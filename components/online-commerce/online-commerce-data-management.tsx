'use client';

import { useEffect, useState } from 'react';
import { OnlineCommerceTeam, ProjectMonthlyExpense } from '@/lib/types';
import { formatCurrency, formatDate, generateMonthRange } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { ACCOUNTING_REQUIRED_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface OnlineCommerceDataManagementProps {
  refreshKey?: number;
}

export function OnlineCommerceDataManagement({ refreshKey }: OnlineCommerceDataManagementProps) {
  const [records, setRecords] = useState<OnlineCommerceTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ id: string; from: 'included' | 'excluded' } | null>(null);
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  
  // 회계 데이터 관리 상태
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>(''); // "category|projectCategory|projectName|companyName" 형식
  const [selectedProjectRecords, setSelectedProjectRecords] = useState<OnlineCommerceTeam[]>([]); // 선택된 프로젝트의 모든 레코드
  const [accountingData, setAccountingData] = useState<{
    projectPeriodStart: string;
    projectPeriodEnd: string;
    targetMarginRate: number | null;
    finalMonthActualCost: number | null;
    finalMonthActualCostCurrency: string; // 'KRW' | 'USD'
    monthlyExpenses: ProjectMonthlyExpense[];
  }>({
    projectPeriodStart: '',
    projectPeriodEnd: '',
    targetMarginRate: null,
    finalMonthActualCost: null,
    finalMonthActualCostCurrency: 'KRW',
    monthlyExpenses: [],
  });
  const [isSavingAccounting, setIsSavingAccounting] = useState(false);
  const [projectAccountingStatusMap, setProjectAccountingStatusMap] = useState<Map<string, '미입력' | '진행중' | '완료'>>(new Map());
  const [accountingDataMap, setAccountingDataMap] = useState<Map<string, {
    projectPeriodStart: string;
    projectPeriodEnd: string;
    targetMarginRate: number | null;
    finalMonthActualCost: number | null;
    monthlyExpenses: ProjectMonthlyExpense[];
  }>>(new Map());

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
    const savedExcluded = localStorage.getItem('online_commerce_excluded_ids');
    if (savedExcluded) {
      setExcludedIds(new Set(JSON.parse(savedExcluded)));
    }
  }, []);

  // refreshKey가 변경되면 데이터 새로고침
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // 선택 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (excludedIds.size > 0) {
      localStorage.setItem('online_commerce_excluded_ids', JSON.stringify(Array.from(excludedIds)));
    } else {
      localStorage.removeItem('online_commerce_excluded_ids');
    }
  }, [excludedIds]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/income-records?team=online_commerce');
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.success) {
        const recordsData = data.data || [];
        setRecords(recordsData);
        
        // 회계 데이터 입력 상태 확인을 위한 데이터 로드
        await loadProjectAccountingStatus(recordsData);
      } else {
        throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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
  const allRecordsForDataTabBase = records.filter(r => r.id);
  
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

  // 회계 데이터 불러오기
  const fetchAccountingData = async (incomeRecordId: string) => {
    try {
      const response = await fetch(`/api/accounting?incomeRecordId=${incomeRecordId}`);
      if (!response.ok) {
        throw new Error('회계 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.success) {
        // monthlyExpenses 데이터 형식 확인 및 변환
        const monthlyExpenses = (data.data.monthlyExpenses || []).map((exp: any) => ({
          id: exp.id,
          incomeRecordId: exp.income_record_id || incomeRecordId,
          month: exp.month,
          expenseAmount: typeof exp.expense_amount === 'number' ? exp.expense_amount : (typeof exp.expenseAmount === 'number' ? exp.expenseAmount : 0),
          expenseCurrency: exp.expense_currency || exp.expenseCurrency || 'KRW',
        }));
        
        console.log('회계 데이터 불러오기 성공:', {
          projectPeriodStart: data.data.projectPeriodStart,
          projectPeriodEnd: data.data.projectPeriodEnd,
          targetMarginRate: data.data.targetMarginRate,
          finalMonthActualCost: data.data.finalMonthActualCost,
          finalMonthActualCostCurrency: data.data.finalMonthActualCostCurrency,
          monthlyExpenses: monthlyExpenses,
        });
        
        setAccountingData({
          projectPeriodStart: data.data.projectPeriodStart || '',
          projectPeriodEnd: data.data.projectPeriodEnd || '',
          targetMarginRate: data.data.targetMarginRate || null,
          finalMonthActualCost: data.data.finalMonthActualCost || null,
          finalMonthActualCostCurrency: data.data.finalMonthActualCostCurrency || 'KRW',
          monthlyExpenses: monthlyExpenses,
        });
      }
    } catch (err) {
      console.error('회계 데이터 불러오기 오류:', err);
      setError(err instanceof Error ? err.message : '회계 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 프로젝트 그룹화 (거래 유형, 프로젝트 유형, Project Name, 회사명이 모두 동일한 경우)
  // 매출 집계에 포함된 데이터만 필터링 (excludedIds에 포함되지 않은 데이터)
  // 회계 데이터 관리가 필요한 카테고리만 필터링
  const includedRecords = records.filter(r => r.id && !excludedIds.has(r.id));
  const accountingRecords = includedRecords.filter(r => 
    r.category && ACCOUNTING_REQUIRED_CATEGORIES.includes(r.category as any)
  );
  
  // 디버깅: 필터링 전후 데이터 수 확인
  console.log('=== 회계 데이터 관리 프로젝트 선택창 디버깅 ===');
  console.log('전체 레코드 수:', records.length);
  console.log('매출 집계 포함 레코드 수:', includedRecords.length);
  console.log('회계 데이터 관리 카테고리 레코드 수:', accountingRecords.length);
  
  const missingFields = accountingRecords.filter(r => 
    !r.projectCategory || !r.projectName || !r.companyName
  );
  if (missingFields.length > 0) {
    console.log('필수 필드 누락 레코드 수:', missingFields.length);
    console.log('필수 필드 누락 레코드 상세:', missingFields.map(r => ({
      id: r.id,
      category: r.category,
      projectCategory: r.projectCategory,
      projectName: r.projectName,
      companyName: r.companyName,
      hasProjectCategory: !!r.projectCategory,
      hasProjectName: !!r.projectName,
      hasCompanyName: !!r.companyName,
    })));
  }
  
  const groupedProjects = accountingRecords
    .filter(r => {
      // 필수 필드 확인
      // projectCategory, projectName, companyName이 모두 있어야 그룹화 가능
      const hasAllFields = r.projectCategory && r.projectName && r.companyName;
      if (!hasAllFields) {
        console.log('필터링 제외 레코드:', {
          id: r.id,
          category: r.category,
          projectCategory: r.projectCategory,
          projectName: r.projectName,
          companyName: r.companyName,
        });
      }
      return hasAllFields;
    })
    .reduce((acc, record) => {
      const key = `${record.category}|${record.projectCategory}|${record.projectName}|${record.companyName}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      
      // 디버깅: "kahi 마케팅 지원금"이 포함된 레코드 로깅
      if (record.projectName && record.projectName.includes('kahi 마케팅 지원금')) {
        console.log('kahi 마케팅 지원금 그룹화:', {
          key: key,
          projectName: record.projectName,
          category: record.category,
          projectCategory: record.projectCategory,
          companyName: record.companyName,
          id: record.id,
        });
      }
      
      return acc;
    }, {} as Record<string, OnlineCommerceTeam[]>);
  
  // 그룹화 결과 확인
  console.log('그룹화된 프로젝트 상세:', Object.entries(groupedProjects).map(([key, records]) => ({
    key,
    count: records.length,
    projectNames: records.map(r => r.projectName),
    ids: records.map(r => r.id),
  })));
  
  console.log('그룹화된 프로젝트 수:', Object.keys(groupedProjects).length);
  console.log('그룹화된 프로젝트 키:', Object.keys(groupedProjects));

  const uniqueProjectKeys = Object.keys(groupedProjects);

  // 프로젝트 선택 핸들러
  const handleProjectSelect = (projectKey: string) => {
    setSelectedProjectKey(projectKey);
    if (projectKey) {
      const projectRecords = groupedProjects[projectKey] || [];
      setSelectedProjectRecords(projectRecords);
      // 첫 번째 레코드의 회계 데이터 불러오기
      if (projectRecords.length > 0 && projectRecords[0].id) {
        fetchAccountingData(projectRecords[0].id);
      }
    } else {
      setSelectedProjectRecords([]);
      setAccountingData({
        projectPeriodStart: '',
        projectPeriodEnd: '',
        targetMarginRate: null,
        finalMonthActualCost: null,
        finalMonthActualCostCurrency: 'KRW',
        monthlyExpenses: [],
      });
    }
  };

  // 월 형식 변환: "YYYY-MM" -> "YYMM" (예: "2025-01" -> "2501")
  const convertMonthToFormat = (monthString: string): string => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    if (!year || !month) return '';
    const shortYear = year.substring(2, 4);
    return `${shortYear}${month}`;
  };

  // 월 형식 변환: "YYMM" -> "YYYY-MM" (예: "2501" -> "2025-01")
  const convertFormatToMonth = (formatString: string): string => {
    if (!formatString || formatString.length !== 4) return '';
    const year = `20${formatString.substring(0, 2)}`;
    const month = formatString.substring(2, 4);
    return `${year}-${month}`;
  };

  // 회계 데이터 입력 상태 확인 함수
  const getAccountingStatus = (
    projectPeriodStart: string | null | undefined,
    projectPeriodEnd: string | null | undefined,
    targetMarginRate: number | null | undefined,
    finalMonthActualCost: number | null | undefined,
    monthlyExpenses: ProjectMonthlyExpense[]
  ): '미입력' | '진행중' | '완료' => {
    // 미입력: 프로젝트 수행 기간이 없음
    if (!projectPeriodStart || !projectPeriodEnd) {
      return '미입력';
    }

    // 완료 조건 확인
    const hasManagementAccounting = targetMarginRate !== null && targetMarginRate !== undefined && 
                                    finalMonthActualCost !== null && finalMonthActualCost !== undefined;
    
    // 리얼회계 완료 조건: 프로젝트 수행 기간의 모든 월에 대해 실비가 입력되어 있어야 함
    let hasRealAccounting = false;
    if (projectPeriodStart && projectPeriodEnd) {
      const months = generateMonthRange(projectPeriodStart, projectPeriodEnd);
      hasRealAccounting = months.length > 0 && months.every(month => 
        monthlyExpenses.some(exp => exp.month === month && exp.expenseAmount > 0)
      );
    }

    // 완료: 관리회계와 리얼회계 모두 완료
    if (hasManagementAccounting && hasRealAccounting) {
      return '완료';
    }

    // 진행중: 프로젝트 수행 기간은 있지만 완료 조건을 만족하지 않음
    return '진행중';
  };

  // 프로젝트별 회계 데이터 입력 상태 로드
  const loadProjectAccountingStatus = async (recordsData: OnlineCommerceTeam[]) => {
    const accountingRecords = recordsData.filter((r: OnlineCommerceTeam) => 
      r.id && 
      r.category && 
      ACCOUNTING_REQUIRED_CATEGORIES.includes(r.category as any)
    );

    if (accountingRecords.length === 0) return;

    try {
      const recordIds = accountingRecords.map(r => r.id).filter((id): id is string => !!id);
      const accountingResponse = await fetch(`/api/accounting?incomeRecordIds=${recordIds.join(',')}`);
      if (accountingResponse.ok) {
        const accountingData = await accountingResponse.json();
        if (accountingData.success) {
          const statusMap = new Map<string, '미입력' | '진행중' | '완료'>();
          
          // 프로젝트 그룹화
          const projectGroups = accountingRecords.reduce((acc, record) => {
            const key = `${record.category}|${record.projectCategory}|${record.projectName}|${record.companyName}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(record);
            return acc;
          }, {} as Record<string, OnlineCommerceTeam[]>);

          // 각 프로젝트 그룹의 상태 확인 (첫 번째 레코드 기준)
          Object.keys(projectGroups).forEach(projectKey => {
            const projectRecords = projectGroups[projectKey];
            const firstRecord = projectRecords[0];
            if (firstRecord && firstRecord.id) {
              const apiData = accountingData.data[firstRecord.id];
              const record = accountingRecords.find(r => r.id === firstRecord.id);
              
              if (apiData && record) {
                const status = getAccountingStatus(
                  record.projectPeriodStart || apiData.projectPeriodStart,
                  record.projectPeriodEnd || apiData.projectPeriodEnd,
                  record.targetMarginRate ?? apiData.targetMarginRate,
                  record.finalMonthActualCost ?? apiData.finalMonthActualCost,
                  apiData.monthlyExpenses || []
                );
                statusMap.set(projectKey, status);
              } else if (record) {
                const status = getAccountingStatus(
                  record.projectPeriodStart,
                  record.projectPeriodEnd,
                  record.targetMarginRate,
                  record.finalMonthActualCost,
                  []
                );
                statusMap.set(projectKey, status);
              } else {
                statusMap.set(projectKey, '미입력');
              }
            }
          });
          
          setProjectAccountingStatusMap(statusMap);
        }
      }
    } catch (err) {
      console.error('회계 데이터 상태 확인 실패:', err);
    }
  };

  // 회계 데이터 저장
  const handleSaveAccountingData = async () => {
    if (!selectedProjectKey || selectedProjectRecords.length === 0) return;
    
    try {
      setIsSavingAccounting(true);
      
      // 선택된 프로젝트의 모든 레코드에 회계 데이터 저장
      for (const record of selectedProjectRecords) {
        if (record.id) {
          const response = await fetch('/api/accounting', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              incomeRecordId: record.id,
              projectPeriodStart: accountingData.projectPeriodStart,
              projectPeriodEnd: accountingData.projectPeriodEnd,
              targetMarginRate: accountingData.targetMarginRate,
              finalMonthActualCost: accountingData.finalMonthActualCost,
              finalMonthActualCostCurrency: accountingData.finalMonthActualCostCurrency,
              monthlyExpenses: accountingData.monthlyExpenses.map(exp => ({
                month: exp.month,
                expenseAmount: exp.expenseAmount,
                expenseCurrency: exp.expenseCurrency || 'KRW',
              })),
            }),
          });

          if (!response.ok) {
            throw new Error('회계 데이터 저장에 실패했습니다.');
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || '회계 데이터 저장에 실패했습니다.');
          }
        }
      }
      
      alert('회계 데이터가 저장되었습니다.');
      // 저장 후 데이터 새로고침 및 상태 업데이트
      await fetchRecords();
    } catch (err) {
      console.error('회계 데이터 저장 오류:', err);
      alert(err instanceof Error ? err.message : '회계 데이터 저장에 실패했습니다.');
    } finally {
      setIsSavingAccounting(false);
    }
  };

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
      {/* 매출 집계 데이터 관리 */}
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
                              <div className="text-gray-200 break-words whitespace-normal">{record.projectName || '-'}</div>
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
                              <div className="text-gray-200">{formatCurrency(record.depositAmount || 0, record.depositCurrency || 'KRW')}</div>
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
                              <div className="text-gray-200 break-words whitespace-normal">{record.projectName || '-'}</div>
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
                              <div className="text-gray-200">{formatCurrency(record.depositAmount || 0, record.depositCurrency || 'KRW')}</div>
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

      {/* 회계 데이터 관리 섹션 */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">회계 데이터 관리</h3>
          
          {/* 프로젝트 선택 - 상태별로 구분 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              프로젝트 선택
            </label>
            <div className="grid grid-cols-3 gap-4">
              {/* 미입력 프로젝트 */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  ⚪ 미입력
                </label>
                <SearchableSelect
                  value={selectedProjectKey && (projectAccountingStatusMap.get(selectedProjectKey) || '미입력') === '미입력' ? selectedProjectKey : ''}
                  onChange={(value) => handleProjectSelect(value)}
                  options={uniqueProjectKeys
                    .filter(key => (projectAccountingStatusMap.get(key) || '미입력') === '미입력')
                    .map(key => {
                      const projectRecords = groupedProjects[key];
                      const firstRecord = projectRecords[0];
                      const brandNames = Array.isArray(firstRecord.brandNames) && firstRecord.brandNames.length > 0
                        ? firstRecord.brandNames.join(', ')
                        : firstRecord.brandName || '';
                      // key를 포함하여 고유성 보장 (디버깅용)
                      const label = `${firstRecord.projectName}${brandNames ? ` [${brandNames}]` : ''} (${firstRecord.category} / ${firstRecord.projectCategory} / ${firstRecord.companyName})`;
                      return {
                        value: key,
                        label: label,
                      };
                    })
                    .filter((option, index, self) => 
                      // value 기준으로 중복 제거 (SearchableSelect의 중복 제거와 별도로)
                      index === self.findIndex(o => o.value === option.value)
                    )}
                  placeholder="선택하세요"
                />
              </div>

              {/* 진행중 프로젝트 */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  🟡 진행중
                </label>
                <SearchableSelect
                  value={selectedProjectKey && (projectAccountingStatusMap.get(selectedProjectKey) || '미입력') === '진행중' ? selectedProjectKey : ''}
                  onChange={(value) => handleProjectSelect(value)}
                  options={uniqueProjectKeys
                    .filter(key => (projectAccountingStatusMap.get(key) || '미입력') === '진행중')
                    .map(key => {
                      const projectRecords = groupedProjects[key];
                      const firstRecord = projectRecords[0];
                      const brandNames = Array.isArray(firstRecord.brandNames) && firstRecord.brandNames.length > 0
                        ? firstRecord.brandNames.join(', ')
                        : firstRecord.brandName || '';
                      const label = `${firstRecord.projectName}${brandNames ? ` [${brandNames}]` : ''} (${firstRecord.category} / ${firstRecord.projectCategory} / ${firstRecord.companyName})`;
                      return {
                        value: key,
                        label: label,
                      };
                    })}
                  placeholder="선택하세요"
                />
              </div>

              {/* 완료 프로젝트 */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  🟢 완료
                </label>
                <SearchableSelect
                  value={selectedProjectKey && (projectAccountingStatusMap.get(selectedProjectKey) || '미입력') === '완료' ? selectedProjectKey : ''}
                  onChange={(value) => handleProjectSelect(value)}
                  options={uniqueProjectKeys
                    .filter(key => (projectAccountingStatusMap.get(key) || '미입력') === '완료')
                    .map(key => {
                      const projectRecords = groupedProjects[key];
                      const firstRecord = projectRecords[0];
                      const brandNames = Array.isArray(firstRecord.brandNames) && firstRecord.brandNames.length > 0
                        ? firstRecord.brandNames.join(', ')
                        : firstRecord.brandName || '';
                      const label = `${firstRecord.projectName}${brandNames ? ` [${brandNames}]` : ''} (${firstRecord.category} / ${firstRecord.projectCategory} / ${firstRecord.companyName})`;
                      return {
                        value: key,
                        label: label,
                      };
                    })}
                  placeholder="선택하세요"
                />
              </div>
            </div>
          </div>

          {selectedProjectKey && selectedProjectRecords.length > 0 && (
            <>
              {/* 프로젝트 정보 표시 */}
              <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">프로젝트 정보</h4>
                <div className="space-y-3">
                  {selectedProjectRecords.map((record, index) => (
                    <div key={record.id || index} className="grid grid-cols-4 gap-4 text-sm pb-3 border-b border-slate-600/30 last:border-b-0">
                      <div>
                        <div className="text-gray-400 mb-1">입금일자</div>
                        <div className="text-gray-200">{record.depositDate ? formatDate(record.depositDate) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">입금액</div>
                        <div className="text-gray-200">{record.depositAmount ? formatCurrency(record.depositAmount, record.depositCurrency || 'KRW') : '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">선/잔금 비율</div>
                        <div className="text-gray-200">{record.ratio || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">세금계산서 발행 공급가</div>
                        <div className="text-gray-200">{record.invoiceSupplyPrice ? formatCurrency(record.invoiceSupplyPrice) : '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 프로젝트 수행 기간 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    프로젝트 수행 기간 시작월
                  </label>
                  <input
                    type="month"
                    value={convertFormatToMonth(accountingData.projectPeriodStart)}
                    onChange={(e) => {
                      const monthFormat = convertMonthToFormat(e.target.value);
                      setAccountingData(prev => ({ ...prev, projectPeriodStart: monthFormat }));
                    }}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    프로젝트 수행 기간 종료월
                  </label>
                  <input
                    type="month"
                    value={convertFormatToMonth(accountingData.projectPeriodEnd)}
                    onChange={(e) => {
                      const monthFormat = convertMonthToFormat(e.target.value);
                      setAccountingData(prev => ({ ...prev, projectPeriodEnd: monthFormat }));
                    }}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              {/* 관리회계 설정 */}
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-400 mb-4">관리회계 설정</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      타겟 마진율 (%)
                    </label>
                    <input
                      type="number"
                      value={accountingData.targetMarginRate || ''}
                      onChange={(e) => setAccountingData(prev => ({ ...prev, targetMarginRate: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="예: 25"
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      프로젝트 최종 실비(VAT제외)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={accountingData.finalMonthActualCost || ''}
                        onChange={(e) => setAccountingData(prev => ({ ...prev, finalMonthActualCost: e.target.value ? parseFloat(e.target.value) : null }))}
                        placeholder="예: 100000000"
                        className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                      />
                      <select
                        value={accountingData.finalMonthActualCostCurrency}
                        onChange={(e) => setAccountingData(prev => ({ ...prev, finalMonthActualCostCurrency: e.target.value }))}
                        className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                      >
                        <option value="KRW">KRW</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 리얼회계 설정 */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-400 mb-4">리얼회계 설정 - 월별 실비 집행액</h4>
                {accountingData.projectPeriodStart && accountingData.projectPeriodEnd && (
                  <div className="space-y-2">
                    {generateMonthRange(accountingData.projectPeriodStart, accountingData.projectPeriodEnd).map(month => {
                      const existingExpense = accountingData.monthlyExpenses.find(e => e.month === month);
                      // 저장된 값이 있으면 표시 (0도 유효한 값이므로 표시)
                      const expenseAmount = existingExpense !== undefined ? (existingExpense.expenseAmount || 0) : '';
                      const expenseCurrency = existingExpense?.expenseCurrency || 'KRW';
                      return (
                        <div key={month} className="flex items-center gap-4">
                          <label className="w-24 text-sm text-gray-300">{formatMonth(month)}</label>
                          <input
                            type="number"
                            value={expenseAmount}
                            onChange={(e) => {
                              const amount = e.target.value ? parseFloat(e.target.value) : 0;
                              setAccountingData(prev => {
                                const existing = prev.monthlyExpenses.find(e => e.month === month);
                                const currentCurrency = existing?.expenseCurrency || 'KRW';
                                const newExpenses = existing
                                  ? prev.monthlyExpenses.map(e => e.month === month ? { ...e, expenseAmount: amount } : e)
                                  : [...prev.monthlyExpenses, { incomeRecordId: selectedProjectRecords[0]?.id || '', month, expenseAmount: amount, expenseCurrency: 'KRW' }];
                                return { ...prev, monthlyExpenses: newExpenses };
                              });
                            }}
                            placeholder="실비 집행액"
                            className="flex-1 px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                          />
                          <select
                            value={expenseCurrency}
                            onChange={(e) => {
                              setAccountingData(prev => {
                                const existing = prev.monthlyExpenses.find(e => e.month === month);
                                const newExpenses = existing
                                  ? prev.monthlyExpenses.map(ex => ex.month === month ? { ...ex, expenseCurrency: e.target.value } : ex)
                                  : [...prev.monthlyExpenses, { incomeRecordId: selectedProjectRecords[0]?.id || '', month, expenseAmount: 0, expenseCurrency: e.target.value }];
                                return { ...prev, monthlyExpenses: newExpenses };
                              });
                            }}
                            className="px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-black/40 backdrop-blur-sm text-gray-200"
                          >
                            <option value="KRW">KRW</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!accountingData.projectPeriodStart || !accountingData.projectPeriodEnd) && (
                  <p className="text-gray-400 text-sm">프로젝트 수행 기간을 먼저 입력해주세요.</p>
                )}
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAccountingData}
                  disabled={isSavingAccounting}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {isSavingAccounting ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// 헬퍼 함수들
function generateMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  if (!start || !end || start.length !== 4 || end.length !== 4) return months;
  
  const startYear = parseInt(start.substring(0, 2));
  const startMonth = parseInt(start.substring(2, 4));
  const endYear = parseInt(end.substring(0, 2));
  const endMonth = parseInt(end.substring(2, 4));
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push(`${currentYear.toString().padStart(2, '0')}${currentMonth.toString().padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return months;
}

function formatMonth(month: string): string {
  if (!month || month.length !== 4) return month;
  const year = month.substring(0, 2);
  const monthNum = month.substring(2, 4);
  return `${year}년 ${parseInt(monthNum)}월`;
}

