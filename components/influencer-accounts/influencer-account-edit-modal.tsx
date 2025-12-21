'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { InfluencerAccount } from '@/lib/types';

interface InfluencerAccountEditModalProps {
  account: InfluencerAccount;
  onClose: () => void;
  onSuccess: () => void;
}

export function InfluencerAccountEditModal({ account, onClose, onSuccess }: InfluencerAccountEditModalProps) {
  const [formData, setFormData] = useState<Omit<InfluencerAccount, 'id' | 'createdAt' | 'updatedAt'>>({
    email: account.email || '',
    tiktokHandle: account.tiktokHandle || '',
    fullName: account.fullName,
    achRoutingNumber: account.achRoutingNumber || '',
    swiftCode: account.swiftCode || '',
    accountNumber: account.accountNumber || '',
    accountType: account.accountType || '',
    wiseTag: account.wiseTag || '',
    address: account.address || '',
    phoneNumber: account.phoneNumber || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/influencer-accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '계좌 수정에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">인플루언서 계좌 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tiktokHandle" className="block text-sm font-medium text-gray-700 mb-1">
                Tiktok handle
              </label>
              <input
                type="text"
                id="tiktokHandle"
                name="tiktokHandle"
                value={formData.tiktokHandle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name of the Bank Account Holder <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="achRoutingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                ACH routing number
              </label>
              <input
                type="text"
                id="achRoutingNumber"
                name="achRoutingNumber"
                value={formData.achRoutingNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 mb-1">
                SWIFT code (BIC)
              </label>
              <input
                type="text"
                id="swiftCode"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <input
                type="text"
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="wiseTag" className="block text-sm font-medium text-gray-700 mb-1">
                WISE TAG
              </label>
              <input
                type="text"
                id="wiseTag"
                name="wiseTag"
                value={formData.wiseTag}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (With the Country Code)
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address (Building number, Street, City, State, Country)
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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



