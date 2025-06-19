import React, { useEffect, useRef } from 'react'; // Added useEffect, useRef
import { Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
// Import DetailedPage from the Wizard component file or a shared types definition
import type { DetailedPage } from '../../pages/tools/pdf/PdfMergeWizard'; // Adjusted path

interface PageThumbnailProps {
  page: DetailedPage;
  onVisible: (pageId: string) => void;
  onDelete: (pageId: string) => void; // Added onDelete prop for the thumbnail
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ page, onVisible, onDelete }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (page.thumbnailUrl === null) { // Only trigger if not already loaded/loading/error
            onVisible(page.id);
          }
          observer.unobserve(entry.target); // Unobserve after first visibility or if already processed
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the item is visible
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [page.id, page.thumbnailUrl, onVisible]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className="relative group aspect-[3/4] p-1.5 border border-slate-600 rounded-md shadow-sm bg-slate-700 hover:border-cyan-500 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
            // onClick={() => console.log("Page selected:", page.id)} // For selection later
            // {...providedDraggable.draggableProps} // These will come from Draggable
            // {...providedDraggable.dragHandleProps}
          >
            <div className="w-full h-full bg-slate-600 flex items-center justify-center rounded-sm overflow-hidden">
              {page.thumbnailUrl === 'error' ? (
                <span className="text-xs text-red-400 p-1">Error</span>
              ) : page.thumbnailUrl === 'loading' || page.thumbnailUrl === null ? (
                <span className="text-xs text-slate-400 animate-pulse p-1">Loading...</span>
              ) : (
                <img
                  src={page.thumbnailUrl}
                  alt={`Preview of ${page.originalFileName} page ${page.originalPageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="mt-1.5 w-full text-center">
              <p className="text-xs text-slate-200 truncate" title={page.originalFileName}>
                {page.originalFileName}
              </p>
              <p className="text-xxs text-slate-400">
                Page {page.originalPageIndex + 1} / {page.numPagesInOriginalFile}
              </p>
            </div>
            <button
              className="absolute top-1 right-1 p-0.5 bg-slate-800 text-slate-400 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(page.id);
              }}
              aria-label={`Delete page ${page.originalPageIndex + 1} from ${page.originalFileName}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 text-slate-200 border-slate-700">
          <p>Drag to re-order this page.</p>
          <p className="text-xs text-slate-400">{page.originalFileName} - Page {page.originalPageIndex + 1}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


interface PageArrangeStepProps {
  onBack: () => void;
  onNext: () => void;
  pages: DetailedPage[];
  onPageVisible: (pageId: string) => void;
  onDeletePage: (pageId: string) => void; // Add this prop
  // onPageOrderChange: (reorderedPages: DetailedPageInfo[]) => void; // To be added later for DND
}

const PageArrangeStep: React.FC<PageArrangeStepProps> = ({
  onBack,
  onNext,
  pages,
  onPageVisible,
  onDeletePage
}) => {

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 mb-1">Step 3: Arrange Pages</h2>
        <p className="text-sm text-slate-400">
          Review and reorder individual pages. Drag pages to change their order or use the delete icon to remove a page.
        </p>
      </div>

      {pages.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/30">
          <p className="text-slate-400">No pages to arrange. Please go back to upload and select files, then click "Organize Pages Individually".</p>
        </div>
      ) : (
        // This outer div will be the Droppable for react-beautiful-dnd later
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[200px] overflow-y-auto max-h-[60vh]">
          {pages.map((page, index) => (
            // This PageThumbnail will be wrapped by Draggable later
            <PageThumbnail
              key={page.id}
              page={page}
              onVisible={onPageVisible}
              onDelete={onDeletePage} // Pass onDeletePage here
            />
          ))}
        </div>
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
          disabled={pages.length === 0}
          className="px-6 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
        >
          Next Step: Settings & Merge
        </button>
      </div>
    </div>
  );
};
export default PageArrangeStep;
