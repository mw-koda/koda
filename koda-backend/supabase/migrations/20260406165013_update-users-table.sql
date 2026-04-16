-- Add missing columns to users table
ALTER TABLE users ADD COLUMN avatar_url text;
ALTER TABLE users ADD COLUMN is_onboarded boolean DEFAULT false;
ALTER TABLE users ADD COLUMN updated_at timestamp DEFAULT now();

-- Update existing users to have is_onboarded = false
UPDATE users SET is_onboarded = false WHERE is_onboarded IS NULL;

-- Remove the name column if it exists (not used in code)
-- ALTER TABLE users DROP COLUMN IF EXISTS name;