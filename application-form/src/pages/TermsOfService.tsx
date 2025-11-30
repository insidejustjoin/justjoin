import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '../components/LanguageToggle';

const TermsOfService: React.FC = () => {
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
            {language === 'ja' ? '利用規約' : t('terms.title')}
          </h1>
          <p className="text-gray-600">
            {language === 'ja' ? '最終更新日' : t('terms.lastUpdated')}: 2024年1月27日
          </p>
        </div>

        {/* 利用規約内容 */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第1条（適用）' : t('terms.section1.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本規約は、just join（以下「当社」）が提供する求人プラットフォームサービス（以下「本サービス」）の利用条件を定めるものです。'
                : t('terms.section1.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本サービスを利用するお客様（以下「ユーザー」）は、本規約に同意したものとみなします。'
                : t('terms.section1.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第2条（禁止事項）' : t('terms.section2.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。'
                : t('terms.section2.content')
              }
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{language === 'ja' ? '法令または公序良俗に違反する行為' : t('terms.section2.item1')}</li>
              <li>{language === 'ja' ? '犯罪行為に関連する行為' : t('terms.section2.item2')}</li>
              <li>{language === 'ja' ? '当社のサーバーまたはネットワークの機能を破壊する行為' : t('terms.section2.item3')}</li>
              <li>{language === 'ja' ? '本サービスの他のユーザーに迷惑をかける行為' : t('terms.section2.item4')}</li>
              <li>{language === 'ja' ? '当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為' : t('terms.section2.item5')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第3条（本サービスの提供の停止等）' : t('terms.section3.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。'
                : t('terms.section3.content')
              }
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{language === 'ja' ? '本サービスにかかるコンピュータシステムの保守点検または更新を行う場合' : t('terms.section3.item1')}</li>
              <li>{language === 'ja' ? '地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合' : t('terms.section3.item2')}</li>
              <li>{language === 'ja' ? 'コンピュータまたは通信回線等が事故により停止した場合' : t('terms.section3.item3')}</li>
              <li>{language === 'ja' ? 'その他、当社が本サービスの提供が困難と判断した場合' : t('terms.section3.item4')}</li>
              <li>{language === 'ja' ? '当社は、本サービスの提供の停止または中断によりユーザーまたは第三者に生じた損害について、一切の責任を負いません。' : t('terms.section3.item5')}</li>
              <li>{language === 'ja' ? '当社は、本サービスの提供の停止または中断によりユーザーまたは第三者に生じた損害について、一切の責任を負いません。' : t('terms.section3.item6')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第4条（利用制限および登録抹消）' : t('terms.section4.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。'
                : t('terms.section4.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本規約のいずれかの条項に違反した場合、またはその他、当社が本サービスの利用を適当でないと判断した場合'
                : t('terms.section4.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第5条（免責事項）' : t('terms.section5.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。'
                : t('terms.section5.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。'
                : t('terms.section5.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第6条（サービス内容の変更等）' : t('terms.section6.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。'
                : t('terms.section6.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、本サービスの提供の終了によりユーザーまたは第三者に生じた損害について、一切の責任を負いません。'
                : t('terms.section6.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第7条（利用規約の変更）' : t('terms.section7.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。'
                : t('terms.section7.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'なお、本規約の変更後、本サービスの利用を継続した場合には、変更後の規約に同意したものとみなします。'
                : t('terms.section7.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第8条（通知または連絡）' : t('terms.section8.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。'
                : t('terms.section8.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、ユーザーから、当社が別途定める方法に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。'
                : t('terms.section8.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第9条（権利義務の譲渡の禁止）' : t('terms.section9.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? 'ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。'
                : t('terms.section9.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '当社は、本サービスにかかる事業を他社に譲渡した場合には、当該譲渡に伴い利用契約上の地位、本規約に基づく権利および義務並びにユーザーの登録事項その他の顧客情報を当該譲渡の譲受人に譲渡することができるものとします。'
                : t('terms.section9.content2')
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {language === 'ja' ? '第10条（準拠法・裁判管轄）' : t('terms.section10.title')}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本規約の解釈にあたっては、日本法を準拠法とします。'
                : t('terms.section10.content')
              }
            </p>
            <p className="text-gray-700 mb-4">
              {language === 'ja'
                ? '本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属管轄裁判所とします。'
                : t('terms.section10.content2')
              }
            </p>
          </section>
        </div>

        {/* フッター */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {language === 'ja' ? 'この利用規約は2024年1月27日に制定されました。' : t('terms.footer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 