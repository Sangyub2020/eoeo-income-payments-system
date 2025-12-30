'use client';

import { useEffect, useState } from 'react';
import { GlobalSalesTeam } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface GlobalSalesOutstandingProps {
  onSuccess?: () => void;
}

export function GlobalSalesOutstanding({ onSuccess }: GlobalSalesOutstandingProps) {
  const [records, setRecords] = useState<GlobalSalesTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 열 너비 관리
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    projectCategory: 200,
    projectName: 150,
    companyName: 150,
    brandName: 120,
    expectedDepositDate: 120,
    expectedDepositAmount: 150,
    eoeoManager: 100,
    description: 200,
  });

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey] || 100);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizingColumn) return;
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

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
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-slate-800 border-b border-purple-500/20">
              <tr>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.projectCategory}px`, minWidth: '50px' }}
                >
                  프로젝트 유형
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('projectCategory', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.projectName}px`, minWidth: '50px' }}
                >
                  프로젝트 이름
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('projectName', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.companyName}px`, minWidth: '50px' }}
                >
                  회사명
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('companyName', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.brandName}px`, minWidth: '50px' }}
                >
                  브랜드명
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('brandName', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.expectedDepositDate}px`, minWidth: '50px' }}
                >
                  입금예정일
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('expectedDepositDate', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.expectedDepositAmount}px`, minWidth: '50px' }}
                >
                  예정금액
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('expectedDepositAmount', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.eoeoManager}px`, minWidth: '50px' }}
                >
                  담당자
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('eoeoManager', e)}
                  />
                </th>
                <th 
                  className="text-left p-3 font-medium text-gray-200 relative"
                  style={{ width: `${columnWidths.description}px`, minWidth: '50px' }}
                >
                  적요
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('description', e)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-left text-gray-400">
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
                  
                  return (
                    <tr key={record.id} className="border-b border-purple-500/10 hover:bg-white/5">
                      <td className="p-3 text-gray-300">
                        {projectCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {projectCategories.map((category, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-900/60 text-purple-200 border border-purple-500/70"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.projectName || '-'}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">{record.companyName || '-'}</td>
                      <td className="p-3 whitespace-pre-line text-gray-300">{Array.isArray(record.brandNames) && record.brandNames.length > 0 ? record.brandNames.join('\n') : (record.brandName || '-')}</td>
                      <td className="p-3 whitespace-nowrap text-gray-300">
                        {record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}
                      </td>
                      <td className="p-3 text-left whitespace-nowrap text-gray-300">
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

