import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '../components/LanguageToggle';

const CommercialTransaction: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>registration form for job seeker</title>
        <meta name="description" content="registration form for job seeker" />
        <meta name="keywords" content="registration form for job seeker" />
        <meta property="og:title" content="registration form for job seeker" />
        <meta property="og:description" content="registration form for job seeker" />
        <meta name="twitter:title" content="registration form for job seeker" />
        <meta name="twitter:description" content="registration form for job seeker" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <Link to="/">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('common.home')}
                </Button>
              </Link>
              <LanguageToggle />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('commercial.title')}
            </h1>
            <p className="text-gray-600">
              {t('commercial.lastUpdated')}: 2025年7月7日
            </p>
          </div>

          {/* 特定商取引法に基づく表記内容 */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('commercial.section1.title')}
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <table className="w-full">
                  <tbody className="space-y-4">
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item1.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item1.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item2.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item2.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item3.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item3.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item4.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item4.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item5.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item5.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item6.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item6.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item7.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item7.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item8.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item8.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item9.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item9.value')}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-gray-900 py-2">
                        {t('commercial.section1.item10.label')}
                      </td>
                      <td className="text-gray-700 py-2">
                        {t('commercial.section1.item10.value')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('commercial.section2.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('commercial.section2.content')}
              </p>
              <p className="text-gray-700 mb-4">
                {t('commercial.section2.content2')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('commercial.section3.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('commercial.section3.content')}
              </p>
              <p className="text-gray-700 mb-4">
                {t('commercial.section3.content2')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('commercial.section4.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('commercial.section4.content')}
              </p>
              <p className="text-gray-700 mb-4">
                {t('commercial.section4.content2')}
              </p>
            </section>
          </div>

          {/* フッター */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t('commercial.footer')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommercialTransaction; 