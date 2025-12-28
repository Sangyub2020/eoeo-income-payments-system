'use client';

import { useEffect, useState } from 'react';
import { Brand } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2, Search, X } from 'lucide-react';
import { BrandEditModal } from './brand-edit-modal';

const ITEMS_PER_PAGE = 100;

export function BrandList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBrands = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/brands');
      if (!response.ok) {
        throw new Error('브랜드 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedBrands = data.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
        // 브랜드명으로 오름차순 정렬
        formattedBrands.sort((a: { name?: string }, b: { name?: string }) => (a.name || '').localeCompare(b.name || ''));
        setBrands(formattedBrands);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageBrands = getCurrentPageBrands();
      setSelectedIds(new Set(currentPageBrands.map(b => b.id!)));
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
    if (!confirm(`선택한 ${ids.length}개의 브랜드를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = ids.map(id =>
        fetch(`/api/brands/${id}`, { method: 'DELETE' })
      );
      const responses = await Promise.all(deletePromises);
      
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length}개의 브랜드 삭제에 실패했습니다.`);
      }

      await fetchBrands();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 검색 필터링
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentPageBrands = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredBrands.slice(start, end);
  };

  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
  const currentPageBrands = getCurrentPageBrands();

  // 검색어 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-300">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded">
        {error}
        <Button onClick={fetchBrands} className="mt-2" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10">
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="브랜드명으로 검색..."
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
          <p className="text-xs text-gray-400 mb-2">
            검색 결과: {filteredBrands.length}개 (전체 {brands.length}개)
          </p>
        )}
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={currentPageBrands.length > 0 && currentPageBrands.every(b => selectedIds.has(b.id!))}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-600 bg-slate-700"
          />
          <span className="text-sm text-gray-300">
            전체 {filteredBrands.length}개 중 {selectedIds.size}개 선택
          </span>
        </div>
        {selectedIds.size > 0 && (
          <div className="mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isDeleting}
            >
              선택 삭제
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 sticky top-0">
            <tr className="border-b border-gray-600">
              <th className="text-left p-3 font-medium text-gray-300 w-12">
                <input
                  type="checkbox"
                  checked={currentPageBrands.length > 0 && currentPageBrands.every(b => selectedIds.has(b.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-600 bg-slate-700"
                />
              </th>
              <th className="text-left p-3 font-medium text-gray-300">번호</th>
              <th className="text-left p-3 font-medium text-gray-300">브랜드명</th>
              <th className="text-left p-3 font-medium text-gray-300">작업</th>
            </tr>
          </thead>
          <tbody>
            {currentPageBrands.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  등록된 브랜드가 없습니다.
                </td>
              </tr>
            ) : (
              currentPageBrands.map((brand, index) => (
                <tr key={brand.id} className="border-b border-gray-600 hover:bg-slate-700/50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(brand.id!)}
                      onChange={(e) => handleSelectOne(brand.id!, e.target.checked)}
                      className="rounded border-gray-600 bg-slate-700"
                    />
                  </td>
                  <td className="p-3 text-gray-400">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="p-3 text-gray-300">{brand.name}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingBrand(brand)}
                        className="text-cyan-400 hover:text-cyan-300"
                        title="수정"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete([brand.id!])}
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
        <div className="p-4 border-t">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {editingBrand && (
        <BrandEditModal
          brand={editingBrand}
          onClose={() => setEditingBrand(null)}
          onSuccess={() => {
            setEditingBrand(null);
            fetchBrands();
          }}
        />
      )}
    </div>
  );
}







