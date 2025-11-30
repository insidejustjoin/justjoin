import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type Language = 'ja' | 'en' | 'ru' | 'uz';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ja: {
    // Header
    'header.login': 'ログイン',
    'header.register': '新規登録',
    
    // Hero
    'hero.title': '成長を望むあなたに、',
    'hero.title2': 'チャレンジできる環境を。',
    'hero.subtitle': 'justjoinは、求職者と企業をつなぐ求人プラットフォーム。',
    'hero.subtitle2': 'AI面接システムと徹底的なサポートで、',
    'hero.subtitle3': 'あなたの転職を成功に導きます。',
    
    // Company Info
    'company.title': 'ABOUT US',
    'company.subtitle': 'justjoinについて',
    'company.name': '会社名',
    'company.nameValue': 'just join',
    'company.email': 'メールアドレス',
    'company.emailValue': 'inside.justjoin@gmail.com',
    'company.description': 'just joinは、求職者と企業をつなぐ求人プラットフォームを運営しています。',
    'company.description2': 'AI面接システムと徹底的なサポートにより、',
    'company.description3': '求職者の転職成功と企業の採用課題解決を実現します。',
    
    // Support Cases
    'cases.title': '支援事例',
    'cases.subtitle': 'SUPPORT CASES',
    'case1.title': 'エンジニア転職成功事例',
    'case1.description': 'AI面接システムを活用し、希望の企業への転職を実現。',
    'case1.result': '転職成功',
    'case2.title': '一般職転職成功事例',
    'case2.description': '徹底的なサポートにより、理想の職場環境を見つけました。',
    'case2.result': '転職成功',
    'case3.title': '企業採用成功事例',
    'case3.description': '質の高い人材を迅速にマッチングし、採用課題を解決。',
    'case3.result': '採用成功',
    
    // Footer
    'footer.company': 'just join',
    'footer.rights': 'All rights reserved.',
    'footer.sns': 'SNS',
  },
  en: {
    'header.login': 'Login',
    'header.register': 'Register',
    'hero.title': 'For those who seek growth,',
    'hero.title2': 'an environment where you can challenge yourself.',
    'hero.subtitle': 'justjoin is a job platform connecting job seekers and companies.',
    'hero.subtitle2': 'With AI interview system and thorough support,',
    'hero.subtitle3': 'we guide your career change to success.',
    'company.title': 'ABOUT US',
    'company.subtitle': 'About justjoin',
    'company.name': 'Company Name',
    'company.nameValue': 'just join',
    'company.email': 'Email',
    'company.emailValue': 'inside.justjoin@gmail.com',
    'company.description': 'just join operates a job platform connecting job seekers and companies.',
    'company.description2': 'Through AI interview system and thorough support,',
    'company.description3': 'we realize successful career changes for job seekers and solve hiring challenges for companies.',
    'cases.title': 'Support Cases',
    'cases.subtitle': 'SUPPORT CASES',
    'case1.title': 'Engineer Career Change Success',
    'case1.description': 'Successfully changed jobs to desired company using AI interview system.',
    'case1.result': 'Success',
    'case2.title': 'General Position Career Change Success',
    'case2.description': 'Found ideal workplace environment through thorough support.',
    'case2.result': 'Success',
    'case3.title': 'Company Hiring Success',
    'case3.description': 'Quickly matched high-quality talent and solved hiring challenges.',
    'case3.result': 'Success',
    'footer.company': 'just join',
    'footer.rights': 'All rights reserved.',
    'footer.sns': 'SNS',
  },
  ru: {
    'header.login': 'Войти',
    'header.register': 'Регистрация',
    'hero.title': 'Для тех, кто стремится к росту,',
    'hero.title2': 'среда, где вы можете бросить вызов.',
    'hero.subtitle': 'justjoin - это платформа для трудоустройства, соединяющая соискателей и компании.',
    'hero.subtitle2': 'С системой AI-интервью и тщательной поддержкой,',
    'hero.subtitle3': 'мы ведем ваш карьерный переход к успеху.',
    'company.title': 'О НАС',
    'company.subtitle': 'О justjoin',
    'company.name': 'Название компании',
    'company.nameValue': 'just join',
    'company.email': 'Электронная почта',
    'company.emailValue': 'inside.justjoin@gmail.com',
    'company.description': 'just join управляет платформой для трудоустройства, соединяющей соискателей и компании.',
    'company.description2': 'Через систему AI-интервью и тщательную поддержку,',
    'company.description3': 'мы реализуем успешные карьерные переходы для соискателей и решаем проблемы найма для компаний.',
    'cases.title': 'Примеры поддержки',
    'cases.subtitle': 'ПРИМЕРЫ ПОДДЕРЖКИ',
    'case1.title': 'Успешный карьерный переход инженера',
    'case1.description': 'Успешно сменил работу в желаемую компанию, используя систему AI-интервью.',
    'case1.result': 'Успех',
    'case2.title': 'Успешный карьерный переход на общую должность',
    'case2.description': 'Нашел идеальную рабочую среду благодаря тщательной поддержке.',
    'case2.result': 'Успех',
    'case3.title': 'Успешный найм компании',
    'case3.description': 'Быстро подобрал качественный талант и решил проблемы найма.',
    'case3.result': 'Успех',
    'footer.company': 'just join',
    'footer.rights': 'Все права защищены.',
    'footer.sns': 'SNS',
  },
  uz: {
    'header.login': 'Kirish',
    'header.register': 'Ro\'yxatdan o\'tish',
    'hero.title': 'O\'sishni istaganlar uchun,',
    'hero.title2': 'sizga qiyinchilik yaratadigan muhit.',
    'hero.subtitle': 'justjoin - ish qidiruvchilar va kompaniyalarni bog\'laydigan ish platformasi.',
    'hero.subtitle2': 'AI intervyu tizimi va to\'liq qo\'llab-quvvatlash bilan,',
    'hero.subtitle3': 'biz sizning martaba o\'zgarishingizni muvaffaqiyatga olib boramiz.',
    'company.title': 'BIZ HAQIMIZDA',
    'company.subtitle': 'justjoin haqida',
    'company.name': 'Kompaniya nomi',
    'company.nameValue': 'just join',
    'company.email': 'Elektron pochta',
    'company.emailValue': 'inside.justjoin@gmail.com',
    'company.description': 'just join ish qidiruvchilar va kompaniyalarni bog\'laydigan ish platformasini boshqaradi.',
    'company.description2': 'AI intervyu tizimi va to\'liq qo\'llab-quvvatlash orqali,',
    'company.description3': 'biz ish qidiruvchilar uchun muvaffaqiyatli martaba o\'zgarishlarini va kompaniyalar uchun ishga olish muammolarini hal qilamiz.',
    'cases.title': 'Qo\'llab-quvvatlash misollari',
    'cases.subtitle': 'QO\'LLAB-QUVVATLASH MISOLLARI',
    'case1.title': 'Muhandis martaba o\'zgarishi muvaffaqiyati',
    'case1.description': 'AI intervyu tizimidan foydalanib, istagan kompaniyaga muvaffaqiyatli o\'tdi.',
    'case1.result': 'Muvaffaqiyat',
    'case2.title': 'Umumiy lavozim martaba o\'zgarishi muvaffaqiyati',
    'case2.description': 'To\'liq qo\'llab-quvvatlash orqali ideal ish joyini topdi.',
    'case2.result': 'Muvaffaqiyat',
    'case3.title': 'Kompaniya ishga olish muvaffaqiyati',
    'case3.description': 'Yuqori sifatli talantlarni tezda moslashtirdi va ishga olish muammolarini hal qildi.',
    'case3.result': 'Muvaffaqiyat',
    'footer.company': 'just join',
    'footer.rights': 'Barcha huquqlar himoyalangan.',
    'footer.sns': 'SNS',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja');

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

