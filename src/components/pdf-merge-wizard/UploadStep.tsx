import React, { useRef, useState, DragEvent } from 'react'; // Added useState and DragEvent
import { useAuth } from '../../context/AuthContext';
import { TIER_LIMITS } from '../../constants/tiers';
import type { UserRole } from '../../context/AuthContext';
import clsx from 'clsx'; // For conditional classes

interface UploadStepProps {
  onNext: () => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void; // To update parent state
}

const UploadStep: React.FC<UploadStepProps> = ({
  onNext,
  selectedFiles,
  setSelectedFiles
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { user } = useAuth();
  const userRole = (user?.role || 'anonymous') as UserRole;
  const limit = TIER_LIMITS[userRole] ?? TIER_LIMITS.anonymous;

  // This currentSize reflects what's already in the parent (Wizard) state
  const currentCumulativeSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

  const handleFileProcessing = (fileList: FileList | null) => {
    setUploadError(null);
    if (!fileList) return;

    const newFilesArray = Array.from(fileList);
    const validPdfFiles: File[] = [];
    let newFilesBatchSize = 0;

    for (const file of newFilesArray) {
      if (file.type === "application/pdf") {
        validPdfFiles.push(file);
        newFilesBatchSize += file.size;
      } else {
        setUploadError(`File "${file.name}" is not a PDF and was ignored.`);
        // alert(`File "${file.name}" is not a PDF and was ignored.`); // Simple alert for now
      }
    }

    if (validPdfFiles.length === 0 && newFilesArray.length > 0) {
      setUploadError("No valid PDF files were selected.");
      return;
    }
    if (validPdfFiles.length === 0) { // No files selected or all were invalid
        return;
    }

    // Validate the size of the new batch PLUS already selected files against the tier limit
    // The parent (PdfMergeWizard) will manage the combined list.
    // Here, we ensure the new batch itself isn't excessively large on its own,
    // and then let the parent decide on accumulation.
    // For this step, UploadStep will replace the selection.
    // Parent will then have the full list to validate if it needs to.

    // Let's assume UploadStep replaces the current selection.
    // So, check if this new batch (validPdfFiles) exceeds the limit.
    if (newFilesBatchSize > limit) {
      setUploadError(
        `Selected files (${(newFilesBatchSize / (1024 * 1024)).toFixed(2)} MB) exceed your tier limit of ${(limit / (1024 * 1024)).toFixed(1)} MB.`
      );
      return;
    }

    setSelectedFiles(validPdfFiles); // Pass up the newly validated batch
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileProcessing(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  // currentSize for display should always be from selectedFiles prop (wizard's state)
  const displaySize = selectedFiles.reduce((acc, file) => acc + file.size, 0);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-1">Step 1: Upload Your PDFs</h2>
        <p className="text-sm text-slate-400">Select the PDF files you want to merge. You can drag & drop or browse your computer.</p>
      </div>

      <div
        className={clsx(
          "p-8 md:p-12 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-200 ease-in-out bg-slate-800/30",
          isDraggingOver ? "border-cyan-500 bg-slate-700/50" : "border-slate-600 hover:border-cyan-600 hover:bg-slate-700/40"
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload PDFs – drag & drop or click to browse"
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDropZoneClick();}}
      >
        <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 text-slate-300">Drag & Drop PDF files here</p>
        <p className="text-xs text-slate-500 mt-1">or</p>
        <button
          type="button"
          className="mt-3 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
        >
          Browse Files
        </button>
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={(e) => handleFileProcessing(e.target.files)}
        />
      </div>

      {uploadError && (
        <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md">{uploadError}</p>
      )}

      <div className="mt-4 text-sm">
        {selectedFiles.length > 0 ? (
          <div className="text-slate-300">
            <p>
              <span className="font-medium">{selectedFiles.length} file(s) selected.</span> Total size: {(displaySize / (1024*1024)).toFixed(2)} MB
            </p>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
              <div
                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min((displaySize / limit) * 100, 100)}%` }} // Cap width at 100%
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">
              Your tier limit: {(limit / (1024*1024)).toFixed(1)} MB
            </p>
          </div>
        ) : (
          !uploadError && <p className="text-slate-500">No files selected. Your tier limit is {(limit / (1024*1024)).toFixed(1)} MB.</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={selectedFiles.length === 0 || displaySize > limit || !!uploadError}
          className="px-6 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
        >
          Next Step: Arrange Files
        </button>
      </div>
    </div>
  );
};
export default UploadStep;
