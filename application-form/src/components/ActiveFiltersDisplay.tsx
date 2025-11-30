import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AdvancedFilters {
  searchTerm: string;
  ageValue: number;
  ageCondition: 'gte' | 'lte' | 'eq';
  gender: string;
  nationality: string;
  hasWorkExperience: boolean;
  japaneseLevel: 'all' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'none';
  skillLevelFilters: { [skill: string]: 'all' | 'A' | 'B' | 'C' | 'D' };
  hasSelfIntroduction: boolean;
  hasPhoto: boolean;
  hasWorkHistory: boolean;
  hasQualifications: boolean;
  spouseStatus: 'all' | 'married' | 'single' | 'other';
  commutingTime: 'all' | '30min' | '1hour' | '1.5hour' | '2hour' | '2hour+';
}

interface ActiveFiltersDisplayProps {
  filters: AdvancedFilters;
  onClearFilter: (key: keyof AdvancedFilters, value: any) => void;
  onClearAll: () => void;
}

export function ActiveFiltersDisplay({ filters, onClearFilter, onClearAll }: ActiveFiltersDisplayProps) {
  const getFilterLabel = (key: keyof AdvancedFilters, value: any): string | null => {
    switch (key) {
      case 'searchTerm':
        return value ? `検索: "${value}"` : null;
      case 'ageValue':
        return value > 0 ? `年齢: ${getAgeConditionLabel(filters.ageCondition)}${value}歳` : null;
      case 'gender':
        return value !== 'all' ? `性別: ${getGenderLabel(value)}` : null;
      case 'nationality':
        return value !== 'all' ? `国籍: ${value}` : null;
      case 'hasWorkExperience':
        return value ? '職歴あり' : null;
      case 'japaneseLevel':
        return value !== 'all' ? `日本語資格: ${value === 'none' ? '無' : value}` : null;
      case 'hasSelfIntroduction':
        return value ? '自己紹介あり' : null;
      case 'hasPhoto':
        return value ? '写真あり' : null;
      case 'hasWorkHistory':
        return value ? '職歴あり' : null;
      case 'hasQualifications':
        return value ? '資格あり' : null;
      case 'spouseStatus':
        return value !== 'all' ? `配偶者: ${getSpouseStatusLabel(value)}` : null;
      case 'commutingTime':
        return value !== 'all' ? `通勤時間: ${getCommutingTimeLabel(value)}` : null;
      case 'skillLevelFilters':
        const activeSkillFilters = Object.entries(value).filter(([_, level]) => level !== 'all');
        if (activeSkillFilters.length === 0) return null;
        return activeSkillFilters.map(([skill, level]) => `${skill}: ${level}以上`).join(', ');
      default:
        return null;
    }
  };

  const getAgeConditionLabel = (condition: string): string => {
    switch (condition) {
      case 'gte': return '';
      case 'lte': return '';
      case 'eq': return '';
      default: return '';
    }
  };

  const getGenderLabel = (gender: string): string => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return gender;
    }
  };

  const getSpouseStatusLabel = (status: string): string => {
    switch (status) {
      case 'married': return '配偶者あり';
      case 'single': return '配偶者なし';
      case 'other': return 'その他';
      default: return status;
    }
  };

  const getCommutingTimeLabel = (time: string): string => {
    switch (time) {
      case '30min': return '30分以内';
      case '1hour': return '1時間以内';
      case '1.5hour': return '1.5時間以内';
      case '2hour': return '2時間以内';
      case '2hour+': return '2時間以上';
      default: return time;
    }
  };

  const getDefaultValue = (key: keyof AdvancedFilters): any => {
    switch (key) {
      case 'searchTerm':
        return '';
      case 'ageValue':
        return 0;
      case 'ageCondition':
        return 'gte';
      case 'gender':
      case 'nationality':
      case 'spouseStatus':
      case 'commutingTime':
        return 'all';
      case 'japaneseLevel':
        return 'all';
      case 'hasWorkExperience':
      case 'hasSelfIntroduction':
      case 'hasPhoto':
      case 'hasWorkHistory':
      case 'hasQualifications':
        return false;
      case 'skillLevelFilters':
        return {};
      default:
        return null;
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'skillLevelFilters') {
      return Object.values(value).some(level => level !== 'all');
    }
    return value !== getDefaultValue(key as keyof AdvancedFilters);
  });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-lg border">
      <span className="text-sm font-medium text-gray-700">アクティブフィルター:</span>
      {activeFilters.map(([key, value]) => {
        const label = getFilterLabel(key as keyof AdvancedFilters, value);
        if (!label) return null;

        return (
          <Badge key={key} variant="secondary" className="flex items-center gap-1">
            {label}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-gray-200"
              onClick={() => onClearFilter(key as keyof AdvancedFilters, getDefaultValue(key as keyof AdvancedFilters))}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-gray-500 hover:text-gray-700"
      >
        すべてクリア
      </Button>
    </div>
  );
} 