import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const getLanguageFlag = () => {
    if (language === 'ja') return '🇯🇵';
    if (language === 'ru') return '🇷🇺';
    if (language === 'uz') return '🇺🇿';
    return '🇺🇸';
  };

  const getLanguageName = () => {
    if (language === 'ja') return '日本語';
    if (language === 'ru') return 'Русский';
    if (language === 'uz') return "O'zbekcha";
    return 'English';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <span className="text-sm">{getLanguageFlag()}</span>
          <span className="text-xs hidden sm:inline">{getLanguageName()}</span>
          <Globe className="h-3 w-3" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage('ja')}
          className={language === 'ja' ? 'bg-accent' : ''}
        >
          🇯🇵 日本語
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ru')}
          className={language === 'ru' ? 'bg-accent' : ''}
        >
          🇷🇺 Русский
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('uz')}
          className={language === 'uz' ? 'bg-accent' : ''}
        >
          🇺🇿 O'zbekcha
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 