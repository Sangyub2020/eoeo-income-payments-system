-- 세금계산서 첨부 상태 컬럼 추가
ALTER TABLE income_records
ADD COLUMN IF NOT EXISTS invoice_attachment_status VARCHAR(20) DEFAULT 'required' CHECK (invoice_attachment_status IN ('required', 'completed', 'not_required'));

-- 기존 데이터에서 invoice_copy가 있으면 'completed'로 설정
UPDATE income_records
SET invoice_attachment_status = 'completed'
WHERE invoice_copy IS NOT NULL AND invoice_copy != '';

-- invoice_copy가 없으면 'required'로 설정 (이미 기본값이지만 명시적으로 설정)
UPDATE income_records
SET invoice_attachment_status = 'required'
WHERE invoice_copy IS NULL OR invoice_copy = '';





