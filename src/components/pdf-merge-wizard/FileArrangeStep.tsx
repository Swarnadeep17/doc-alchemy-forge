import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Trash2 } from 'lucide-react';
import { Droppable, Draggable } from 'react-beautiful-dnd'; // Added
import clsx from 'clsx'; // Added

interface FileArrangeStepProps {
  onBack: () => void;
  onNext: () => void;
  files: File[];
  setSelectedFiles: (files: File[]) => void; // For keyboard reordering
  onDeleteFile: (fileId: string) => void;
}

const FileArrangeStep: React.FC<FileArrangeStepProps> = ({
  onBack,
  onNext,
  files,
  setSelectedFiles,
  onDeleteFile
}) => {
  const [selectedFileIdForKeyboard, setSelectedFileIdForKeyboard] = useState<string | null>(null);

  const getFileId = (file: File) => `${file.name}-${file.lastModified}`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedFileIdForKeyboard || files.length === 0) return;

      const currentIndex = files.findIndex(f => getFileId(f) === selectedFileIdForKeyboard);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      let newFilesOrder = Array.from(files);

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
          const temp = newFilesOrder[currentIndex];
          newFilesOrder[currentIndex] = newFilesOrder[newIndex];
          newFilesOrder[newIndex] = temp;
          setSelectedFiles(newFilesOrder);
          setSelectedFileIdForKeyboard(getFileId(newFilesOrder[newIndex]));
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (currentIndex < files.length - 1) {
          newIndex = currentIndex + 1;
          const temp = newFilesOrder[currentIndex];
          newFilesOrder[currentIndex] = newFilesOrder[newIndex];
          newFilesOrder[newIndex] = temp;
          setSelectedFiles(newFilesOrder);
          setSelectedFileIdForKeyboard(getFileId(newFilesOrder[newIndex]));
        }
      } else if (event.key === 'Escape') {
        setSelectedFileIdForKeyboard(null);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDeleteFile(selectedFileIdForKeyboard);
        setSelectedFileIdForKeyboard(null); // Deselect after deletion
      }
    };

    // Only add listener if there are files to navigate
    if (files.length > 0) {
        document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [files, selectedFileIdForKeyboard, setSelectedFiles, onDeleteFile]);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-1">Step 2: Arrange Files</h2>
        <p className="text-sm text-slate-400">
          Drag and drop files, or use Arrow Left/Right keys on a selected file, to change their merge order. The file at the left will appear first.
        </p>
      </div>

      {files.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/30">
          <p className="text-slate-400">No files uploaded. Please go back to Step 1 to upload your PDFs.</p>
        </div>
      ) : (
        <Droppable droppableId="fileListDroppable" direction="horizontal" type="FILE_CARD">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex overflow-x-auto space-x-4 pb-4 min-h-[150px] items-start bg-slate-900/50 p-4 rounded-lg border border-slate-700"
            >
              {files.map((file, index) => {
                const fileId = getFileId(file);
                return (
                  <Draggable draggableId={fileId} index={index} key={fileId}>
                    {(providedDraggable, snapshot) => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
                        onClick={() => setSelectedFileIdForKeyboard(fileId)}
                        className={clsx(
                          "flex-shrink-0 w-56 p-3 bg-slate-700 rounded-lg shadow-md border border-slate-600 cursor-grab",
                          {
                            "ring-2 ring-cyan-500 border-cyan-500": selectedFileIdForKeyboard === fileId,
                            "opacity-80 scale-105 shadow-xl": snapshot.isDragging,
                           }
                        )}
                        aria-selected={selectedFileIdForKeyboard === fileId}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium text-slate-100 break-all" title={file.name}>
                            {file.name}
                          </h4>
                          <button
                            className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card click selection
                                onDeleteFile(fileId);
                            }}
                            aria-label={`Delete ${file.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={files.length === 0}
          className="px-6 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
        >
          Next Step: Arrange Pages
        </button>
      </div>
    </div>
  );
};
export default FileArrangeStep;
