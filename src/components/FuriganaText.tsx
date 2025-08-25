import React, { useState, useEffect, useMemo } from 'react';
import { applyFurigana } from '../utils/furiganaDictionary';

interface FuriganaTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
  showToggleButton?: boolean;
}

interface FuriganaSegment {
  text: string;
  reading?: string;
  isKanji: boolean;
}

export function FuriganaText({ 
  text, 
  className = "", 
  showFurigana = true,
  onToggleFurigana,
  showToggleButton = false
}: FuriganaTextProps) {
  // メモ化してパフォーマンスを向上
  const segments = useMemo(() => {
    if (!text.trim()) {
      return [{ text: text, isKanji: false }];
    }
    return applyFurigana(text);
  }, [text]);

  // ふりがな表示切り替えボタン
  const ToggleButton = () => {
    if (!onToggleFurigana || !showToggleButton) return null;

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFurigana(!showFurigana);
        }}
        className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
        title="ふりがなの表示/非表示を切り替え"
      >
        {showFurigana ? 'ふりがな非表示' : 'ふりがな表示'}
      </button>
    );
  };

  // ふりがな表示
  if (showFurigana && segments.length > 0) {
    return (
      <span className={className}>
        {segments.map((segment, index) => {
          if (segment.isKanji && segment.reading) {
            return (
              <span key={index} className="inline-flex items-center">
                <span>{segment.text}</span>
                <span className="text-xs text-gray-500 ml-1 leading-none">({segment.reading})</span>
              </span>
            );
          } else {
            return <span key={index}>{segment.text}</span>;
          }
        })}
        <ToggleButton />
      </span>
    );
  }

  // 通常表示（ふりがななし）
  return (
    <span className={className}>
      {text}
      <ToggleButton />
    </span>
  );
} 