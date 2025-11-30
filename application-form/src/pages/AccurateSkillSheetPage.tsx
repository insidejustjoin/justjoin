import React from 'react';
import DocumentGenerator from '@/components/DocumentGenerator';

const AccurateSkillSheetPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <DocumentGenerator registrationType="engineer" />
    </div>
  );
};

export default AccurateSkillSheetPage; 