'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Project } from '@/lib/types';

interface ProjectBulkFormProps {
  onSuccess: () => void;
}

export function ProjectBulkForm({ onSuccess }: ProjectBulkFormProps) {
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const parseBulkText = (text: string): Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const line of lines) {
      const parts = line.includes('\t') 
        ? line.split('\t').map(p => p.trim())
        : line.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        projects.push({
          name: parts[0] || '',
          code: parts[1] || '',
        });
      }
    }

    return projects;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setResult(null);

    try {
      const projects = parseBulkText(bulkText);
      
      if (projects.length === 0) {
        throw new Error('등록할 프로젝트 정보가 없습니다.');
      }

      const invalidProjects = projects.filter(p => !p.code || !p.name);
      if (invalidProjects.length > 0) {
        throw new Error('모든 프로젝트는 프로젝트명과 프로젝트코드가 필수입니다.');
      }

      const response = await fetch('/api/projects/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projects }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '일괄 등록에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data.result);
      
      if (data.result && data.result.failed > 0 && data.result.errors.length > 0) {
        const failedCodes = new Set<string>();
        data.result.errors.forEach((err: string) => {
          const match = err.match(/^([^:]+):/);
          if (match) {
            failedCodes.add(match[1].trim());
          }
        });
        
        const projects = parseBulkText(bulkText);
        const failedProjects = projects.filter(p => failedCodes.has(p.code));
        
        if (failedProjects.length > 0) {
          const failedText = failedProjects
            .map(p => `${p.name}\t${p.code}`)
            .join('\n');
          
          setBulkText(failedText);
        }
      } else {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">일괄 등록</h3>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800 mb-2">
          <strong>입력 형식:</strong> CSV 파일에서 복사하여 붙여넣기 하세요 (탭으로 구분)
        </p>
        <p className="text-sm text-blue-700">
          형식: 프로젝트명 [탭] 프로젝트코드
        </p>
        <p className="text-xs text-blue-600 mt-2">
          예시: 프로젝트A [탭] P001
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && result && (
        <div className={`border rounded mb-4 ${
          result.failed > 0 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
            : 'bg-green-50 border-green-200 text-green-700'
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
                <summary className="cursor-pointer text-sm font-medium hover:underline">
                  실패 상세 내역 보기 ({result.errors.length}건)
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto bg-white rounded p-3 border">
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    {result.errors.slice(0, 100).map((err, idx) => (
                      <li key={idx} className="text-red-700">{err}</li>
                    ))}
                    {result.errors.length > 100 && (
                      <li className="text-gray-500 italic">
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
          <label htmlFor="bulkText" className="block text-sm font-medium text-gray-700 mb-2">
            프로젝트 정보 입력 (CSV에서 복사하여 붙여넣기)
          </label>
          <textarea
            id="bulkText"
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              if (error) setError(null);
              if (success) {
                setSuccess(false);
                setResult(null);
              }
            }}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="CSV 파일에서 복사하여 붙여넣기 하세요&#10;각 줄은 탭으로 구분된 형식입니다"
          />
          {bulkText.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              입력된 줄 수: {bulkText.split('\n').filter(line => line.trim()).length}줄
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            <span className="text-sm">파일 업로드</span>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
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
          <Button type="submit" disabled={isSubmitting || !bulkText.trim()}>
            {isSubmitting ? '등록 중...' : '일괄 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}



