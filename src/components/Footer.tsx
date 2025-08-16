import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  const handleLinkClick = () => {
    // ページを最上部までスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 会社情報 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Application Form of Recruit
            </h3>
          </div>
        </div>

        {/* 法的事項 */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <Link
                to="/privacy-policy"
                className="hover:text-gray-700"
                onClick={handleLinkClick}
              >
                {t('footer.privacyPolicy')}
              </Link>
              <Link
                to="/terms-of-service"
                className="hover:text-gray-700"
                onClick={handleLinkClick}
              >
                {t('footer.termsOfService')}
              </Link>
              <Link
                to="/commercial-transaction"
                className="hover:text-gray-700"
                onClick={handleLinkClick}
              >
                {t('footer.commercialTransaction')}
              </Link>
            </div>
            <div className="text-xs text-gray-500">
            just join {t('footer.allRightsReserved')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 