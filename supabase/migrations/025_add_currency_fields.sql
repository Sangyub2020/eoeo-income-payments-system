-- 모든 테이블에 통화 필드 추가
ALTER TABLE online_commerce_team 
ADD COLUMN IF NOT EXISTS deposit_currency VARCHAR(3) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS expected_deposit_currency VARCHAR(3) DEFAULT 'KRW';

ALTER TABLE global_marketing_team 
ADD COLUMN IF NOT EXISTS deposit_currency VARCHAR(3) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS expected_deposit_currency VARCHAR(3) DEFAULT 'KRW';

ALTER TABLE global_sales_team 
ADD COLUMN IF NOT EXISTS deposit_currency VARCHAR(3) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS expected_deposit_currency VARCHAR(3) DEFAULT 'KRW';

ALTER TABLE brand_planning_team 
ADD COLUMN IF NOT EXISTS deposit_currency VARCHAR(3) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS expected_deposit_currency VARCHAR(3) DEFAULT 'KRW';

ALTER TABLE other_income 
ADD COLUMN IF NOT EXISTS deposit_currency VARCHAR(3) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS expected_deposit_currency VARCHAR(3) DEFAULT 'KRW';




