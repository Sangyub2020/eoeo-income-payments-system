'use client';

import { useEffect, useState } from 'react';
import { OnlineCommerceTeam } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface OnlineCommerceOutstandingProps {
  onSuccess?: () => void;
}

export function OnlineCommerceOutstanding({ onSuccess }: OnlineCommerceOutstandingProps) {
  const [records, setRecords] = useState<OnlineCommerceTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/income-records?team=online_commerce');
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.success) {
        const allRecords = data.data || [];
        
        // 미수금 필터링: 입금일이 지났는데 입금액이 없는 경우
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const outstandingRecords = allRecords.filter((record: OnlineCommerceTeam) => {
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
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-2 text-gray-300">데이터를 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 미수금 총계 */}
      <Card>
        <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
          <div className="text-sm text-gray-300 mb-1">미수금 총계</div>
          <div className="text-2xl font-bold text-red-300">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{records.length}건</div>
        </div>
      </Card>

      {/* 미수금 목록 */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">미수금 목록</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-purple-500/20">
              <tr>
                <th className="text-left p-3 font-medium text-gray-200">프로젝트 유형</th>
                <th className="text-left p-3 font-medium text-gray-200">프로젝트 이름</th>
                <th className="text-left p-3 font-medium text-gray-200">회사명</th>
                <th className="text-left p-3 font-medium text-gray-200">브랜드명</th>
                <th className="text-left p-3 font-medium text-gray-200">입금예정일</th>
                <th className="text-right p-3 font-medium text-gray-200">예정금액</th>
                <th className="text-left p-3 font-medium text-gray-200">담당자</th>
                <th className="text-left p-3 font-medium text-gray-200">적요</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
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
                    <tr key={record.id} className="border-b border-purple-500/10 hover:bg-white/5">
                      <td className="p-3 whitespace-nowrap text-gray-300">{projectCategoryDisplay}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.projectName || '-'}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.companyName || '-'}</td>
                      <td className="p-3 whitespace-pre-line text-gray-300">{Array.isArray(record.brandNames) && record.brandNames.length > 0 ? record.brandNames.join('\n') : (record.brandName || '-')}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">
                        {record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap text-gray-300">
                        {record.expectedDepositAmount 
                          ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency)
                          : '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.eoeoManager || '-'}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.description || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

