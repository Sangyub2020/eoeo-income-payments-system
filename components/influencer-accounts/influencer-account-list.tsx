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

  // 열 너비 관리
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    number: 60,
    recipientType: 120,
    fullName: 150,
    tiktokAccount: 150,
    instagramAccount: 150,
    email: 180,
    accountNumber: 150,
    achRoutingNumber: 150,
    swiftCode: 120,
    accountType: 120,
    wiseTag: 120,
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
        const formattedAccounts = data.data.map((a: any) => {
          // JSONB 배열이 문자열로 반환될 수 있으므로 파싱
          let tiktokHandles = a.tiktok_handles;
          let instagramHandles = a.instagram_handles;
          
          if (typeof tiktokHandles === 'string') {
            try {
              tiktokHandles = JSON.parse(tiktokHandles);
            } catch {
              tiktokHandles = [];
            }
          }
          
          if (typeof instagramHandles === 'string') {
            try {
              instagramHandles = JSON.parse(instagramHandles);
            } catch {
              instagramHandles = [];
            }
          }
          
          return {
            id: a.id,
            email: a.email,
            tiktokHandle: a.tiktok_handle,
            tiktokHandles: Array.isArray(tiktokHandles) ? tiktokHandles : [],
            instagramHandles: Array.isArray(instagramHandles) ? instagramHandles : [],
            recipientType: a.recipient_type,
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
          };
        });
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
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
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
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.number}px`, minWidth: '50px' }}
                >
                  순번
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('number', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.recipientType}px`, minWidth: '50px' }}
                >
                  Recipient Type
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('recipientType', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.fullName}px`, minWidth: '50px' }}
                >
                  Account Holder
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('fullName', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.tiktokAccount}px`, minWidth: '50px' }}
                >
                  Tiktok Account
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('tiktokAccount', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.instagramAccount}px`, minWidth: '50px' }}
                >
                  Instagram Account
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('instagramAccount', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.email}px`, minWidth: '50px' }}
                >
                  Email
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('email', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.accountNumber}px`, minWidth: '50px' }}
                >
                  Account Number
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('accountNumber', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.achRoutingNumber}px`, minWidth: '50px' }}
                >
                  ACH routing number
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('achRoutingNumber', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.swiftCode}px`, minWidth: '50px' }}
                >
                  SWIFT CODE
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('swiftCode', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.accountType}px`, minWidth: '50px' }}
                >
                  Account Type
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('accountType', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.wiseTag}px`, minWidth: '50px' }}
                >
                  Wise Tag
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('wiseTag', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-700 text-sm relative"
                  style={{ width: `${columnWidths.actions}px`, minWidth: '50px' }}
                >
                  작업
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('actions', e)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPageAccounts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-500 text-sm">
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
                      <td className="p-4 text-sm">{account.recipientType || '-'}</td>
                      <td className="p-4 font-medium text-sm">{account.fullName}</td>
                      <td className="p-4 text-sm">
                        {account.recipientType === 'Business' 
                          ? (account.tiktokHandles && account.tiktokHandles.length > 0 
                              ? account.tiktokHandles.join(', ') 
                              : '-')
                          : (account.tiktokHandle || '-')}
                      </td>
                      <td className="p-4 text-sm">
                        {account.recipientType === 'Business' 
                          ? (account.instagramHandles && account.instagramHandles.length > 0 
                              ? account.instagramHandles.join(', ') 
                              : '-')
                          : '-'}
                      </td>
                      <td className="p-4 text-sm">
                        {account.email ? (
                          account.email.includes('\n') ? (
                            <div className="whitespace-pre-line">{account.email}</div>
                          ) : (
                            account.email
                          )
                        ) : '-'}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{account.accountNumber || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">{account.achRoutingNumber || '-'}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        {account.swiftCode ? (
                          account.swiftCode.includes('\n') ? (
                            <div className="whitespace-pre-line">{account.swiftCode}</div>
                          ) : (
                            account.swiftCode
                          )
                        ) : '-'}
                      </td>
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



