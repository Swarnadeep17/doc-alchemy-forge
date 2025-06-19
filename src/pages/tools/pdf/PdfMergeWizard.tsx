import React, { useState, useEffect } from 'react'; // Added useEffect
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import UploadStep from '../../../components/pdf-merge-wizard/UploadStep';
import FileArrangeStep from '../../../components/pdf-merge-wizard/FileArrangeStep';
import PageArrangeStep from '../../../components/pdf-merge-wizard/PageArrangeStep';
import SettingsStep from '../../../components/pdf-merge-wizard/SettingsStep';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { pdfjs } from 'react-pdf'; // For getDocument
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Recommended for react-pdf
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Recommended for react-pdf

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

// Define and Export DetailedPage interface
export interface DetailedPage {
  id: string; // Unique ID for react-beautiful-dnd (e.g., fileId-page-${originalPageIndex})
  fileId: string; // Unique ID for the source file (e.g., `${file.name}-${file.lastModified}`)
  originalFile: File; // Reference to the source File object
  originalFileName: string; // Added for convenience
  originalPageIndex: number; // 0-based index within the source file
  numPagesInFile: number; // Total number of pages in the originalFile
  thumbnailUrl: string | null | 'loading' | 'error'; // Data URL for the page thumbnail or status
}

const PdfMergeWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileArrayBuffers, setFileArrayBuffers] = useState<Map<string, ArrayBuffer>>(new Map());
  const [detailedPages, setDetailedPages] = useState<DetailedPage[]>([]);
  const [isProcessingThumbs, setIsProcessingThumbs] = useState(false); // For thumbnail generation indicator

  const totalSteps = 4;

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleMerge = () => {
    alert('Merge initiated! Final step processing would occur here.');
  };

  const handleSetSelectedFiles = async (newFiles: File[]) => {
    setSelectedFiles(newFiles);
    const newBuffers = new Map(fileArrayBuffers);
    const currentFileIds = new Set<string>();

    for (const file of newFiles) {
      const fileId = `${file.name}-${file.lastModified}`;
      currentFileIds.add(fileId);
      if (!newBuffers.has(fileId)) {
        try {
          const buffer = await file.arrayBuffer();
          newBuffers.set(fileId, buffer);
        } catch (error) {
          console.error("Error reading ArrayBuffer for file:", file.name, error);
        }
      }
    }
    newBuffers.forEach((_, key) => {
        if (!currentFileIds.has(key)) {
            newBuffers.delete(key);
        }
    });
    setFileArrayBuffers(newBuffers);
    // If files change, page view needs to be reset/updated
    if (currentStep === 3) setDetailedPages([]);
  };

  const handleDeleteFile = (fileIdToDelete: string) => {
    const updatedFiles = selectedFiles.filter(
      (file) => `${file.name}-${file.lastModified}` !== fileIdToDelete
    );
    setSelectedFiles(updatedFiles); // This will trigger the useEffect for detailedPages if on step 3

    setFileArrayBuffers(prevMap => {
      const newMap = new Map(prevMap);
      newMap.delete(fileIdToDelete);
      return newMap;
    });
     // If files change, page view needs to be reset/updated
    if (currentStep === 3) setDetailedPages([]);
  };

  // Effect to populate detailedPages when moving to Step 3 or when selectedFiles change while on Step 3
  useEffect(() => {
    if (currentStep === 3) {
      const populate = async () => {
        setIsProcessingThumbs(true);
        const newDetailedPages: DetailedPage[] = [];
        for (const file of selectedFiles) {
          const fileId = `${file.name}-${file.lastModified}`;
          const buffer = fileArrayBuffers.get(fileId);
          if (buffer) {
            try {
              const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise; // Use slice(0) for a new reference if needed
              for (let i = 0; i < pdfDoc.numPages; i++) {
                newDetailedPages.push({
                  id: `${fileId}-page-${i}`,
                  fileId,
                  originalFile: file,
                  originalFileName: file.name,
                  originalPageIndex: i,
                  numPagesInFile: pdfDoc.numPages,
                  thumbnailUrl: null, // Will be lazy-loaded
                });
              }
            } catch (error) {
              console.error("Error processing file for page view:", file.name, error);
              // Optionally add a placeholder error page or skip this file
            }
          }
        }
        setDetailedPages(newDetailedPages);
        setIsProcessingThumbs(false);
      };
      populate();
    } else {
      // Clear detailed pages if not on step 3 to ensure fresh load when returning
      if (detailedPages.length > 0) setDetailedPages([]);
    }
  }, [currentStep, selectedFiles, fileArrayBuffers]);


  const handlePageVisible = async (pageId: string) => {
    const pageIndex = detailedPages.findIndex(p => p.id === pageId);
    if (pageIndex === -1 || detailedPages[pageIndex].thumbnailUrl !== null) {
      return; // Already processed or not found
    }

    // Mark as loading
    setDetailedPages(prev => prev.map(p => p.id === pageId ? { ...p, thumbnailUrl: 'loading' } : p));

    const pageInfo = detailedPages[pageIndex];
    const buffer = fileArrayBuffers.get(pageInfo.fileId);

    if (!buffer) {
      console.error("ArrayBuffer not found for file:", pageInfo.originalFileName);
      setDetailedPages(prev => prev.map(p => p.id === pageId ? { ...p, thumbnailUrl: 'error' } : p));
      return;
    }

    try {
      const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
      const pdfPage = await pdfDoc.getPage(pageInfo.originalPageIndex + 1); // 1-based for pdfjs

      const targetWidth = 96;
      const viewport = pdfPage.getViewport({ scale: 1 });
      const scale = targetWidth / viewport.width;
      const scaledViewport = pdfPage.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      const context = canvas.getContext('2d');

      if (context) {
        await pdfPage.render({ canvasContext: context, viewport: scaledViewport }).promise;
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        setDetailedPages(prev => prev.map(p => p.id === pageId ? { ...p, thumbnailUrl } : p));
      } else {
        throw new Error("Failed to get canvas context");
      }
    } catch (error) {
      console.error("Error generating thumbnail for pageId:", pageId, error);
      setDetailedPages(prev => prev.map(p => p.id === pageId ? { ...p, thumbnailUrl: 'error' } : p));
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (destination.droppableId === 'fileListDroppable' || type === 'FILE_CARD') {
      const reorderedFiles = Array.from(selectedFiles);
      const [removed] = reorderedFiles.splice(source.index, 1);
      reorderedFiles.splice(destination.index, 0, removed);
      // setSelectedFiles will trigger detailedPages refresh if on step 3 via useEffect
      handleSetSelectedFiles(reorderedFiles); // Use handleSetSelectedFiles to ensure buffer consistency
    } else if (destination.droppableId === 'pageListDroppable' || type === 'PAGE_CARD') {
      const reorderedPages = Array.from(detailedPages);
      const [removed] = reorderedPages.splice(source.index, 1);
      reorderedPages.splice(destination.index, 0, removed);
      setDetailedPages(reorderedPages);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Upload PDFs";
      case 2: return "Arrange Files";
      case 3: return "Arrange Pages";
      case 4: return "Settings & Merge";
      default: return "";
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white selection:bg-cyan-500 selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col items-center py-8 px-4">
          <div className="w-full max-w-4xl bg-slate-800/60 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-center text-cyan-400 mb-2">PDF Merge Wizard</h1>
              <p className="text-center text-slate-300">
                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                {currentStep === 3 && isProcessingThumbs && " (Loading page details...)"}
              </p>
            </div>

            {currentStep === 1 && (
              <UploadStep
                onNext={handleNext}
                selectedFiles={selectedFiles}
                setSelectedFiles={handleSetSelectedFiles}
              />
            )}
            {currentStep === 2 && (
              <FileArrangeStep
                onBack={handleBack}
                onNext={handleNext}
                files={selectedFiles}
                setSelectedFiles={handleSetSelectedFiles}
                onDeleteFile={handleDeleteFile}
              />
            )}
            {currentStep === 3 && (
              <PageArrangeStep
                onBack={handleBack}
                onNext={handleNext}
                pages={detailedPages}
                onPageVisible={handlePageVisible}
                // Pass onDeletePage and other necessary props later
              />
            )}
            {currentStep === 4 && <SettingsStep onBack={handleBack} onMerge={handleMerge} />}

          </div>
        </main>
        <Footer />
      </div>
    </DragDropContext>
  );
};
export default PdfMergeWizard;
