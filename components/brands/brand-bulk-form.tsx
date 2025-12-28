'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/lib/types';

interface BrandBulkFormProps {
  onSuccess: () => void;
}

export function BrandBulkForm({ onSuccess }: BrandBulkFormProps) {
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const hasText = bulkText.trim().length > 0;

  const parseBulkText = (text: string): Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const brands: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const line of lines) {
      // 탭을 우선으로 구분 (CSV 복사 시 탭으로 구분됨)
      // 탭이 없으면 쉼표로 구분
      const parts = line.includes('\t') 
        ? line.split('\t').map(p => p.trim())
        : line.split(',').map(p => p.trim());
      
      if (parts.length >= 1 && parts[0]) {
        brands.push({
          name: parts[0],
        });
      }
    }

    return brands;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setResult(null);

    try {
      const brands = parseBulkText(bulkText);
      
      if (brands.length === 0) {
        throw new Error('등록할 브랜드 정보가 없습니다.');
      }

      // 필수 필드 검증
      const invalidBrands = brands.filter(b => !b.name || b.name.trim() === '');
      if (invalidBrands.length > 0) {
        throw new Error('모든 브랜드는 브랜드명이 필수입니다.');
      }

      // 일괄 등록 API 호출
      const response = await fetch('/api/brands/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brands }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '일괄 등록에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data.result);
      
      // 실패한 항목만 남기기 (성공한 항목 제거)
      if (data.result && data.result.failed > 0 && data.result.errors.length > 0) {
        // 실패한 브랜드명 목록 추출 (에러 메시지에서 브랜드명 추출)
        const failedNames = new Set<string>();
        data.result.errors.forEach((err: string) => {
          // "브랜드명: 메시지" 형식에서 브랜드명 추출
          const match = err.match(/^([^:]+):/);
          if (match) {
            failedNames.add(match[1].trim());
          }
        });
        
        // 실패한 항목만 남기기
        const brands = parseBulkText(bulkText);
        const failedBrands = brands.filter(b => failedNames.has(b.name));
        
        if (failedBrands.length > 0) {
          const failedText = failedBrands
            .map(b => b.name)
            .join('\n');
          
          setBulkText(failedText);
        } else {
          // 브랜드명 매칭 실패 시 원본 텍스트 유지
          console.warn('실패한 항목을 찾을 수 없습니다. 원본 텍스트를 유지합니다.');
        }
      } else {
        // 모두 성공한 경우에만 텍스트 초기화
        setBulkText('');
      }
      
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">일괄 등록</h3>
      
      <div className="mb-4 p-4 bg-cyan-900/30 border border-cyan-500/50 rounded-md">
        <p className="text-sm text-cyan-300 mb-2">
          <strong>입력 형식:</strong> CSV 파일에서 복사하여 붙여넣기 하세요 (탭 또는 줄바꿈으로 구분)
        </p>
        <p className="text-sm text-cyan-200">
          형식: 브랜드명 (한 줄에 하나씩)
        </p>
        <p className="text-xs text-cyan-300/80 mt-2">
          예시:
        </p>
        <pre className="text-xs text-cyan-300/80 mt-1 bg-slate-700/50 p-2 rounded border border-gray-600">
          Chasin' Rabbits{'\n'}10 BRANDS{'\n'}2aN{'\n'}Abib
        </pre>
        <p className="text-xs text-cyan-300/70 mt-1 italic">
          * Excel이나 Google Sheets에서 복사하면 자동으로 탭으로 구분됩니다
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && result && (
        <div className={`border rounded mb-4 ${
          result.failed > 0 
            ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300' 
            : 'bg-green-900/30 border-green-500/50 text-green-300'
        }`}>
          <div className="px-4 py-3">
            <p className="font-medium">
              {result.failed > 0 ? '⚠️ 부분 등록 완료' : '✅ 등록 완료'}: 성공 {result.success}건, 실패 {result.failed}건
            </p>
            {result.failed > 0 && (
              <p className="text-sm mt-2">
                실패한 항목은 텍스트 영역에 남아있습니다. 수정 후 다시 등록해주세요.
              </p>
            )}
            {result.errors.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium hover:underline text-gray-300">
                  실패 상세 내역 보기 ({result.errors.length}건)
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto bg-slate-700/50 rounded p-3 border border-gray-600">
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    {result.errors.slice(0, 100).map((err, idx) => (
                      <li key={idx} className="text-red-300">{err}</li>
                    ))}
                    {result.errors.length > 100 && (
                      <li className="text-gray-400 italic">
                        ... 외 {result.errors.length - 100}건의 오류가 더 있습니다.
                      </li>
                    )}
                  </ul>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bulkText" className="block text-sm font-medium text-gray-300 mb-2">
            브랜드명 입력 (한 줄에 하나씩)
          </label>
          <textarea
            id="bulkText"
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              // 텍스트 입력 시 에러 및 성공 메시지 초기화
              if (error) setError(null);
              if (success) {
                setSuccess(false);
                setResult(null);
              }
            }}
            rows={10}
            className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
            placeholder="브랜드명을 한 줄에 하나씩 입력하세요&#10;예: Chasin' Rabbits&#10;예: 10 BRANDS&#10;예: 2aN"
          />
          {bulkText.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              입력된 줄 수: {bulkText.split('\n').filter(line => line.trim()).length}줄
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {bulkText.trim() && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBulkText('');
                setError(null);
                setSuccess(false);
                setResult(null);
              }}
              disabled={isSubmitting}
            >
              초기화
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting || !hasText}
          >
            {isSubmitting ? '등록 중...' : '일괄 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}







