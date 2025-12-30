-- 차수(installment_number) 필드 삭제
-- 통합 테이블에서 삭제
ALTER TABLE income_records DROP COLUMN IF EXISTS installment_number;

-- 기존 개별 테이블들에서도 삭제 (혹시 남아있을 경우)
ALTER TABLE online_commerce_team DROP COLUMN IF EXISTS installment_number;
ALTER TABLE global_marketing_team DROP COLUMN IF EXISTS installment_number;
ALTER TABLE global_sales_team DROP COLUMN IF EXISTS installment_number;
ALTER TABLE brand_planning_team DROP COLUMN IF EXISTS installment_number;
ALTER TABLE other_income DROP COLUMN IF EXISTS installment_number;

