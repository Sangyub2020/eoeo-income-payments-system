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

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {opt.label}
                {!disabled && (
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-blue-900"
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
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={isSelected ? 'text-blue-900 font-medium' : 'text-gray-900'}>
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}




