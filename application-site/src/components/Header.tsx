import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { Menu, X, Globe } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages: { code: Language; name: string }[] = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'uz', name: "O'zbek" },
  ];


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src="/logo.svg"
              alt="justjoin"
              className="h-10 sm:h-12"
            />
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {languages.find(l => l.code === language)?.name}
                </span>
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === lang.code ? 'bg-primary text-white hover:bg-primary-sub' : ''
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login Button */}
            <motion.a
              href="https://justjoin.jp/jobseeker/login"
              className="px-6 py-2 text-sm font-medium text-black hover:text-primary transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('header.login')}
            </motion.a>

            {/* Register Button */}
            <motion.a
              href="https://justjoin.jp/jobseeker/register"
              className="px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-sub transition-colors shadow-md"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(218, 34, 34, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              {t('header.register')}
            </motion.a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 pb-4 border-t border-gray-200"
          >
            <div className="flex flex-col gap-4 pt-4">
              {/* Language Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase mb-2">Language</span>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                      }}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        language === lang.code
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login Button */}
              <a
                href="https://justjoin.jp/jobseeker/login"
                className="px-6 py-3 text-center font-medium text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('header.login')}
              </a>

              {/* Register Button */}
              <a
                href="https://justjoin.jp/jobseeker/register"
                className="px-6 py-3 text-center font-medium text-white bg-primary rounded-lg hover:bg-primary-sub transition-colors"
              >
                {t('header.register')}
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

