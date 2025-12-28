'use client';

import { useEffect, useState } from 'react';
import { InfluencerAccount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Edit2, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // 검색 필터링 (Account Number 또는 Account Holder 명으로)
  const filteredAccounts = accounts.filter(account => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const accountNumber = (account.accountNumber || '').toLowerCase();
    const fullName = (account.fullName || '').toLowerCase();
    return accountNumber.includes(query) || fullName.includes(query);
  });

  // 통계 계산
  const totalCount = accounts.length;
  const personalCount = accounts.filter(a => a.recipientType === 'Personal').length;
  const businessCount = accounts.filter(a => a.recipientType === 'Business').length;
  const otherCount = accounts.filter(a => !a.recipientType || (a.recipientType !== 'Personal' && a.recipientType !== 'Business')).length;

  const getCurrentPageAccounts = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, end);
  };

  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const currentPageAccounts = getCurrentPageAccounts();
  const allSelected = currentPageAccounts.length > 0 && currentPageAccounts.every(a => selectedIds.has(a.id!));

  // 검색어 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-gray-300">계좌 목록을 불러오는 중...</span>
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
        <Button onClick={fetchAccounts} className="mt-4" variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-purple-500/20 bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-purple-500/10">
        {/* 통계 표시 */}
        <div className="p-4 border-b border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-400">전체: </span>
                <span className="font-medium text-gray-200">{totalCount}명</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Personal: </span>
                <span className="font-medium text-cyan-300">{personalCount}명</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Business: </span>
                <span className="font-medium text-purple-300">{businessCount}명</span>
              </div>
              {otherCount > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">기타: </span>
                  <span className="font-medium text-gray-300">{otherCount}명</span>
                </div>
              )}
            </div>
          </div>

          {/* 검색 입력 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Account Number 또는 Account Holder 명으로 검색..."
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
              검색 결과: {filteredAccounts.length}개 (전체 {totalCount}개)
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
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.checkbox}px`, minWidth: '50px' }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-600 bg-slate-700"
                  />
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent"
                    onMouseDown={(e) => handleResizeStart('checkbox', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.number}px`, minWidth: '50px' }}
                >
                  순번
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('number', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.recipientType}px`, minWidth: '50px' }}
                >
                  Recipient Type
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('recipientType', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.fullName}px`, minWidth: '50px' }}
                >
                  Account Holder
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('fullName', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.tiktokAccount}px`, minWidth: '50px' }}
                >
                  Tiktok Account
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('tiktokAccount', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.instagramAccount}px`, minWidth: '50px' }}
                >
                  Instagram Account
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('instagramAccount', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.email}px`, minWidth: '50px' }}
                >
                  Email
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('email', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.accountNumber}px`, minWidth: '50px' }}
                >
                  Account Number
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('accountNumber', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.achRoutingNumber}px`, minWidth: '50px' }}
                >
                  ACH routing number
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('achRoutingNumber', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.swiftCode}px`, minWidth: '50px' }}
                >
                  SWIFT CODE
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('swiftCode', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.accountType}px`, minWidth: '50px' }}
                >
                  Account Type
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('accountType', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.wiseTag}px`, minWidth: '50px' }}
                >
                  Wise Tag
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('wiseTag', e)}
                  />
                </th>
                <th 
                  className="text-left p-4 font-medium text-gray-300 text-sm relative"
                  style={{ width: `${columnWidths.actions}px`, minWidth: '50px' }}
                >
                  작업
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500 bg-transparent z-10"
                    onMouseDown={(e) => handleResizeStart('actions', e)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPageAccounts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-400 text-sm">
                    등록된 계좌가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageAccounts.map((account, index) => {
                  const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  return (
                    <tr key={account.id} className="border-b border-gray-600 hover:bg-slate-700/50">
                      <td className="p-4 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(account.id!)}
                          onChange={(e) => handleSelectOne(account.id!, e.target.checked)}
                          className="rounded border-gray-600 bg-slate-700"
                        />
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{rowNumber}</td>
                      <td className="p-4 text-sm text-gray-300">{account.recipientType || '-'}</td>
                      <td className="p-4 font-medium text-sm text-gray-200">{account.fullName}</td>
                      <td className="p-4 text-sm">
                        {account.recipientType === 'Business' 
                          ? (account.tiktokHandles && account.tiktokHandles.length > 0 
                              ? (
                                  <div className="flex flex-wrap gap-1">
                                    {account.tiktokHandles.map((handle, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-500/50">
                                        {handle}
                                      </span>
                                    ))}
                                  </div>
                                )
                              : <span className="text-gray-400">-</span>)
                          : (account.tiktokHandle 
                              ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-500/50">
                                    {account.tiktokHandle}
                                  </span>
                                )
                              : <span className="text-gray-400">-</span>)}
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {account.recipientType === 'Business' 
                          ? (account.instagramHandles && account.instagramHandles.length > 0 
                              ? account.instagramHandles.join(', ') 
                              : '-')
                          : '-'}
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {account.email ? (
                          account.email.includes('\n') ? (
                            <div className="whitespace-pre-line">{account.email}</div>
                          ) : (
                            account.email
                          )
                        ) : '-'}
                      </td>
                      <td className="p-4 text-sm">
                        {account.accountNumber ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                            {account.accountNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {account.achRoutingNumber ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                            {account.achRoutingNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {account.swiftCode ? (
                          account.swiftCode.includes('\n') ? (
                            <div className="flex flex-wrap gap-1">
                              {account.swiftCode.split('\n').map((code, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                                  {code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                              {account.swiftCode}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {account.accountType ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                            {account.accountType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {account.wiseTag ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/50">
                            {account.wiseTag}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAccount(account)}
                            className="text-cyan-400 hover:text-cyan-300"
                            title="수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete([account.id!])}
                            className="text-red-400 hover:text-red-300"
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



