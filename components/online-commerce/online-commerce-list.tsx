'use client';

import { useEffect, useState, useCallback } from 'react';
import { OnlineCommerceTeam } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Plus, Upload, Edit2, Search, ArrowUp, ArrowDown, ArrowUpDown, Settings, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OnlineCommerceFormModal } from './online-commerce-form-modal';
import { OnlineCommerceBulkModal } from './online-commerce-bulk-modal';
import { OnlineCommerceEditModal } from './online-commerce-edit-modal';
import { MultiSelect } from '@/components/ui/multi-select';

const ITEMS_PER_PAGE = 100;

type SortField = 'category' | 'vendorCode' | 'companyName' | 'brandName' | 'project' | 'projectName' | 'projectCode' | 'expectedDepositDate' | 'expectedDepositAmount' | 'depositDate' | 'depositAmount' | null;
type SortDirection = 'asc' | 'desc';

interface OnlineCommerceListProps {
  onSuccess?: () => void;
}

export function OnlineCommerceList({ onSuccess }: OnlineCommerceListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [records, setRecords] = useState<OnlineCommerceTeam[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OnlineCommerceTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OnlineCommerceTeam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumns, setSearchColumns] = useState<string[]>(['companyName', 'brandName']); // 기본값: 회사이름, 브랜드명
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [depositStatusFilter, setDepositStatusFilter] = useState<'입금완료' | '입금예정' | '입금지연' | null>(null);
  
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
    { key: 'depositStatus', label: '입금여부', alwaysVisible: false },
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
    depositStatus: 100,
    expectedDepositDate: 110,
    expectedDepositAmount: 120,
    depositDate: 110,
    depositAmount: 120,
    invoiceSupplyPrice: 150,
    oneTimeExpenseAmount: 150,
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
      // 캐시를 무시하고 최신 데이터를 가져오기 위해 timestamp 추가
      const response = await fetch(`/api/income-records?team=online_commerce&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('입금 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        // 통합 API는 이미 camelCase로 변환된 데이터를 반환
        const formattedRecords = data.data.map((r: any) => ({
          ...r,
          expectedDepositCurrency: r.expectedDepositCurrency || 'KRW',
          depositCurrency: r.depositCurrency || 'KRW',
          // 필수 필드 검증 플래그
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
      // 같은 필드를 클릭하면 정렬 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 오름차순으로 시작
      setSortField(field);
      setSortDirection('asc');
    }
    // 페이지 리셋은 useEffect에서 처리
  };

  // 입금여부 계산 함수
  const getDepositStatus = useCallback((record: OnlineCommerceTeam): '입금완료' | '입금예정' | '입금지연' => {
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

  const sortRecords = useCallback((recordsToSort: OnlineCommerceTeam[]): OnlineCommerceTeam[] => {
    if (!sortField) return recordsToSort;

    const sorted = [...recordsToSort].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // null/undefined 처리
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // 숫자 필드 처리
      if (sortField === 'expectedDepositAmount' || sortField === 'depositAmount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 날짜 필드 처리
      if (sortField === 'expectedDepositDate' || sortField === 'depositDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 문자열 필드 처리
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

    // 입금여부 필터 적용
    if (depositStatusFilter) {
      filtered = filtered.filter(record => {
        const status = getDepositStatus(record);
        return status === depositStatusFilter;
      });
    }

    // 검색 필터링
    if (searchQuery.trim() !== '' && searchColumns.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => {
        return searchColumns.some(column => {
          const value = (record as any)[column];
          if (value === null || value === undefined) return false;
          
          // brandNames 배열 처리
          if (column === 'brandName' && Array.isArray((record as any).brandNames)) {
            return (record as any).brandNames.some((brand: string) => 
              brand?.toLowerCase().includes(query)
            );
          }
          
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // 정렬 적용
    const sorted = sortRecords(filtered);
    setFilteredRecords(sorted);
  }, [searchQuery, searchColumns, records, sortField, sortDirection, sortRecords, depositStatusFilter, getDepositStatus]);

  // 검색/정렬/필터 변경 시에만 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchColumns, sortField, sortDirection, depositStatusFilter]);

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

  const handleEdit = (record: OnlineCommerceTeam) => {
    if (!record.id) {
      alert('레코드 ID가 없습니다. 페이지를 새로고침하고 다시 시도해주세요.');
      console.error('레코드에 ID가 없습니다:', record);
      return;
    }
    console.log('수정할 레코드:', record);
    setEditingRecord(record);
  };

  const handleEditSuccess = () => {
    fetchRecords();
    setEditingRecord(null);
    if (onSuccess) onSuccess();
  };

  const handleInvoiceAttachmentStatusChange = async (recordId: string, status: 'required' | 'completed' | 'not_required') => {
    try {
      const response = await fetch(`/api/income-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceAttachmentStatus: status,
        }),
      });

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setRecords(prevRecords => 
        prevRecords.map(r => 
          r.id === recordId 
            ? { ...r, invoiceAttachmentStatus: status }
            : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 업데이트 중 오류가 발생했습니다.');
    }
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
    filteredRecords.forEach((record, index) => {
      const row: string[] = [];
      
      visibleColumnKeys.forEach(key => {
        let value: any = (record as any)[key];
        
        // 특수 케이스 처리
        if (key === 'brandName') {
          // 브랜드명 배열 처리
          if (Array.isArray((record as any).brandNames)) {
            value = (record as any).brandNames.join('\n');
          } else if (value) {
            value = String(value);
          } else {
            value = '';
          }
        } else if (key === 'expectedDepositAmount' || key === 'depositAmount' || key === 'oneTimeExpenseAmount' || key === 'invoiceSupplyPrice') {
          // 금액 포맷팅
          if (value != null) {
            const currency = key === 'expectedDepositAmount' 
              ? (record as any).expectedDepositCurrency || 'KRW'
              : key === 'depositAmount'
              ? (record as any).depositCurrency || 'KRW'
              : 'KRW';
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
    link.download = `온라인커머스팀_입금목록_${new Date().toISOString().split('T')[0]}.csv`;
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

  // 입금여부별 카운트 계산
  const depositStatusCounts = {
    입금완료: records.filter(r => getDepositStatus(r) === '입금완료').length,
    입금예정: records.filter(r => getDepositStatus(r) === '입금예정').length,
    입금지연: records.filter(r => getDepositStatus(r) === '입금지연').length,
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-2 text-gray-300">입금 목록을 불러오는 중...</span>
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
        <Button onClick={fetchRecords} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-200">입금 목록 ({filteredRecords.length}개)</h3>
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
                <div className="absolute right-0 top-full mt-2 bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-lg shadow-lg z-50 p-4 min-w-[250px] max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-gray-200">표시할 열 선택</h4>
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
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-1 rounded"
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
          
          {/* 입금여부 필터 버튼 */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-gray-400">입금여부:</span>
            <button
              onClick={() => setDepositStatusFilter(depositStatusFilter === '입금완료' ? null : '입금완료')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                depositStatusFilter === '입금완료'
                  ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                  : 'bg-green-500/10 text-green-400/70 border border-green-500/20 hover:bg-green-500/20'
              }`}
            >
              입금완료 {depositStatusCounts.입금완료}개
            </button>
            <button
              onClick={() => setDepositStatusFilter(depositStatusFilter === '입금예정' ? null : '입금예정')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                depositStatusFilter === '입금예정'
                  ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                  : 'bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20 hover:bg-yellow-500/20'
              }`}
            >
              입금예정 {depositStatusCounts.입금예정}개
            </button>
            <button
              onClick={() => setDepositStatusFilter(depositStatusFilter === '입금지연' ? null : '입금지연')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                depositStatusFilter === '입금지연'
                  ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                  : 'bg-red-500/10 text-red-400/70 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              입금지연 {depositStatusCounts.입금지연}개
            </button>
            {depositStatusFilter && (
              <button
                onClick={() => setDepositStatusFilter(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-purple-500/20 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-gray-200 placeholder-gray-500 backdrop-blur-sm"
              />
            </div>
            <div className="w-64">
              <label className="block text-xs text-gray-300 mb-1">검색 컬럼</label>
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
        <div className="p-4 bg-cyan-500/20 border-b border-purple-500/20 flex items-center justify-between">
          <span className="text-sm font-medium text-cyan-300">
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
            <thead className="bg-slate-800 sticky top-0 z-10">
              <tr className="border-b border-purple-500/20">
                {visibleColumns.has('checkbox') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 relative"
                    style={{ width: `${columnWidths.checkbox}px`, minWidth: '50px' }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                      onMouseDown={(e) => handleResizeStart('checkbox', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('number') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
                    style={{ width: `${columnWidths.number}px`, minWidth: '50px' }}
                  >
                    번호
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                      onMouseDown={(e) => handleResizeStart('number', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('category') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.projectCode}px`, minWidth: '50px' }}
                    onClick={() => handleSort('projectCode')}
                  >
                    <div className="flex items-center gap-1">
                      <span>프로젝트 유형 코드</span>
                      {sortField === 'projectCode' ? (
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
                      onMouseDown={(e) => handleResizeStart('projectCode', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('project') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.project}px`, minWidth: '50px' }}
                    onClick={() => handleSort('project')}
                  >
                    <div className="flex items-center gap-1">
                      <span>프로젝트 유형</span>
                      {sortField === 'project' ? (
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
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.projectName}px`, minWidth: '50px' }}
                    onClick={() => handleSort('projectName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Project Name</span>
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
                      onMouseDown={(e) => handleResizeStart('projectName', e)}
                    />
                  </th>
                )}
                {visibleColumns.has('vendorCode') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                {visibleColumns.has('depositStatus') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
                    style={{ width: `${columnWidths.depositStatus}px`, minWidth: '50px' }}
                  >
                  <div className="flex items-center gap-1">
                    <span>입금여부</span>
                  </div>
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('depositStatus', e)}
                  />
                  </th>
                )}
                {visibleColumns.has('expectedDepositDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-right p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-right p-2 font-medium text-gray-200 cursor-pointer hover:bg-white/10 select-none whitespace-nowrap relative"
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
                    className="text-right p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-right p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                    className="text-left p-2 font-medium text-gray-200 whitespace-nowrap relative"
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
                <td colSpan={visibleColumns.size} className="p-8 text-center text-gray-400">
                  {searchQuery ? '검색 결과가 없습니다.' : '등록된 입금 정보가 없습니다.'}
                </td>
              </tr>
            ) : (
              currentPageRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`border-b border-purple-500/10 hover:bg-white/5 ${(record as any).hasWarning ? 'bg-yellow-500/10' : ''}`}
                >
                  {visibleColumns.has('checkbox') && (
                    <td className="p-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id!)}
                        onChange={(e) => handleSelectOne(record.id!, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {visibleColumns.has('number') && (
                    <td className="p-2 text-xs text-gray-300">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                  )}
                  {visibleColumns.has('category') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.category || ''}>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate">{record.category || '-'}</span>
                        {(record as any).hasWarning && (
                          <span className="text-xs text-yellow-600 font-medium flex-shrink-0" title="필수 항목 누락">⚠️</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('projectCode') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.projectCode || ''}>{record.projectCode || '-'}</td>
                  )}
                  {visibleColumns.has('project') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.project || ''}>{record.project || '-'}</td>
                  )}
                  {visibleColumns.has('projectName') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.projectName || ''}>{record.projectName || '-'}</td>
                  )}
                  {visibleColumns.has('vendorCode') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.vendorCode || ''}>{record.vendorCode || '-'}</td>
                  )}
                  {visibleColumns.has('companyName') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.companyName || ''}>{record.companyName || '-'}</td>
                  )}
                  {visibleColumns.has('brandName') && (
                    <td className="p-2 text-[13px] whitespace-pre-line" title={Array.isArray(record.brandNames) && record.brandNames.length > 0 ? record.brandNames.join('\n') : (record.brandName || '')}>
                      {Array.isArray(record.brandNames) && record.brandNames.length > 0 ? record.brandNames.join('\n') : (record.brandName || '-')}
                    </td>
                  )}
                  {visibleColumns.has('depositStatus') && (
                    <td className="p-2 text-[13px] whitespace-nowrap">
                      {(() => {
                        let status: string;
                        // DB에서 가져온 depositStatus가 있으면 사용
                        if (record.depositStatus) {
                          status = record.depositStatus;
                        } else if (record.depositAmount && record.depositAmount > 0) {
                          // 입금액이 있으면 '입금완료'
                          status = '입금완료';
                        } else if (record.expectedDepositDate) {
                          // 입금액이 없고 입금예정일이 있으면
                          const expectedDate = new Date(record.expectedDepositDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          expectedDate.setHours(0, 0, 0, 0);
                          // 입금예정일이 오늘 이후면 '입금예정'
                          if (expectedDate >= today) {
                            status = '입금예정';
                          } else {
                            // 입금예정일이 오늘 이전이면 '입금지연'
                            status = '입금지연';
                          }
                        } else {
                          // 둘 다 없으면 '입금예정'
                          status = '입금예정';
                        }
                        
                        // 색상 클래스 결정
                        let bgColor = '';
                        let textColor = '';
                        if (status === '입금완료') {
                          bgColor = 'bg-green-500/20';
                          textColor = 'text-green-400';
                        } else if (status === '입금예정') {
                          bgColor = 'bg-yellow-500/20';
                          textColor = 'text-yellow-400';
                        } else if (status === '입금지연') {
                          bgColor = 'bg-red-500/20';
                          textColor = 'text-red-400';
                        }
                        
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor} border ${status === '입금완료' ? 'border-green-500/30' : status === '입금예정' ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  {visibleColumns.has('expectedDepositDate') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.expectedDepositDate ? formatDate(record.expectedDepositDate) : ''}>{record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}</td>
                  )}
                  {visibleColumns.has('expectedDepositAmount') && (
                    <td className="p-2 text-[13px] text-right whitespace-nowrap truncate overflow-hidden" title={record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount) : ''}>{record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount) : '-'}</td>
                  )}
                  {visibleColumns.has('depositDate') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.depositDate ? formatDate(record.depositDate) : ''}>{record.depositDate ? formatDate(record.depositDate) : '-'}</td>
                  )}
                  {visibleColumns.has('depositAmount') && (
                    <td className="p-2 text-[13px] text-right font-medium whitespace-nowrap truncate overflow-hidden" title={record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency) : ''}>{record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency) : '-'}</td>
                  )}
                  {visibleColumns.has('invoiceSupplyPrice') && (
                    <td className="p-2 text-[13px] text-right whitespace-nowrap truncate overflow-hidden" title={record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice, 'KRW') : ''}>{record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice, 'KRW') : '-'}</td>
                  )}
                  {visibleColumns.has('oneTimeExpenseAmount') && (
                    <td className="p-2 text-[13px] text-right whitespace-nowrap truncate overflow-hidden" title={record.oneTimeExpenseAmount ? formatCurrency(record.oneTimeExpenseAmount) : ''}>{record.oneTimeExpenseAmount ? formatCurrency(record.oneTimeExpenseAmount) : '-'}</td>
                  )}
                  {visibleColumns.has('invoiceAttachment') && (
                    <td className="p-2 text-[13px] whitespace-nowrap">
                      {(() => {
                        let status: string;
                        let bgColor = '';
                        let textColor = '';
                        let borderColor = '';
                        let isLink = false;
                        
                        // invoiceCopy가 있으면 "첨부완료" (클릭하면 파일 열기)
                        if (record.invoiceCopy) {
                          status = '첨부완료';
                          bgColor = 'bg-green-500/20';
                          textColor = 'text-green-400';
                          borderColor = 'border-green-500/30';
                          isLink = true;
                        } else {
                          // invoiceAttachmentStatus에 따라 상태 표시
                          const currentStatus = record.invoiceAttachmentStatus || 'required';
                          
                          if (currentStatus === 'not_required') {
                            status = '첨부불요';
                            bgColor = 'bg-gray-500/20';
                            textColor = 'text-gray-400';
                            borderColor = 'border-gray-500/30';
                          } else if (currentStatus === 'completed') {
                            status = '첨부완료';
                            bgColor = 'bg-green-500/20';
                            textColor = 'text-green-400';
                            borderColor = 'border-green-500/30';
                          } else {
                            status = '첨부필요';
                            bgColor = 'bg-yellow-500/20';
                            textColor = 'text-yellow-400';
                            borderColor = 'border-yellow-500/30';
                          }
                        }
                        
                        const badgeClass = `inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`;
                        
                        if (isLink && record.invoiceCopy) {
                          return (
                            <a 
                              href={record.invoiceCopy} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`${badgeClass} hover:opacity-80 cursor-pointer`}
                              title={record.invoiceCopy}
                            >
                              {status}
                            </a>
                          );
                        }
                        
                        return (
                          <span className={badgeClass}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  {visibleColumns.has('businessRegistrationNumber') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.businessRegistrationNumber || ''}>{record.businessRegistrationNumber || '-'}</td>
                  )}
                  {visibleColumns.has('invoiceEmail') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.invoiceEmail || ''}>{record.invoiceEmail || '-'}</td>
                  )}
                  {visibleColumns.has('eoeoManager') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.eoeoManager || ''}>{record.eoeoManager || '-'}</td>
                  )}
                  {visibleColumns.has('contractLink') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden">
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
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden">
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
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.installmentNumber ? String(record.installmentNumber) : ''}>{record.installmentNumber || '-'}</td>
                  )}
                  {visibleColumns.has('attributionYearMonth') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.attributionYearMonth || ''}>{record.attributionYearMonth || '-'}</td>
                  )}
                  {visibleColumns.has('advanceBalance') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.advanceBalance || ''}>{record.advanceBalance || '-'}</td>
                  )}
                  {visibleColumns.has('ratio') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.ratio ? String(record.ratio) : ''}>{record.ratio || '-'}</td>
                  )}
                  {visibleColumns.has('count') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.count ? String(record.count) : ''}>{record.count || '-'}</td>
                  )}
                  {visibleColumns.has('description') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.description || ''}>{record.description || '-'}</td>
                  )}
                  {visibleColumns.has('createdDate') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.createdDate ? formatDate(record.createdDate) : ''}>{record.createdDate ? formatDate(record.createdDate) : '-'}</td>
                  )}
                  {visibleColumns.has('issueNotes') && (
                    <td className="p-2 text-[13px] whitespace-nowrap truncate overflow-hidden" title={record.issueNotes || ''}>{record.issueNotes || '-'}</td>
                  )}
                  {visibleColumns.has('actions') && (
                    <td className="p-2 text-[13px]">
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
      </Card>

      <OnlineCommerceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <OnlineCommerceBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkModalSuccess}
      />
      {editingRecord && (
        <OnlineCommerceEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

