import React from 'react';
import DocumentGenerator from '@/components/DocumentGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

const Documents: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto p-4">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold">{t('documents.title')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('documents.description')}
        </p>
      </div>
      
      <DocumentGenerator />
    </div>
  );
};

export default Documents; 