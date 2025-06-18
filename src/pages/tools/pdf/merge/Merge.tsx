import { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
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

// File validation constants
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['application/pdf'];

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Invalid file type. Only PDF files are allowed.';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
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
      const validationErrors = files.map(validateFile).filter(Boolean);
      
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
    userTier: 'free',
    watermark: {
      text: 'Confidential',
      position: 'center',
      fontSize: 40,
      color: '#CCCCCC',
      opacity: 0.4
    }
  });

  // Rest of implementation will follow...
  const handleMerge = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const selectedPages = state.allPages.filter(page => page.selected);
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
        mergedPdf.addPage(copiedPage);
      }

      const mergedPdfBytes = await mergedPdf.save();
      dispatch({ type: 'SET_MERGED_PDF', payload: mergedPdfBytes });
      
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Merge Tool</h1>
      
      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition"
          disabled={state.isProcessing}
        >
          {state.isProcessing ? 'Processing...' : 'Add PDF Files'}
        </button>
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
