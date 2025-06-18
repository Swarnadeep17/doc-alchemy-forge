import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { useAuth } from '../../../../context/AuthContext';

// Tier Constants
const TIER_LIMITS = {
  FREE: 20 * 1024 * 1024, // 20MB
  PREMIUM: 100 * 1024 * 1024 // 100MB
};

// Feature Flags
const hasFeature = (user: any, feature: string) => {
  if (!user) return false; // Anonymous users
  switch(feature) {
    case 'OCR':
    case 'ADVANCED_WATERMARK':
    case 'BULK_OPS':
      return ['premium', 'admin', 'superadmin'].includes(user.role);
    default:
      return true;
  }
};
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Type definitions
type PDFFile = {
  file: File;
  pdfDoc: PDFDocument;
  pageCount: number;
  thumbnails: string[];
  pages: PDFPage[];
};

type PDFPage = {
  number: number;
  selected: boolean;
  duplicate: boolean;
  fileId: string;
  thumbnail: string;
  originalIndex: number;
};

type AppState = {
  files: PDFFile[];
  allPages: PDFPage[];
  mergedPdf: Uint8Array | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
};

const initialState: AppState = {
  files: [],
  allPages: [],
  mergedPdf: null,
  isProcessing: false,
  progress: 0,
  error: null
};

// File validation with tier support
function validateFile(file: File, user: any): string | null {
  if (!['application/pdf'].includes(file.type)) {
    return 'Invalid file type. Only PDF files are allowed.';
  }
  const maxSize = user?.role ? TIER_LIMITS.PREMIUM : TIER_LIMITS.FREE;
  if (file.size > maxSize) {
    return `File size exceeds ${user?.role ? '100MB' : '20MB'} limit.`;
  }
  return null;
}

async function processPDFFile(file: File): Promise<PDFFile | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    
    const thumbnails = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) => 
        generateThumbnail(pdf, i + 1)
      )
    );

    return {
      file,
      pdfDoc,
      pageCount: pdf.numPages,
      thumbnails,
      pages: Array.from({ length: pdf.numPages }, (_, i) => ({
        number: i + 1,
        selected: true,
        duplicate: false,
        fileId: file.name,
        thumbnail: '',
        originalIndex: i
      }))
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    return null;
  }
}

async function generateThumbnail(pdf: any, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas.toDataURL();
}

