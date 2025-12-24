-- Remove invoice_issued column from income_records table
-- This column is no longer used as it has been replaced by invoice_attachment_status

ALTER TABLE income_records
DROP COLUMN IF EXISTS invoice_issued;

