-- 회계 데이터 관리를 위한 컬럼 추가
-- 프로젝트 수행 기간 (공통)
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS project_period_start VARCHAR(6),
ADD COLUMN IF NOT EXISTS project_period_end VARCHAR(6);

-- 관리회계 관련 데이터
ALTER TABLE income_records
ADD COLUMN IF NOT EXISTS target_margin_rate DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS final_month_actual_cost DECIMAL(15, 2);

-- 리얼회계용 월별 실비 집행액 테이블 생성
CREATE TABLE IF NOT EXISTS project_monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_record_id UUID NOT NULL REFERENCES income_records(id) ON DELETE CASCADE,
  month VARCHAR(6) NOT NULL,  -- 예: "2501" (25년 1월)
  expense_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- 해당 월 실비 집행액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(income_record_id, month)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_monthly_expenses_income_record_id 
  ON project_monthly_expenses(income_record_id);
CREATE INDEX IF NOT EXISTS idx_project_monthly_expenses_month 
  ON project_monthly_expenses(month);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_project_monthly_expenses_updated_at
  BEFORE UPDATE ON project_monthly_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


