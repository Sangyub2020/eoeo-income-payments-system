-- 브랜드기획팀 테이블 생성
CREATE TABLE IF NOT EXISTS brand_planning_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255),
  vendor_code VARCHAR(255),
  company_name VARCHAR(255),
  brand_name VARCHAR(255),
  business_registration_number VARCHAR(255),
  invoice_email VARCHAR(255),
  project_code VARCHAR(255),
  project VARCHAR(255),
  project_name VARCHAR(255),
  eoeo_manager VARCHAR(255),
  contract_link TEXT,
  invoice_link TEXT, -- 인보이스 링크
  installment_number INTEGER,
  attribution_year_month VARCHAR(255),
  advance_balance VARCHAR(255),
  ratio DECIMAL(10, 2),
  count INTEGER,
  expected_deposit_date DATE,
  one_time_expense_amount DECIMAL(15, 2),
  expected_deposit_amount DECIMAL(15, 2),
  description TEXT,
  deposit_date DATE,
  deposit_amount DECIMAL(15, 2),
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
CREATE INDEX IF NOT EXISTS idx_brand_planning_team_vendor_code ON brand_planning_team(vendor_code);
CREATE INDEX IF NOT EXISTS idx_brand_planning_team_project_code ON brand_planning_team(project_code);
CREATE INDEX IF NOT EXISTS idx_brand_planning_team_created_at ON brand_planning_team(created_at);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_brand_planning_team_updated_at
  BEFORE UPDATE ON brand_planning_team
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();





