-- Add slip_url column to orders table for payment verification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS slip_url TEXT;
