-- Add full_name and address to users table to match the backend handler expectations
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Optional: Populate full_name from existing first_name and last_name if they exist
UPDATE users 
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL 
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);
