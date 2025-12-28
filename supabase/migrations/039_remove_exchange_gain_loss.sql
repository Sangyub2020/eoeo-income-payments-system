-- Remove exchange_gain_loss and difference columns from income_records table
-- These columns are not displayed in the dashboard and are rarely used

ALTER TABLE income_records 
DROP COLUMN IF EXISTS exchange_gain_loss,
DROP COLUMN IF EXISTS difference;

