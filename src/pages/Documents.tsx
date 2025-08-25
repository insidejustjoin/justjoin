import React, { useState } from 'react';
import DocumentGenerator from '@/components/DocumentGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { FuriganaText } from '@/components/FuriganaText';

const Documents: React.FC = () => {
  const { t } = useLanguage();
  const [showFurigana, setShowFurigana] = useState(true);

  return (
    <div className="container mx-auto p-4">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">
          <FuriganaText 
            text={t('documents.title')} 
            showFurigana={showFurigana}
            onToggleFurigana={setShowFurigana}
            showToggleButton={true}
          />
        </h1>
        <p className="text-muted-foreground text-sm">
          <FuriganaText 
            text={t('documents.description')} 
            showFurigana={showFurigana}
          />
        </p>
      </div>
      
      <DocumentGenerator />
    </div>
  );
};

export default Documents; 