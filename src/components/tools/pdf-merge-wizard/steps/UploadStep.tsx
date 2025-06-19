// src/components/tools/pdf-merge-wizard/steps/UploadStep.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui button
import { TIER_LIMITS, UserRole } from '@/constants/tiers'; // Import TIER_LIMITS and UserRole
import { useAuth } from '@/context/AuthContext'; // To get the current user's role
import { UploadCloud, FileText, XCircle, Loader2 } from 'lucide-react';

interface UploadStepProps {
  onNext: () => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  // It's better to calculate total size and tier limit in the parent and pass them down
  // to keep this component focused on UI and basic validation.
  // For now, we'll pass userRole and let the component calculate its display.
  // Later, parent Merge.tsx will handle ArrayBuffer caching and more complex logic.
}

const UploadStep: React.FC<UploadStepProps> = ({ onNext, selectedFiles, setSelectedFiles }) => {
  const { user } = useAuth();
  const userRole: UserRole = user?.role || 'anonymous';
  const currentTierLimit = TIER_LIMITS[userRole];

  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  useEffect(() => {
    const currentSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    setTotalSize(currentSize);
  }, [selectedFiles]);

  const validateFiles = (files: File[]): { validFiles: File[], errors: string[] } => {
    const errors: string[] = [];
    const validFiles: File[] = [...selectedFiles]; // Start with already selected valid files
    let currentTotalSize = totalSize;

    files.forEach(file => {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: Invalid file type. Only PDFs are allowed.`);
        return;
      }
      if (currentTotalSize + file.size > currentTierLimit) {
        errors.push(`${file.name}: File size exceeds remaining session limit. Total limit for your tier (${userRole}) is ${(currentTierLimit / (1024*1024)).toFixed(0)}MB.`);
        // Do not add this file if it makes the total exceed the limit
        return;
      }
      // Check for duplicates by name and size (simple check, not content based here)
      if (validFiles.some(vf => vf.name === file.name && vf.size === file.size)) {
        errors.push(`${file.name}: This file seems to be a duplicate.`);
        return;
      }

      validFiles.push(file);
      currentTotalSize += file.size;
    });

    // Final check on total size if multiple files were added at once
    if (validFiles.reduce((acc, f) => acc + f.size, 0) > currentTierLimit && files.length > 0) {
        // This case is tricky if a batch of files collectively exceeds the limit
        // For simplicity, if the initial check per file passed but total now fails (e.g. adding many small files at once)
        // We might need to remove files from the end of the 'files' array until it fits.
        // However, the individual file check should largely prevent this.
        // The prompt implies "running total size", so checks are per-file addition.
    }

    return { validFiles, errors };
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    setIsReadingFiles(true);
    setFileErrors([]); // Clear previous errors

    const rejectionErrors = fileRejections.map(rejection =>
      `${rejection.file.name}: ${rejection.errors.map((e:any) => e.message).join(', ')}`
    );

    // Pass current `selectedFiles` from props to `validateFiles`
    const { validFiles: newValidFiles, errors: validationErrors } = validateFiles(acceptedFiles);

    const allErrors = [...rejectionErrors, ...validationErrors];

    if (allErrors.length > 0) {
      setFileErrors(allErrors);
    }

    setSelectedFiles(newValidFiles);

    // Simulate reading files for progress (actual ArrayBuffer caching will be in parent)
    if (acceptedFiles.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 300 + 50 * acceptedFiles.length));
    }
    setIsReadingFiles(false);

  }, [setSelectedFiles, currentTierLimit, userRole, selectedFiles, totalSize]); // Added selectedFiles and totalSize to dependencies


  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true, // Using a custom button to open
    noKeyboard: true,
  });

  const removeFile = (fileName: string) => {
    setSelectedFiles(selectedFiles.filter(f => f.name !== fileName));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div
        {...getRootProps()}
        role="button"
        aria-label="Upload PDFs – drag & drop or click"
        className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-200 ease-in-out
                    ${isDragActive ? 'border-cyan-400 bg-cyan-900/30' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-cyan-300' : 'text-slate-500'}`} />
        {isDragActive ? (
          <p className="text-lg font-semibold text-cyan-300">Drop the files here ...</p>
        ) : (
          <>
            <p className="text-lg font-semibold text-slate-300">Drag & drop PDF files here</p>
            <p className="text-sm text-slate-400 mt-1">or</p>
          </>
        )}
        <Button
          type="button"
          onClick={open}
          variant="outline"
          className="mt-4 bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-200 hover:text-white"
        >
          Browse Files
        </Button>
      </div>

      {fileErrors.length > 0 && (
        <div className="mt-4 space-y-1">
          {fileErrors.map((error, index) => (
            <p key={index} className="text-xs text-red-400 font-mono flex items-center">
              <XCircle className="w-3 h-3 mr-1.5 flex-shrink-0" /> {error}
            </p>
          ))}
        </div>
      )}

      {isReadingFiles && (
        <div className="flex items-center justify-center text-slate-300 mt-4">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing files...
        </div>
      )}

      {selectedFiles.length > 0 && !isReadingFiles && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">Selected Files:</h3>
          <ul className="max-h-60 overflow-y-auto pr-2 space-y-2">
            {selectedFiles.map(file => (
              <li key={`${file.name}-${file.lastModified}-${file.size}`} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg text-sm">
                <div className="flex items-center overflow-hidden min-w-0">
                  <FileText className="w-5 h-5 mr-3 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-300 truncate" title={file.name}>{file.name}</span>
                </div>
                <div className="flex items-center flex-shrink-0 ml-2">
                  <span className="text-xs text-slate-400 mr-3 whitespace-nowrap">{formatBytes(file.size)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.name)} className="text-slate-400 hover:text-red-400 h-7 w-7">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-sm text-slate-400">
        <p>
          Total selected size: <span className="font-semibold text-cyan-300">{formatBytes(totalSize)}</span> /
          <span className="font-semibold text-slate-200">{formatBytes(currentTierLimit)}</span>
          <span className="text-xs"> ({userRole} tier)</span>
        </p>
        {totalSize > currentTierLimit && (
            <p className="text-red-400 text-xs font-mono mt-1 flex items-center">
                <XCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                You have exceeded your session upload limit. Please remove some files.
            </p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedFiles.length === 0 || totalSize === 0 || totalSize > currentTierLimit || isReadingFiles}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-2.5"
        >
          Next: Arrange Files
          {isReadingFiles && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        </Button>
      </div>
    </div>
  );
};

export default UploadStep;
