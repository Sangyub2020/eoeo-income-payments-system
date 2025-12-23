'use client';

import { useEffect, useState } from 'react';
import { Brand } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2 } from 'lucide-react';
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

  const getCurrentPageBrands = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return brands.slice(start, end);
  };

  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE);
  const currentPageBrands = getCurrentPageBrands();

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
        <Button onClick={fetchBrands} className="mt-2" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={currentPageBrands.length > 0 && currentPageBrands.every(b => selectedIds.has(b.id!))}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">
            전체 {brands.length}개 중 {selectedIds.size}개 선택
          </span>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => handleDelete(Array.from(selectedIds))}
            disabled={isDeleting}
          >
            선택 삭제
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-gray-700 w-12">
                <input
                  type="checkbox"
                  checked={currentPageBrands.length > 0 && currentPageBrands.every(b => selectedIds.has(b.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left p-3 font-medium text-gray-700">번호</th>
              <th className="text-left p-3 font-medium text-gray-700">브랜드명</th>
              <th className="text-left p-3 font-medium text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {currentPageBrands.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  등록된 브랜드가 없습니다.
                </td>
              </tr>
            ) : (
              currentPageBrands.map((brand, index) => (
                <tr key={brand.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(brand.id!)}
                      onChange={(e) => handleSelectOne(brand.id!, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-3 text-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="p-3">{brand.name}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingBrand(brand)}
                        className="text-blue-600 hover:text-blue-800"
                        title="수정"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete([brand.id!])}
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


