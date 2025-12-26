-- 입금여부 컬럼 추가
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(20) CHECK (deposit_status IN ('입금완료', '입금예정', '입금지연'));

-- 기존 데이터에 대해 입금여부 자동 계산
-- 입금액이 있으면 '입금완료'
UPDATE income_records 
SET deposit_status = '입금완료'
WHERE deposit_amount IS NOT NULL AND deposit_amount > 0;

-- 입금액이 없고 입금예정일이 오늘 이후면 '입금예정'
UPDATE income_records 
SET deposit_status = '입금예정'
WHERE (deposit_amount IS NULL OR deposit_amount = 0)
  AND expected_deposit_date IS NOT NULL
  AND expected_deposit_date >= CURRENT_DATE;

-- 입금액이 없고 입금예정일이 오늘 이전이면 '입금지연'
UPDATE income_records 
SET deposit_status = '입금지연'
WHERE (deposit_amount IS NULL OR deposit_amount = 0)
  AND expected_deposit_date IS NOT NULL
  AND expected_deposit_date < CURRENT_DATE;

-- 입금액과 입금예정일이 모두 없으면 '입금예정'
UPDATE income_records 
SET deposit_status = '입금예정'
WHERE (deposit_amount IS NULL OR deposit_amount = 0)
  AND expected_deposit_date IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_income_records_deposit_status ON income_records(deposit_status);

