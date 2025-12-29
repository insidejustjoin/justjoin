/**
 * HubSpot連携用のデータマッパー
 * 
 * 求職者情報と書類データをHubSpotのカスタムプロパティにマッピングします。
 */

// DocumentData型の定義（DocumentGeneratorから独立させる）
export interface DocumentData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  liveAddress?: string;
  livePostNumber?: string;
  livePhoneNumber?: string;
  contactAddress?: string;
  contactPhoneNumber?: string;
  contactMail?: string;
  liveMail?: string;
  resume?: {
    selfPR?: string;
    education?: Array<{ year: string; month: string; content: string }>;
    workExperience?: Array<{ year: string; month: string; content: string }>;
    qualifications?: Array<{ year: string; month: string; name: string }>;
  };
  workHistory?: {
    workExperiences?: Array<{
      period: string;
      company: string;
      position: string;
      description: string;
      technologies: string;
      role: string;
    }>;
    qualifications?: string;
  };
  skillSheet?: {
    skills?: {
      [skillName: string]: {
        level: string;
        experience: string;
        projects: string;
        evaluation: string;
      };
    };
  };
  // 追加情報
  selfIntroduction?: string;
  spouse?: string;
  spouseSupport?: string;
  personalPreference?: string;
  // 日本語関連情報
  certificateStatus?: {
    date: string;
    name: string;
  };
  japaneseLevel?: string;
  qualificationDate?: string;
  nextJapaneseTestDate?: string;
  nextJapaneseTestLevel?: string;
  whyJapan?: string;
  whyInterestJapan?: string;
  // 日本の在留資格関連
  residencyStatus?: string;
  technicalTrainingIndustry?: string;
  technicalTrainingJobType?: string;
  desiredJobTypes?: string[];
}

interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  [key: string]: any; // カスタムプロパティ
}

/**
 * 書類データをHubSpotの連絡先プロパティに変換
 */
