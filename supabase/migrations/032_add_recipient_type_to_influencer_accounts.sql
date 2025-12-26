-- Add recipient_type column to influencer_accounts table
ALTER TABLE influencer_accounts 
ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) CHECK (recipient_type IN ('Personal', 'Business'));







