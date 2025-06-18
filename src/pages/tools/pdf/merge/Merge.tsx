// PdfMergeTool.tsx
// Full-featured PDF Merge Tool component for Doc Enclave platform
// Implements all features listed in Merge.md
// -------------------------------------------------------------
// External dependencies (ensure these are installed in package.json):
// pdf-lib, pdfjs-dist, react-beautiful-dnd, tesseract.js, @tensorflow/tfjs, @tensorflow-models/universal-sentence-encoder, classnames, tailwindcss (already in project)

import React, { useCallback, useEffect, useRef, useState } from 'react';
<<<<<<< HEAD
import { PDFDocument, PDFSaveOptions, rgb, degrees, StandardFonts } from 'pdf-lib';
=======
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
>>>>>>> main
// import { getDatabase, ref, update, increment } from 'firebase/database'; // Firebase specific stats removed
import { useAuth, UserRole } from '../../../../context/AuthContext'; // <-- project‑specific auth hook that returns {user, role}
import { trackStat } from '../../../../lib/statsManager';
import { Document, Page, pdfjs } from 'react-pdf';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import * as tf from '@tensorflow/tfjs';
import Tesseract from 'tesseract.js';
import clsx from 'classnames';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming this path from typical shadcn/ui setup

// Load PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// ---------------------------------------------------------------------------
// Interface Definitions
// ---------------------------------------------------------------------------
interface DetailedPage {
  id: string; // Unique ID for react-beautiful-dnd (e.g., `fileId-page-${originalPageIndex}`)
  fileId: string; // Unique ID for the source file (e.g., `${file.name}-${file.lastModified}`)
  originalFile: File; // Reference to the source File object
  originalPageIndex: number; // 0-based index within the source file
  numPagesInFile: number; // Total number of pages in the originalFile
  thumbnailUrl: string | null; // Data URL for the page thumbnail
}

// ---------------------------------------------------------------------------
// 1. Account Tier System & Constants
// ---------------------------------------------------------------------------
const TIER_LIMITS: Record<UserRole, number> = {
  anonymous: 20 * 1024 * 1024, // 20 MB
  free: 20 * 1024 * 1024, // 20 MB
  premium: 100 * 1024 * 1024, // 100 MB
  admin: 100 * 1024 * 1024, // 100 MB
  superadmin: 100 * 1024 * 1024, // 100 MB
};

// List premium‑only feature keys
const PREMIUM_FEATURES = ['OCR', 'ADVANCED_WATERMARK'];

// Feature gate utility
function hasFeature(userRole: string, feature: string): boolean {
  if (!PREMIUM_FEATURES.includes(feature)) return true; // Free features
  return ['premium', 'admin', 'superadmin'].includes(userRole);
}

// Duplicate detection threshold (cosine similarity)
const DUPLICATE_THRESHOLD = 0.98;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PdfMergeTool() {
  const { user } = useAuth();
  // const db = getDatabase(); // Firebase specific stats removed

  const userRole: UserRole = user?.role || 'anonymous';

  // Local component state
  const [files, setFiles] = useState<File[]>([]);
  const [orderedFiles, setOrderedFiles] = useState<File[]>([]);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkText, setWatermarkText] = useState('Confidential');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  // Removed watermarkRotation and watermarkFontSize state
  const [duplicates, setDuplicates] = useState<number[]>([]); // indices of duplicate pages
  const [ocrText, setOcrText] = useState<string>('');
  const [applyGrayscale, setApplyGrayscale] = useState(false);
<<<<<<< HEAD
  const [compressionLevel, setCompressionLevel] = useState<string>('none');
  const [detailedPages, setDetailedPages] = useState<DetailedPage[]>([]);
  const [isPageView, setIsPageView] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
