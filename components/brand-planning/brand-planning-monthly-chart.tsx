'use client';

import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrandPlanningTeam } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';

export function BrandPlanningMonthlyChart() {
  const [records, setRecords] = useState<BrandPlanningTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ id: string; from: 'included' | 'excluded' } | null>(null);
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');

  // 귀속연월 파싱 함수: "2512" -> { year: "2025", month: "12", fullYear: 2025 }
  const parseAttributionYearMonth = (attributionYearMonth: string) => {
    if (!attributionYearMonth || attributionYearMonth.length !== 4) return null;
    
    const yearStr = attributionYearMonth.substring(0, 2);
    const monthStr = attributionYearMonth.substring(2, 4);
    const fullYear = 2000 + parseInt(yearStr, 10);
    
    return {
      year: fullYear.toString(),
      month: monthStr,
      fullYear,
      monthNum: parseInt(monthStr, 10),
    };
  };

  useEffect(() => {
    fetchRecords();
    // localStorage에서 저장된 선택 상태 불러오기
    const savedExcluded = localStorage.getItem('brand_planning_excluded_ids');
    if (savedExcluded) {
      setExcludedIds(new Set(JSON.parse(savedExcluded)));
    }
  }, []);

  // 선택 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (excludedIds.size > 0) {
      localStorage.setItem('brand_planning_excluded_ids', JSON.stringify(Array.from(excludedIds)));
    } else {
      localStorage.removeItem('brand_planning_excluded_ids');
    }
  }, [excludedIds]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/income-records?team=brand_planning');
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.success) {
        setRecords(data.data || []);
        // 기본 연도 설정 (가장 최근 연도)
        if (data.data && data.data.length > 0) {
          const years = new Set<string>();
          data.data.forEach((record: BrandPlanningTeam) => {
            if (record.attributionYearMonth) {
              const parsed = parseAttributionYearMonth(record.attributionYearMonth);
              if (parsed) {
                years.add(parsed.year);
              }
            }
          });
          const sortedYears = Array.from(years).sort().reverse();
          if (sortedYears.length > 0 && !selectedYear) {
            setSelectedYear(sortedYears[0]);
          }
        }
      } else {
        throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 선택된 연도에 해당하는 데이터만 필터링
  const filteredRecordsByYear = selectedYear 
    ? records.filter(record => {
        if (!record.attributionYearMonth) return false;
        const parsed = parseAttributionYearMonth(record.attributionYearMonth);
        return parsed && parsed.year === selectedYear;
      })
    : records;

  // 매출 집계에 포함할 데이터 필터링
  const filteredRecords = filteredRecordsByYear.filter(record => {
    // excludedIds에 있는 것은 제외
    if (excludedIds.has(record.id || '')) return false;
    return true;
  });

  // 귀속연월 기준으로 데이터 집계
  const monthlyData = filteredRecords.reduce((acc, record) => {
    if (!record.attributionYearMonth || !record.depositAmount) return acc;
    
    const parsed = parseAttributionYearMonth(record.attributionYearMonth);
    if (!parsed) return acc;
    
    // 정렬을 위한 키: "2025-12" 형식
    const monthKey = `${parsed.fullYear}-${parsed.month.padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        monthNum: parsed.monthNum,
        fullYear: parsed.fullYear,
        depositAmount: 0,
        oneTimeExpenseAmount: 0,
        profit: 0,
      };
    }
    
    acc[monthKey].depositAmount += record.depositAmount || 0;
    acc[monthKey].oneTimeExpenseAmount += record.oneTimeExpenseAmount || 0;
    acc[monthKey].profit = acc[monthKey].depositAmount - acc[monthKey].oneTimeExpenseAmount;
    
    return acc;
  }, {} as Record<string, { month: string; monthNum: number; fullYear: number; depositAmount: number; oneTimeExpenseAmount: number; profit: number }>);

  // 월별로 정렬 및 월 표시 형식 변환
  const chartData = Object.values(monthlyData)
    .sort((a, b) => {
      // 연도 우선 정렬, 그 다음 월
      if (a.fullYear !== b.fullYear) {
        return a.fullYear - b.fullYear;
      }
      return a.monthNum - b.monthNum;
    })
    .map(item => {
      // "12월" 형식으로 변환
      const monthLabel = `${item.monthNum}월`;
      return {
        ...item,
        monthLabel,
        depositAmountFormatted: formatCurrency(item.depositAmount),
        profitFormatted: formatCurrency(item.profit),
      };
    });

  // 사용 가능한 연도 목록 생성
  const availableYears = Array.from(
    new Set(
      records
        .filter(r => r.attributionYearMonth)
        .map(r => {
          const parsed = parseAttributionYearMonth(r.attributionYearMonth!);
          return parsed ? parsed.year : null;
        })
        .filter((year): year is string => year !== null)
    )
  ).sort().reverse();

  // 선택된 연도의 총계 계산
  const totalDepositAmount = filteredRecords.reduce((sum, record) => sum + (record.depositAmount || 0), 0);
  const totalOneTimeExpenseAmount = filteredRecords.reduce((sum, record) => sum + (record.oneTimeExpenseAmount || 0), 0);
  const totalProfit = totalDepositAmount - totalOneTimeExpenseAmount;

  // 입금 예정액 총계 계산 (입금 예정기한이 아직 도래하지 않았지만 발생이 확정적인 매출액)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalExpectedAmount = filteredRecords.reduce((sum, record) => {
    if (record.expectedDepositDate && (!record.depositAmount || record.depositAmount === 0)) {
      const depositDate = new Date(record.expectedDepositDate);
      depositDate.setHours(0, 0, 0, 0);
      // 입금 예정일이 오늘 이후인 경우
      if (depositDate >= today) {
        return sum + (record.expectedDepositAmount || 0);
      }
    }
    return sum;
  }, 0);

  // 미수금 총계 계산 (입금 예정일이 지났는데 입금액이 없는 경우, 또는 입금예정일과 입금액이 모두 공백인 경우)
  const totalOutstanding = filteredRecords.reduce((sum, record) => {
    // 입금예정일이 공백이고 입금액이 공백인 경우
    if (!record.expectedDepositDate && (!record.depositAmount || record.depositAmount === 0)) {
      return sum + (record.expectedDepositAmount || 0);
    }
    
    // 입금일이 있고, 입금일이 오늘보다 이전인 경우
    if (record.expectedDepositDate) {
      const depositDate = new Date(record.expectedDepositDate);
      depositDate.setHours(0, 0, 0, 0);
      
      // 입금일이 지났고, 입금액이 없거나 0인 경우
      if (depositDate < today && (!record.depositAmount || record.depositAmount === 0)) {
        return sum + (record.expectedDepositAmount || 0);
      }
    }
    return sum;
  }, 0);

  // 드래그앤드롭 핸들러
  const handleDragStart = (e: React.DragEvent, id: string, from: 'included' | 'excluded') => {
    setDraggedItem({ id, from });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'included' | 'excluded') => {
    e.preventDefault();
    if (!draggedItem) return;

    const id = draggedItem.id;
    const newExcludedIds = new Set(excludedIds);

    // 새 위치에 따라 excludedIds 업데이트
    if (target === 'included') {
      // 매출 집계로 이동: excludedIds에서 제거
      newExcludedIds.delete(id);
    } else {
      // 매출 제외로 이동: excludedIds에 추가
      newExcludedIds.add(id);
    }

    setExcludedIds(newExcludedIds);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 데이터탭용: 모든 레코드 (매출 집계/제외 선택용)
  const allRecordsForDataTabBase = filteredRecordsByYear.filter(r => r.id);
  
  // 연도/월/브랜드 필터 적용
  const allRecordsForDataTab = allRecordsForDataTabBase.filter(record => {
    // 연도/월 필터
    if (filterYear || filterMonth) {
      if (!record.attributionYearMonth) return false;
      const parsed = parseAttributionYearMonth(record.attributionYearMonth);
      if (!parsed) return false;
      
      if (filterYear && parsed.year !== filterYear) return false;
      if (filterMonth && parsed.month !== filterMonth) return false;
    }
    
    // 브랜드명 필터
    if (filterBrand) {
      const brandNames = Array.isArray(record.brandNames) && record.brandNames.length > 0
        ? record.brandNames
        : record.brandName ? [record.brandName] : [];
      const brandMatch = brandNames.some(brand => 
        brand && brand.toLowerCase().includes(filterBrand.toLowerCase())
      );
      if (!brandMatch) return false;
    }
    
    return true;
  });

  // 사용 가능한 브랜드 목록 (데이터탭용)
  const availableBrandsForFilter = Array.from(
    new Set(
      allRecordsForDataTabBase
        .flatMap(r => {
          if (Array.isArray(r.brandNames) && r.brandNames.length > 0) {
            return r.brandNames.filter(b => b);
          }
          return r.brandName ? [r.brandName] : [];
        })
        .filter((brand): brand is string => !!brand)
    )
  ).sort();

  // 사용 가능한 연도 목록 (데이터탭용)
  const availableYearsForFilter = Array.from(
    new Set(
      allRecordsForDataTabBase
        .filter(r => r.attributionYearMonth)
        .map(r => {
          const parsed = parseAttributionYearMonth(r.attributionYearMonth!);
          return parsed ? parsed.year : null;
        })
        .filter((year): year is string => year !== null)
    )
  ).sort().reverse();

  // 사용 가능한 월 목록 (선택된 연도에 따라)
  const availableMonthsForFilter = filterYear
    ? Array.from(
        new Set(
          allRecordsForDataTabBase
            .filter(r => {
              if (!r.attributionYearMonth) return false;
              const parsed = parseAttributionYearMonth(r.attributionYearMonth);
              return parsed && parsed.year === filterYear;
            })
            .map(r => {
              const parsed = parseAttributionYearMonth(r.attributionYearMonth!);
              return parsed ? parsed.month : null;
            })
            .filter((month): month is string => month !== null)
        )
      ).sort((a, b) => parseInt(a) - parseInt(b))
    : [];

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="ml-2 text-gray-300">데이터를 불러오는 중...</span>
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
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 총계 표시 */}
      <Card>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-cyan-500/20 rounded-lg p-4 border border-cyan-500/30">
            <div className="text-sm text-gray-300 mb-1">매출 총계</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {formatCurrency(totalDepositAmount)}
            </div>
            {selectedYear && (
              <div className="text-xs text-gray-400 mt-1">{selectedYear}년</div>
            )}
            <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-cyan-500/30">
              입금 예정액: {formatCurrency(totalExpectedAmount)}
            </div>
            <div className="text-xs text-red-300 mt-1">
              미수금: {formatCurrency(totalOutstanding)}
            </div>
          </div>
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="text-sm text-gray-300 mb-1">이익 총계</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {formatCurrency(totalProfit)}
            </div>
            {selectedYear && (
              <div className="text-xs text-gray-400 mt-1">{selectedYear}년</div>
            )}
          </div>
          <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
            <div className="text-sm text-gray-300 mb-1">실비 총계</div>
            <div className="text-2xl font-bold text-gray-300">
              {formatCurrency(totalOneTimeExpenseAmount)}
            </div>
            {selectedYear && (
              <div className="text-xs text-gray-400 mt-1">{selectedYear}년</div>
            )}
          </div>
        </div>
      </Card>

      {/* 그래프 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">월별 입금액 및 이익 현황</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">연도:</label>
            <SearchableSelect
              value={selectedYear}
              onChange={(value) => setSelectedYear(value || '')}
              options={availableYears.map(year => ({ value: year, label: `${year}년` }))}
              placeholder="연도 선택"
              className="w-32"
            />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 12, fill: '#d1d5db' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#d1d5db' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip 
              formatter={(value: number | undefined, name: string | undefined) => {
                if (value === undefined || value === null) return '-';
                if (name === '입금액' || name === '이익') {
                  return formatCurrency(value);
                }
                return value;
              }}
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px', color: '#d1d5db' }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="depositAmount" 
              fill="#3b82f6" 
              name="입금액"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={3}
              name="이익"
              dot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 데이터탭 */}
      <Card>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">매출 집계 데이터 관리</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">연도:</label>
              <SearchableSelect
                value={filterYear}
                onChange={(value) => {
                  setFilterYear(value || '');
                  setFilterMonth(''); // 연도 변경 시 월 초기화
                }}
                options={[
                  { value: '', label: '전체' },
                  ...availableYearsForFilter.map(year => ({ value: year, label: `${year}년` }))
                ]}
                placeholder="연도 선택"
                className="w-32"
              />
              {filterYear && (
                <>
                  <label className="text-sm text-gray-300 ml-2">월:</label>
                  <SearchableSelect
                    value={filterMonth}
                    onChange={(value) => setFilterMonth(value || '')}
                    options={[
                      { value: '', label: '전체' },
                      ...availableMonthsForFilter.map(month => ({ value: month, label: `${parseInt(month)}월` }))
                    ]}
                    placeholder="월 선택"
                    className="w-28"
                  />
                </>
              )}
              <label className="text-sm text-gray-300 ml-2">브랜드:</label>
              <input
                type="text"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                placeholder="브랜드명 검색"
                className="w-40 px-3 py-1.5 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 placeholder-gray-500 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-cyan-400">
              매출 집계: <span className="font-bold">{allRecordsForDataTab.filter(r => !excludedIds.has(r.id || '')).length}개</span>
            </div>
            <div className="text-red-400">
              매출 제외: <span className="font-bold">{allRecordsForDataTab.filter(r => excludedIds.has(r.id || '')).length}개</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 왼쪽: 매출 집계 */}
              <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/10">
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">매출 집계</h4>
                <div 
                  className="min-h-[400px] max-h-[600px] overflow-y-auto space-y-2"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'included')}
                >
                  {allRecordsForDataTab
                    .filter(r => !excludedIds.has(r.id || ''))
                    .map((record) => (
                      <div
                        key={record.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, record.id || '', 'included')}
                        onDragEnd={handleDragEnd}
                        className="bg-slate-700/50 border border-cyan-500/30 rounded p-3 cursor-move hover:bg-slate-700/70 transition-colors flex items-center gap-2"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-7 gap-2 text-xs">
                            <div>
                              <div className="text-gray-400 mb-1">거래유형</div>
                              <div className="text-gray-200">{record.category || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">프로젝트 유형</div>
                              <div className="text-gray-200">{record.projectCategory || record.project || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">Project Name</div>
                              <div className="text-gray-200 truncate">{record.projectName || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">브랜드명</div>
                              <div className="text-gray-200">
                                {Array.isArray(record.brandNames) && record.brandNames.length > 0
                                  ? record.brandNames.join(', ')
                                  : record.brandName || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">입금액</div>
                              <div className="text-gray-200">{formatCurrency(record.depositAmount || 0)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">세금계산서 발행 공급가</div>
                              <div className="text-gray-200">{record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice) : '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">입금일</div>
                              <div className="text-gray-200">{record.depositDate ? formatDate(record.depositDate) : '-'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {allRecordsForDataTab.filter(r => !excludedIds.has(r.id || '')).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      드래그하여 데이터를 추가하세요
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 매출 제외 */}
              <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/10">
                <h4 className="text-lg font-semibold text-red-400 mb-3">매출 제외</h4>
                <div 
                  className="min-h-[400px] max-h-[600px] overflow-y-auto space-y-2"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'excluded')}
                >
                  {allRecordsForDataTab
                    .filter(r => excludedIds.has(r.id || ''))
                    .map((record) => (
                      <div
                        key={record.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, record.id || '', 'excluded')}
                        onDragEnd={handleDragEnd}
                        className="bg-slate-700/50 border border-red-500/30 rounded p-3 cursor-move hover:bg-slate-700/70 transition-colors flex items-center gap-2"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-7 gap-2 text-xs">
                            <div>
                              <div className="text-gray-400 mb-1">거래유형</div>
                              <div className="text-gray-200">{record.category || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">프로젝트 유형</div>
                              <div className="text-gray-200">{record.projectCategory || record.project || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">Project Name</div>
                              <div className="text-gray-200 truncate">{record.projectName || '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">브랜드명</div>
                              <div className="text-gray-200">
                                {Array.isArray(record.brandNames) && record.brandNames.length > 0
                                  ? record.brandNames.join(', ')
                                  : record.brandName || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">입금액</div>
                              <div className="text-gray-200">{formatCurrency(record.depositAmount || 0)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">세금계산서 발행 공급가</div>
                              <div className="text-gray-200">{record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice) : '-'}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">입금일</div>
                              <div className="text-gray-200">{record.depositDate ? formatDate(record.depositDate) : '-'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {allRecordsForDataTab.filter(r => excludedIds.has(r.id || '')).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      드래그하여 데이터를 추가하세요
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              💡 드래그앤드롭으로 데이터를 이동하여 매출 집계에 포함/제외할 수 있습니다.
            </div>
          </div>
      </Card>
    </div>
  );
}


