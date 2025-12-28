'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OnlineCommerceTeam } from '@/lib/types';

interface OnlineCommerceSingleFormProps {
  onSuccess: () => void;
}

export function OnlineCommerceSingleForm({ onSuccess }: OnlineCommerceSingleFormProps) {
  const [formData, setFormData] = useState<Partial<OnlineCommerceTeam>>({
    category: '',
    vendorCode: '',
    companyName: '',
    brandName: '',
    businessRegistrationNumber: '',
    invoiceEmail: '',
    projectCode: '',
    project: '',
    projectName: '',
    eoeoManager: '',
    contractLink: '',
    estimateLink: '',
    installmentNumber: undefined,
    attributionYearMonth: '',
    advanceBalance: '',
    ratio: undefined,
    count: undefined,
    expectedDepositDate: '',
    expectedDepositAmount: undefined,
    description: '',
    depositDate: '',
    depositAmount: undefined,
    createdDate: '',
    invoiceCopy: '',
    issueNotes: '',
    taxStatus: '',
    invoiceSupplyPrice: undefined,
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
      const response = await fetch('/api/income-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          team: 'online_commerce',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '입금 정보 등록에 실패했습니다.');
      }

      // 폼 초기화
      setFormData({
        category: '',
        vendorCode: '',
        companyName: '',
        brandName: '',
        businessRegistrationNumber: '',
        invoiceEmail: '',
        projectCode: '',
        project: '',
        projectName: '',
        eoeoManager: '',
        contractLink: '',
        estimateLink: '',
        installmentNumber: undefined,
        attributionYearMonth: '',
        advanceBalance: '',
        ratio: undefined,
        count: undefined,
        expectedDepositDate: '',
        expectedDepositAmount: undefined,
        description: '',
        depositDate: '',
        depositAmount: undefined,
        createdDate: '',
        invoiceCopy: '',
        issueNotes: '',
        taxStatus: '',
        invoiceSupplyPrice: undefined,
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
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : (name.includes('Amount') || name.includes('Number') || name === 'ratio' || name === 'count' || name === 'installmentNumber' || name === 'expectedDepositAmount' || name === 'depositAmount' || name === 'invoiceSupplyPrice')
        ? (value === '' ? undefined : Number(value))
        : value,
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
          입금 정보가 성공적으로 등록되었습니다.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              구분
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="vendorCode" className="block text-sm font-medium text-gray-700 mb-1">
              거래처코드
            </label>
            <input
              type="text"
              id="vendorCode"
              name="vendorCode"
              value={formData.vendorCode || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              id="brandName"
              name="brandName"
              value={formData.brandName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
              사업자등록번호
            </label>
            <input
              type="text"
              id="businessRegistrationNumber"
              name="businessRegistrationNumber"
              value={formData.businessRegistrationNumber || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="invoiceEmail" className="block text-sm font-medium text-gray-700 mb-1">
              세금계산서 발행 이메일
            </label>
            <input
              type="email"
              id="invoiceEmail"
              name="invoiceEmail"
              value={formData.invoiceEmail || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 mb-1">
              project code
            </label>
            <input
              type="text"
              id="projectCode"
              name="projectCode"
              value={formData.projectCode || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              project
            </label>
            <input
              type="text"
              id="project"
              name="project"
              value={formData.project || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project name
            </label>
            <input
              type="text"
              id="projectName"
              name="projectName"
              value={formData.projectName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="eoeoManager" className="block text-sm font-medium text-gray-700 mb-1">
              EOEO 담당자
            </label>
            <input
              type="text"
              id="eoeoManager"
              name="eoeoManager"
              value={formData.eoeoManager || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="contractLink" className="block text-sm font-medium text-gray-700 mb-1">
              계약서 (LINK)
            </label>
            <input
              type="text"
              id="contractLink"
              name="contractLink"
              value={formData.contractLink || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="estimateLink" className="block text-sm font-medium text-gray-700 mb-1">
              견적서 (LINK)
            </label>
            <input
              type="text"
              id="estimateLink"
              name="estimateLink"
              value={formData.estimateLink || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="installmentNumber" className="block text-sm font-medium text-gray-700 mb-1">
              차수
            </label>
            <input
              type="number"
              id="installmentNumber"
              name="installmentNumber"
              value={formData.installmentNumber || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="attributionYearMonth" className="block text-sm font-medium text-gray-700 mb-1">
              귀속년월
            </label>
            <input
              type="text"
              id="attributionYearMonth"
              name="attributionYearMonth"
              value={formData.attributionYearMonth || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="advanceBalance" className="block text-sm font-medium text-gray-700 mb-1">
              선/잔금
            </label>
            <input
              type="text"
              id="advanceBalance"
              name="advanceBalance"
              value={formData.advanceBalance || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="ratio" className="block text-sm font-medium text-gray-700 mb-1">
              비율
            </label>
            <input
              type="number"
              step="0.01"
              id="ratio"
              name="ratio"
              value={formData.ratio || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
              건수
            </label>
            <input
              type="number"
              id="count"
              name="count"
              value={formData.count || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="expectedDepositDate" className="block text-sm font-medium text-gray-700 mb-1">
              입금예정일
            </label>
            <input
              type="date"
              id="expectedDepositDate"
              name="expectedDepositDate"
              value={formData.expectedDepositDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="expectedDepositAmount" className="block text-sm font-medium text-gray-700 mb-1">
              입금 예정금액 (부가세 포함)
            </label>
            <input
              type="number"
              id="expectedDepositAmount"
              name="expectedDepositAmount"
              value={formData.expectedDepositAmount || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              적요
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="depositDate" className="block text-sm font-medium text-gray-700 mb-1">
              입금일
            </label>
            <input
              type="date"
              id="depositDate"
              name="depositDate"
              value={formData.depositDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
              입금액
            </label>
            <input
              type="number"
              id="depositAmount"
              name="depositAmount"
              value={formData.depositAmount || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <div>
            <label htmlFor="createdDate" className="block text-sm font-medium text-gray-700 mb-1">
              작성일자
            </label>
            <input
              type="date"
              id="createdDate"
              name="createdDate"
              value={formData.createdDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="invoiceCopy" className="block text-sm font-medium text-gray-700 mb-1">
              세금계산서 사본
            </label>
            <input
              type="text"
              id="invoiceCopy"
              name="invoiceCopy"
              value={formData.invoiceCopy || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="issueNotes" className="block text-sm font-medium text-gray-700 mb-1">
              ISSUE사항
            </label>
            <input
              type="text"
              id="issueNotes"
              name="issueNotes"
              value={formData.issueNotes || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <div>
            <label htmlFor="taxStatus" className="block text-sm font-medium text-gray-700 mb-1">
              과/면세/영세
            </label>
            <input
              type="text"
              id="taxStatus"
              name="taxStatus"
              value={formData.taxStatus || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="invoiceSupplyPrice" className="block text-sm font-medium text-gray-700 mb-1">
              세금계산서발행공급가
            </label>
            <input
              type="number"
              id="invoiceSupplyPrice"
              name="invoiceSupplyPrice"
              value={formData.invoiceSupplyPrice || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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


