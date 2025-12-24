'use client';

import { useEffect, useState, useCallback } from 'react';
import { GlobalMarketingTeam } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Plus, Upload, Edit2, Search, ArrowUp, ArrowDown, ArrowUpDown, Settings, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { GlobalMarketingFormModal } from './global-marketing-form-modal';
import { GlobalMarketingBulkModal } from './global-marketing-bulk-modal';
import { GlobalMarketingEditModal } from './global-marketing-edit-modal';
import { MultiSelect } from '@/components/ui/multi-select';

const ITEMS_PER_PAGE = 100;

type SortField = 'category' | 'vendorCode' | 'companyName' | 'brandName' | 'projectName' | 'expectedDepositDate' | 'expectedDepositAmount' | 'depositDate' | 'depositAmount' | null;
type SortDirection = 'asc' | 'desc';

interface GlobalMarketingListProps {
  onSuccess?: () => void;
}

export function GlobalMarketingList({ onSuccess }: GlobalMarketingListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [records, setRecords] = useState<GlobalMarketingTeam[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<GlobalMarketingTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GlobalMarketingTeam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumns, setSearchColumns] = useState<string[]>(['companyName', 'brandName']); // 기본값: 회사이름, 브랜드명
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  
  // 검색 가능한 컬럼 옵션
  const searchableColumns = [
    { value: 'companyName', label: '회사명' },
    { value: 'brandName', label: '브랜드명' },
    { value: 'vendorCode', label: '거래처코드' },
    { value: 'category', label: '거래 유형' },
    { value: 'project', label: '프로젝트 유형' },
    { value: 'projectName', label: 'Project Name' },
    { value: 'eoeoManager', label: '담당자' },
    { value: 'description', label: '적요' },
  ];
  
  // 모든 열 정의
  const allColumns = [
    { key: 'checkbox', label: '선택', alwaysVisible: true },
    { key: 'number', label: '번호', alwaysVisible: true },
    { key: 'category', label: '거래 유형', alwaysVisible: false },
    { key: 'projectCode', label: '프로젝트 유형 코드', alwaysVisible: false },
    { key: 'project', label: '프로젝트 유형', alwaysVisible: false },
    { key: 'projectName', label: 'Project Name', alwaysVisible: false },
    { key: 'vendorCode', label: '거래처코드', alwaysVisible: false },
    { key: 'companyName', label: '회사명', alwaysVisible: false },
    { key: 'brandName', label: '브랜드명', alwaysVisible: false },
    { key: 'expectedDepositDate', label: '입금예정일', alwaysVisible: false },
    { key: 'expectedDepositAmount', label: '예정금액', alwaysVisible: false },
    { key: 'depositDate', label: '입금일', alwaysVisible: false },
    { key: 'depositAmount', label: '입금액', alwaysVisible: false },
    { key: 'invoiceSupplyPrice', label: '세금계산서 발행 공급가', alwaysVisible: false },
    { key: 'oneTimeExpenseAmount', label: '실비금액(VAT제외)', alwaysVisible: false },
    { key: 'invoiceAttachment', label: '세금계산서 첨부', alwaysVisible: false },
    { key: 'businessRegistrationNumber', label: '사업자번호', alwaysVisible: false },
    { key: 'invoiceEmail', label: '이메일', alwaysVisible: false },
    { key: 'eoeoManager', label: '담당자', alwaysVisible: false },
    { key: 'contractLink', label: '계약서', alwaysVisible: false },
    { key: 'estimateLink', label: '견적서', alwaysVisible: false },
    { key: 'installmentNumber', label: '차수', alwaysVisible: false },
    { key: 'attributionYearMonth', label: '귀속년월', alwaysVisible: false },
    { key: 'advanceBalance', label: '선/잔금', alwaysVisible: false },
    { key: 'ratio', label: '비율', alwaysVisible: false },
    { key: 'count', label: '건수', alwaysVisible: false },
    { key: 'description', label: '적요', alwaysVisible: false },
    { key: 'createdDate', label: '작성일', alwaysVisible: false },
    { key: 'issueNotes', label: '이슈', alwaysVisible: false },
    { key: 'actions', label: '작업', alwaysVisible: true },
  ];
  
  // 선택된 열 관리 (프로젝트 유형 코드, 차수, 건수, 작성일은 기본적으로 숨김)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(allColumns.filter(col => 
      col.key !== 'projectCode' && 
      col.key !== 'installmentNumber' && 
      col.key !== 'count' && 
      col.key !== 'createdDate' &&
      col.key !== 'businessRegistrationNumber' &&
      col.key !== 'invoiceEmail'
    ).map(col => col.key))
  );

  // 열 너비 관리
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    number: 60,
    category: 120,
    projectCode: 150,
    project: 150,
    projectName: 150,
    vendorCode: 100,
    companyName: 150,
    brandName: 120,
    expectedDepositDate: 110,
    expectedDepositAmount: 120,
    oneTimeExpenseAmount: 120,
    depositDate: 110,
    depositAmount: 120,
    invoiceSupplyPrice: 150,
    invoiceAttachment: 180,
    businessRegistrationNumber: 120,
    invoiceEmail: 180,
    eoeoManager: 100,
    contractLink: 120,
    estimateLink: 120,
    installmentNumber: 60,
    attributionYearMonth: 100,
    advanceBalance: 80,
    ratio: 80,
    count: 60,
    description: 200,
    createdDate: 110,
    issueNotes: 200,
    actions: 100,
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
      const response = await fetch('/api/income-records?team=global_marketing');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.error || '입금 목록을 불러오는데 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (data.success) {
        // 통합 API는 이미 camelCase로 변환된 데이터를 반환
        const formattedRecords = data.data.map((r: any) => ({
          ...r,
          expectedDepositCurrency: r.expectedDepositCurrency || 'KRW',
          depositCurrency: r.depositCurrency || 'KRW',
          hasWarning: !r.vendorCode || !r.category || !r.projectCode,
        }));
        // records만 업데이트하면 useEffect가 자동으로 필터링을 다시 실행합니다
        // 검색어와 필터 상태는 유지됩니다
        setRecords(formattedRecords);
      }
    } catch (err) {
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
    // 페이지 리셋은 useEffect에서 처리
  };

  const sortRecords = useCallback((recordsToSort: GlobalMarketingTeam[]): GlobalMarketingTeam[] => {
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

  useEffect(() => {
    let filtered = records;

    if (searchQuery.trim() !== '' && searchColumns.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = records.filter(record => {
        return searchColumns.some(column => {
          // brandNames 배열 처리
          if (column === 'brandName' && Array.isArray((record as any).brandNames)) {
            return (record as any).brandNames.some((brand: string) => 
              brand?.toLowerCase().includes(query)
            );
          }
          
          // project/projectCategory 복수 처리
          if (column === 'project' || column === 'projectName') {
            const categories = [
              (record as any).projectCategory,
              (record as any).projectCategory2,
              (record as any).projectCategory3,
            ].filter((cat): cat is string => !!cat);
            
            return categories.some((cat: string) => 
              cat?.toLowerCase().includes(query)
            );
          }
          
          const value = (record as any)[column];
          if (value === null || value === undefined) return false;
          
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    const sorted = sortRecords(filtered);
    setFilteredRecords(sorted);
  }, [searchQuery, searchColumns, records, sortField, sortDirection, sortRecords]);

  // 검색/정렬 변경 시에만 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchColumns, sortField, sortDirection]);

  // 필터링된 결과가 변경되면 현재 페이지가 유효한 범위 내에 있는지 확인
  useEffect(() => {
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && filteredRecords.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredRecords.length, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageRecords = getCurrentPageRecords();
      setSelectedIds(new Set(currentPageRecords.map(r => r.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 입금 정보를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // 여러 ID를 개별적으로 삭제
      const deletePromises = ids.map(id => 
        fetch(`/api/income-records/${id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error('일부 항목 삭제에 실패했습니다.');
      }

      await fetchRecords();
      setSelectedIds(new Set());
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    fetchRecords();
    setIsModalOpen(false);
    if (onSuccess) onSuccess();
  };

  const handleBulkModalSuccess = () => {
    fetchRecords();
    setIsBulkModalOpen(false);
    if (onSuccess) onSuccess();
  };

  const handleEdit = (record: GlobalMarketingTeam) => {
    setEditingRecord(record);
  };

  const handleEditSuccess = () => {
    fetchRecords();
    setEditingRecord(null);
    if (onSuccess) onSuccess();
  };

  const handleDownloadCSV = () => {
    // CSV 헤더 생성 (표시된 열만)
    const visibleColumnKeys = Array.from(visibleColumns).filter(key => 
      key !== 'checkbox' && key !== 'actions' && key !== 'number'
    );
    
    const headers = visibleColumnKeys.map(key => {
      const column = allColumns.find(col => col.key === key);
      return column ? column.label : key;
    });

    // CSV 데이터 생성
    const csvRows: string[] = [];
    
    // 헤더 추가
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // 데이터 행 추가
    filteredRecords.forEach((record) => {
      const row: string[] = [];
      
      visibleColumnKeys.forEach(key => {
        let value: any = (record as any)[key];
        
        // 특수 케이스 처리
        if (key === 'brandName') {
          // 브랜드명 배열 처리
          if (Array.isArray((record as any).brandNames)) {
            value = (record as any).brandNames.join(', ');
          } else if (value) {
            value = String(value);
          } else {
            value = '';
          }
        } else if (key === 'project' || key === 'projectName') {
          // 프로젝트 카테고리 복수 처리
          const categories = [
            (record as any).projectCategory,
            (record as any).projectCategory2,
            (record as any).projectCategory3,
          ].filter((cat): cat is string => !!cat);
          
          value = categories.length > 0 ? categories.join(', ') : '';
        } else if (key === 'expectedDepositAmount' || key === 'depositAmount') {
          // 금액 포맷팅
          if (value != null) {
            const currency = key === 'expectedDepositAmount' 
              ? (record as any).expectedDepositCurrency || 'KRW'
              : (record as any).depositCurrency || 'KRW';
            value = formatCurrency(Number(value), currency);
          } else {
            value = '';
          }
        } else if (key === 'expectedDepositDate' || key === 'depositDate' || key === 'createdDate') {
          // 날짜 포맷팅
          value = value ? formatDate(value) : '';
        } else {
          // 일반 필드
          if (value == null) {
            value = '';
          } else {
            value = String(value);
          }
        }

        // CSV 이스케이프 처리 (쉼표, 따옴표, 줄바꿈 포함 시 따옴표로 감싸기)
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          row.push(`"${stringValue.replace(/"/g, '""')}"`);
        } else {
          row.push(stringValue);
        }
      });
      
      csvRows.push(row.join(','));
    });

    // CSV 파일 생성 및 다운로드
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM 추가로 한글 깨짐 방지
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `글로벌마케팅솔루션팀_입금목록_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCurrentPageRecords = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRecords.slice(start, end);
  };

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const currentPageRecords = getCurrentPageRecords();
  const allSelected = currentPageRecords.length > 0 && currentPageRecords.every(r => selectedIds.has(r.id!));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">입금 목록을 불러오는 중...</span>
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
        <Button onClick={fetchRecords} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">입금 목록 ({filteredRecords.length}개)</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} 
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                열 선택
              </Button>
              {isColumnSelectorOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[250px] max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">표시할 열 선택</h4>
                    <button
                      onClick={() => {
                        setVisibleColumns(new Set(allColumns.map(col => col.key)));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      모두 선택
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    {allColumns.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.key)}
                          onChange={(e) => {
                            if (column.alwaysVisible) return;
                            const newVisible = new Set(visibleColumns);
                            if (e.target.checked) {
                              newVisible.add(column.key);
                            } else {
                              newVisible.delete(column.key);
                            }
                            setVisibleColumns(newVisible);
                          }}
                          disabled={column.alwaysVisible}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{column.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end pt-3 border-t">
                    <Button
                      onClick={() => setIsColumnSelectorOpen(false)}
                      size="sm"
                      className="px-4"
                    >
                      확인
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              데이터 추가
            </Button>
            <Button onClick={() => setIsBulkModalOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              일괄 추가
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-64">
              <label className="block text-xs text-gray-600 mb-1">검색 컬럼</label>
              <MultiSelect
                value={searchColumns}
                onChange={setSearchColumns}
                options={searchableColumns}
                placeholder="검색할 컬럼 선택"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              선택 삭제
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b">
                {visibleColumns.has('checkbox') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 relative"
                    style={{ width: `${columnWidths.checkbox}px`, minWidth: '50px' }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('checkbox', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('number') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.number}px`, minWidth: '50px' }}
                  >
                    번호
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('number', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('category') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.category}px`, minWidth: '50px' }}
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      <span>거래 유형</span>
                      <span className="text-xs text-yellow-600" title="필수 항목 누락 경고">⚠️</span>
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('category', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('projectCode') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.projectCode}px`, minWidth: '50px' }}
                  >
                    프로젝트 유형 코드
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('projectCode', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('project') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.project}px`, minWidth: '50px' }}
                    onClick={() => handleSort('projectName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>프로젝트 유형</span>
                      {sortField === 'projectName' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('project', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('projectName') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.projectName}px`, minWidth: '50px' }}
                  >
                    Project Name
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('projectName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('vendorCode') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.vendorCode}px`, minWidth: '50px' }}
                    onClick={() => handleSort('vendorCode')}
                  >
                    <div className="flex items-center gap-1">
                      <span>거래처코드</span>
                      {sortField === 'vendorCode' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('vendorCode', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('companyName') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.companyName}px`, minWidth: '50px' }}
                    onClick={() => handleSort('companyName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>회사명</span>
                      {sortField === 'companyName' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('companyName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('brandName') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.brandName}px`, minWidth: '50px' }}
                    onClick={() => handleSort('brandName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>브랜드명</span>
                      {sortField === 'brandName' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('brandName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('expectedDepositDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.expectedDepositDate}px`, minWidth: '50px' }}
                    onClick={() => handleSort('expectedDepositDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>입금예정일</span>
                      {sortField === 'expectedDepositDate' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('expectedDepositDate', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('expectedDepositAmount') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.expectedDepositAmount}px`, minWidth: '50px' }}
                    onClick={() => handleSort('expectedDepositAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>예정금액</span>
                      {sortField === 'expectedDepositAmount' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('expectedDepositAmount', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('depositDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositDate}px`, minWidth: '50px' }}
                    onClick={() => handleSort('depositDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>입금일</span>
                      {sortField === 'depositDate' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('depositDate', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('depositAmount') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositAmount}px`, minWidth: '50px' }}
                    onClick={() => handleSort('depositAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>입금액</span>
                      {sortField === 'depositAmount' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('depositAmount', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('invoiceSupplyPrice') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.invoiceSupplyPrice}px`, minWidth: '50px' }}
                  >
                    세금계산서 발행 공급가
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('invoiceSupplyPrice', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('oneTimeExpenseAmount') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.oneTimeExpenseAmount}px`, minWidth: '50px' }}
                  >
                    실비금액(VAT제외)
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('oneTimeExpenseAmount', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('invoiceAttachment') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.invoiceAttachment}px`, minWidth: '50px' }}
                  >
                    세금계산서 첨부
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('invoiceAttachment', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('businessRegistrationNumber') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.businessRegistrationNumber}px`, minWidth: '50px' }}
                  >
                    사업자번호
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('businessRegistrationNumber', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('invoiceEmail') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.invoiceEmail}px`, minWidth: '50px' }}
                  >
                    이메일
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('invoiceEmail', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('eoeoManager') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.eoeoManager}px`, minWidth: '50px' }}
                  >
                    담당자
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('eoeoManager', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('contractLink') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.contractLink}px`, minWidth: '50px' }}
                  >
                    계약서
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('contractLink', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('estimateLink') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.estimateLink}px`, minWidth: '50px' }}
                  >
                    견적서
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('estimateLink', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('installmentNumber') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.installmentNumber}px`, minWidth: '50px' }}
                  >
                    차수
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('installmentNumber', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('attributionYearMonth') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.attributionYearMonth}px`, minWidth: '50px' }}
                  >
                    귀속년월
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('attributionYearMonth', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('advanceBalance') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.advanceBalance}px`, minWidth: '50px' }}
                  >
                    선/잔금
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('advanceBalance', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('ratio') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.ratio}px`, minWidth: '50px' }}
                  >
                    비율
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('ratio', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('count') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.count}px`, minWidth: '50px' }}
                  >
                    건수
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('count', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('description') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.description}px`, minWidth: '50px' }}
                  >
                    적요
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('description', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('createdDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.createdDate}px`, minWidth: '50px' }}
                  >
                    작성일
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('createdDate', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('issueNotes') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.issueNotes}px`, minWidth: '50px' }}
                  >
                    이슈
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('issueNotes', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('actions') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.actions}px`, minWidth: '50px' }}
                  >
                    작업
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                      onMouseDown={(e) => handleResizeStart('actions', e)}
                    />
                  </th>
                )}
              </tr>
            </thead>
          <tbody>
            {currentPageRecords.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.size} className="p-8 text-center text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다.' : '등록된 입금 정보가 없습니다.'}
                </td>
              </tr>
            ) : (
              currentPageRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`border-b hover:bg-gray-50 ${(record as any).hasWarning ? 'bg-yellow-50' : ''}`}
                >
                  {visibleColumns.has('checkbox') && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id!)}
                        onChange={(e) => handleSelectOne(record.id!, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {visibleColumns.has('number') && (
                    <td className="p-2 text-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                  )}
                  {visibleColumns.has('category') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.category || ''}>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate">{record.category || '-'}</span>
                        {(record as any).hasWarning && (
                          <span className="text-xs text-yellow-600 font-medium flex-shrink-0" title="필수 항목 누락">⚠️</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('projectCode') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.projectCode || ''}>{record.projectCode || '-'}</td>
                  )}
                  {visibleColumns.has('project') && (
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        {[
                          (record as any).projectCategory,
                          (record as any).projectCategory2,
                          (record as any).projectCategory3,
                        ]
                          .filter((category): category is string => !!category)
                          .map((category, idx) => (
                            <div
                              key={idx}
                              className="whitespace-nowrap truncate overflow-hidden"
                              title={category}
                            >
                              {category}
                            </div>
                          ))}
                        {[
                          (record as any).projectCategory,
                          (record as any).projectCategory2,
                          (record as any).projectCategory3,
                        ].every((category) => !category) && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('projectName') && (
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      {[
                        record.projectName,
                        record.projectName2,
                        record.projectName3,
                        record.projectName4,
                        record.projectName5,
                        record.projectName6,
                        record.projectName7,
                        record.projectName8,
                        record.projectName9,
                        record.projectName10,
                      ]
                        .filter((name): name is string => !!name)
                        .map((name, idx) => (
                          <div
                            key={idx}
                            className="whitespace-nowrap truncate overflow-hidden"
                            title={name}
                          >
                            {name}
                          </div>
                        ))}
                      {[
                        record.projectName,
                        record.projectName2,
                        record.projectName3,
                        record.projectName4,
                        record.projectName5,
                        record.projectName6,
                        record.projectName7,
                        record.projectName8,
                        record.projectName9,
                        record.projectName10,
                      ].every((name) => !name) && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  )}
                  {visibleColumns.has('vendorCode') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.vendorCode || ''}>{record.vendorCode || '-'}</td>
                  )}
                  {visibleColumns.has('companyName') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.companyName || ''}>{record.companyName || '-'}</td>
                  )}
                  {visibleColumns.has('brandName') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.brandName || ''}>{record.brandName || '-'}</td>
                  )}
                  {visibleColumns.has('expectedDepositDate') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.expectedDepositDate ? formatDate(record.expectedDepositDate) : ''}>{record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}</td>
                  )}
                  {visibleColumns.has('expectedDepositAmount') && (
                    <td className="p-2 text-right whitespace-nowrap truncate overflow-hidden" title={record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency) : ''}>{record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount, record.expectedDepositCurrency) : '-'}</td>
                  )}
                  {visibleColumns.has('depositDate') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.depositDate ? formatDate(record.depositDate) : ''}>{record.depositDate ? formatDate(record.depositDate) : '-'}</td>
                  )}
                  {visibleColumns.has('depositAmount') && (
                    <td className="p-2 text-right font-medium whitespace-nowrap truncate overflow-hidden" title={record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency) : ''}>{record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency) : '-'}</td>
                  )}
                  {visibleColumns.has('invoiceSupplyPrice') && (
                    <td className="p-2 text-right whitespace-nowrap truncate overflow-hidden" title={record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice, 'KRW') : ''}>{record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice, 'KRW') : '-'}</td>
                  )}
                  {visibleColumns.has('oneTimeExpenseAmount') && (
                    <td className="p-2 text-right whitespace-nowrap truncate overflow-hidden" title={record.oneTimeExpenseAmount ? formatCurrency(record.oneTimeExpenseAmount) : ''}>{record.oneTimeExpenseAmount ? formatCurrency(record.oneTimeExpenseAmount) : '-'}</td>
                  )}
                  {visibleColumns.has('invoiceAttachment') && (
                    <td className="p-2 whitespace-nowrap">
                      {(() => {
                        // invoiceCopy가 있으면 "첨부완료" (클릭하면 파일 열기)
                        if (record.invoiceCopy) {
                          return (
                            <a 
                              href={record.invoiceCopy} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 font-medium hover:underline cursor-pointer"
                              title={record.invoiceCopy}
                            >
                              첨부완료
                            </a>
                          );
                        }
                        
                        // invoiceAttachmentStatus에 따라 상태 표시
                        const currentStatus = record.invoiceAttachmentStatus || 'required';
                        
                        if (currentStatus === 'not_required') {
                          return (
                            <span className="text-green-600">첨부불요</span>
                          );
                        }
                        
                        return (
                          <span className="text-red-600">첨부필요</span>
                        );
                      })()}
                    </td>
                  )}
                  {visibleColumns.has('businessRegistrationNumber') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.businessRegistrationNumber || ''}>{record.businessRegistrationNumber || '-'}</td>
                  )}
                  {visibleColumns.has('invoiceEmail') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.invoiceEmail || ''}>{record.invoiceEmail || '-'}</td>
                  )}
                  {visibleColumns.has('eoeoManager') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.eoeoManager || ''}>{record.eoeoManager || '-'}</td>
                  )}
                  {visibleColumns.has('contractLink') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden">
                      {record.contractLink ? (
                        <a 
                          href={record.contractLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline truncate block"
                          title={record.contractLink}
                        >
                          링크
                        </a>
                      ) : '-'}
                    </td>
                  )}
                  {visibleColumns.has('estimateLink') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden">
                      {record.estimateLink ? (
                        <a 
                          href={record.estimateLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline truncate block"
                          title={record.estimateLink}
                        >
                          링크
                        </a>
                      ) : '-'}
                    </td>
                  )}
                  {visibleColumns.has('installmentNumber') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.installmentNumber ? String(record.installmentNumber) : ''}>{record.installmentNumber || '-'}</td>
                  )}
                  {visibleColumns.has('attributionYearMonth') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.attributionYearMonth || ''}>{record.attributionYearMonth || '-'}</td>
                  )}
                  {visibleColumns.has('advanceBalance') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.advanceBalance || ''}>{record.advanceBalance || '-'}</td>
                  )}
                  {visibleColumns.has('ratio') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.ratio ? String(record.ratio) : ''}>{record.ratio || '-'}</td>
                  )}
                  {visibleColumns.has('count') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.count ? String(record.count) : ''}>{record.count || '-'}</td>
                  )}
                  {visibleColumns.has('description') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.description || ''}>{record.description || '-'}</td>
                  )}
                  {visibleColumns.has('createdDate') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.createdDate ? formatDate(record.createdDate) : ''}>{record.createdDate ? formatDate(record.createdDate) : '-'}</td>
                  )}
                  {visibleColumns.has('issueNotes') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.issueNotes || ''}>{record.issueNotes || '-'}</td>
                  )}
                  {visibleColumns.has('actions') && (
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete([record.id!])}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      </div>

      <GlobalMarketingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <GlobalMarketingBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkModalSuccess}
      />
      {editingRecord && (
        <GlobalMarketingEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

