'use client';

import { useEffect, useState } from 'react';
import { OtherIncome } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Trash2, Plus, Upload, Edit2, Search, ArrowUp, ArrowDown, ArrowUpDown, Settings } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OtherIncomeFormModal } from './other-income-form-modal';
import { OtherIncomeBulkModal } from './other-income-bulk-modal';
import { OtherIncomeEditModal } from './other-income-edit-modal';

const ITEMS_PER_PAGE = 100;

type SortField = 'category' | 'vendorCode' | 'companyName' | 'brandName' | 'projectName' | 'expectedDepositDate' | 'expectedDepositAmount' | 'depositDate' | 'depositAmount' | 'invoiceIssued' | null;
type SortDirection = 'asc' | 'desc';

interface OtherIncomeListProps {
  onSuccess?: () => void;
}

export function OtherIncomeList({ onSuccess }: OtherIncomeListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [records, setRecords] = useState<OtherIncome[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OtherIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OtherIncome | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  
  // Î™®Îì† ???ïÏùò
  const allColumns = [
    { key: 'checkbox', label: '?†ÌÉù', alwaysVisible: true },
    { key: 'number', label: 'Î≤àÌò∏', alwaysVisible: true },
    { key: 'category', label: 'Í±∞Îûò ?†Ìòï', alwaysVisible: false },
    { key: 'projectCode', label: '?ÑÎ°ú?ùÌä∏ ?†Ìòï ÏΩîÎìú', alwaysVisible: false },
    { key: 'project', label: '?ÑÎ°ú?ùÌä∏ ?†Ìòï', alwaysVisible: false },
    { key: 'projectName', label: 'Project Name', alwaysVisible: false },
    { key: 'vendorCode', label: 'Í±∞ÎûòÏ≤òÏΩî??, alwaysVisible: false },
    { key: 'companyName', label: '?åÏÇ¨Î™?, alwaysVisible: false },
    { key: 'brandName', label: 'Î∏åÎûú?úÎ™Ö', alwaysVisible: false },
    { key: 'expectedDepositDate', label: '?ÖÍ∏à?àÏ†ï??, alwaysVisible: false },
    { key: 'expectedDepositAmount', label: '?àÏ†ïÍ∏àÏï°', alwaysVisible: false },
    { key: 'depositDate', label: '?ÖÍ∏à??, alwaysVisible: false },
    { key: 'depositAmount', label: '?ÖÍ∏à??, alwaysVisible: false },
    { key: 'invoiceIssued', label: '?∏Í∏àÍ≥ÑÏÇ∞??, alwaysVisible: false },
    { key: 'businessRegistrationNumber', label: '?¨ÏóÖ?êÎ≤à??, alwaysVisible: false },
    { key: 'invoiceEmail', label: '?¥Î©î??, alwaysVisible: false },
    { key: 'eoeoManager', label: '?¥Îãπ??, alwaysVisible: false },
    { key: 'contractLink', label: 'Í≥ÑÏïΩ??, alwaysVisible: false },
    { key: 'estimateLink', label: 'Í≤¨Ï†Å??, alwaysVisible: false },
    { key: 'installmentNumber', label: 'Ï∞®Ïàò', alwaysVisible: false },
    { key: 'attributionYearMonth', label: 'Í∑Ä?çÎÖÑ??, alwaysVisible: false },
    { key: 'advanceBalance', label: '???îÍ∏à', alwaysVisible: false },
    { key: 'ratio', label: 'ÎπÑÏú®', alwaysVisible: false },
    { key: 'count', label: 'Í±¥Ïàò', alwaysVisible: false },
    { key: 'description', label: '?ÅÏöî', alwaysVisible: false },
    { key: 'createdDate', label: '?ëÏÑ±??, alwaysVisible: false },
    { key: 'invoiceCopy', label: '?∏Í∏àÍ≥ÑÏÇ∞??Ï≤®Î?', alwaysVisible: false },
    { key: 'issueNotes', label: '?¥Ïäà', alwaysVisible: false },
    { key: 'actions', label: '?ëÏóÖ', alwaysVisible: true },
  ];
  
  // ?†ÌÉù????Í¥ÄÎ¶?(?îÌè¥?∏Îäî Î™®Îì† ???†ÌÉù)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(allColumns.map(col => col.key))
  );

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/other-income-team');
      if (!response.ok) {
        throw new Error('?ÖÍ∏à Î™©Î°ù??Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.');
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
          // ?ÑÏàò ?ÑÎìú Í≤ÄÏ¶??åÎûòÍ∑?          hasWarning: !r.vendor_code || !r.category || !r.project_code,
        }));
        setRecords(formattedRecords);
        setFilteredRecords(formattedRecords);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '?????ÜÎäî ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Í∞ôÏ? ?ÑÎìúÎ•??¥Î¶≠?òÎ©¥ ?ïÎ†¨ Î∞©Ìñ• ?†Í?
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // ?§Î•∏ ?ÑÎìúÎ•??¥Î¶≠?òÎ©¥ ?§Î¶ÑÏ∞®Ïàú?ºÎ°ú ?úÏûë
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // ?ïÎ†¨ ??Ï≤??òÏù¥ÏßÄÎ°?Î¶¨ÏÖã
  };

  const sortRecords = (recordsToSort: OtherIncome[]): OtherIncome[] => {
    if (!sortField) return recordsToSort;

    const sorted = [...recordsToSort].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // null/undefined Ï≤òÎ¶¨
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // ?´Ïûê ?ÑÎìú Ï≤òÎ¶¨
      if (sortField === 'expectedDepositAmount' || sortField === 'depositAmount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // ?†Ïßú ?ÑÎìú Ï≤òÎ¶¨
      if (sortField === 'expectedDepositDate' || sortField === 'depositDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Î¨∏Ïûê???ÑÎìú Ï≤òÎ¶¨
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

    // Í≤Ä???ÑÌÑ∞Îß?    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = records.filter(record => 
        record.companyName?.toLowerCase().includes(query) ||
        record.vendorCode?.toLowerCase().includes(query) ||
        record.brandName?.toLowerCase().includes(query)
      );
    }

    // ?ïÎ†¨ ?ÅÏö©
    const sorted = sortRecords(filtered);
    setFilteredRecords(sorted);
    setCurrentPage(1); // Í≤Ä???ïÎ†¨ ??Ï≤??òÏù¥ÏßÄÎ°?Î¶¨ÏÖã
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
    if (!confirm(`?†ÌÉù??${ids.length}Í∞úÏùò ?ÖÍ∏à ?ïÎ≥¥Î•???†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/other-income-team', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '??†ú???§Ìå®?àÏäµ?àÎã§.');
      }

      await fetchRecords();
      setSelectedIds(new Set());
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : '??†ú Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.');
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

  const handleEdit = (record: OtherIncome) => {
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
          <span className="ml-2 text-gray-600">?ÖÍ∏à Î™©Î°ù??Î∂àÎü¨?§Îäî Ï§?..</span>
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
          ?§Ïãú ?úÎèÑ
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">?ÖÍ∏à Î™©Î°ù ({filteredRecords.length}Í∞?</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} 
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                ???†ÌÉù
              </Button>
              {isColumnSelectorOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[250px] max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">?úÏãú?????†ÌÉù</h4>
                    <button
                      onClick={() => {
                        setVisibleColumns(new Set(allColumns.map(col => col.key)));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Î™®Îëê ?†ÌÉù
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
                      ?ïÏù∏
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              ?∞Ïù¥??Ï∂îÍ?
            </Button>
            <Button onClick={() => setIsBulkModalOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              ?ºÍ¥Ñ Ï∂îÍ?
            </Button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="?åÏÇ¨?¥Î¶Ñ, Í±∞ÎûòÏ≤òÏΩî?? Î∏åÎûú?úÎ™Ö?ºÎ°ú Í≤Ä??.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size}Í∞??†ÌÉù??          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              ?†ÌÉù ??†ú
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
        <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b">
                {visibleColumns.has('checkbox') && (
                  <th className="text-left p-2 font-medium text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {visibleColumns.has('number') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">
                    Î≤àÌò∏
                  </th>
                )}
                {visibleColumns.has('category') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Í±∞Îûò ?†Ìòï</span>
                      <span className="text-xs text-yellow-600" title="?ÑÏàò ??™© ?ÑÎùΩ Í≤ΩÍ≥†">?†Ô∏è</span>
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
                )}
                {visibleColumns.has('projectCode') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">
                    ?ÑÎ°ú?ùÌä∏ ?†Ìòï ÏΩîÎìú
                  </th>
                )}
                {visibleColumns.has('project') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('projectName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>?ÑÎ°ú?ùÌä∏ ?†Ìòï</span>
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
                )}
                {visibleColumns.has('projectName') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">
                    Project Name
                  </th>
                )}
                {visibleColumns.has('vendorCode') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('vendorCode')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Í±∞ÎûòÏ≤òÏΩî??/span>
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
                )}
                {visibleColumns.has('companyName') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('companyName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>?åÏÇ¨Î™?/span>
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
                )}
                {visibleColumns.has('brandName') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('brandName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Î∏åÎûú?úÎ™Ö</span>
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
                )}
                {visibleColumns.has('expectedDepositDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('expectedDepositDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>?ÖÍ∏à?àÏ†ï??/span>
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
                )}
                {visibleColumns.has('expectedDepositAmount') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('expectedDepositAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>?àÏ†ïÍ∏àÏï°</span>
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
                )}
                {visibleColumns.has('depositDate') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('depositDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>?ÖÍ∏à??/span>
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
                )}
                {visibleColumns.has('depositAmount') && (
                  <th 
                    className="text-right p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('depositAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>?ÖÍ∏à??/span>
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
                )}
                {visibleColumns.has('invoiceIssued') && (
                  <th 
                    className="text-left p-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort('invoiceIssued')}
                  >
                    <div className="flex items-center gap-1">
                      <span>?∏Í∏àÍ≥ÑÏÇ∞??/span>
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
                )}
                {visibleColumns.has('businessRegistrationNumber') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?¨ÏóÖ?êÎ≤à??/th>
                )}
                {visibleColumns.has('invoiceEmail') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?¥Î©î??/th>
                )}
                {visibleColumns.has('eoeoManager') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?¥Îãπ??/th>
                )}
                {visibleColumns.has('contractLink') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">Í≥ÑÏïΩ??/th>
                )}
                {visibleColumns.has('estimateLink') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">Í≤¨Ï†Å??/th>
                )}
                {visibleColumns.has('installmentNumber') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">Ï∞®Ïàò</th>
                )}
                {visibleColumns.has('attributionYearMonth') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">Í∑Ä?çÎÖÑ??/th>
                )}
                {visibleColumns.has('advanceBalance') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">???îÍ∏à</th>
                )}
                {visibleColumns.has('ratio') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">ÎπÑÏú®</th>
                )}
                {visibleColumns.has('count') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">Í±¥Ïàò</th>
                )}
                {visibleColumns.has('description') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?ÅÏöî</th>
                )}
                {visibleColumns.has('createdDate') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?ëÏÑ±??/th>
                )}
                {visibleColumns.has('invoiceCopy') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?∏Í∏àÍ≥ÑÏÇ∞??Ï≤®Î?</th>
                )}
                {visibleColumns.has('issueNotes') && (
                  <th className="text-left p-2 font-medium text-gray-700 whitespace-nowrap">?¥Ïäà</th>
                )}
                {visibleColumns.has('actions') && (
                  <th className="text-left p-2 font-medium text-gray-700 w-24 whitespace-nowrap">?ëÏóÖ</th>
                )}
              </tr>
            </thead>
          <tbody>
            {currentPageRecords.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.size} className="p-8 text-center text-gray-500">
                  {searchQuery ? 'Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.' : '?±Î°ù???ÖÍ∏à ?ïÎ≥¥Í∞Ä ?ÜÏäµ?àÎã§.'}
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
                          <span className="text-xs text-yellow-600 font-medium flex-shrink-0" title="?ÑÏàò ??™© ?ÑÎùΩ">?†Ô∏è</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('projectCode') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.projectCode || ''}>{record.projectCode || '-'}</td>
                  )}
                  {visibleColumns.has('project') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.project || ''}>{record.project || '-'}</td>
                  )}
                  {visibleColumns.has('projectName') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.projectName || ''}>{record.projectName || '-'}</td>
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
                    <td className="p-2 text-right whitespace-nowrap truncate overflow-hidden" title={record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount) : ''}>{record.expectedDepositAmount ? formatCurrency(record.expectedDepositAmount) : '-'}</td>
                  )}
                  {visibleColumns.has('depositDate') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.depositDate ? formatDate(record.depositDate) : ''}>{record.depositDate ? formatDate(record.depositDate) : '-'}</td>
                  )}
                  {visibleColumns.has('depositAmount') && (
                    <td className="p-2 text-right font-medium whitespace-nowrap truncate overflow-hidden" title={record.depositAmount ? formatCurrency(record.depositAmount) : ''}>{record.depositAmount ? formatCurrency(record.depositAmount) : '-'}</td>
                  )}
                  {visibleColumns.has('invoiceIssued') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden" title={record.invoiceIssued || ''}>{record.invoiceIssued || '-'}</td>
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
                          ÎßÅÌÅ¨
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
                          ÎßÅÌÅ¨
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
                  {visibleColumns.has('invoiceCopy') && (
                    <td className="p-2 whitespace-nowrap truncate overflow-hidden">
                      {record.invoiceCopy ? (
                        <a href={record.invoiceCopy} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" title={record.invoiceCopy}>
                          Î≥¥Í∏∞
                        </a>
                      ) : '-'}
                    </td>
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
                          title="?òÏ†ï"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete([record.id!])}
                          className="text-red-600 hover:text-red-800"
                          title="??†ú"
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

      <OtherIncomeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <OtherIncomeBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkModalSuccess}
      />
      {editingRecord && (
        <OtherIncomeEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

