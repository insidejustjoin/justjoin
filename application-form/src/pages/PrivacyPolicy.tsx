import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '../components/LanguageToggle';

const PrivacyPolicy: React.FC = () => {
  const { t, language } = useLanguage();

  return (
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
            {language === 'ja' ? 'プライバシーポリシー' : t('privacy.title')}
          </h1>
          <p className="text-gray-600">
            {language === 'ja' ? '最終更新日' : t('privacy.lastUpdated')}: 2024年1月27日
          </p>
        </div>

        {/* プライバシーポリシー内容 */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '1. 個人情報の収集について' : t('privacy.section1.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja' 
                ? 'just join（以下「当社」）は、求職者と企業をつなぐ求人プラットフォームを運営しています。当社は、サービスの提供にあたり、お客様の個人情報を適切に取り扱い、保護することが社会的責務であると考えています。'
                : t('privacy.section1.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本プライバシーポリシーは、当社が収集する個人情報の種類、利用目的、管理方法、お客様の権利について説明します。'
                : t('privacy.section1.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '2. 収集する個人情報' : t('privacy.section2.title')}
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{language === 'ja' ? '氏名、メールアドレス、電話番号' : t('privacy.section2.item1')}</li>
              <li>{language === 'ja' ? '職歴、学歴、スキル情報' : t('privacy.section2.item2')}</li>
              <li>{language === 'ja' ? '企業情報（企業ユーザーの場合）' : t('privacy.section2.item3')}</li>
              <li>{language === 'ja' ? 'アップロードされた書類（履歴書、職務経歴書等）' : t('privacy.section2.item4')}</li>
              <li>{language === 'ja' ? '面接データ（AI面接システム利用時）' : t('privacy.section2.item5')}</li>
              <li>{language === 'ja' ? 'アクセスログ、利用履歴' : t('privacy.section2.item6')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '3. 個人情報の利用目的' : t('privacy.section3.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、収集した個人情報を以下の目的で利用します。'
                : t('privacy.section3.content')
              }
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{language === 'ja' ? '求職者と企業のマッチングサービス提供' : t('privacy.section3.item1')}</li>
              <li>{language === 'ja' ? 'AI面接システムの提供・改善' : t('privacy.section3.item2')}</li>
              <li>{language === 'ja' ? 'カスタマーサポートの提供' : t('privacy.section3.item3')}</li>
              <li>{language === 'ja' ? 'サービスの改善・新機能開発' : t('privacy.section3.item4')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '4. 個人情報の管理・保護' : t('privacy.section4.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、個人情報の漏洩、滅失、き損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。'
                : t('privacy.section4.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '具体的には、暗号化通信、アクセス制御、定期的なセキュリティ監査を実施しています。'
                : t('privacy.section4.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '5. 個人情報の第三者提供' : t('privacy.section5.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、法令に基づく場合を除き、お客様の同意なく個人情報を第三者に提供いたしません。'
                : t('privacy.section5.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'ただし、求職者と企業のマッチング目的で、適切な範囲内で情報を共有する場合があります。'
                : t('privacy.section5.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '6. 個人情報の開示・訂正・利用停止' : t('privacy.section6.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'お客様は、当社が保有する個人情報について、開示、訂正、利用停止を請求する権利があります。'
                : t('privacy.section6.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'これらの請求については、inside.justjoin@gmail.comまでご連絡ください。'
                : t('privacy.section6.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '7. Cookieの使用' : t('privacy.section7.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、サービスの改善とユーザー体験の向上のためにCookieを使用しています。'
                : t('privacy.section7.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'ブラウザの設定でCookieを無効にすることも可能ですが、一部の機能が利用できなくなる場合があります。'
                : t('privacy.section7.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '8. プライバシーポリシーの変更' : t('privacy.section8.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、必要に応じて本プライバシーポリシーを変更する場合があります。'
                : t('privacy.section8.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '重要な変更がある場合は、事前に通知いたします。'
                : t('privacy.section8.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '9. お問い合わせ' : t('privacy.section9.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '個人情報の取り扱いに関するお問い合わせは、以下の連絡先までお願いいたします。'
                : t('privacy.section9.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'メール: inside.justjoin@gmail.com'
                : t('privacy.section9.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '10. 準拠法・管轄裁判所' : t('privacy.section10.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本プライバシーポリシーの解釈にあたっては、日本法を準拠法とします。'
                : t('privacy.section10.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本プライバシーポリシーに関して紛争が生じた場合の第一審の専属管轄裁判所は、東京地方裁判所とします。'
                : t('privacy.section10.content2')
              }
            </p>
          </section>
        </div>

        {/* フッター */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {language === 'ja' ? 'このプライバシーポリシーは2024年1月27日に制定されました。' : t('privacy.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 