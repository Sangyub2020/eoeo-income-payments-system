'use client';

import { useEffect, useState } from 'react';
import { GlobalSalesTeam } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface GlobalSalesOutstandingProps {
  onSuccess?: () => void;
}

export function GlobalSalesOutstanding({ onSuccess }: GlobalSalesOutstandingProps) {
  const [records, setRecords] = useState<GlobalSalesTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/income-records?team=global_sales');
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.success) {
        const allRecords = data.data || [];
        
        // 미수금 필터링: 입금일이 지났는데 입금액이 없는 경우
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const outstandingRecords = allRecords.filter((record: GlobalSalesTeam) => {
          // 입금예정일이 공백이고 입금액이 공백인 경우
          if (!record.expectedDepositDate && (!record.depositAmount || record.depositAmount === 0)) {
            return true;
          }
          
          // 입금일이 있고, 입금일이 오늘보다 이전인 경우
          if (record.expectedDepositDate) {
            const depositDate = new Date(record.expectedDepositDate);
            depositDate.setHours(0, 0, 0, 0);
            
            // 입금일이 지났고, 입금액이 없거나 0인 경우
            if (depositDate < today && (!record.depositAmount || record.depositAmount === 0)) {
              return true;
            }
          }
          return false;
        });
        
        setRecords(outstandingRecords);
      } else {
        throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 미수금 총액 계산
  const totalOutstanding = records.reduce((sum, record) => {
    return sum + (record.expectedDepositAmount || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 미수금 총계 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">미수금 총계</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{records.length}건</div>
        </div>
      </div>

      {/* 미수금 목록 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">미수금 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">프로젝트 유형</th>
                <th className="text-left p-3 font-medium text-gray-700">프로젝트 이름</th>
                <th className="text-left p-3 font-medium text-gray-700">회사명</th>
                <th className="text-left p-3 font-medium text-gray-700">브랜드명</th>
                <th className="text-left p-3 font-medium text-gray-700">입금예정일</th>
                <th className="text-right p-3 font-medium text-gray-700">예정금액</th>
                <th className="text-left p-3 font-medium text-gray-700">담당자</th>
                <th className="text-left p-3 font-medium text-gray-700">적요</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    미수금이 없습니다.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  // 프로젝트 유형 표시 (projectCategory, projectCategory2, projectCategory3)
                  const projectCategories = [
                    record.projectCategory,
                    record.projectCategory2,
                    record.projectCategory3,
                  ].filter(Boolean);
                  const projectCategoryDisplay = projectCategories.length > 0 
                    ? projectCategories.join(', ') 
                    : '-';
                  
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap">{projectCategoryDisplay}</td>
                      <td className="p-3 whitespace-nowrap">{record.projectName || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{record.companyName || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{record.brandName || '-'}</td>
                      <td className="p-3 whitespace-nowrap">
                        {record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {record.expectedDepositAmount 
                          ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency)
                          : '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap">{record.eoeoManager || '-'}</td>
                      <td className="p-3 whitespace-nowrap">{record.description || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