export function mapDocumentDataToHubSpot(
  documentData: DocumentData,
  userEmail: string,
  registrationType: 'engineer' | 'general'
): HubSpotContactProperties {
  const properties: HubSpotContactProperties = {
    email: userEmail,
    firstname: documentData.firstName || '',
    lastname: documentData.lastName || '',
    phone: documentData.livePhoneNumber || documentData.contactPhoneNumber || '',
  };

  // 基本情報
  if (documentData.birthDate) {
    properties.birth_date = documentData.birthDate;
  }
  if (documentData.gender) {
    // 性別はそのまま使用（HubSpotのプロパティは「男性」「女性」「その他」を期待）
    properties.gender = documentData.gender;
  }
  if (documentData.nationality) {
    properties.nationality = documentData.nationality;
  }

  // 住所情報
  if (documentData.liveAddress) {
    properties.address = documentData.liveAddress;
  }
  if (documentData.livePostNumber) {
    properties.postal_code = documentData.livePostNumber;
  }
  if (documentData.contactAddress) {
    properties.contact_address = documentData.contactAddress;
  }
  if (documentData.contactMail) {
    properties.contact_email = documentData.contactMail;
  }
  if (documentData.liveMail) {
    properties.live_email = documentData.liveMail;
  }

  // 登録タイプ
  properties.registration_type = registrationType;

  // 履歴書情報
  if (documentData.resume) {
    if (documentData.resume.selfPR) {
      properties.self_pr = documentData.resume.selfPR;
    }
    if (documentData.resume.education && documentData.resume.education.length > 0) {
      properties.education_history = JSON.stringify(documentData.resume.education);
    }
    if (documentData.resume.workExperience && documentData.resume.workExperience.length > 0) {
      properties.work_experience_history = JSON.stringify(documentData.resume.workExperience);
    }
    if (documentData.resume.qualifications && documentData.resume.qualifications.length > 0) {
      properties.qualifications = JSON.stringify(documentData.resume.qualifications);
    }
  }

  // 職務経歴書情報
  if (documentData.workHistory) {
    if (documentData.workHistory.workExperiences && documentData.workHistory.workExperiences.length > 0) {
      properties.work_history = JSON.stringify(documentData.workHistory.workExperiences);
    }
    if (documentData.workHistory.qualifications) {
      properties.work_history_qualifications = documentData.workHistory.qualifications;
    }
  }

  // スキルシート情報 - 各スキルを個別のプロパティとして設定
  if (documentData.skillSheet && documentData.skillSheet.skills) {
    for (const [skillName, skillData] of Object.entries(documentData.skillSheet.skills)) {
      // スキル名をプロパティ名に変換（特殊文字をアンダースコアに置換）
      const propertyName = `skill_${skillName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      if (skillData.evaluation && skillData.evaluation !== '-') {
        properties[propertyName] = skillData.evaluation;
      }
    }
  }

  // 追加情報
  if (documentData.selfIntroduction) {
    properties.self_introduction = documentData.selfIntroduction;
  }
  if (documentData.spouse) {
    properties.spouse = documentData.spouse;
  }
  if (documentData.spouseSupport) {
    properties.spouse_support = documentData.spouseSupport;
  }
  // 日本語資格関連
  if (documentData.certificateStatus && documentData.certificateStatus.name) {
    properties.current_japanese_qualification = documentData.certificateStatus.name;
  } else if (documentData.japaneseLevel) {
    // japaneseLevelはcertificateStatus.nameのフォールバック
    properties.current_japanese_qualification = documentData.japaneseLevel;
  }
  if (documentData.qualificationDate) {
    properties.qualification_date = documentData.qualificationDate;
  } else if (documentData.certificateStatus && documentData.certificateStatus.date) {
    // certificateStatus.dateをqualification_dateのフォールバックとして使用
    properties.qualification_date = documentData.certificateStatus.date;
  }
  if (documentData.nextJapaneseTestLevel) {
    properties.planned_japanese_qualification = documentData.nextJapaneseTestLevel;
  }
  if (documentData.nextJapaneseTestDate) {
    properties.next_exam_date = documentData.nextJapaneseTestDate;
  }
  
  // 在留資格関連
  if (documentData.residencyStatus) {
    properties.residency_status = documentData.residencyStatus;
  }
  if (documentData.technicalTrainingIndustry) {
    properties.technical_training_industry = documentData.technicalTrainingIndustry;
  }
  if (documentData.technicalTrainingJobType) {
    properties.technical_training_job_type = documentData.technicalTrainingJobType;
  }
  
  // 理由・要望関連
  if (documentData.whyJapan) {
    properties.why_japan = documentData.whyJapan;
  }
  if (documentData.whyInterestJapan) {
    properties.why_interest_japan = documentData.whyInterestJapan;
  }
  if (documentData.personalPreference) {
    properties.personal_preference = documentData.personalPreference;
  }
  
  // 希望職種（複数選択をカンマ区切りで保存）
  if (documentData.desiredJobTypes && documentData.desiredJobTypes.length > 0) {
    properties.desired_job_types = documentData.desiredJobTypes.join(', ');
  }

  return properties;
}

/**
 * スキル名のリスト（すべてのスキルを個別プロパティとして作成）
 */
const ALL_SKILLS = [
  'Windows', 'MacOS', 'Linux',
  'Photoshop', 'Illustrator',
  'Webサーバ（構築、運用）', 'メールサーバ（構築、運用）', 'DBサーバ（構築、運用）', 'DNSサーバ（構築、運用）',
  'N/W設計', 'N/W構築', 'N/W調査', 'N/W監視',
  'DB2', 'SQL Server', 'Oracle', 'MySQL', 'PostgreSQL',
  'プログラマ', 'SE', 'リーダー', 'マネージャー',
  'C / C++', 'C#', 'VB.NET', 'JAVA', 'JavaScript ', 'PHP', 'Python', 'Ruby', 'Swift', 'Objective-C', 'HTML / HTML5', 'CSS / CSS3', 'R',
  'ASP.NET (Web Forms)', 'ASP.NET (Core) MVC', 'jQuery', 'Bootstrap', 'Tailwind', 'ReactJS', 'VueJS', 'Laravel',
  '要件定義', '外部設計/基本設計', '内部設計/詳細設計', '検証試験', 'セキュリティ試験', '負荷試験',
  'MS-WORD', 'MS-EXCEL', 'MS-Access', 'MS-PowerPoint', 'InDesiｇn', 'Dreamweaver', 'Fireworks', 'MAYA', 'Studio Design', 'Figma',
  'Visual Studio / VSCode', 'Git / SVN', 'Backlog / Redmine', 'Notion',
  'AWS', 'Azure', 'Google Cloud Platform', 'IBM Cloud (Bluemix)',
  'W3Schools', 'タッチタイピング', 'パソコン利用歴'
];

/**
 * スキル名をプロパティ名に変換
 */
function skillNameToPropertyName(skillName: string): string {
  return `skill_${skillName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
}

/**
 * 国連加盟国193カ国のリスト（DocumentGeneratorから取得）
 */
const UN_MEMBER_COUNTRIES = [
  "Japan", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Democratic Republic of the Congo", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea", "Korea", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

/**
 * HubSpotに必要なカスタムプロパティの定義
 * HubSpot公式ドキュメント: https://developers.hubspot.jp/docs/api-reference/crm-properties-v3/guide
 * ドロップダウンになっている項目はenumerationタイプに統一
 */
export const HUBSPOT_CUSTOM_PROPERTIES = [
  // 基本情報
  {
    name: 'birth_date',
    label: '生年月日',
    type: 'date' as const,
    fieldType: 'date' as const,
    groupName: 'contactinformation',
    description: '求職者の生年月日',
  },
  {
    name: 'gender',
    label: '性別',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の性別',
    options: [
      { label: '男性', value: '男性' },
      { label: '女性', value: '女性' },
      { label: 'その他', value: 'その他' },
    ],
  },
  {
    name: 'nationality',
    label: '国籍',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の国籍',
    options: UN_MEMBER_COUNTRIES.map(country => ({
      label: country,
      value: country,
    })),
  },
  {
    name: 'postal_code',
    label: '郵便番号',
    type: 'string' as const,
    fieldType: 'text' as const,
    groupName: 'contactinformation',
    description: '求職者の郵便番号',
  },
  {
    name: 'contact_address',
    label: '連絡先住所',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の連絡先住所',
  },
  {
    name: 'contact_email',
    label: '連絡先メールアドレス',
    type: 'string' as const,
    fieldType: 'text' as const,
    groupName: 'contactinformation',
    description: '求職者の連絡先メールアドレス',
  },
  {
    name: 'live_email',
    label: '現住所メールアドレス',
    type: 'string' as const,
    fieldType: 'text' as const,
    groupName: 'contactinformation',
    description: '求職者の現住所メールアドレス',
  },
  {
    name: 'registration_type',
    label: '登録タイプ',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の登録タイプ（エンジニアまたは一般職）',
    options: [
      { label: 'エンジニア', value: 'engineer' },
      { label: '一般職', value: 'general' },
    ],
  },
  // 履歴書情報
  {
    name: 'self_pr',
    label: '自己PR',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の自己PR',
  },
  {
    name: 'education_history',
    label: '学歴',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の学歴（JSON形式）',
  },
  {
    name: 'work_experience_history',
    label: '職歴（履歴書）',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の職歴（履歴書、JSON形式）',
  },
  {
    name: 'qualifications',
    label: '資格（履歴書）',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の資格（履歴書、JSON形式）',
  },
  // 職務経歴書情報
  {
    name: 'work_history',
    label: '職務経歴',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の職務経歴（JSON形式）',
  },
  {
    name: 'work_history_qualifications',
    label: '資格（職務経歴書）',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の資格（職務経歴書）',
  },
  // 追加情報
  {
    name: 'self_introduction',
    label: '自己紹介',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の自己紹介',
  },
  {
    name: 'spouse',
    label: '配偶者',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '配偶者の有無',
    options: [
      { label: 'あり', value: 'あり' },
      { label: 'なし', value: 'なし' },
    ],
  },
  {
    name: 'spouse_support',
    label: '配偶者扶養',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '配偶者扶養の有無',
    options: [
      { label: 'あり', value: 'あり' },
      { label: 'なし', value: 'なし' },
    ],
  },
  {
    name: 'current_japanese_qualification',
    label: '現在の日本語資格',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の現在の日本語資格',
    options: [
      { label: 'なし', value: 'なし' },
      { label: 'N1', value: 'N1' },
      { label: 'N2', value: 'N2' },
      { label: 'N3', value: 'N3' },
      { label: 'N4', value: 'N4' },
      { label: 'N5', value: 'N5' },
    ],
  },
  {
    name: 'qualification_date',
    label: '取得日',
    type: 'date' as const,
    fieldType: 'date' as const,
    groupName: 'contactinformation',
    description: '日本語資格の取得日',
  },
  {
    name: 'planned_japanese_qualification',
    label: '予定の日本語資格',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の予定の日本語資格',
    options: [
      { label: '未定', value: '未定' },
      { label: 'N1', value: 'N1' },
      { label: 'N2', value: 'N2' },
      { label: 'N3', value: 'N3' },
      { label: 'N4', value: 'N4' },
      { label: 'N5', value: 'N5' },
    ],
  },
  {
    name: 'next_exam_date',
    label: '次回受験予定日',
    type: 'date' as const,
    fieldType: 'date' as const,
    groupName: 'contactinformation',
    description: '次回の日本語試験受験予定日',
  },
  {
    name: 'residency_status',
    label: '在留資格',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '求職者の在留資格',
    options: [
      { label: '技人国', value: '技人国' },
      { label: '特定技能1号', value: '特定技能1号' },
      { label: '特定技能2号', value: '特定技能2号' },
      { label: '技能実習', value: '技能実習' },
      { label: '未取得/不明', value: '未取得/不明' },
    ],
  },
  {
    name: 'technical_training_industry',
    label: '技能実習の業種',
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: '技能実習の業種',
    options: [
      { label: '農業', value: '農業' },
      { label: '漁業', value: '漁業' },
      { label: '建設', value: '建設' },
      { label: '食品製造', value: '食品製造' },
      { label: '繊維・縫製', value: '繊維・縫製' },
      { label: '機械金属', value: '機械金属' },
      { label: '電気電子', value: '電気電子' },
      { label: '自動車', value: '自動車' },
      { label: '化学・プラ', value: '化学・プラ' },
      { label: '印刷', value: '印刷' },
      { label: '木材家具', value: '木材家具' },
      { label: '介護', value: '介護' },
      { label: '清掃', value: '清掃' },
    ],
  },
  {
    name: 'technical_training_job_type',
    label: '技能実習の職種',
    type: 'string' as const,
    fieldType: 'text' as const,
    groupName: 'contactinformation',
    description: '技能実習の職種',
  },
  {
    name: 'why_japan',
    label: '日本で働きたい理由',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '日本で働きたい理由',
  },
  {
    name: 'why_interest_japan',
    label: '日本に興味を持った理由',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '日本に興味を持った理由',
  },
  {
    name: 'personal_preference',
    label: '希望・要望',
    type: 'string' as const,
    fieldType: 'textarea' as const,
    groupName: 'contactinformation',
    description: '求職者の希望・要望',
  },
  {
    name: 'desired_job_types',
    label: '希望職種',
    type: 'string' as const,
    fieldType: 'text' as const,
    groupName: 'contactinformation',
    description: '求職者の希望職種（複数選択、カンマ区切り）',
  },
  // スキルプロパティ（すべてのスキルを個別に作成、評価はA-Eの選択肢）
  ...ALL_SKILLS.map(skillName => ({
    name: skillNameToPropertyName(skillName),
    label: `スキル: ${skillName}`,
    type: 'enumeration' as const,
    fieldType: 'select' as const,
    groupName: 'contactinformation',
    description: `スキル評価: ${skillName}`,
    options: [
      { label: '-', value: '-' },
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'C', value: 'C' },
      { label: 'D', value: 'D' },
      { label: 'E', value: 'E' },
    ],
  })),
];
