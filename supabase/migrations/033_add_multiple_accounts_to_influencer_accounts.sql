-- Add JSONB columns for multiple TikTok and Instagram accounts
ALTER TABLE influencer_accounts 
ADD COLUMN IF NOT EXISTS tiktok_handles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS instagram_handles JSONB DEFAULT '[]'::jsonb;







