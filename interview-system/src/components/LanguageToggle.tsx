import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../types/interview';

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export function LanguageToggle({ language, onLanguageChange, className = '' }: LanguageToggleProps) {
  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
    { value: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  ];

  const currentLang = languages.find(l => l.value === language) || languages[0];

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <Globe className="h-4 w-4 text-gray-500" />
      </button>
      
      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => {
                  onLanguageChange(lang.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  language === lang.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {language === lang.value && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

