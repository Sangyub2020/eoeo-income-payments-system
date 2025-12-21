'use client';

import { useEffect, useState } from 'react';
import { OnlineCommerceTeam } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Plus, Upload, Edit2, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OnlineCommerceFormModal } from './online-commerce-form-modal';
import { OnlineCommerceBulkModal } from './online-commerce-bulk-modal';
import { OnlineCommerceEditModal } from './online-commerce-edit-modal';

const ITEMS_PER_PAGE = 100;

type SortField = 'category' | 'vendorCode' | 'companyName' | 'brandName' | 'projectName' | 'expectedDepositDate' | 'expectedDepositAmount' | 'depositDate' | 'depositAmount' | 'invoiceIssued' | null;
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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/online-commerce-team');
      if (!response.ok) {
        throw new Error('입금 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedRecords = data.data.map((r: any) => ({
          id: r.id,
          category: r.category,
          vendorCode: r.vendor_code,
          companyName: r.company_name,
          brandName: r.brand_name,
          businessRegistrationNumber: r.business_registration_number,
          invoiceEmail: r.invoice_email,
          projectCode: r.project_code,
          project: r.project,
          projectName: r.project_name,
          eoeoManager: r.eoeo_manager,
          contractLink: r.contract_link,
          estimateLink: r.estimate_link,
          installmentNumber: r.installment_number,
          attributionYearMonth: r.attribution_year_month,
          advanceBalance: r.advance_balance,
          ratio: r.ratio,
          count: r.count,
          expectedDepositDate: r.expected_deposit_date,
          expectedDepositAmount: r.expected_deposit_amount,
          description: r.description,
          depositDate: r.deposit_date,
          depositAmount: r.deposit_amount,
          exchangeGainLoss: r.exchange_gain_loss,
          difference: r.difference,
          createdDate: r.created_date,
          invoiceIssued: r.invoice_issued,
          invoiceCopy: r.invoice_copy,
          issueNotes: r.issue_notes,
          year: r.year,
          expectedDepositMonth: r.expected_deposit_month,
          depositMonth: r.deposit_month,
          taxStatus: r.tax_status,
          invoiceSupplyPrice: r.invoice_supply_price,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          // 필수 필드 검증 플래그
          hasWarning: !r.vendor_code || !r.category || !r.project_code,
        }));
        setRecords(formattedRecords);
        setFilteredRecords(formattedRecords);
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
    setCurrentPage(1); // 정렬 시 첫 페이지로 리셋
  };

  const sortRecords = (recordsToSort: OnlineCommerceTeam[]): OnlineCommerceTeam[] => {
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
  };

  useEffect(() => {
    let filtered = records;

    // 검색 필터링
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = records.filter(record => 
        record.companyName?.toLowerCase().includes(query) ||
        record.vendorCode?.toLowerCase().includes(query) ||
        record.brandName?.toLowerCase().includes(query)
      );
    }

    // 정렬 적용
    const sorted = sortRecords(filtered);
    setFilteredRecords(sorted);
    setCurrentPage(1); // 검색/정렬 시 첫 페이지로 리셋
  }, [searchQuery, records, sortField, sortDirection]);

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
      const response = await fetch('/api/online-commerce-team', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
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
    setEditingRecord(record);
  };

  const handleEditSuccess = () => {
    fetchRecords();
    setEditingRecord(null);
    if (onSuccess) onSuccess();
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
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              데이터 추가
            </Button>
            <Button onClick={() => setIsBulkModalOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              일괄 추가
            </Button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="회사이름, 거래처코드, 브랜드명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
        <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b">
                <th className="text-left p-2 font-medium text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-2 font-medium text-gray-700 w-16 whitespace-nowrap">번호</th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    <span>구분</span>
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  onClick={() => handleSort('projectName')}
                >
                  <div className="flex items-center gap-1">
                    <span>프로젝트명</span>
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
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
                </th>
                <th 
                  className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  onClick={() => handleSort('invoiceIssued')}
                >
                  <div className="flex items-center gap-1">
                    <span>세금계산서</span>
                    {sortField === 'invoiceIssued' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">사업자번호</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">이메일</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">프로젝트코드</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">프로젝트</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">담당자</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">계약서</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">견적서</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">차수</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">귀속년월</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">선/잔금</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">비율</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">건수</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">적요</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">작성일</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">세금계산서 첨부</th>
                <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">이슈</th>
                <th className="text-left p-2 font-medium text-gray-700 w-24 whitespace-nowrap">작업</th>
              </tr>
            </thead>
          <tbody>
            {currentPageRecords.length === 0 ? (
              <tr>
                <td colSpan={28} className="p-8 text-center text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다.' : '등록된 입금 정보가 없습니다.'}
                </td>
              </tr>
            ) : (
              currentPageRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`border-b hover:bg-gray-50 ${(record as any).hasWarning ? 'bg-yellow-50' : ''}`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id!)}
                      onChange={(e) => handleSelectOne(record.id!, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-2 text-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[80px]">{record.category || '-'}</span>
                      {(record as any).hasWarning && (
                        <span className="text-xs text-yellow-600 font-medium flex-shrink-0" title="필수 항목 누락">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">{record.vendorCode || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[120px]" title={record.companyName || ''}>{record.companyName || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[100px]" title={record.brandName || ''}>{record.brandName || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[120px]" title={record.projectName || ''}>{record.projectName || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.expectedDepositDate ? formatDate(record.expectedDepositDate) : '-'}</td>
                  <td className="p-2 text-right whitespace-nowrap">{record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount) : '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.depositDate ? formatDate(record.depositDate) : '-'}</td>
                  <td className="p-2 text-right font-medium whitespace-nowrap">{record.depositAmount ? formatCurrency(record.depositAmount) : '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.invoiceIssued || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[100px]" title={record.businessRegistrationNumber || ''}>{record.businessRegistrationNumber || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[150px]" title={record.invoiceEmail || ''}>{record.invoiceEmail || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.projectCode || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[100px]" title={record.project || ''}>{record.project || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[80px]" title={record.eoeoManager || ''}>{record.eoeoManager || '-'}</td>
                  <td className="p-2 whitespace-nowrap">
                    {record.contractLink ? (
                      <a 
                        href={record.contractLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline truncate max-w-[100px] block"
                        title={record.contractLink}
                      >
                        링크
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {record.estimateLink ? (
                      <a 
                        href={record.estimateLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline truncate max-w-[100px] block"
                        title={record.estimateLink}
                      >
                        링크
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-2 whitespace-nowrap">{record.installmentNumber || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.attributionYearMonth || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.advanceBalance || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.ratio || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.count || '-'}</td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[100px]" title={record.description || ''}>{record.description || '-'}</td>
                  <td className="p-2 whitespace-nowrap">{record.createdDate ? formatDate(record.createdDate) : '-'}</td>
                  <td className="p-2 whitespace-nowrap">
                    {record.invoiceCopy ? (
                      <a href={record.invoiceCopy} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        보기
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-2 whitespace-nowrap truncate max-w-[100px]" title={record.issueNotes || ''}>{record.issueNotes || '-'}</td>
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

