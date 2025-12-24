-- 통합 입금 관리 테이블 생성
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team VARCHAR(50) NOT NULL CHECK (team IN ('online_commerce', 'global_marketing', 'global_sales', 'brand_planning', 'other_income')),
  
  -- 공통 필드
  category VARCHAR(255),
  vendor_code VARCHAR(255),
  company_name VARCHAR(255),
  brand_name VARCHAR(255),
  business_registration_number VARCHAR(255),
  invoice_email VARCHAR(255),
  project_code VARCHAR(255),
  project VARCHAR(255),
  project_name VARCHAR(255),
  
  -- 글로벌마케팅팀 전용 (project_name2-10)
  project_name2 VARCHAR(255),
  project_name3 VARCHAR(255),
  project_name4 VARCHAR(255),
  project_name5 VARCHAR(255),
  project_name6 VARCHAR(255),
  project_name7 VARCHAR(255),
  project_name8 VARCHAR(255),
  project_name9 VARCHAR(255),
  project_name10 VARCHAR(255),
  
  eoeo_manager VARCHAR(255),
  contract_link TEXT,
  
  -- estimate_link와 invoice_link 모두 포함 (팀에 따라 사용)
  estimate_link TEXT,
  invoice_link TEXT,
  
  installment_number INTEGER,
  attribution_year_month VARCHAR(255),
  advance_balance VARCHAR(255),
  ratio DECIMAL(10, 2),
  count INTEGER,
  expected_deposit_date DATE,
  
  -- one_time_expense_amount (온라인커머스와 기타 income에는 없음, NULL 허용)
  one_time_expense_amount DECIMAL(15, 2),
  
  expected_deposit_amount DECIMAL(15, 2),
  expected_deposit_currency VARCHAR(3) DEFAULT 'KRW',
  description TEXT,
  deposit_date DATE,
  deposit_amount DECIMAL(15, 2),
  deposit_currency VARCHAR(3) DEFAULT 'KRW',
  exchange_gain_loss DECIMAL(15, 2),
  difference DECIMAL(15, 2),
  created_date DATE,
  invoice_issued VARCHAR(10),
  invoice_copy TEXT,
  issue_notes TEXT,
  year INTEGER,
  expected_deposit_month INTEGER,
  deposit_month INTEGER,
  tax_status VARCHAR(50),
  invoice_supply_price DECIMAL(15, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_income_records_team ON income_records(team);
CREATE INDEX IF NOT EXISTS idx_income_records_vendor_code ON income_records(vendor_code);
CREATE INDEX IF NOT EXISTS idx_income_records_project_code ON income_records(project_code);
CREATE INDEX IF NOT EXISTS idx_income_records_created_at ON income_records(created_at);
CREATE INDEX IF NOT EXISTS idx_income_records_category ON income_records(category);
CREATE INDEX IF NOT EXISTS idx_income_records_company_name ON income_records(company_name);
CREATE INDEX IF NOT EXISTS idx_income_records_brand_name ON income_records(brand_name);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_income_records_updated_at
  BEFORE UPDATE ON income_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




