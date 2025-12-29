import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

// 全ての国の国コードリスト（ISO 3166-1 alpha-2準拠、国コード順）
const COUNTRY_CODES = [
  { code: '+1', country: 'US', name: 'アメリカ合衆国', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'カナダ', flag: '🇨🇦' },
  { code: '+7', country: 'RU', name: 'ロシア', flag: '🇷🇺' },
  { code: '+7', country: 'KZ', name: 'カザフスタン', flag: '🇰🇿' },
  { code: '+20', country: 'EG', name: 'エジプト', flag: '🇪🇬' },
  { code: '+27', country: 'ZA', name: '南アフリカ', flag: '🇿🇦' },
  { code: '+30', country: 'GR', name: 'ギリシャ', flag: '🇬🇷' },
  { code: '+31', country: 'NL', name: 'オランダ', flag: '🇳🇱' },
  { code: '+32', country: 'BE', name: 'ベルギー', flag: '🇧🇪' },
  { code: '+33', country: 'FR', name: 'フランス', flag: '🇫🇷' },
  { code: '+34', country: 'ES', name: 'スペイン', flag: '🇪🇸' },
  { code: '+36', country: 'HU', name: 'ハンガリー', flag: '🇭🇺' },
  { code: '+39', country: 'IT', name: 'イタリア', flag: '🇮🇹' },
  { code: '+40', country: 'RO', name: 'ルーマニア', flag: '🇷🇴' },
  { code: '+41', country: 'CH', name: 'スイス', flag: '🇨🇭' },
  { code: '+43', country: 'AT', name: 'オーストリア', flag: '🇦🇹' },
  { code: '+44', country: 'GB', name: 'イギリス', flag: '🇬🇧' },
  { code: '+45', country: 'DK', name: 'デンマーク', flag: '🇩🇰' },
  { code: '+46', country: 'SE', name: 'スウェーデン', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'ノルウェー', flag: '🇳🇴' },
  { code: '+48', country: 'PL', name: 'ポーランド', flag: '🇵🇱' },
  { code: '+49', country: 'DE', name: 'ドイツ', flag: '🇩🇪' },
  { code: '+51', country: 'PE', name: 'ペルー', flag: '🇵🇪' },
  { code: '+52', country: 'MX', name: 'メキシコ', flag: '🇲🇽' },
  { code: '+53', country: 'CU', name: 'キューバ', flag: '🇨🇺' },
  { code: '+54', country: 'AR', name: 'アルゼンチン', flag: '🇦🇷' },
  { code: '+55', country: 'BR', name: 'ブラジル', flag: '🇧🇷' },
  { code: '+56', country: 'CL', name: 'チリ', flag: '🇨🇱' },
  { code: '+57', country: 'CO', name: 'コロンビア', flag: '🇨🇴' },
  { code: '+58', country: 'VE', name: 'ベネズエラ', flag: '🇻🇪' },
  { code: '+60', country: 'MY', name: 'マレーシア', flag: '🇲🇾' },
  { code: '+61', country: 'AU', name: 'オーストラリア', flag: '🇦🇺' },
  { code: '+62', country: 'ID', name: 'インドネシア', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'フィリピン', flag: '🇵🇭' },
  { code: '+64', country: 'NZ', name: 'ニュージーランド', flag: '🇳🇿' },
  { code: '+65', country: 'SG', name: 'シンガポール', flag: '🇸🇬' },
  { code: '+66', country: 'TH', name: 'タイ', flag: '🇹🇭' },
  { code: '+81', country: 'JP', name: '日本', flag: '🇯🇵' },
  { code: '+82', country: 'KR', name: '韓国', flag: '🇰🇷' },
  { code: '+84', country: 'VN', name: 'ベトナム', flag: '🇻🇳' },
  { code: '+86', country: 'CN', name: '中国', flag: '🇨🇳' },
  { code: '+90', country: 'TR', name: 'トルコ', flag: '🇹🇷' },
  { code: '+91', country: 'IN', name: 'インド', flag: '🇮🇳' },
  { code: '+92', country: 'PK', name: 'パキスタン', flag: '🇵🇰' },
  { code: '+93', country: 'AF', name: 'アフガニスタン', flag: '🇦🇫' },
  { code: '+94', country: 'LK', name: 'スリランカ', flag: '🇱🇰' },
  { code: '+95', country: 'MM', name: 'ミャンマー', flag: '🇲🇲' },
  { code: '+98', country: 'IR', name: 'イラン', flag: '🇮🇷' },
  { code: '+212', country: 'MA', name: 'モロッコ', flag: '🇲🇦' },
  { code: '+213', country: 'DZ', name: 'アルジェリア', flag: '🇩🇿' },
  { code: '+216', country: 'TN', name: 'チュニジア', flag: '🇹🇳' },
  { code: '+218', country: 'LY', name: 'リビア', flag: '🇱🇾' },
  { code: '+220', country: 'GM', name: 'ガンビア', flag: '🇬🇲' },
  { code: '+221', country: 'SN', name: 'セネガル', flag: '🇸🇳' },
  { code: '+222', country: 'MR', name: 'モーリタニア', flag: '🇲🇷' },
  { code: '+223', country: 'ML', name: 'マリ', flag: '🇲🇱' },
  { code: '+224', country: 'GN', name: 'ギニア', flag: '🇬🇳' },
  { code: '+225', country: 'CI', name: 'コートジボワール', flag: '🇨🇮' },
  { code: '+226', country: 'BF', name: 'ブルキナファソ', flag: '🇧🇫' },
  { code: '+227', country: 'NE', name: 'ニジェール', flag: '🇳🇪' },
  { code: '+228', country: 'TG', name: 'トーゴ', flag: '🇹🇬' },
  { code: '+229', country: 'BJ', name: 'ベナン', flag: '🇧🇯' },
  { code: '+230', country: 'MU', name: 'モーリシャス', flag: '🇲🇺' },
  { code: '+231', country: 'LR', name: 'リベリア', flag: '🇱🇷' },
  { code: '+232', country: 'SL', name: 'シエラレオネ', flag: '🇸🇱' },
  { code: '+233', country: 'GH', name: 'ガーナ', flag: '🇬🇭' },
  { code: '+234', country: 'NG', name: 'ナイジェリア', flag: '🇳🇬' },
  { code: '+235', country: 'TD', name: 'チャド', flag: '🇹🇩' },
  { code: '+236', country: 'CF', name: '中央アフリカ', flag: '🇨🇫' },
  { code: '+237', country: 'CM', name: 'カメルーン', flag: '🇨🇲' },
  { code: '+238', country: 'CV', name: 'カーボベルデ', flag: '🇨🇻' },
  { code: '+239', country: 'ST', name: 'サントメ・プリンシペ', flag: '🇸🇹' },
  { code: '+240', country: 'GQ', name: '赤道ギニア', flag: '🇬🇶' },
  { code: '+241', country: 'GA', name: 'ガボン', flag: '🇬🇦' },
  { code: '+242', country: 'CG', name: 'コンゴ共和国', flag: '🇨🇬' },
  { code: '+243', country: 'CD', name: 'コンゴ民主共和国', flag: '🇨🇩' },
  { code: '+244', country: 'AO', name: 'アンゴラ', flag: '🇦🇴' },
  { code: '+245', country: 'GW', name: 'ギニアビサウ', flag: '🇬🇼' },
  { code: '+246', country: 'IO', name: 'イギリス領インド洋地域', flag: '🇮🇴' },
  { code: '+248', country: 'SC', name: 'セーシェル', flag: '🇸🇨' },
  { code: '+249', country: 'SD', name: 'スーダン', flag: '🇸🇩' },
  { code: '+250', country: 'RW', name: 'ルワンダ', flag: '🇷🇼' },
  { code: '+251', country: 'ET', name: 'エチオピア', flag: '🇪🇹' },
  { code: '+252', country: 'SO', name: 'ソマリア', flag: '🇸🇴' },
  { code: '+253', country: 'DJ', name: 'ジブチ', flag: '🇩🇯' },
  { code: '+254', country: 'KE', name: 'ケニア', flag: '🇰🇪' },
  { code: '+255', country: 'TZ', name: 'タンザニア', flag: '🇹🇿' },
  { code: '+256', country: 'UG', name: 'ウガンダ', flag: '🇺🇬' },
  { code: '+257', country: 'BI', name: 'ブルンジ', flag: '🇧🇮' },
  { code: '+258', country: 'MZ', name: 'モザンビーク', flag: '🇲🇿' },
  { code: '+260', country: 'ZM', name: 'ザンビア', flag: '🇿🇲' },
  { code: '+261', country: 'MG', name: 'マダガスカル', flag: '🇲🇬' },
  { code: '+262', country: 'RE', name: 'レユニオン', flag: '🇷🇪' },
  { code: '+263', country: 'ZW', name: 'ジンバブエ', flag: '🇿🇼' },
  { code: '+264', country: 'NA', name: 'ナミビア', flag: '🇳🇦' },
  { code: '+265', country: 'MW', name: 'マラウィ', flag: '🇲🇼' },
  { code: '+266', country: 'LS', name: 'レソト', flag: '🇱🇸' },
  { code: '+267', country: 'BW', name: 'ボツワナ', flag: '🇧🇼' },
  { code: '+268', country: 'SZ', name: 'エスワティニ', flag: '🇸🇿' },
  { code: '+269', country: 'KM', name: 'コモロ', flag: '🇰🇲' },
  { code: '+290', country: 'SH', name: 'セントヘレナ', flag: '🇸🇭' },
  { code: '+291', country: 'ER', name: 'エリトリア', flag: '🇪🇷' },
  { code: '+297', country: 'AW', name: 'アルバ', flag: '🇦🇼' },
  { code: '+298', country: 'FO', name: 'フェロー諸島', flag: '🇫🇴' },
  { code: '+299', country: 'GL', name: 'グリーンランド', flag: '🇬🇱' },
  { code: '+350', country: 'GI', name: 'ジブラルタル', flag: '🇬🇮' },
  { code: '+351', country: 'PT', name: 'ポルトガル', flag: '🇵🇹' },
  { code: '+352', country: 'LU', name: 'ルクセンブルク', flag: '🇱🇺' },
  { code: '+353', country: 'IE', name: 'アイルランド', flag: '🇮🇪' },
  { code: '+354', country: 'IS', name: 'アイスランド', flag: '🇮🇸' },
  { code: '+355', country: 'AL', name: 'アルバニア', flag: '🇦🇱' },
  { code: '+356', country: 'MT', name: 'マルタ', flag: '🇲🇹' },
  { code: '+357', country: 'CY', name: 'キプロス', flag: '🇨🇾' },
  { code: '+358', country: 'FI', name: 'フィンランド', flag: '🇫🇮' },
  { code: '+359', country: 'BG', name: 'ブルガリア', flag: '🇧🇬' },
  { code: '+370', country: 'LT', name: 'リトアニア', flag: '🇱🇹' },
  { code: '+371', country: 'LV', name: 'ラトビア', flag: '🇱🇻' },
  { code: '+372', country: 'EE', name: 'エストニア', flag: '🇪🇪' },
  { code: '+373', country: 'MD', name: 'モルドバ', flag: '🇲🇩' },
  { code: '+374', country: 'AM', name: 'アルメニア', flag: '🇦🇲' },
  { code: '+375', country: 'BY', name: 'ベラルーシ', flag: '🇧🇾' },
  { code: '+376', country: 'AD', name: 'アンドラ', flag: '🇦🇩' },
  { code: '+377', country: 'MC', name: 'モナコ', flag: '🇲🇨' },
  { code: '+378', country: 'SM', name: 'サンマリノ', flag: '🇸🇲' },
  { code: '+380', country: 'UA', name: 'ウクライナ', flag: '🇺🇦' },
  { code: '+381', country: 'RS', name: 'セルビア', flag: '🇷🇸' },
  { code: '+382', country: 'ME', name: 'モンテネグロ', flag: '🇲🇪' },
  { code: '+383', country: 'XK', name: 'コソボ', flag: '🇽🇰' },
  { code: '+385', country: 'HR', name: 'クロアチア', flag: '🇭🇷' },
  { code: '+386', country: 'SI', name: 'スロベニア', flag: '🇸🇮' },
  { code: '+387', country: 'BA', name: 'ボスニア・ヘルツェゴビナ', flag: '🇧🇦' },
  { code: '+389', country: 'MK', name: '北マケドニア', flag: '🇲🇰' },
  { code: '+420', country: 'CZ', name: 'チェコ', flag: '🇨🇿' },
  { code: '+421', country: 'SK', name: 'スロバキア', flag: '🇸🇰' },
  { code: '+423', country: 'LI', name: 'リヒテンシュタイン', flag: '🇱🇮' },
  { code: '+500', country: 'FK', name: 'フォークランド諸島', flag: '🇫🇰' },
  { code: '+501', country: 'BZ', name: 'ベリーズ', flag: '🇧🇿' },
  { code: '+502', country: 'GT', name: 'グアテマラ', flag: '🇬🇹' },
  { code: '+503', country: 'SV', name: 'エルサルバドル', flag: '🇸🇻' },
  { code: '+504', country: 'HN', name: 'ホンジュラス', flag: '🇭🇳' },
  { code: '+505', country: 'NI', name: 'ニカラグア', flag: '🇳🇮' },
  { code: '+506', country: 'CR', name: 'コスタリカ', flag: '🇨🇷' },
  { code: '+507', country: 'PA', name: 'パナマ', flag: '🇵🇦' },
  { code: '+508', country: 'PM', name: 'サンピエール・ミクロン', flag: '🇵🇲' },
  { code: '+509', country: 'HT', name: 'ハイチ', flag: '🇭🇹' },
  { code: '+590', country: 'BL', name: 'サン・バルテルミー', flag: '🇧🇱' },
  { code: '+591', country: 'BO', name: 'ボリビア', flag: '🇧🇴' },
  { code: '+592', country: 'GY', name: 'ガイアナ', flag: '🇬🇾' },
  { code: '+593', country: 'EC', name: 'エクアドル', flag: '🇪🇨' },
  { code: '+594', country: 'GF', name: 'フランス領ギアナ', flag: '🇬🇫' },
  { code: '+595', country: 'PY', name: 'パラグアイ', flag: '🇵🇾' },
  { code: '+596', country: 'MQ', name: 'マルティニーク', flag: '🇲🇶' },
  { code: '+597', country: 'SR', name: 'スリナム', flag: '🇸🇷' },
  { code: '+598', country: 'UY', name: 'ウルグアイ', flag: '🇺🇾' },
  { code: '+599', country: 'CW', name: 'キュラソー', flag: '🇨🇼' },
  { code: '+670', country: 'TL', name: '東ティモール', flag: '🇹🇱' },
  { code: '+672', country: 'NF', name: 'ノーフォーク島', flag: '🇳🇫' },
  { code: '+673', country: 'BN', name: 'ブルネイ', flag: '🇧🇳' },
  { code: '+674', country: 'NR', name: 'ナウル', flag: '🇳🇷' },
  { code: '+675', country: 'PG', name: 'パプアニューギニア', flag: '🇵🇬' },
  { code: '+676', country: 'TO', name: 'トンガ', flag: '🇹🇴' },
  { code: '+677', country: 'SB', name: 'ソロモン諸島', flag: '🇸🇧' },
  { code: '+678', country: 'VU', name: 'バヌアツ', flag: '🇻🇺' },
  { code: '+679', country: 'FJ', name: 'フィジー', flag: '🇫🇯' },
  { code: '+680', country: 'PW', name: 'パラオ', flag: '🇵🇼' },
  { code: '+681', country: 'WF', name: 'ウォリス・フツナ', flag: '🇼🇫' },
  { code: '+682', country: 'CK', name: 'クック諸島', flag: '🇨🇰' },
  { code: '+683', country: 'NU', name: 'ニウエ', flag: '🇳🇺' },
  { code: '+685', country: 'WS', name: 'サモア', flag: '🇼🇸' },
  { code: '+686', country: 'KI', name: 'キリバス', flag: '🇰🇮' },
  { code: '+687', country: 'NC', name: 'ニューカレドニア', flag: '🇳🇨' },
  { code: '+688', country: 'TV', name: 'ツバル', flag: '🇹🇻' },
  { code: '+689', country: 'PF', name: 'フランス領ポリネシア', flag: '🇵🇫' },
  { code: '+690', country: 'TK', name: 'トケラウ', flag: '🇹🇰' },
  { code: '+691', country: 'FM', name: 'ミクロネシア', flag: '🇫🇲' },
  { code: '+692', country: 'MH', name: 'マーシャル諸島', flag: '🇲🇭' },
  { code: '+850', country: 'KP', name: '北朝鮮', flag: '🇰🇵' },
  { code: '+852', country: 'HK', name: '香港', flag: '🇭🇰' },
  { code: '+853', country: 'MO', name: 'マカオ', flag: '🇲🇴' },
  { code: '+855', country: 'KH', name: 'カンボジア', flag: '🇰🇭' },
  { code: '+856', country: 'LA', name: 'ラオス', flag: '🇱🇦' },
  { code: '+880', country: 'BD', name: 'バングラデシュ', flag: '🇧🇩' },
  { code: '+886', country: 'TW', name: '台湾', flag: '🇹🇼' },
  { code: '+960', country: 'MV', name: 'モルディブ', flag: '🇲🇻' },
  { code: '+961', country: 'LB', name: 'レバノン', flag: '🇱🇧' },
  { code: '+962', country: 'JO', name: 'ヨルダン', flag: '🇯🇴' },
  { code: '+963', country: 'SY', name: 'シリア', flag: '🇸🇾' },
  { code: '+964', country: 'IQ', name: 'イラク', flag: '🇮🇶' },
  { code: '+965', country: 'KW', name: 'クウェート', flag: '🇰🇼' },
  { code: '+966', country: 'SA', name: 'サウジアラビア', flag: '🇸🇦' },
  { code: '+967', country: 'YE', name: 'イエメン', flag: '🇾🇪' },
  { code: '+968', country: 'OM', name: 'オマーン', flag: '🇴🇲' },
  { code: '+970', country: 'PS', name: 'パレスチナ', flag: '🇵🇸' },
  { code: '+971', country: 'AE', name: 'アラブ首長国連邦', flag: '🇦🇪' },
  { code: '+972', country: 'IL', name: 'イスラエル', flag: '🇮🇱' },
  { code: '+973', country: 'BH', name: 'バーレーン', flag: '🇧🇭' },
  { code: '+974', country: 'QA', name: 'カタール', flag: '🇶🇦' },
  { code: '+975', country: 'BT', name: 'ブータン', flag: '🇧🇹' },
  { code: '+976', country: 'MN', name: 'モンゴル', flag: '🇲🇳' },
  { code: '+977', country: 'NP', name: 'ネパール', flag: '🇳🇵' },
  { code: '+992', country: 'TJ', name: 'タジキスタン', flag: '🇹🇯' },
  { code: '+993', country: 'TM', name: 'トルクメニスタン', flag: '🇹🇲' },
  { code: '+994', country: 'AZ', name: 'アゼルバイジャン', flag: '🇦🇿' },
  { code: '+995', country: 'GE', name: 'ジョージア', flag: '🇬🇪' },
  { code: '+996', country: 'KG', name: 'キルギス', flag: '🇰🇬' },
  { code: '+998', country: 'UZ', name: 'ウズベキスタン', flag: '🇺🇿' },
].sort((a, b) => {
  // 国コードでソート（数値として比較）
  const codeA = parseInt(a.code.replace('+', ''));
  const codeB = parseInt(b.code.replace('+', ''));
  if (codeA !== codeB) {
    return codeA - codeB;
  }
  // 同じ国コードの場合は国名でソート
  return a.name.localeCompare(b.name, 'ja');
});

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  showFormatOption?: boolean;
  verified?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  showFormatOption = true,
  verified = false,
}) => {
  const [countryCode, setCountryCode] = useState('+81');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showFormatted, setShowFormatted] = useState(true);

  // 既存の値から国コードと電話番号を分離
  useEffect(() => {
    // 現在の内部状態から生成される値と比較して、実際に変更があった場合のみ更新
    const currentFullNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
    if (value === currentFullNumber) {
      return; // 値が同じ場合は更新しない（無限ループ防止）
    }

    if (value) {
      // +から始まる国際形式の場合
      if (value.startsWith('+')) {
        // 国コードを検索（長い国コードから順に検索）
        let foundCode = '+81'; // デフォルト
        let numberPart = value.substring(1);
        
        // 長い国コードから順に検索
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
        for (const country of sortedCodes) {
          if (value.startsWith(country.code)) {
            foundCode = country.code;
            numberPart = value.substring(country.code.length);
            break;
          }
        }
        
        setCountryCode(foundCode);
        setPhoneNumber(numberPart);
      } else {
        // +がない場合はそのまま電話番号として扱う
        setPhoneNumber(value);
      }
    } else {
      setCountryCode('+81');
      setPhoneNumber('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 国コードまたは電話番号が変更されたときに親コンポーネントに通知
  useEffect(() => {
    const fullNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
    // 現在の値と異なる場合のみ更新（無限ループ防止）
    if (fullNumber !== value) {
      onChange(fullNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, phoneNumber]);

  // 電話番号のフォーマット（スペースを追加）
  const formatPhoneNumber = (num: string): string => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    if (countryCode === '+81') {
      // 日本の場合: 080 6518 7544 のような形式
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    } else if (countryCode === '+998') {
      // ウズベキスタンの場合: 90 123 45 67 のような形式
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    } else if (countryCode === '+7') {
      // ロシアの場合: 912 345 67 89 のような形式
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
    } else if (countryCode === '+1') {
      // アメリカ・カナダの場合: (555) 123-4567 のような形式
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (countryCode === '+86') {
      // 中国の場合: 138 0013 8000 のような形式
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    } else if (countryCode === '+82') {
      // 韓国の場合: 10 1234 5678 のような形式
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    } else if (countryCode === '+44') {
      // イギリスの場合: 7700 900123 のような形式
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else if (countryCode === '+33') {
      // フランスの場合: 6 12 34 56 78 のような形式
      if (digits.length <= 1) return digits;
      if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
      if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    } else if (countryCode === '+49') {
      // ドイツの場合: 151 23456789 のような形式
      if (digits.length <= 3) return digits;
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (countryCode === '+61') {
      // オーストラリアの場合: 4 1234 5678 のような形式
      if (digits.length <= 1) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
      return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
    } else if (countryCode === '+91') {
      // インドの場合: 98765 43210 のような形式
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    // その他の国: 3桁ずつ区切る
    return digits.match(/.{1,3}/g)?.join(' ') || digits;
  };

  // 電話番号の書式を削除（数字のみ）
  const removeFormat = (num: string): string => {
    return num.replace(/\D/g, '');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (showFormatted) {
      const formatted = formatPhoneNumber(inputValue);
      setPhoneNumber(removeFormat(formatted));
    } else {
      setPhoneNumber(removeFormat(inputValue));
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* 国コード選択 */}
        <Select value={countryCode} onValueChange={setCountryCode}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {COUNTRY_CODES.map((country) => (
              <SelectItem key={`${country.code}-${country.country}`} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <span className="text-gray-500">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 電話番号入力 */}
        <div className="flex-1 relative">
          <Input
            type="tel"
            value={showFormatted ? formatPhoneNumber(phoneNumber) : phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder || '806 51 87544'}
            className={`h-10 ${verified ? 'border-green-500' : ''}`}
            required={required}
          />
          {verified && (
            <p className="text-xs text-green-600 mt-1">検証済み</p>
          )}
        </div>
      </div>

      {showFormatOption && showFormatted && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            onClick={() => setShowFormatted(false)}
          >
            <Info className="h-3 w-3" />
            番号の書式を削除
          </button>
        </div>
      )}
    </div>
  );
};
