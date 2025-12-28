'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Vendor } from '@/lib/types';

interface VendorEditModalProps {
  vendor: Vendor;
  onClose: () => void;
  onSuccess: () => void;
}

export function VendorEditModal({ vendor, onClose, onSuccess }: VendorEditModalProps) {
  const [formData, setFormData] = useState<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>({
    code: vendor.code,
    name: vendor.name,
    businessNumber: vendor.businessNumber || '',
    invoiceEmail: vendor.invoiceEmail || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '거래처 수정에 실패했습니다.');
      }

      onSuccess();
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-purple-500/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-gray-200">거래처 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
              거래처 코드 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="예: V001"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              거래처명 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="거래처명을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-300 mb-1">
              사업자번호
            </label>
            <input
              type="text"
              id="businessNumber"
              name="businessNumber"
              value={formData.businessNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="123-45-67890"
            />
          </div>

          <div>
            <label htmlFor="invoiceEmail" className="block text-sm font-medium text-gray-300 mb-1">
              세금계산서 발행 이메일
            </label>
            <input
              type="email"
              id="invoiceEmail"
              name="invoiceEmail"
              value={formData.invoiceEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="invoice@example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}









