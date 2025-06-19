import React from 'react';

interface SettingsStepProps {
  onBack: () => void;
  onMerge: () => void; // Or onFinish
}

const SettingsStep: React.FC<SettingsStepProps> = ({ onBack, onMerge }) => {
  return (
    <div>
      <h2>Step 4: Settings & Merge</h2>
      {/* UI for settings and merge button will go here */}
      <button onClick={onBack}>Back</button>
      <button onClick={onMerge}>Merge PDFs</button>
    </div>
  );
};
export default SettingsStep;
