'use client';

import { useEffect, useState } from 'react';
import { InfluencerAccount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2 } from 'lucide-react';
import { InfluencerAccountEditModal } from './influencer-account-edit-modal';

const ITEMS_PER_PAGE = 100;

export function InfluencerAccountList() {
  const [accounts, setAccounts] = useState<InfluencerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingAccount, setEditingAccount] = useState<InfluencerAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/influencer-accounts');
      if (!response.ok) {
        throw new Error('계좌 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const formattedAccounts = data.data.map((a: any) => ({
          id: a.id,
          email: a.email,
          tiktokHandle: a.tiktok_handle,
          fullName: a.full_name,
          achRoutingNumber: a.ach_routing_number,
          swiftCode: a.swift_code,
          accountNumber: a.account_number,
          accountType: a.account_type,
          wiseTag: a.wise_tag,
          address: a.address,
          phoneNumber: a.phone_number,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));
        setAccounts(formattedAccounts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageAccounts = getCurrentPageAccounts();
      setSelectedIds(new Set(currentPageAccounts.map(a => a.id!)));
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
    if (!confirm(`선택한 ${ids.length}개의 계좌를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/influencer-accounts', {
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

      await fetchAccounts();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchAccounts();
    setEditingAccount(null);
  };

  const getCurrentPageAccounts = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return accounts.slice(start, end);
  };

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
  const currentPageAccounts = getCurrentPageAccounts();
  const allSelected = currentPageAccounts.length > 0 && currentPageAccounts.every(a => selectedIds.has(a.id!));

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">계좌 목록을 불러오는 중...</span>
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
        <Button onClick={fetchAccounts} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
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
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-700 w-16">순번</th>
                <th className="text-left p-4 font-medium text-gray-700">Tiktok Account</th>
                <th className="text-left p-4 font-medium text-gray-700">Instagram Account</th>
                <th className="text-left p-4 font-medium text-gray-700">Email</th>
                <th className="text-left p-4 font-medium text-gray-700">Full Name</th>
                <th className="text-left p-4 font-medium text-gray-700">Account Number</th>
                <th className="text-left p-4 font-medium text-gray-700">ACH routing number</th>
                <th className="text-left p-4 font-medium text-gray-700">SWIFT CODE</th>
                <th className="text-left p-4 font-medium text-gray-700">Account Type</th>
                <th className="text-left p-4 font-medium text-gray-700">Wise Tag</th>
                <th className="text-left p-4 font-medium text-gray-700 w-24">작업</th>
              </tr>
            </thead>
            <tbody>
              {currentPageAccounts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500 text-sm">
                    등록된 계좌가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageAccounts.map((account, index) => {
                  const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(account.id!)}
                          onChange={(e) => handleSelectOne(account.id!, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{rowNumber}</td>
                      <td className="p-4 text-sm">{account.tiktokHandle || '-'}</td>
                      <td className="p-4 text-sm">-</td>
                      <td className="p-4 text-sm">{account.email || '-'}</td>
                      <td className="p-4 font-medium text-sm">{account.fullName}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.accountNumber || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.achRoutingNumber || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.swiftCode || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.accountType || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.wiseTag || '-'}</td>
                      <td className="p-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAccount(account)}
                            className="text-blue-600 hover:text-blue-800"
                            title="수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete([account.id!])}
                            className="text-red-600 hover:text-red-800"
                            title="삭제"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {editingAccount && (
        <InfluencerAccountEditModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}



