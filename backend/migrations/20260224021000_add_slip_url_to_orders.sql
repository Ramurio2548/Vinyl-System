-- Add slip_url to orders table for payment proof
ALTER TABLE orders ADD COLUMN slip_url TEXT;
