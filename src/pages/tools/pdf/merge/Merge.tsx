// src/pages/tools/pdf/merge/Merge.tsx
import React, { useState } from 'react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import UploadStep from '../../../../components/tools/pdf-merge-wizard/steps/UploadStep';
import FileArrangeStep from '../../../../components/tools/pdf-merge-wizard/steps/FileArrangeStep';
import PageArrangeStep from '../../../../components/tools/pdf-merge-wizard/steps/PageArrangeStep';
import SettingsStep from '../../../../components/tools/pdf-merge-wizard/steps/SettingsStep';
import { DragDropContext, DropResult } from 'react-beautiful-dnd'; // Corrected import

// Placeholder for DetailedPage interface - will be refined
export interface DetailedPage {
  id: string;
  fileId: string;
  originalFile: File;
  originalFileName: string;
  originalPageIndex: number;
  numPagesInFile: number;
  thumbnailUrl: string | null | 'loading' | 'error';
}

const PdfMergeWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [detailedPages, setDetailedPages] = useState<DetailedPage[]>([]);
  const [fileArrayBuffers, setFileArrayBuffers] = useState<Map<string, ArrayBuffer>>(new Map());

  const totalSteps = 4;

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSetSelectedFiles = (files: File[]) => setSelectedFiles(files);
  const handleDeleteFile = (fileId: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(f => `${f.name}-${f.lastModified}` !== fileId));
  };
  const handlePageVisible = (pageId: string) => console.log("Page visible:", pageId);
  const handleMerge = () => alert('Merge initiated!');

  // Dummy onDragEnd handler for react-beautiful-dnd
  const onDragEnd = (result: DropResult) => {
    // Basic handler, will be fleshed out when implementing drag & drop in steps
    console.log('Drag ended:', result);
    if (!result.destination) {
      return;
    }
    // Example: if (result.destination.droppableId === 'fileListDroppable' && currentStep === 2) { ... }
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

  const StepIndicator = ({ step, title, isActive, isCompleted }: { step: number, title: string, isActive: boolean, isCompleted: boolean }) => (
    <div className={`flex items-center ${isCompleted ? 'text-cyan-400' : isActive ? 'text-white' : 'text-gray-500'}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2
                    ${isActive || isCompleted ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400'}
                    border-2 ${isActive ? 'border-cyan-300' : isCompleted ? 'border-cyan-500' : 'border-gray-600'}`}
      >
        {isCompleted && !isActive ? '✔' : step}
      </div>
      <span className={`font-mono text-sm uppercase tracking-wider ${isActive ? 'font-semibold' : ''}`}>{title}</span>
    </div>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white selection:bg-cyan-500 selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col items-center py-8 px-4">
          <div className="w-full max-w-5xl bg-slate-800/70 backdrop-blur-lg p-6 md:p-10 rounded-xl shadow-2xl border border-slate-700/50">

            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-3">
                PDF Merge Tool
              </h1>
              <div className="flex justify-center items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((step, index) => (
                  <React.Fragment key={step}>
                    <StepIndicator
                      step={step}
                      title={getStepTitle(step)}
                      isActive={currentStep === step}
                      isCompleted={currentStep > step}
                    />
                    {index < totalSteps - 1 && (
                      <div className="flex-1 h-px bg-gray-600 max-w-[20px] sm:max-w-[40px]"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="min-h-[300px]">
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
                />
              )}
              {currentStep === 4 && (
                <SettingsStep
                  onBack={handleBack}
                  onMerge={handleMerge}
                />
              )}
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </DragDropContext>
  );
};

export default PdfMergeWizard;
