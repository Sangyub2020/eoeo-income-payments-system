'use client';

import { useEffect, useState } from 'react';
import { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2, Search, X } from 'lucide-react';
import { VendorEditModal } from './vendor-edit-modal';

const ITEMS_PER_PAGE = 100;

export function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        throw new Error('거래처 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedVendors = data.data.map((v: any) => ({
          id: v.id,
          code: v.code,
          name: v.name,
          businessNumber: v.business_number,
          invoiceEmail: v.invoice_email,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        }));
        // 거래처 코드로 오름차순 정렬 (숫자 크기 기준)
        formattedVendors.sort((a: { code?: string }, b: { code?: string }) => {
          const codeA = a.code || '';
          const codeB = b.code || '';
          // 숫자 부분 추출 및 비교
          const numA = codeA.match(/\d+/)?.[0] || '';
          const numB = codeB.match(/\d+/)?.[0] || '';
          if (numA && numB) {
            const numCompare = parseInt(numA, 10) - parseInt(numB, 10);
            if (numCompare !== 0) return numCompare;
          }
          // 숫자가 같거나 없으면 문자열 비교
          return codeA.localeCompare(codeB);
        });
        setVendors(formattedVendors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageVendors = getCurrentPageVendors();
      setSelectedIds(new Set(currentPageVendors.map(v => v.id!)));
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
    if (!confirm(`선택한 ${ids.length}개의 거래처를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/vendors', {
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

      await fetchVendors();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchVendors();
    setEditingVendor(null);
  };

  // 검색 필터링
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentPageVendors = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredVendors.slice(start, end);
  };

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const currentPageVendors = getCurrentPageVendors();
  const allSelected = currentPageVendors.length > 0 && currentPageVendors.every(v => selectedIds.has(v.id!));

  // 검색어 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-gray-300">거래처 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
        <Button onClick={fetchVendors} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10">
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="거래처명으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-slate-700/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-400 mt-2">
              검색 결과: {filteredVendors.length}개 (전체 {vendors.length}개)
            </p>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="p-4 bg-cyan-900/30 border-b border-cyan-500/30 flex items-center justify-between">
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
          <table className="w-full">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr className="border-b border-gray-600">
                <th className="text-left p-4 font-medium text-gray-300 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-600 bg-slate-700"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-300">거래처 코드</th>
                <th className="text-left p-4 font-medium text-gray-300">거래처명</th>
                <th className="text-left p-4 font-medium text-gray-300">사업자번호</th>
                <th className="text-left p-4 font-medium text-gray-300">세금계산서 이메일</th>
                <th className="text-left p-4 font-medium text-gray-300 w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {currentPageVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-left text-gray-400">
                    등록된 거래처가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-600 hover:bg-slate-700/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(vendor.id!)}
                        onChange={(e) => handleSelectOne(vendor.id!, e.target.checked)}
                        className="rounded border-gray-600 bg-slate-700"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-200">{vendor.code}</td>
                    <td className="p-4 text-gray-300">{vendor.name}</td>
                    <td className="p-4 text-gray-400">{vendor.businessNumber || '-'}</td>
                    <td className="p-4 text-gray-400">{vendor.invoiceEmail || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingVendor(vendor)}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete([vendor.id!])}
                          className="text-red-400 hover:text-red-300"
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

      {editingVendor && (
        <VendorEditModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
