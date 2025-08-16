import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

interface BetaNoticeProps {
  className?: string;
}

export function BetaNotice({ className = '' }: BetaNoticeProps) {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center justify-center p-2 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
      <AlertTriangle className="w-3 h-3 text-amber-600 mr-2 flex-shrink-0" />
      <p className="text-xs text-amber-800 font-medium">
        {t('betaNotice.message')}
      </p>
    </div>
  );
} 