'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InfluencerAccount } from '@/lib/types';
import { Plus, X } from 'lucide-react';

interface InfluencerAccountSingleFormProps {
  onSuccess: () => void;
}

export function InfluencerAccountSingleForm({ onSuccess }: InfluencerAccountSingleFormProps) {
  const [formData, setFormData] = useState<Omit<InfluencerAccount, 'id' | 'createdAt' | 'updatedAt'>>({
    email: '',
    tiktokHandle: '',
    tiktokHandles: [],
    instagramHandles: [],
    recipientType: undefined,
    fullName: '',
    achRoutingNumber: '',
    swiftCode: '',
    accountNumber: '',
    accountType: '',
    wiseTag: '',
    address: '',
    phoneNumber: '',
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
      const response = await fetch('/api/influencer-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '인플루언서 계좌 등록에 실패했습니다.');
      }

      setFormData({
        email: '',
        tiktokHandle: '',
        tiktokHandles: [],
        instagramHandles: [],
        recipientType: undefined,
        fullName: '',
        achRoutingNumber: '',
        swiftCode: '',
        accountNumber: '',
        accountType: '',
        wiseTag: '',
        address: '',
        phoneNumber: '',
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
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">단일 등록</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          인플루언서 계좌가 성공적으로 등록되었습니다.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="email@example.com"
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
                placeholder="@username"
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
              placeholder="홍길동"
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
              placeholder="123456789"
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
              placeholder="SWIFTCODE"
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
              placeholder="1234567890"
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
              placeholder="Checking, Savings 등"
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
              placeholder="WISE TAG"
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
              placeholder="+82 10-1234-5678"
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
              placeholder="123 Main St, Seoul, Seoul, South Korea"
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



