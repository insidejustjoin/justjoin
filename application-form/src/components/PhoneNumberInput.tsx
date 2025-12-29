import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

// 主要な国コードリスト
const COUNTRY_CODES = [
  { code: '+81', country: 'JP', name: '日本', flag: '🇯🇵' },
  { code: '+998', country: 'UZ', name: 'ウズベキスタン', flag: '🇺🇿' },
  { code: '+7', country: 'RU', name: 'ロシア', flag: '🇷🇺' },
  { code: '+86', country: 'CN', name: '中国', flag: '🇨🇳' },
  { code: '+82', country: 'KR', name: '韓国', flag: '🇰🇷' },
  { code: '+1', country: 'US', name: 'アメリカ', flag: '🇺🇸' },
  { code: '+44', country: 'GB', name: 'イギリス', flag: '🇬🇧' },
  { code: '+33', country: 'FR', name: 'フランス', flag: '🇫🇷' },
  { code: '+49', country: 'DE', name: 'ドイツ', flag: '🇩🇪' },
  { code: '+91', country: 'IN', name: 'インド', flag: '🇮🇳' },
  { code: '+61', country: 'AU', name: 'オーストラリア', flag: '🇦🇺' },
  { code: '+55', country: 'BR', name: 'ブラジル', flag: '🇧🇷' },
  { code: '+34', country: 'ES', name: 'スペイン', flag: '🇪🇸' },
  { code: '+39', country: 'IT', name: 'イタリア', flag: '🇮🇹' },
  { code: '+31', country: 'NL', name: 'オランダ', flag: '🇳🇱' },
  { code: '+65', country: 'SG', name: 'シンガポール', flag: '🇸🇬' },
  { code: '+60', country: 'MY', name: 'マレーシア', flag: '🇲🇾' },
  { code: '+66', country: 'TH', name: 'タイ', flag: '🇹🇭' },
  { code: '+84', country: 'VN', name: 'ベトナム', flag: '🇻🇳' },
  { code: '+62', country: 'ID', name: 'インドネシア', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'フィリピン', flag: '🇵🇭' },
  { code: '+880', country: 'BD', name: 'バングラデシュ', flag: '🇧🇩' },
  { code: '+92', country: 'PK', name: 'パキスタン', flag: '🇵🇰' },
];

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
        // 国コードを検索
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
      // 日本の場合: 080-6518-7544 のような形式
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
          <SelectContent>
            {COUNTRY_CODES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
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

