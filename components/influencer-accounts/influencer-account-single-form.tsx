'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InfluencerAccount } from '@/lib/types';

interface InfluencerAccountSingleFormProps {
  onSuccess: () => void;
}

export function InfluencerAccountSingleForm({ onSuccess }: InfluencerAccountSingleFormProps) {
  const [formData, setFormData] = useState<Omit<InfluencerAccount, 'id' | 'createdAt' | 'updatedAt'>>({
    email: '',
    tiktokHandle: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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



