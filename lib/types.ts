export interface Income {
  id?: string;
  date: string;
  brand: string;
  platform: string;
  amount: number;
  status: 'pending' | 'received' | 'overdue';
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id?: string;
  date: string;
  brand: string;
  platform: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OutstandingPayment {
  id: string;
  brand: string;
  platform: string;
  totalAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  expectedDate?: string;
  status: 'pending' | 'overdue';
}

export interface PaymentForecast {
  date: string;
  expectedAmount: number;
  platform: string;
  brand: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalPayments: number;
  outstandingAmount: number;
  overdueAmount: number;
  pendingIncome: number;
  pendingPayments: number;
}

export interface Vendor {
  id?: string;
  code: string;
  name: string;
  businessNumber?: string;
  invoiceEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id?: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InfluencerAccount {
  id?: string;
  email?: string;
  tiktokHandle?: string;
  tiktokHandles?: string[]; // Business일 때 복수 계정
  instagramHandles?: string[]; // Business일 때 복수 계정
  recipientType?: 'Personal' | 'Business';
  fullName: string;
  achRoutingNumber?: string;
  swiftCode?: string;
  accountNumber?: string;
  accountType?: string;
  wiseTag?: string;
  address?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnlineCommerceTeam {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  brandNames?: string[];
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  projectCode2?: string;
  projectCode3?: string;
  project?: string;
  projectCategory?: string;
  projectCategory2?: string;
  projectCategory3?: string;
  projectName?: string;
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: string;
  expectedDepositDate?: string;
  depositStatus?: '입금완료' | '입금예정' | '입금지연';
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  expectedDepositCurrency?: string;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  depositCurrency?: string;
  createdDate?: string;
  invoiceCopy?: string;
  invoiceAttachmentStatus?: 'required' | 'completed' | 'not_required'; // 첨부필요, 첨부완료, 첨부 불요
  issueNotes?: string;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  // 회계 데이터 관리 필드
  projectPeriodStart?: string; // 예: "2501" (25년 1월)
  projectPeriodEnd?: string; // 예: "2506" (25년 6월)
  targetMarginRate?: number; // 타겟 마진율 (예: 25.00)
  finalMonthActualCost?: number; // 마지막달 실제 총 비용
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean; // 필수 항목 누락 경고 플래그
}

export interface GlobalMarketingTeam {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  brandNames?: string[];
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  projectCode2?: string;
  projectCode3?: string;
  project?: string;
  projectCategory?: string;
  projectCategory2?: string;
  projectCategory3?: string;
  projectName?: string;
  projectName2?: string;
  projectName3?: string;
  projectName4?: string;
  projectName5?: string;
  projectName6?: string;
  projectName7?: string;
  projectName8?: string;
  projectName9?: string;
  projectName10?: string;
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: string;
  expectedDepositDate?: string;
  depositStatus?: '입금완료' | '입금예정' | '입금지연';
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  expectedDepositCurrency?: string;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  depositCurrency?: string;
  createdDate?: string;
  invoiceCopy?: string;
  invoiceAttachmentStatus?: 'required' | 'completed' | 'not_required'; // 첨부필요, 첨부완료, 첨부 불요
  issueNotes?: string;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  // 회계 데이터 관리 필드
  projectPeriodStart?: string; // 예: "2501" (25년 1월)
  projectPeriodEnd?: string; // 예: "2506" (25년 6월)
  targetMarginRate?: number; // 타겟 마진율 (예: 25.00)
  finalMonthActualCost?: number; // 마지막달 실제 총 비용
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean;
}

export interface OtherIncome {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  brandNames?: string[];
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  projectCode2?: string;
  projectCode3?: string;
  project?: string;
  projectCategory?: string;
  projectCategory2?: string;
  projectCategory3?: string;
  projectName?: string;
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: string;
  expectedDepositDate?: string;
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  expectedDepositCurrency?: string;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  depositCurrency?: string;
  depositStatus?: '입금완료' | '입금예정' | '입금지연';
  createdDate?: string;
  invoiceCopy?: string;
  invoiceAttachmentStatus?: 'required' | 'completed' | 'not_required'; // 첨부필요, 첨부완료, 첨부 불요
  issueNotes?: string;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  // 회계 데이터 관리 필드
  projectPeriodStart?: string; // 예: "2501" (25년 1월)
  projectPeriodEnd?: string; // 예: "2506" (25년 6월)
  targetMarginRate?: number; // 타겟 마진율 (예: 25.00)
  finalMonthActualCost?: number; // 마지막달 실제 총 비용
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean; // 필수 항목 누락 경고 플래그
}

export interface GlobalSalesTeam {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  brandNames?: string[];
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  projectCode2?: string;
  projectCode3?: string;
  project?: string;
  projectCategory?: string;
  projectCategory2?: string;
  projectCategory3?: string;
  projectName?: string; // 긴 형식의 프로젝트명
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  invoiceLink?: string;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: string;
  expectedDepositDate?: string;
  depositStatus?: '입금완료' | '입금예정' | '입금지연';
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  expectedDepositCurrency?: string;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  depositCurrency?: string;
  createdDate?: string;
  invoiceCopy?: string;
  invoiceAttachmentStatus?: 'required' | 'completed' | 'not_required'; // 첨부필요, 첨부완료, 첨부 불요
  issueNotes?: string;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  // 회계 데이터 관리 필드
  projectPeriodStart?: string; // 예: "2501" (25년 1월)
  projectPeriodEnd?: string; // 예: "2506" (25년 6월)
  targetMarginRate?: number; // 타겟 마진율 (예: 25.00)
  finalMonthActualCost?: number; // 마지막달 실제 총 비용
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean;
}

export interface BrandPlanningTeam {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  brandNames?: string[];
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  projectCode2?: string;
  projectCode3?: string;
  project?: string;
  projectCategory?: string;
  projectCategory2?: string;
  projectCategory3?: string;
  projectName?: string;
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: string;
  expectedDepositDate?: string;
  depositStatus?: '입금완료' | '입금예정' | '입금지연';
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  expectedDepositCurrency?: string;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  depositCurrency?: string;
  createdDate?: string;
  invoiceCopy?: string;
  invoiceAttachmentStatus?: 'required' | 'completed' | 'not_required'; // 첨부필요, 첨부완료, 첨부 불요
  issueNotes?: string;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  // 회계 데이터 관리 필드
  projectPeriodStart?: string; // 예: "2501" (25년 1월)
  projectPeriodEnd?: string; // 예: "2506" (25년 6월)
  targetMarginRate?: number; // 타겟 마진율 (예: 25.00)
  finalMonthActualCost?: number; // 마지막달 실제 총 비용
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean;
}

// 리얼회계용 월별 실비 집행액 타입
export interface ProjectMonthlyExpense {
  id?: string;
  incomeRecordId: string;
  month: string; // 예: "2501" (25년 1월)
  expenseAmount: number;
  expenseCurrency?: string; // 'KRW' | 'USD'
  createdAt?: string;
  updatedAt?: string;
}