function PDFMergeTool() {
  const { user } = useAuth();
  
  function reducer(state: AppState, action: any): AppState {
  switch (action.type) {
    case 'SET_FILES': return { ...state, files: action.payload };
    case 'SET_PAGES': return { ...state, allPages: action.payload };
    case 'SET_MERGED_PDF': return { ...state, mergedPdf: action.payload };
    case 'SET_LOADING': return { ...state, isProcessing: action.payload };
    case 'SET_PROGRESS': return { ...state, progress: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    default: return state;
  }
}

  const [state, dispatch] = useReducer(reducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const files = Array.from(e.target.files);
      const validationErrors = files.map(file => validateFile(file, user)).filter(Boolean);
      
      if (validationErrors.length) {
        dispatch({ type: 'SET_ERROR', payload: validationErrors[0] });
        return;
      }

      const processedFiles = await Promise.all(files.map(processPDFFile));
      const validFiles = processedFiles.filter(Boolean) as PDFFile[];
      
      if (!validFiles.length) {
        dispatch({ type: 'SET_ERROR', payload: 'No valid PDF files were processed' });
        return;
      }

      dispatch({ type: 'SET_FILES', payload: [...state.files, ...validFiles] });
      
      // Update all pages with the new files
      const allPages = [...state.files, ...validFiles].flatMap(file => 
        file.pages.map((page, idx) => ({
          ...page,
          fileId: file.file.name,
          thumbnail: file.thumbnails[idx],
          originalIndex: idx
        }))
      );
      dispatch({ type: 'SET_PAGES', payload: allPages });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      if (e.target) e.target.value = '';
    }
  };

const [settings, setSettings] = useState({
    similarityThreshold: 0.85,
    watermark: {
      enabled: hasFeature(user, 'ADVANCED_WATERMARK'),
      text: 'Confidential',
      position: 'center',
      fontSize: 40,
      color: '#CCCCCC',
      opacity: 0.4,
      rotation: -45
    },
    ocr: {
      enabled: hasFeature(user, 'OCR'),
      languages: ['eng']
    },
    duplicateDetection: {
      enabled: hasFeature(user, 'AI_DUPLICATE_DETECTION'),
      threshold: 0.9
    }
  });

  // Live watermark preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawPreview = () => {
      const canvas = canvasRef.current;
      if (!canvas || !settings.watermark.enabled) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw watermark preview
      ctx.save();
      ctx.globalAlpha = settings.watermark.opacity;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(settings.watermark.rotation * Math.PI / 180); // Convert degrees to radians
      ctx.fillStyle = settings.watermark.color;
      ctx.font = `${settings.watermark.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(settings.watermark.text, 0, 0);
      ctx.restore();
    };
    
    drawPreview();
  }, [settings.watermark]);

  // Rest of implementation will follow...
  // Drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(state.allPages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    dispatch({ type: 'SET_PAGES', payload: items });
  };

  const detectDuplicates = async (pages: PDFPage[]) => {
    if (!settings.duplicateDetection.enabled) return pages;
    
    try {
      // Load TensorFlow model
      const model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
      
      // Extract features from each page
      const features = await Promise.all(pages.map(async (page) => {
        const img = new Image();
        img.src = page.thumbnail;
        await new Promise(resolve => img.onload = resolve);
        
        const tensor = tf.browser.fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .expandDims();
        
        const predictions = model.predict(tensor) as tf.Tensor;
        const features = await predictions.data();
        return new Float32Array(features);
      }));
    
      // Compare features and mark duplicates
      return pages.map((page, i) => {
        for (let j = 0; j < i; j++) {
          const similarity = cosineSimilarity(features[i], features[j]);
          if (similarity > settings.duplicateDetection.threshold) {
            return { ...page, duplicate: true };
          }
        }
        return page;
      });
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return pages;
    }
  };

  const extractTextWithOCR = async (pdfBytes: Uint8Array) => {
    if (!settings.ocr.enabled) return null;
    
    try {
      const worker = await createWorker();
      await worker.load();
      await worker.load();
      
      // Convert PDF bytes to image data URL for OCR
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const { data } = await worker.recognize(url);
      await worker.terminate();
      URL.revokeObjectURL(url);
      
      return data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  };

  const handleMerge = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      let selectedPages = state.allPages.filter(page => page.selected);
      selectedPages = await detectDuplicates(selectedPages);
      if (selectedPages.length === 0) {
        throw new Error('No pages selected for merging');
      }

      const mergedPdf = await PDFDocument.create();
      const fileMap = new Map<string, PDFDocument>();
      
      // Load all needed PDFs
      for (const file of state.files) {
        fileMap.set(file.file.name, file.pdfDoc);
      }

      // Copy selected pages
      for (const page of selectedPages) {
        const srcPdf = fileMap.get(page.fileId);
        if (!srcPdf) continue;
        
        const [copiedPage] = await mergedPdf.copyPages(srcPdf, [page.originalIndex]);
        const newPage = mergedPdf.addPage(copiedPage);
        
        // Apply watermark if enabled
        if (settings.watermark.enabled) {
          const { width, height } = newPage.getSize();
          const fontSize = settings.watermark.fontSize;
          const text = settings.watermark.text;
          
          newPage.drawText(text, {
            x: width / 2,
            y: height / 2,
            size: fontSize,
            color: rgb(
              parseInt(settings.watermark.color.slice(1, 3), 16) / 255,
              parseInt(settings.watermark.color.slice(3, 5), 16) / 255,
              parseInt(settings.watermark.color.slice(5, 7), 16) / 255
            ),
            opacity: settings.watermark.opacity,
            rotate: degrees(settings.watermark.rotation)
          });
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      dispatch({ type: 'SET_MERGED_PDF', payload: mergedPdfBytes });
      
      // Extract text if OCR enabled
      if (settings.ocr.enabled) {
        const extractedText = await extractTextWithOCR(mergedPdfBytes);
        console.log('Extracted text:', extractedText);
      }
      
      // Create download link
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Helper function for cosine similarity
  function cosineSimilarity(a: Float32Array, b: Float32Array) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Merge Tool</h1>
      
      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      {!user?.role && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Feature</th>
                  <th className="text-left py-2 px-4">Free</th>
                  <th className="text-left py-2 px-4">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">Max File Size</td>
                  <td className="py-2 px-4">20MB</td>
                  <td className="py-2 px-4">100MB</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Watermarking</td>
                  <td className="py-2 px-4">❌</td>
                  <td className="py-2 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">AI Duplicate Detection</td>
                  <td className="py-2 px-4">❌</td>
                  <td className="py-2 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">OCR Text Extraction</td>
                  <td className="py-2 px-4">❌</td>
                  <td className="py-2 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Bulk Processing</td>
                  <td className="py-2 px-4">❌</td>
                  <td className="py-2 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Upgrade to Premium for advanced features and higher limits.
          </div>
        </div>
      )}

      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          className="hidden"
        />
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition"
            disabled={state.isProcessing}
          >
            {state.isProcessing ? 'Processing...' : 'Add PDF Files'}
          </button>
          {hasFeature(user, 'BULK_OPS') && (
            <button
              onClick={() => {
                // In a real implementation, this would open a folder selection dialog
                alert('Bulk folder processing is a premium feature');
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition"
              disabled={state.isProcessing}
            >
              Add Folder (Premium)
            </button>
          )}
        </div>
      </div>

      {state.allPages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Page Preview ({state.allPages.length} pages)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {state.allPages.map((page, index) => (
              <div 
                key={`${page.fileId}-${page.number}`}
                className={`relative border rounded-lg overflow-hidden transition-all ${page.selected ? 'ring-2 ring-blue-500' : 'opacity-70'}`}
                onClick={() => {
                  const newPages = [...state.allPages];
                  newPages[index].selected = !newPages[index].selected;
                  dispatch({ type: 'SET_PAGES', payload: newPages });
                }}
              >
                <img 
                  src={page.thumbnail} 
                  alt={`Page ${page.number} of ${page.fileId}`}
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                  {page.fileId} - Page {page.number}
                </div>
                {page.duplicate && (
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Duplicate
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.allPages.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleMerge}
            disabled={state.isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {state.isProcessing ? 'Merging...' : 'Merge Selected Pages'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PDFMergeTool;
