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

export interface InfluencerAccount {
  id?: string;
  email?: string;
  tiktokHandle?: string;
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
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  project?: string;
  projectName?: string;
  eoeoManager?: string;
  contractLink?: string;
  estimateLink?: string;
  installmentNumber?: number;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: number;
  count?: number;
  expectedDepositDate?: string;
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  exchangeGainLoss?: number;
  difference?: number;
  createdDate?: string;
  invoiceIssued?: string;
  invoiceCopy?: string;
  issueNotes?: string;
  year?: number;
  expectedDepositMonth?: number;
  depositMonth?: number;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
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
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  project?: string;
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
  installmentNumber?: number;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: number;
  count?: number;
  expectedDepositDate?: string;
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  exchangeGainLoss?: number;
  difference?: number;
  createdDate?: string;
  invoiceIssued?: string;
  invoiceCopy?: string;
  issueNotes?: string;
  year?: number;
  expectedDepositMonth?: number;
  depositMonth?: number;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean;
}

export interface GlobalSalesTeam {
  id?: string;
  category?: string;
  vendorCode?: string;
  companyName?: string;
  brandName?: string;
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  project?: string;
  projectName?: string; // 긴 형식의 프로젝트명
  eoeoManager?: string;
  contractLink?: string;
  invoiceLink?: string; // 인보이스 링크
  installmentNumber?: number;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: number;
  count?: number;
  expectedDepositDate?: string;
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  exchangeGainLoss?: number;
  difference?: number;
  createdDate?: string;
  invoiceIssued?: string;
  invoiceCopy?: string;
  issueNotes?: string;
  year?: number;
  expectedDepositMonth?: number;
  depositMonth?: number;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
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
  businessRegistrationNumber?: string;
  invoiceEmail?: string;
  projectCode?: string;
  project?: string;
  projectName?: string;
  eoeoManager?: string;
  contractLink?: string;
  invoiceLink?: string; // 인보이스 링크
  installmentNumber?: number;
  attributionYearMonth?: string;
  advanceBalance?: string;
  ratio?: number;
  count?: number;
  expectedDepositDate?: string;
  oneTimeExpenseAmount?: number;
  expectedDepositAmount?: number;
  description?: string;
  depositDate?: string;
  depositAmount?: number;
  exchangeGainLoss?: number;
  difference?: number;
  createdDate?: string;
  invoiceIssued?: string;
  invoiceCopy?: string;
  issueNotes?: string;
  year?: number;
  expectedDepositMonth?: number;
  depositMonth?: number;
  taxStatus?: string;
  invoiceSupplyPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  hasWarning?: boolean;
}

