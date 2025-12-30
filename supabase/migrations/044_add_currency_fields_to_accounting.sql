-- 회계 데이터에 환종 필드 추가
-- income_records 테이블에 final_month_actual_cost_currency 컬럼 추가
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS final_month_actual_cost_currency VARCHAR(3) DEFAULT 'KRW';

-- project_monthly_expenses 테이블에 expense_currency 컬럼 추가
ALTER TABLE project_monthly_expenses
ADD COLUMN IF NOT EXISTS expense_currency VARCHAR(3) DEFAULT 'KRW';

