'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
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
    tiktokHandles: account.tiktokHandles || [],
    instagramHandles: account.instagramHandles || [],
    recipientType: account.recipientType,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Business가 아닐 때는 복수 계정 배열 초기화
      if (name === 'recipientType' && value !== 'Business') {
        newData.tiktokHandles = [];
        newData.instagramHandles = [];
      }
      return newData;
    });
  };

  const addTiktokAccount = () => {
    setFormData((prev) => ({
      ...prev,
      tiktokHandles: [...(prev.tiktokHandles || []), ''],
    }));
  };

  const removeTiktokAccount = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tiktokHandles: prev.tiktokHandles?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateTiktokAccount = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tiktokHandles: prev.tiktokHandles?.map((handle, i) => (i === index ? value : handle)) || [],
    }));
  };

  const addInstagramAccount = () => {
    setFormData((prev) => ({
      ...prev,
      instagramHandles: [...(prev.instagramHandles || []), ''],
    }));
  };

  const removeInstagramAccount = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instagramHandles: prev.instagramHandles?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateInstagramAccount = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      instagramHandles: prev.instagramHandles?.map((handle, i) => (i === index ? value : handle)) || [],
    }));
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

            {formData.recipientType === 'Business' ? (
              <>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tiktok Accounts
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTiktokAccount}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      추가
                    </Button>
                  </div>
                  {formData.tiktokHandles?.map((handle, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => updateTiktokAccount(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`@username${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTiktokAccount(index)}
                        className="px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.tiktokHandles || formData.tiktokHandles.length === 0) && (
                    <p className="text-sm text-gray-500">+ 버튼을 눌러 계정을 추가하세요</p>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Instagram Accounts
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstagramAccount}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      추가
                    </Button>
                  </div>
                  {formData.instagramHandles?.map((handle, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => updateInstagramAccount(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`@username${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInstagramAccount(index)}
                        className="px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.instagramHandles || formData.instagramHandles.length === 0) && (
                    <p className="text-sm text-gray-500">+ 버튼을 눌러 계정을 추가하세요</p>
                  )}
                </div>
              </>
            ) : (
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
            )}

            <div>
              <label htmlFor="recipientType" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Type
              </label>
              <select
                id="recipientType"
                name="recipientType"
                value={formData.recipientType || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
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



