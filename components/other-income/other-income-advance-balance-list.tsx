'use client';

import { useEffect, useState, useCallback } from 'react';
import { OtherIncome } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const ITEMS_PER_PAGE = 100;

type SortField = 'category' | 'companyName' | 'project' | 'projectName' | 'expectedDepositDate' | 'expectedDepositAmount' | 'depositDate' | 'depositAmount' | null;
type SortDirection = 'asc' | 'desc';

interface OtherIncomeAdvanceBalanceListProps {
  onSuccess?: () => void;
}

export function OtherIncomeAdvanceBalanceList({ onSuccess }: OtherIncomeAdvanceBalanceListProps) {
  const [records, setRecords] = useState<OtherIncome[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OtherIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // 표시할 열만 정의
  const allColumns = [
    { key: 'number', label: '번호', alwaysVisible: true },
    { key: 'advanceBalance', label: '선/잔금', alwaysVisible: false },
    { key: 'ratio', label: '비율', alwaysVisible: false },
    { key: 'category', label: '거래 유형', alwaysVisible: false },
    { key: 'project', label: '프로젝트 유형', alwaysVisible: false },
    { key: 'projectName', label: 'Project Name', alwaysVisible: false },
    { key: 'companyName', label: '회사명', alwaysVisible: false },
    { key: 'depositStatus', label: '입금여부', alwaysVisible: false },
    { key: 'expectedDepositDate', label: '입금 예정일', alwaysVisible: false },
    { key: 'expectedDepositAmount', label: '예정금액', alwaysVisible: false },
    { key: 'depositDate', label: '입금일', alwaysVisible: false },
    { key: 'depositAmount', label: '입금액', alwaysVisible: false },
    { key: 'invoiceAttachment', label: '세금계산서 첨부', alwaysVisible: false },
    { key: 'description', label: '적요', alwaysVisible: false },
  ];
  
  // 선택된 열 관리 (거래 유형, 프로젝트 유형, Project Name, 회사명 제외)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(allColumns.map(col => col.key).filter(key => 
      key !== 'category' && key !== 'project' && key !== 'projectName' && key !== 'companyName'
    ))
  );

  // 열 너비 관리
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    number: 60,
    category: 150,
    project: 150,
    projectName: 150,
    companyName: 150,
    depositStatus: 100,
    expectedDepositDate: 110,
    expectedDepositAmount: 120,
    depositDate: 110,
    depositAmount: 120,
    invoiceAttachment: 180,
    advanceBalance: 80,
    ratio: 80,
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

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/income-records?team=other_income&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('입금 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedRecords = data.data.map((r: any) => ({
          ...r,
          expectedDepositCurrency: r.expectedDepositCurrency || 'KRW',
          depositCurrency: r.depositCurrency || 'KRW',
        }));
        setRecords(formattedRecords);
      } else {
        setError(data.error || '입금 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('입금 목록 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 입금여부 계산 함수
  const getDepositStatus = useCallback((record: OtherIncome): '입금완료' | '입금예정' | '입금지연' => {
    if (record.depositStatus) {
      return record.depositStatus as '입금완료' | '입금예정' | '입금지연';
    }
    if (record.depositAmount && record.depositAmount > 0) {
      return '입금완료';
    }
    if (record.expectedDepositDate) {
      const expectedDate = new Date(record.expectedDepositDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expectedDate.setHours(0, 0, 0, 0);
      if (expectedDate >= today) {
        return '입금예정';
      }
      return '입금지연';
    }
    return '입금예정';
  }, []);

  const sortRecords = useCallback((recordsToSort: OtherIncome[]): OtherIncome[] => {
    if (!sortField) return recordsToSort;

    const sorted = [...recordsToSort].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (sortField === 'expectedDepositAmount' || sortField === 'depositAmount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (sortField === 'expectedDepositDate' || sortField === 'depositDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [sortField, sortDirection]);

  // 선/잔금 경고 체크 함수
  const checkAdvanceBalanceWarning = useCallback((record: OtherIncome, allRecords: OtherIncome[]): boolean => {
    const advanceBalance = record.advanceBalance;
    
    if (!advanceBalance) return false;
    
    if (advanceBalance === '선금' || advanceBalance.trim() === '선금') {
      const hasMatchingRemainder = allRecords.some(r => 
        r.id !== record.id &&
        r.category === record.category &&
        r.project === record.project &&
        r.projectName === record.projectName &&
        r.companyName === record.companyName &&
        (r.advanceBalance === '잔금' || r.advanceBalance?.trim() === '잔금')
      );
      return !hasMatchingRemainder;
    }
    
    if (advanceBalance === '잔금' || advanceBalance.trim() === '잔금') {
      const hasMatchingAdvance = allRecords.some(r => 
        r.id !== record.id &&
        r.category === record.category &&
        r.project === record.project &&
        r.projectName === record.projectName &&
        r.companyName === record.companyName &&
        (r.advanceBalance === '선금' || r.advanceBalance?.trim() === '선금')
      );
      return !hasMatchingAdvance;
    }
    
    return false;
  }, []);

  useEffect(() => {
    let filtered = records;

    // 일시불인 행 제외
    filtered = filtered.filter(record => {
      const advanceBalance = record.advanceBalance;
      if (!advanceBalance) return true;
      return advanceBalance !== '일시불' && advanceBalance.trim() !== '일시불';
    });

    // 선금과 잔금이 모두 있고 둘 다 입금완료인 경우 제외
    const nonLumpSumRecords = records.filter(r => {
      const ab = r.advanceBalance;
      if (!ab) return true;
      return ab !== '일시불' && ab.trim() !== '일시불';
    });
    
    filtered = filtered.filter(record => {
      const advanceBalance = record.advanceBalance;
      
      if (!advanceBalance) return true;
      
      const isAdvance = advanceBalance === '선금' || advanceBalance.trim() === '선금';
      const isRemainder = advanceBalance === '잔금' || advanceBalance.trim() === '잔금';
      
      if (!isAdvance && !isRemainder) return true;
      
      const currentStatus = getDepositStatus(record);
      
      if (currentStatus !== '입금완료') return true;
      
      const matchingRecords = nonLumpSumRecords.filter(r => 
        r.id !== record.id &&
        r.category === record.category &&
        r.project === record.project &&
        r.projectName === record.projectName &&
        r.companyName === record.companyName
      );
      
      if (isAdvance) {
        const hasRemainderCompleted = matchingRecords.some(r => {
          const rAdvanceBalance = r.advanceBalance;
          if (!rAdvanceBalance) return false;
          const isRemainderRecord = rAdvanceBalance === '잔금' || rAdvanceBalance.trim() === '잔금';
          if (!isRemainderRecord) return false;
          const rStatus = getDepositStatus(r);
          return rStatus === '입금완료';
        });
        
        return !hasRemainderCompleted;
      } else if (isRemainder) {
        const hasAdvanceCompleted = matchingRecords.some(r => {
          const rAdvanceBalance = r.advanceBalance;
          if (!rAdvanceBalance) return false;
          const isAdvanceRecord = rAdvanceBalance === '선금' || rAdvanceBalance.trim() === '선금';
          if (!isAdvanceRecord) return false;
          const rStatus = getDepositStatus(r);
          return rStatus === '입금완료';
        });
        
        return !hasAdvanceCompleted;
      }
      
      return true;
    });

    // 검색 필터링 (회사명, Project Name)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => {
        const companyName = record.companyName?.toLowerCase() || '';
        const projectName = record.projectName?.toLowerCase() || '';
        return companyName.includes(query) || projectName.includes(query);
      });
    }

    // 정렬 적용
    const sorted = sortRecords(filtered);
    setFilteredRecords(sorted);
  }, [searchQuery, records, sortField, sortDirection, sortRecords, getDepositStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && filteredRecords.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredRecords.length, currentPage]);

  // 그룹화 함수: 거래 유형, 프로젝트 유형, Project Name, 회사명 기준
  const groupRecords = useCallback((recordsToGroup: OtherIncome[]) => {
    const groups = new Map<string, OtherIncome[]>();
    
    recordsToGroup.forEach(record => {
      const groupKey = `${record.category || ''}|${record.project || ''}|${record.projectName || ''}|${record.companyName || ''}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    });
    
    return Array.from(groups.entries()).map(([key, records]) => ({
      key,
      records,
      category: records[0]?.category || '',
      project: records[0]?.project || '',
      projectName: records[0]?.projectName || '',
      companyName: records[0]?.companyName || '',
    }));
  }, []);

  const getCurrentPageRecords = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRecords.slice(start, end);
  };

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const currentPageRecords = getCurrentPageRecords();
  const groupedRecords = groupRecords(currentPageRecords);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline text-cyan-400" />
      : <ArrowDown className="h-4 w-4 ml-1 inline text-cyan-400" />;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-left text-gray-400">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-left text-red-400">{error}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="text"
              placeholder="검색 (회사명, Project Name)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          총 {filteredRecords.length}개 항목
        </div>

        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {groupedRecords.map((group, groupIndex) => {
            return (
              <div key={group.key} className="border border-purple-500/30 rounded-lg bg-slate-800/50 p-4">
                {/* 그룹 헤더 */}
                <div className="mb-3 pb-3 border-b border-purple-500/20">
                  <div className="flex flex-wrap gap-4 items-center text-sm">
                    {group.category && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">거래 유형:</span>
                        {(() => {
                          const category = group.category;
                          let bgColor = 'bg-purple-900/60';
                          let textColor = 'text-purple-200';
                          let borderColor = 'border-purple-500/70';
                          
                          if (category.includes('파트너십 - 서비스매출') || category.includes('용역사업 - 서비스매출')) {
                            bgColor = 'bg-blue-900/60';
                            textColor = 'text-blue-200';
                            borderColor = 'border-blue-500/70';
                          } else if (category.includes('파트너십 - 수출바우처') || category.includes('용역사업 - 수출바우처')) {
                            bgColor = 'bg-cyan-900/60';
                            textColor = 'text-cyan-200';
                            borderColor = 'border-cyan-500/70';
                          } else if (category === 'B2B') {
                            bgColor = 'bg-green-900/60';
                            textColor = 'text-green-200';
                            borderColor = 'border-green-500/70';
                          } else if (category.includes('재고') || category.includes('기재고')) {
                            bgColor = 'bg-orange-900/60';
                            textColor = 'text-orange-200';
                            borderColor = 'border-orange-500/70';
                          } else if (category === '배송비') {
                            bgColor = 'bg-yellow-900/60';
                            textColor = 'text-yellow-200';
                            borderColor = 'border-yellow-500/70';
                          } else if (category.includes('마케팅지원비')) {
                            bgColor = 'bg-pink-900/60';
                            textColor = 'text-pink-200';
                            borderColor = 'border-pink-500/70';
                          } else if (category === 'other') {
                            bgColor = 'bg-gray-700/60';
                            textColor = 'text-gray-300';
                            borderColor = 'border-gray-500/70';
                          }
                          
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`}>
                              {category}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {group.project && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">프로젝트 유형:</span>
                        <span className="text-gray-200 font-medium">{group.project}</span>
                      </div>
                    )}
                    {group.projectName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Project Name:</span>
                        <span className="text-gray-200 font-medium">{group.projectName}</span>
                      </div>
                    )}
                    {group.companyName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">회사명:</span>
                        <span className="text-gray-200 font-medium">{group.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-gray-400">({group.records.length}건)</span>
                    </div>
                  </div>
                </div>
                
                {/* 그룹 내 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <thead className="bg-slate-800/80">
                    <tr className="border-b border-purple-500/20">
                {visibleColumns.has('number') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.number}px`, minWidth: '50px' }}
                  >
                    번호
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('number', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('advanceBalance') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.advanceBalance}px`, minWidth: '50px' }}
                  >
                    선/잔금
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('advanceBalance', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('ratio') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.ratio}px`, minWidth: '50px' }}
                  >
                    비율
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('ratio', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('category') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.category}px`, minWidth: '50px' }}
                    onClick={() => handleSort('category')}
                  >
                    거래 유형 {getSortIcon('category')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('category', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('project') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.project}px`, minWidth: '50px' }}
                    onClick={() => handleSort('project')}
                  >
                    프로젝트 유형 {getSortIcon('project')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('project', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('projectName') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.projectName}px`, minWidth: '50px' }}
                    onClick={() => handleSort('projectName')}
                  >
                    Project Name {getSortIcon('projectName')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('projectName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('companyName') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.companyName}px`, minWidth: '50px' }}
                    onClick={() => handleSort('companyName')}
                  >
                    회사명 {getSortIcon('companyName')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('companyName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('depositStatus') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositStatus}px`, minWidth: '50px' }}
                  >
                    입금여부
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('depositStatus', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('expectedDepositDate') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.expectedDepositDate}px`, minWidth: '50px' }}
                    onClick={() => handleSort('expectedDepositDate')}
                  >
                    입금 예정일 {getSortIcon('expectedDepositDate')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('expectedDepositDate', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('expectedDepositAmount') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.expectedDepositAmount}px`, minWidth: '50px' }}
                    onClick={() => handleSort('expectedDepositAmount')}
                  >
                    예정금액 {getSortIcon('expectedDepositAmount')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('expectedDepositAmount', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('depositDate') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositDate}px`, minWidth: '50px' }}
                    onClick={() => handleSort('depositDate')}
                  >
                    입금일 {getSortIcon('depositDate')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('depositDate', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('depositAmount') && (
                  <th 
                    className="text-left p-2 text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositAmount}px`, minWidth: '50px' }}
                    onClick={() => handleSort('depositAmount')}
                  >
                    입금액 {getSortIcon('depositAmount')}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('depositAmount', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('invoiceAttachment') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.invoiceAttachment}px`, minWidth: '50px' }}
                  >
                    세금계산서 첨부
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('invoiceAttachment', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('description') && (
                  <th 
                    className="text-left p-2 text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.description}px`, minWidth: '50px' }}
                  >
                    적요
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50"
                      onMouseDown={(e) => handleResizeStart('description', e)}
                    />
                  </th>
                )}
                    </tr>
                  </thead>
                  <tbody>
                    {group.records.map((record, recordIndex) => {
                      const previousGroupsCount = groupedRecords.slice(0, groupIndex).reduce((sum, g) => sum + g.records.length, 0);
                      const actualIndex = previousGroupsCount + recordIndex + 1;
                      const depositStatus = getDepositStatus(record);
                  
                  return (
                    <tr key={record.id || recordIndex} className="border-b border-purple-500/20 hover:bg-white/5">
                      {visibleColumns.has('number') && (
                        <td className="p-2 text-xs text-gray-300" style={{ width: `${columnWidths.number}px` }}>{actualIndex}</td>
                      )}
                      {visibleColumns.has('advanceBalance') && (
                        <td className="p-2 text-xs whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.advanceBalance}px` }}>
                          {(() => {
                            const advanceBalance = record.advanceBalance || '-';
                            const hasWarning = checkAdvanceBalanceWarning(record, records);
                            
                            let warningMessage = '';
                            if (hasWarning) {
                              if (advanceBalance === '선금' || advanceBalance?.trim() === '선금') {
                                warningMessage = "'선금'은 있으나 '잔금' 행이 없습니다";
                              } else if (advanceBalance === '잔금' || advanceBalance?.trim() === '잔금') {
                                warningMessage = "'잔금'은 있으나 '선금' 행이 없습니다";
                              }
                            }
                            
                            return (
                              <span 
                                className={hasWarning ? 'text-red-400 font-semibold' : 'text-gray-300'}
                                title={hasWarning ? warningMessage : advanceBalance}
                              >
                                {advanceBalance}
                                {hasWarning && ' ⚠️'}
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      {visibleColumns.has('ratio') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.ratio}px` }} title={record.ratio ? `${record.ratio}%` : ''}>{record.ratio ? `${record.ratio}%` : '-'}</td>
                      )}
                      {visibleColumns.has('category') && (
                        <td className="p-2 text-xs" style={{ width: `${columnWidths.category}px` }}>
                          <div className="flex items-center gap-1">
                            {record.category ? (() => {
                              const category = record.category;
                              let bgColor = 'bg-purple-900/60';
                              let textColor = 'text-purple-200';
                              let borderColor = 'border-purple-500/70';
                              
                              if (category.includes('파트너십 - 서비스매출') || category.includes('용역사업 - 서비스매출')) {
                                bgColor = 'bg-blue-900/60';
                                textColor = 'text-blue-200';
                                borderColor = 'border-blue-500/70';
                              } else if (category.includes('파트너십 - 수출바우처') || category.includes('용역사업 - 수출바우처')) {
                                bgColor = 'bg-cyan-900/60';
                                textColor = 'text-cyan-200';
                                borderColor = 'border-cyan-500/70';
                              } else if (category === 'B2B') {
                                bgColor = 'bg-green-900/60';
                                textColor = 'text-green-200';
                                borderColor = 'border-green-500/70';
                              } else if (category.includes('재고') || category.includes('기재고')) {
                                bgColor = 'bg-orange-900/60';
                                textColor = 'text-orange-200';
                                borderColor = 'border-orange-500/70';
                              } else if (category === '배송비') {
                                bgColor = 'bg-yellow-900/60';
                                textColor = 'text-yellow-200';
                                borderColor = 'border-yellow-500/70';
                              } else if (category.includes('마케팅지원비')) {
                                bgColor = 'bg-pink-900/60';
                                textColor = 'text-pink-200';
                                borderColor = 'border-pink-500/70';
                              } else if (category === 'other') {
                                bgColor = 'bg-gray-700/60';
                                textColor = 'text-gray-300';
                                borderColor = 'border-gray-500/70';
                              }
                              
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`}>
                                  {category}
                                </span>
                              );
                            })() : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.has('project') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.project}px` }} title={record.project || ''}>{record.project || '-'}</td>
                      )}
                      {visibleColumns.has('projectName') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.projectName}px` }} title={record.projectName || ''}>{record.projectName || '-'}</td>
                      )}
                      {visibleColumns.has('companyName') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.companyName}px` }} title={record.companyName || ''}>{record.companyName || '-'}</td>
                      )}
                      {visibleColumns.has('depositStatus') && (
                        <td className="p-2 overflow-hidden" style={{ width: `${columnWidths.depositStatus}px` }}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            depositStatus === '입금완료' ? 'bg-green-500/20 text-green-300' :
                            depositStatus === '입금지연' ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {depositStatus}
                          </span>
                        </td>
                      )}
                      {visibleColumns.has('expectedDepositDate') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.expectedDepositDate}px` }} title={record.expectedDepositDate ? formatDate(record.expectedDepositDate) : ''}>{record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}</td>
                      )}
                      {visibleColumns.has('expectedDepositAmount') && (
                        <td className="p-2 text-xs text-gray-300 text-left whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.expectedDepositAmount}px` }} title={record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency || 'KRW') : ''}>
                          {record.expectedDepositAmount 
                            ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency || 'KRW')
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.has('depositDate') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.depositDate}px` }} title={record.depositDate ? formatDate(record.depositDate) : ''}>{record.depositDate ? formatDate(record.depositDate) : '-'}</td>
                      )}
                      {visibleColumns.has('depositAmount') && (
                        <td className="p-2 text-xs text-gray-300 text-left whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.depositAmount}px` }} title={record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency || 'KRW') : ''}>
                          {record.depositAmount 
                            ? formatCurrency(record.depositAmount, record.depositCurrency || 'KRW')
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.has('invoiceAttachment') && (
                        <td className="p-2 overflow-hidden" style={{ width: `${columnWidths.invoiceAttachment}px` }}>
                          {record.invoiceAttachmentStatus === 'completed' ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">첨부완료</span>
                          ) : record.invoiceAttachmentStatus === 'not_required' ? (
                            <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">첨부불요</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">첨부필요</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.has('description') && (
                        <td className="p-2 text-xs text-gray-300 whitespace-nowrap overflow-hidden" style={{ width: `${columnWidths.description}px` }} title={record.description || ''}>{record.description || '-'}</td>
                      )}
                    </tr>
                    );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            );
          })}
          
          {groupedRecords.length === 0 && (
            <div className="text-left p-8 text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

