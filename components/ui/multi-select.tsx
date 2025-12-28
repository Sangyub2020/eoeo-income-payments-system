'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  required = false,
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디버깅: options가 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('MultiSelect options 업데이트:', {
      optionsCount: options.length,
      firstFew: options.slice(0, 5),
      allOptions: options
    });
  }, [options]);

  // 중복된 value를 가진 옵션 제거 (첫 번째 것만 유지)
  const uniqueOptions = options.reduce((acc, opt) => {
    if (!acc.find(item => item.value === opt.value)) {
      acc.push(opt);
    }
    return acc;
  }, [] as Array<{ value: string; label: string }>);

  const selectedOptions = uniqueOptions.filter(opt => value.includes(opt.value));

  const filteredOptions = uniqueOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleToggleOpen = () => {
    if (!disabled) {
      console.log('MultiSelect 드롭다운 토글:', {
        isOpen: !isOpen,
        optionsCount: options.length,
        uniqueOptionsCount: uniqueOptions.length,
        filteredOptionsCount: filteredOptions.length,
        searchQuery
      });
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={disabled}
        className={`w-full min-h-[42px] px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-left flex items-center justify-between ${
          disabled ? 'bg-slate-800/40 cursor-not-allowed text-gray-500' : 'bg-black/40 backdrop-blur-xl cursor-pointer hover:border-purple-500/50 text-gray-200'
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-sm"
              >
                {opt.label}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-cyan-200"
                    onClick={(e) => handleRemove(opt.value, e)}
                  />
                )}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {value.length > 0 && !disabled && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-cyan-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll(e);
              }}
            />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-purple-500/20">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  console.log('MultiSelect 검색어 변경:', e.target.value);
                  setSearchQuery(e.target.value);
                }}
                placeholder="검색..."
                className="w-full pl-8 pr-3 py-2 bg-black/40 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {(() => {
              console.log('MultiSelect 드롭다운 렌더링:', {
                filteredOptionsCount: filteredOptions.length,
                uniqueOptionsCount: uniqueOptions.length,
                optionsCount: options.length,
                searchQuery
              });
              if (filteredOptions.length === 0) {
                return (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    {uniqueOptions.length === 0 ? `브랜드 목록이 없습니다. (options: ${options.length}개)` : '검색 결과가 없습니다.'}
                  </div>
                );
              }
              return filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-cyan-500/20' : ''
                    }`}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={isSelected ? 'text-cyan-300 font-medium' : 'text-gray-300'}>
                      {option.label}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}