=======
>>>>>>> main

  // On mount: increment visits
  useEffect(() => {
    trackStat("visits", "PDF", "merge");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Thumbnail Generation Effect
  useEffect(() => {
    if (isPageView && detailedPages.some(p => p.thumbnailUrl === null)) {
      const generateThumbnails = async () => {
        // Create a new array to ensure state update and re-render
        let newPages = [...detailedPages];
        for (let i = 0; i < newPages.length; i++) {
          const pageDetail = newPages[i];
          if (pageDetail.thumbnailUrl === null) {
            try {
              const arrayBuffer = await pageDetail.originalFile.arrayBuffer();
              const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
              const pdfPage = await pdfDoc.getPage(pageDetail.originalPageIndex + 1); // pdfjs is 1-based

              const viewport = pdfPage.getViewport({ scale: 100 / pdfPage.getViewport({ scale: 1.0 }).width });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const context = canvas.getContext('2d');

              if (context) {
                await pdfPage.render({ canvasContext: context, viewport: viewport }).promise;
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
                // Update the specific page with its thumbnail
                newPages = newPages.map(p =>
                  p.id === pageDetail.id ? { ...p, thumbnailUrl } : p
                );
              } else {
                console.error(`Failed to get 2D context for page ${pageDetail.id}`);
                 newPages = newPages.map(p =>
                  p.id === pageDetail.id ? { ...p, thumbnailUrl: 'error' } : p // Mark as error or use a placeholder
                );
              }
            } catch (error) {
              console.error(`Error generating thumbnail for page ${pageDetail.id}:`, error);
              // Mark this page's thumbnail as error or use a placeholder
              newPages = newPages.map(p =>
                p.id === pageDetail.id ? { ...p, thumbnailUrl: 'error' } : p
              );
               trackStat("errors", "PDF", "merge", { errorContext: "thumbnailGeneration", userTier: userRole, pageId: pageDetail.id, errorMessage: error instanceof Error ? error.message : String(error) });
            }
          }
        }
        setDetailedPages(newPages); // Set state once after processing all needed thumbnails in this batch
      };

      generateThumbnails();
    }
  }, [detailedPages, isPageView, userRole]);

  // Keyboard listener for page view navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPageView || !selectedPageId || detailedPages.length === 0) return;

      const currentIndex = detailedPages.findIndex(p => p.id === selectedPageId);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
          const newArray = Array.from(detailedPages);
          const temp = newArray[currentIndex];
          newArray[currentIndex] = newArray[newIndex];
          newArray[newIndex] = temp;
          setDetailedPages(newArray);
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentIndex < detailedPages.length - 1) {
          newIndex = currentIndex + 1;
          const newArray = Array.from(detailedPages);
          const temp = newArray[currentIndex];
          newArray[currentIndex] = newArray[newIndex];
          newArray[newIndex] = temp;
          setDetailedPages(newArray);
        }
      } else if (event.key === 'Escape') {
        setSelectedPageId(null);
      }
       // After moving, update selectedPageId to the new position's ID if index changed
      if (newIndex !== currentIndex && detailedPages[newIndex]) {
         setSelectedPageId(detailedPages[newIndex].id);
      }
    };

    if (isPageView && detailedPages.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPageView, detailedPages, selectedPageId, setSelectedPageId, setDetailedPages]);

  // -----------------------------------------------------------------------
  // File input handler with tier validation
  // -----------------------------------------------------------------------
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    const limit = TIER_LIMITS[userRole] ?? TIER_LIMITS.anonymous; // Default to anonymous if role somehow not in TIER_LIMITS

    // 1. Validate total size for the current selection
    const totalSize = selected.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > limit) {
      alert(
        `Total selected file size (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds your ${userRole} tier limit of ${(limit / 1024 / 1024).toFixed(2)} MB.`
      );
      trackStat("errors", "PDF", "merge", { errorContext: "fileSizeValidationTotal", userTier: userRole, totalSizeMB: parseFloat((totalSize / (1024*1024)).toFixed(2)), limitMB: parseFloat((limit / (1024*1024)).toFixed(2)) });
      return; // Do not update files state
    }

    // 2. Validate individual file sizes (optional, but good practice)
    // This check might seem redundant if total size is already checked, but it can give more specific feedback.
    // For this subtask, the primary requirement is the total size check above.
    // Depending on desired UX, this individual check can be kept or removed.
    // Keeping it for now as it doesn't conflict with the primary requirement.
    for (const f of selected) {
      // A single file itself cannot exceed the total limit (logically covered by totalSize check if there's only one file)
      // However, if individual files could have a *different, smaller* limit than the total, this loop would be essential.
      // For now, assuming individual file limit is the same as the total session limit.
      if (f.size > limit) { // This check is somewhat redundant if totalSize passed, unless a single file itself is larger than the tier limit (e.g. free tier 20MB, one file is 25MB)
        alert(
          `File ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB) exceeds your ${userRole} tier limit of ${(limit / 1024 / 1024).toFixed(2)} MB.`
        );
        trackStat("errors", "PDF", "merge", { errorContext: "fileSizeValidationIndividual", userTier: userRole, fileName: f.name, fileSizeMB: parseFloat((f.size / (1024*1024)).toFixed(2)), limitMB: parseFloat((limit / (1024*1024)).toFixed(2)) });
        return; // Do not update files state
      }
    }

    setFiles(selected);
    setOrderedFiles(selected);
  };

  // -----------------------------------------------------------------------
  // Drag & drop reordering
  // -----------------------------------------------------------------------
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // Dropped in the same place
    }

    if (destination.droppableId === 'pdfList') { // File reordering (Droppable type "FILE")
      const newOrder = Array.from(orderedFiles);
      const [removed] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, removed);
      setOrderedFiles(newOrder);
    } else if (destination.droppableId === 'detailedPagesList') { // Page reordering (Droppable type "PAGE")
      const newDetailedPagesOrder = Array.from(detailedPages);
      const [removedPage] = newDetailedPagesOrder.splice(source.index, 1);
      newDetailedPagesOrder.splice(destination.index, 0, removedPage);
      setDetailedPages(newDetailedPagesOrder);
    }
  };

  // -----------------------------------------------------------------------
  // Page View Expansion
  // -----------------------------------------------------------------------
  const handleExpandToPageView = async () => {
    setIsProcessing(true);
    const newDetailedPages: DetailedPage[] = [];
    try {
      for (const file of orderedFiles) {
        const fileId = `${file.name}-${file.lastModified}`;
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        for (let i = 0; i < pdfDoc.numPages; i++) {
          const pageIndex = i; // 0-based
          newDetailedPages.push({
            id: `${fileId}-page-${pageIndex}`,
            fileId,
            originalFile: file,
            originalPageIndex: pageIndex,
            numPagesInFile: pdfDoc.numPages,
            thumbnailUrl: null, // To be generated in the next step
          });
        }
      }
      setDetailedPages(newDetailedPages);
      setIsPageView(true);
      trackStat("featureUsed", "PDF", "merge", {
        featureName: "pageOrganizationView",
        userTier: userRole
      });
    } catch (error) {
      console.error("Error expanding to page view:", error);
      alert("Failed to load PDF details. Please ensure it's a valid PDF.");
      // Optionally track this specific error
      trackStat("errors", "PDF", "merge", { errorContext: "pageExpansion", userTier: userRole, errorMessage: error instanceof Error ? error.message : String(error) });
    }
    setIsProcessing(false);
  };

  const handleBackToFileView = () => {
    setIsPageView(false);
    setDetailedPages([]); // Clear detailed pages when going back
  };

  // -----------------------------------------------------------------------
  // Duplicate detection using TensorFlow Universal Sentence Encoder on bitmap hashes
  // (Lightweight approach: compare page canvases MeanHash + cosine sim) – simplified
  // -----------------------------------------------------------------------
  const detectDuplicates = useCallback(async (pdfDoc: PDFDocument) => {
    try {
      // Removed 'db' dependency from useCallback as writeStats is removed.
      // If detectDuplicates needs to be a useCallback, its dependencies should be reviewed.
      // For now, assuming it's fine as a regular async function or if its dependencies are correctly managed.
      const pageImages: Float32Array[] = [];
      const embed = await tf.loadGraphModel('https://tfhub.dev/google/imagenet/inception_v3/feature_vector/4', {
        fromTFHub: true,
      });
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        // Render page to canvas via pdfjs (simplified placeholder)
        // TODO: integrate proper pdfjs render using pdfjsLib.getDocument

        // Downscale & get image data
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const tensor = tf.browser.fromPixels(imgData).expandDims(0).toFloat().div(255);
        const vector = (await (embed.execute(tensor) as tf.Tensor).array()) as number[][];
        pageImages.push(new Float32Array(vector[0]));
        tensor.dispose();
      }
      const dupIndices: number[] = [];
      for (let i = 0; i < pageImages.length; i++) {
        for (let j = i + 1; j < pageImages.length; j++) {
          const v1 = pageImages[i];
          const v2 = pageImages[j];
          const dot = v1.reduce((acc, val, idx) => acc + val * v2[idx], 0);
          const mag1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0));
          const mag2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0));
          const sim = dot / (mag1 * mag2);
          if (sim > DUPLICATE_THRESHOLD) dupIndices.push(j);
        }
      }
      return dupIndices;
    } catch (err) {
      console.error('Duplicate detection error', err);
      trackStat("errors", "PDF", "merge", { errorContext: "duplicateDetection", userTier: userRole, errorMessage: err instanceof Error ? err.message : String(err) });
      return [];
    }
  }, [userRole]); // Added userRole as a dependency for trackStat, removed writeStats

  // -----------------------------------------------------------------------
  // Merge handler
  // -----------------------------------------------------------------------
  const handleMerge = async () => {
    const useDetailedPagesOrder = isPageView && detailedPages.length > 0;

    // Determine the number of items to be merged.
    // If in page view, it's the number of detailed pages.
    // If in file view, it's the number of ordered files.
    const itemCount = useDetailedPagesOrder ? detailedPages.length : orderedFiles.length;

    if (itemCount === 0) {
      alert('Please add PDF files to merge.');
      return;
    }
    // In file view, typically a merge involves at least two files.
    // In page view, even a single page (from one or more files) can be "merged" (processed and saved).
    if (!isPageView && orderedFiles.length < 2) {
      alert('Please select at least two PDF files to merge when in File View, or switch to Page View to process individual pages.');
      return;
    }

    setIsProcessing(true);
    const sourcePdfCache = new Map<string, PDFDocument>();
    let finalMergedDoc: PDFDocument | null = null; // Renamed from mergedPdfOutput for clarity

    try {
<<<<<<< HEAD
      finalMergedDoc = await PDFDocument.create();
      const standardFont = await finalMergedDoc.embedFont(StandardFonts.Helvetica);

      if (useDetailedPagesOrder) {
        // --- Page View Merge Logic ---
        for (const pageInfo of detailedPages) {
          let sourcePdfDoc: PDFDocument | undefined = sourcePdfCache.get(pageInfo.fileId);
          if (!sourcePdfDoc) {
            const arrayBuffer = await pageInfo.originalFile.arrayBuffer();
            sourcePdfDoc = await PDFDocument.load(arrayBuffer);
            sourcePdfCache.set(pageInfo.fileId, sourcePdfDoc);
          }

          const [copiedPage] = await finalMergedDoc.copyPages(sourcePdfDoc, [pageInfo.originalPageIndex]);

          // Apply watermarking to the copied page
          if (watermarkText) {
            const { width, height } = copiedPage.getSize();
            let R = 0.5, G = 0.5, B = 0.5;
            if (applyGrayscale) { R = 0.4; G = 0.4; B = 0.4; }
            copiedPage.drawText(watermarkText, {
              x: width / 2, y: height / 2, size: 36, font: standardFont,
              color: rgb(R, G, B), rotate: degrees(-45), opacity: watermarkOpacity,
            });
          } else if (applyGrayscale) {
            console.log('Grayscale effect selected, but no watermark text. Full page grayscale not yet implemented.');
          }
          finalMergedDoc.addPage(copiedPage);
        }
      } else {
        // --- File View Merge Logic (existing logic) ---
        for (const file of orderedFiles) {
          const bytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(bytes);
          const copiedPages = await finalMergedDoc.copyPages(pdf, pdf.getPageIndices());
          for (const page of copiedPages) {
            if (watermarkText) {
              const { width, height } = page.getSize();
              let R = 0.5, G = 0.5, B = 0.5;
              if (applyGrayscale) { R = 0.4; G = 0.4; B = 0.4; }
              page.drawText(watermarkText, {
                x: width / 2, y: height / 2, size: 36, font: standardFont,
                color: rgb(R, G, B), rotate: degrees(-45), opacity: watermarkOpacity,
              });
            } else if (applyGrayscale) {
              console.log('Grayscale effect selected, but no watermark. Full page grayscale not yet implemented.');
            }
            finalMergedDoc.addPage(page);
=======
      // Client priority: premium+ immediate, free: artificial delay to simulate queue.
      // PRIORITY_QUEUE feature was removed. If specific delay logic is still needed for free/anonymous, it should be handled differently.
      // For now, removing the explicit delay based on PRIORITY_QUEUE.
      // if (!hasFeature(userRole, 'PRIORITY_QUEUE')) { // PRIORITY_QUEUE is no longer a feature
      //   await new Promise((res) => setTimeout(res, 2000));
      // }

      const merged = await PDFDocument.create();
      const standardFont = await merged.embedFont(StandardFonts.Helvetica);

      for (const file of orderedFiles) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await merged.copyPages(pdf, pdf.getPageIndices());
        for (const page of copiedPages) {
          // Watermark all pages if watermark text provided
          if (watermarkText) {
            const { width, height } = page.getSize();
            let R = 0.5, G = 0.5, B = 0.5; // Default watermark color (gray)
            if (applyGrayscale) {
              // Grayscale keeps R, G, B components equal.
              // Using the existing default gray, but could be made configurable.
              R = 0.4; G = 0.4; B = 0.4; // A slightly darker gray for grayscale effect
            }
            page.drawText(watermarkText, {
              x: width / 2,
              y: height / 2,
              size: watermarkFontSize,
              font: standardFont,
              color: rgb(R, G, B),
              rotate: degrees(watermarkRotation),
              opacity: watermarkOpacity,
              xSkew: 0,
              ySkew: 0,
            });
          } else if (applyGrayscale) {
            console.log('Grayscale effect selected, but no watermark text to apply it to. Full page grayscale for existing content is not yet implemented.');
>>>>>>> main
          }
        }
      }

      // Duplicate detection (applied to the final merged document)
      // Ensure finalMergedDoc is not null before processing for duplicates
      const dupIdx = finalMergedDoc ? await detectDuplicates(finalMergedDoc) : [];
      setDuplicates(dupIdx);

      // PDF Save options based on compression level
      const saveOptions: PDFSaveOptions = {};
      if (compressionLevel === 'none') {
        saveOptions.useObjectStreams = false;
      } else {
        saveOptions.useObjectStreams = true;
      }

      // Save merged PDF (ensure finalMergedDoc is not null)
      if (!finalMergedDoc) {
        throw new Error("PDF document creation failed.");
      }
      const mergedBytes = await finalMergedDoc.save(saveOptions);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setMergedBlobUrl(blobUrl);

      // OCR (premium feature)
      if (hasFeature(userRole, 'OCR')) {
        const { data } = await Tesseract.recognize(blob, 'eng');
        setOcrText(data.text);
      } else {
        setOcrText(''); // Clear any previous OCR text if user loses feature access
      }

      // Track successful merge operation
      trackStat("mergeOps", "PDF", "merge", {
        totalFiles: orderedFiles.length,
<<<<<<< HEAD
        totalSizeMB: parseFloat((orderedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)),
        userTier: userRole,
        compression: compressionLevel, // Added compression level
=======
        totalSizeMB: parseFloat((orderedFiles.reduce((acc, f) => acc + f.size, 0) / (1024*1024)).toFixed(2)),
        userTier: userRole
>>>>>>> main
      });

      // Track features used
      if (watermarkText) {
        trackStat("featureUsed", "PDF", "merge", { featureName: "watermark", userTier: userRole });
      }
      if (applyGrayscale) {
        trackStat("featureUsed", "PDF", "merge", { featureName: "grayscale", userTier: userRole });
      }
      if (hasFeature(userRole, 'OCR') && ocrText) { // ocrText being populated implies successful OCR
        trackStat("featureUsed", "PDF", "merge", { featureName: "ocr", userTier: userRole });
      }
      if (dupIdx.length > 0) { // dupIdx from detectDuplicates
        trackStat("featureUsed", "PDF", "merge", { featureName: "duplicateDetection", userTier: userRole });
<<<<<<< HEAD
      }
      if (compressionLevel !== 'none') {
        trackStat("featureUsed", "PDF", "merge", { featureName: "compression_" + compressionLevel, userTier: userRole });
=======
>>>>>>> main
      }

    } catch (err) {
      console.error(err);
      trackStat("errors", "PDF", "merge", { errorContext: "mergeProcessing", userTier: userRole, errorMessage: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  // -----------------------------------------------------------------------
  // Download handler
  // -----------------------------------------------------------------------
  const handleDownload = async () => {
    if (!mergedBlobUrl) return;
    const a = document.createElement('a');
    a.href = mergedBlobUrl;
    a.download = 'merged.pdf';
    a.click();
    trackStat("downloads", "PDF", "merge", { userTier: userRole });
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const renderPreview = (file: File, index: number) => (
    <Draggable key={file.name} draggableId={file.name} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="border rounded p-2 bg-white dark:bg-slate-800 shadow relative"
        >
          <p className="text-sm truncate w-40" title={file.name}>{file.name}</p>
        </div>
      )}
    </Draggable>
  );

  // -----------------------------------------------------------------------
  // JSX UI
  // -----------------------------------------------------------------------
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">PDF Merge</h1>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
          {userRole.toUpperCase()}
        </span>
      </div>

      {/* File selector */}
      {!isPageView && (
      <label className="block mb-4">
        <span className="sr-only">Choose PDFs</span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
            file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
          onChange={handleFileInput}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select one or more PDF files. Max total size: {(TIER_LIMITS[userRole] ?? TIER_LIMITS.anonymous) / (1024 * 1024)}MB.
        </p>
      </label>
      )}

      {/* Conditional View Rendering */}
      {isPageView ? (
        // =================== PAGE VIEW ===================
        <div className="mb-4">
          <button
            onClick={handleBackToFileView}
            className="mb-4 px-4 py-2 rounded font-semibold text-white bg-gray-500 hover:bg-gray-600"
          >
            &larr; Back to File View
          </button>
          <Droppable droppableId="detailedPagesList" direction="horizontal" type="PAGE">
            {(providedDroppable) => (
              <div
                ref={providedDroppable.innerRef}
                {...providedDroppable.droppableProps}
                className="flex flex-wrap gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md min-h-[200px]"
              >
                {detailedPages.map((page, index) => (
                  <Draggable draggableId={page.id} index={index} key={page.id}>
                    {(providedDraggable) => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
                        className={clsx(
                          "w-32 p-2 border rounded-md shadow bg-white dark:bg-slate-800 cursor-grab",
                          { 'ring-2 ring-blue-500 border-blue-700 dark:ring-blue-400 dark:border-blue-500': selectedPageId === page.id }
                        )}
                        onClick={() => setSelectedPageId(page.id)}
                      >
                        {page.thumbnailUrl === 'error' ? (
                          <div className="w-full h-32 flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 text-xs">
                            Error
                          </div>
                        ) : page.thumbnailUrl ? (
                          <img src={page.thumbnailUrl} alt={`Page ${page.originalPageIndex + 1} of ${page.originalFile.name}`} className="w-full h-auto object-contain mb-1" />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-slate-700 animate-pulse">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                          </div>
                        )}
                        <p className="text-xs truncate text-gray-700 dark:text-gray-300" title={`${page.originalFile.name} (Page ${page.originalPageIndex + 1} / ${page.numPagesInFile})`}>
                          {page.originalFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Page {page.originalPageIndex + 1} / {page.numPagesInFile}
                        </p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {providedDroppable.placeholder}
                {detailedPages.length === 0 && !isProcessing && (
                  <p className="text-gray-500 dark:text-gray-400">No pages to display. Try expanding files.</p>
                )}
              </div>
            )}
          </Droppable>
        </div>
      ) : (
        // =================== FILE VIEW ===================
        <>
          {orderedFiles.length > 0 && (
            <div className="mb-4">
              {/* No DragDropContext here, it's at the root */}
              <Droppable droppableId="pdfList" direction="horizontal" type="FILE">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex space-x-2 overflow-x-auto pb-2"
                  >
                    {orderedFiles.map((file, index) => renderPreview(file, index))} {/* Call renderPreview here */}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Drag and drop the uploaded files to set the merge order.
              </p>
              <button
                onClick={handleExpandToPageView}
                disabled={isProcessing}
                className="mt-4 px-4 py-2 rounded font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300"
              >
                {isProcessing ? 'Loading Pages...' : 'Organize Pages Individually \u2192'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Common Controls (Watermark, Compression, etc.) - visible in both views or only file view? For now, only file view implied by placement */}
      {!isPageView && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Watermark Text</label>
          <input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-slate-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter text to apply as a watermark on each page.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={watermarkOpacity}
            onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Adjust the transparency of the watermark.
          </p>
        </div>
        {/* Rotation and Font Size controls removed */}
        {/* Grayscale Checkbox */}
        <div className="md:col-span-2 flex items-center space-x-2 pt-2"> {/* Added pt-2 for spacing */}
          <input
            type="checkbox"
            id="grayscaleCheckbox"
            checked={applyGrayscale}
            onChange={(e) => setApplyGrayscale(e.target.checked)}
            className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="grayscaleCheckbox" className="text-sm font-medium">
            Apply Grayscale Effect
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            (Converts watermark text to grayscale)
          </p>
        </div>
        {/* Compression Level Select */}
        <div>
          <label htmlFor="compressionLevel" className="block text-sm font-medium mb-1">Compression Level</label>
          <Select value={compressionLevel} onValueChange={setCompressionLevel}>
            <SelectTrigger id="compressionLevel" className="w-full bg-white dark:bg-slate-800">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Default)</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Attempt to reduce file size. Effectiveness may vary. Available to all users.
          </p>
        </div>
        {/* Grayscale Checkbox */}
        <div className="md:col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            id="grayscaleCheckbox"
            checked={applyGrayscale}
            onChange={(e) => setApplyGrayscale(e.target.checked)}
            className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="grayscaleCheckbox" className="text-sm font-medium">
            Apply Grayscale Effect (to watermark)
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={handleMerge}
          disabled={isProcessing || orderedFiles.length < 2}
          className={clsx(
            'px-6 py-2 rounded font-semibold text-white',
            isProcessing ? 'bg-gray-400' : 'bg-cyan-600 hover:bg-cyan-700'
          )}
        >
          {isProcessing ? 'Processing…' : 'Merge'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!mergedBlobUrl}
          className={clsx(
            'px-6 py-2 rounded font-semibold',
            mergedBlobUrl ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-300 text-gray-600'
          )}
        >
          Download
        </button>
      </div>

      {/* OCR Result (premium) */}
      {hasFeature(userRole, 'OCR') ? (
<<<<<<< HEAD
        ocrText ? ( // Only show if there's text and feature is enabled
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded mb-6">
            <h2 className="font-bold mb-2">Extracted Text (OCR)</h2>
            <pre className="whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">{ocrText}</pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Extracted text content from your PDF using OCR.
            </p>
          </div>
        ) : ( // If feature enabled but no text yet (e.g. before processing)
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded mb-6 text-center">
             <p className="text-sm text-gray-600 dark:text-gray-300">
              OCR text will appear here after processing if text is found.
            </p>
=======
        ocrText && (
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded mb-6">
            <h2 className="font-bold mb-2">Extracted Text (OCR)</h2>
            <pre className="whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">{ocrText}</pre>
>>>>>>> main
          </div>
        )
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 p-4 rounded mb-6 text-center">
          <p className="text-sm text-yellow-700 dark:text-yellow-200">
            Text extraction (OCR) is a premium feature. Upgrade to enable.
          </p>
        </div>
      )}

      {/* Duplicate pages info */}
      {duplicates.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded mb-6">
          <h2 className="font-bold mb-2 text-yellow-700 dark:text-yellow-200">Duplicate Pages Detected</h2>
          <p className="text-sm mb-1">
            The following pages appear to be duplicates: {duplicates.map((i) => i + 1).join(', ')}.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-500">
             Review and consider removing them before merging for a cleaner result.
          </p>
        </div>
      )}
    </div>
  </DragDropContext>
  );
}
