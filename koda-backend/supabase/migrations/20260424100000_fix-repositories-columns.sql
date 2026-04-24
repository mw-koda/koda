-- Add missing columns to repositories table
ALTER TABLE repositories ADD COLUMN full_name text;
ALTER TABLE repositories ADD COLUMN html_url text;
ALTER TABLE repositories ADD COLUMN created_at timestamp DEFAULT now();

-- Update existing records if any (optional, but good for data consistency)
UPDATE repositories SET full_name = name WHERE full_name IS NULL;
UPDATE repositories SET html_url = url WHERE html_url IS NULL;
