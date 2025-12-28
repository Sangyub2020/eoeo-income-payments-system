'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Project } from '@/lib/types';

interface ProjectSingleFormProps {
  onSuccess: () => void;
}

export function ProjectSingleForm({ onSuccess }: ProjectSingleFormProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    code: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '프로젝트 등록에 실패했습니다.');
      }

      setFormData({
        name: '',
        code: '',
      });
      setSuccess(true);
      onSuccess();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">단일 등록</h3>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 rounded mb-4">
          프로젝트가 성공적으로 등록되었습니다.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              프로젝트명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="프로젝트명을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
              프로젝트코드 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="예: P001"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : '등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}









