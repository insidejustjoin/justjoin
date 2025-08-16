import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Users, FileText, Award, MapPin, Clock } from 'lucide-react';

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

interface QuickFiltersProps {
  filters: AdvancedFilters;
  onFilterChange: (key: keyof AdvancedFilters, value: any) => void;
}

export function QuickFilters({ filters, onFilterChange }: QuickFiltersProps) {
  const quickFilterOptions = [
    {
      key: 'gender' as keyof AdvancedFilters,
      label: '男性',
      icon: Users,
      active: filters.gender === 'male',
      value: 'male',
      resetValue: 'all',
    },
    {
      key: 'gender' as keyof AdvancedFilters,
      label: '女性',
      icon: Users,
      active: filters.gender === 'female',
      value: 'female',
      resetValue: 'all',
    },
    {
      key: 'hasWorkHistory' as keyof AdvancedFilters,
      label: '職歴あり',
      icon: FileText,
      active: filters.hasWorkHistory === true,
      value: true,
      resetValue: false,
    },
  ];

  const handleFilterClick = (option: typeof quickFilterOptions[0]) => {
    if (option.key === 'hasWorkHistory') {
      // 職歴フィルターの場合は単純なトグル
      if (option.active) {
        // フィルターが既にアクティブな場合はリセット
        onFilterChange(option.key, false);
      } else {
        // フィルターをアクティブにする
        onFilterChange(option.key, true);
      }
    } else {
      // 性別フィルターの場合は従来通り単一選択
      if (option.active) {
        // フィルターが既にアクティブな場合はリセット
        onFilterChange(option.key, option.resetValue);
      } else {
        // フィルターをアクティブにする
        onFilterChange(option.key, option.value);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 text-blue-700 font-medium">
        <Filter className="h-4 w-4" />
        クイックフィルター:
      </div>
      
      {/* 性別フィルター */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700">性別:</span>
        {quickFilterOptions.filter(option => option.key === 'gender').map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Button
              key={`${option.key}-${index}`}
              variant={option.active ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick(option)}
              className={`flex items-center gap-2 ${
                option.active 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-blue-100 border-blue-300 text-blue-700'
              }`}
            >
              <IconComponent className="h-3 w-3" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* 日本語資格フィルター */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700">日本語資格:</span>
        <Select
          value={filters.japaneseLevel}
          onValueChange={(value) => onFilterChange('japaneseLevel', value)}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">指定なし</SelectItem>
            <SelectItem value="N1">N1以上</SelectItem>
            <SelectItem value="N2">N2以上</SelectItem>
            <SelectItem value="N3">N3以上</SelectItem>
            <SelectItem value="N4">N4以上</SelectItem>
            <SelectItem value="N5">N5以上</SelectItem>
            <SelectItem value="none">なし</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 職歴フィルター */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700">職歴:</span>
        {quickFilterOptions.filter(option => option.key === 'hasWorkHistory').map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Button
              key={`${option.key}-${index}`}
              variant={option.active ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick(option)}
              className={`flex items-center gap-2 ${
                option.active 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-blue-100 border-blue-300 text-blue-700'
              }`}
            >
              <IconComponent className="h-3 w-3" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
} 