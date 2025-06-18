import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/webpack';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import * as tf from '@tensorflow/tfjs';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function PDFMergeTool() {
  const [files, setFiles] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [mergedPdf, setMergedPdf] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);
  const [userTier, setUserTier] = useState('free');
  const [watermarkText, setWatermarkText] = useState('Confidential');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkFontSize, setWatermarkFontSize] = useState(40);
  const [watermarkColor, setWatermarkColor] = useState('#CCCCCC');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [previewCanvas, setPreviewCanvas] = useState(null);
  const fileInputRef = useRef(null);
  console.log('fileInputRef.current:', fileInputRef.current);
  const dropRef = useRef(null);
  const previewRef = useRef(null);

  const tierLimits = {
    free: { maxPages: 5, allowDuplicates: false, allowWatermark: false },
    basic: { maxPages: 20, allowDuplicates: true, allowWatermark: false },
    premium: { maxPages: Infinity, allowDuplicates: true, allowWatermark: true }
  };

  useEffect(() => {
    if (userTier !== 'premium' || !previewRef.current) return;
    
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${watermarkFontSize}px Arial`;
    ctx.fillStyle = `${watermarkColor}${Math.floor(watermarkOpacity * 255).toString(16).padStart(2, '0')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(degrees(-45));
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();
  }, [watermarkText, watermarkPosition, watermarkFontSize, watermarkColor, watermarkOpacity, userTier]);

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        console.log('TensorFlow.js loaded successfully');
      } catch (error) {
        console.error('Error loading TensorFlow.js:', error);
      }
    }
    loadModel();
  }, []);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    try {
      const newFiles = Array.from(e.target.files);
      const processedFiles = await Promise.all(
        newFiles.map(file => processPDFFile(file))
      );
      const validFiles = processedFiles.filter(file => file !== null);
      
      if (validFiles.length === 0) {
        alert('No valid PDF files were processed');
        return;
      }
      
      const currentTotalPages = files.reduce((sum, file) => sum + file.pageCount, 0);
      const newTotalPages = validFiles.reduce((sum, file) => sum + file.pageCount, 0);
      const totalPages = currentTotalPages + newTotalPages;
      
      if (totalPages > tierLimits[userTier].maxPages) {
        alert(`Your ${userTier} tier is limited to ${tierLimits[userTier].maxPages} pages`);
        return;
      }
      
      setFiles(prev => [...prev, ...validFiles]);
      updateAllPages([...prev, ...validFiles]);
    } catch (error) {
      console.error('Error handling files:', error);
      alert(`Error processing files: ${error.message}`);
    } finally {
      setIsProcessing(false);
      e.target.value = ''; // Reset input to allow re-uploading same files
    }
  };

  const processPDFFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      const thumbnails = await generateThumbnails(pdf);
      
      return {
        file,
        pdfDoc,
        pageCount,
        thumbnails,
        pages: Array.from({ length: pageCount }, (_, i) => ({
          number: i + 1,
          selected: true,
          duplicate: false
        }))
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      return null;
    }
  };

  const generateThumbnails = async (pdf) => {
    const thumbnails = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      thumbnails.push(canvas.toDataURL());
    }
    return thumbnails;
  };

  const updateAllPages = useCallback((files) => {
    const pages = files.flatMap(file => 
      file.pages.map((page, idx) => ({
        ...page,
        fileId: file.file.name,
        thumbnail: file.thumbnails[idx],
        originalIndex: idx
      }))
    );
    setAllPages(pages);
  }, []);

  const detectDuplicates = async () => {
    setIsProcessing(true);
    try {
      if (!tierLimits[userTier].allowDuplicates) {
        alert(`Duplicate detection is not available in ${userTier} tier`);
        return;
      }
      
      const updatedPages = await Promise.all(
        allPages.map(async (page, index) => {
          const isDuplicate = await checkPageSimilarity(page, allPages, index);
          return { ...page, duplicate: isDuplicate };
        })
      );
      setAllPages(updatedPages);
    } catch (error) {
      console.error('Duplicate detection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPageSimilarity = async (page, allPages, currentIndex) => {
    for (let i = 0; i < currentIndex; i++) {
      if (allPages[i].thumbnail === page.thumbnail) {
        return true;
      }
    }
    return false;
  };

  const mergePDFs = async () => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const selectedPages = allPages.filter(page => page.selected);
      const totalPages = selectedPages.length;
      let processedPages = 0;
      
      if (selectedPages.length > tierLimits[userTier].maxPages) {
        alert(`Your ${userTier} tier is limited to ${tierLimits[userTier].maxPages} pages`);
        return;
      }
      
      const mergedPdf = await PDFDocument.create();
      
      for (const page of selectedPages) {
        const file = files.find(f => f.file.name === page.fileId);
        if (!file) continue;
        
        const [copiedPage] = await mergedPdf.copyPages(
          file.pdfDoc, 
          [page.originalIndex]
        );
        mergedPdf.addPage(copiedPage);
        processedPages++;
        setProgress(Math.round((processedPages / totalPages) * 100));
      }
      
      const watermarkedPdf = userTier === 'premium' 
        ? await addWatermark(mergedPdf)
        : mergedPdf;
      
      const mergedPdfBytes = await watermarkedPdf.save();
      setMergedPdf(mergedPdfBytes);
    } catch (error) {
      console.error('Error merging PDFs:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(allPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setAllPages(items);
  };

  const togglePageSelection = (index) => {
    const updatedPages = [...allPages];
    updatedPages[index] = {
      ...updatedPages[index],
      selected: !updatedPages[index].selected
    };
    setAllPages(updatedPages);
  };

  const addWatermark = async (pdfDoc) => {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFDocument.Font.HelveticaBold);
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 2 - 100,
        y: height / 2,
        font: font,
        color: rgb(
          parseInt(watermarkColor.substr(1, 2), 16) / 255,
          parseInt(watermarkColor.substr(3, 2), 16) / 255,
          parseInt(watermarkColor.substr(5, 2), 16) / 255
        ),
        rotate: degrees(-45),
        opacity: watermarkOpacity,
        size: watermarkFontSize
      });
    }
    return pdfDoc;
  };

  const downloadMergedPDF = () => {
    if (!mergedPdf) return;
    const blob = new Blob([mergedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Merge Tool</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <select
            value={userTier}
            onChange={(e) => setUserTier(e.target.value)}
            className="w-full text-sm border rounded px-2 py-3 bg-white"
          >
            <option value="free">Free Tier</option>
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>
        {userTier === 'premium' && (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Watermark text"
                className="w-full text-sm border rounded px-2 py-3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value)}
                className="w-full text-sm border rounded px-2 py-3 bg-white"
              >
                <option value="center">Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="diagonal">Diagonal</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="80"
                value={watermarkFontSize}
                onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm">Size: {watermarkFontSize}px</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={watermarkColor}
                onChange={(e) => setWatermarkColor(e.target.value)}
                className="w-8 h-8"
              />
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm">Opacity: {watermarkOpacity.toFixed(1)}</span>
            </div>
            <div className="col-span-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Watermark Preview</h3>
              <canvas 
                ref={previewRef}
                width="400"
                height="200"
                className="border rounded bg-white w-full h-40"
              />
            </div>
          </>
        )}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            multiple
            style={{ display: 'none' }}
          />
          <button
            onClick={() => {
              console.log('Upload button clicked');
              if (fileInputRef.current) {
                console.log('Triggering file input click');
                fileInputRef.current.click();
              } else {
                console.log('fileInputRef.current is null');
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Add PDF Files'}
          </button>
        </div>
        
        <button
          onClick={detectDuplicates}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition"
          disabled={isProcessing || allPages.length === 0}
        >
          Detect Duplicates
        </button>
        
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Similarity:</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="ml-2 text-sm">{Math.round(similarityThreshold * 100)}%</span>
        </div>
      </div>

      <div className="mb-6 p-4 border rounded-lg" ref={dropRef}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="pages">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {allPages.map((page, index) => (
                  <Draggable key={`${page.fileId}-${index}`} draggableId={`${page.fileId}-${index}`} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative border rounded-lg overflow-hidden ${page.selected ? 'ring-2 ring-blue-500' : ''} ${page.duplicate ? 'bg-red-100' : ''}`}
                      >
                        <img
                          src={page.thumbnail}
                          alt={`Page ${index + 1}`}
                          className="w-full h-auto cursor-pointer"
                          onClick={() => togglePageSelection(index)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs flex justify-between">
                          <span>Page {index + 1}</span>
                          {page.duplicate && (
                            <span className="text-red-300">Duplicate</span>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {allPages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Upload PDF files to get started
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={mergePDFs}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={allPages.filter(p => p.selected).length === 0 || isProcessing}
            title={allPages.filter(p => p.selected).length === 0 ? 'Select pages to merge' : ''}
          >
            {isProcessing ? 'Merging...' : 'Merge PDFs'}
          </button>
          {isProcessing && (
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1">
                {progress}% complete
              </div>
            </div>
          )}
        </div>
        <button
          onClick={downloadMergedPDF}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={!mergedPdf}
        >
          Download Merged PDF
        </button>
      </div>
    </div>
  );
}
