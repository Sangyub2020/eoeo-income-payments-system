import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  const locale = currency === 'USD' ? 'en-US' : 'ko-KR';
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
  };
  
  // USD의 경우 소수점 없이 정수만 표시
  if (currency === 'USD') {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  
  return new Intl.NumberFormat(locale, options).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// 회계 계산 관련 유틸리티 함수

// 월 문자열을 개월 수로 변환 (예: "2501" -> 1, "2506" -> 6)
export function monthStringToNumber(month: string): number {
  if (!month || month.length !== 4) return 0;
  const year = parseInt(month.substring(0, 2));
  const monthNum = parseInt(month.substring(2, 4));
  return year * 12 + monthNum;
}

// 두 월 사이의 개월 수 계산
export function monthsBetween(start: string, end: string): number {
  const startNum = monthStringToNumber(start);
  const endNum = monthStringToNumber(end);
  return Math.max(0, endNum - startNum + 1);
}

// 월 범위 생성 (예: "2501", "2506" -> ["2501", "2502", "2503", "2504", "2505", "2506"])
export function generateMonthRange(start: string, end: string): string[] {
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

// 관리회계 관점: 월별 매출/이익 계산
export interface ManagementAccountingResult {
  month: string; // "2501" 형식
  revenue: number; // 해당 월 매출
  profit: number; // 해당 월 이익
}

export function calculateManagementAccounting(
  depositAmount: number,
  projectPeriodStart: string,
  projectPeriodEnd: string,
  targetMarginRate: number | null,
  finalMonthActualCost: number | null
): ManagementAccountingResult[] {
  const results: ManagementAccountingResult[] = [];
  
  if (!projectPeriodStart || !projectPeriodEnd) {
    return results;
  }
  
  const monthRange = generateMonthRange(projectPeriodStart, projectPeriodEnd);
  const monthCount = monthRange.length;
  
  if (monthCount === 0) {
    return results;
  }
  
  // 각 달 매출 = 입금액 / 개월 수
  const monthlyRevenue = depositAmount / monthCount;
  
  // 타겟 마진율이 있는 경우
  const marginRate = targetMarginRate ? targetMarginRate / 100 : 0;
  
  monthRange.forEach((month, index) => {
    const isLastMonth = index === monthRange.length - 1;
    
    let profit: number;
    
    if (isLastMonth && finalMonthActualCost !== null) {
      // 마지막달: 실제 총 비용으로 보정
      profit = monthlyRevenue - finalMonthActualCost;
    } else {
      // 일반 달: 타겟 마진율로 계산
      profit = monthlyRevenue * marginRate;
    }
    
    results.push({
      month,
      revenue: monthlyRevenue,
      profit,
    });
  });
  
  return results;
}

// 리얼회계 관점: 월별 매출/이익 계산
export interface RealAccountingResult {
  month: string; // "2501" 형식
  revenue: number; // 해당 월 매출
  profit: number; // 해당 월 이익
  expense: number; // 해당 월 실비 집행액
}

export function calculateRealAccounting(
  depositAmount: number,
  projectPeriodStart: string,
  projectPeriodEnd: string,
  monthlyExpenses: Array<{ month: string; expenseAmount: number }>
): RealAccountingResult[] {
  const results: RealAccountingResult[] = [];
  
  if (!projectPeriodStart || !projectPeriodEnd) {
    return results;
  }
  
  const monthRange = generateMonthRange(projectPeriodStart, projectPeriodEnd);
  
  // 실비 집행액 맵 생성
  const expenseMap = new Map<string, number>();
  monthlyExpenses.forEach(exp => {
    expenseMap.set(exp.month, exp.expenseAmount || 0);
  });
  
  monthRange.forEach((month, index) => {
    const isFirstMonth = index === 0;
    const expense = expenseMap.get(month) || 0;
    
    // 첫달에만 매출 인식, 나머지는 0
    const revenue = isFirstMonth ? depositAmount : 0;
    
    // 이익 = 매출 - 실비
    const profit = revenue - expense;
    
    results.push({
      month,
      revenue,
      profit,
      expense,
    });
  });
  
  return results;
}



