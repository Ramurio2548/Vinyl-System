-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    material_type TEXT NOT NULL,
    base_price_per_sqm DOUBLE PRECISION NOT NULL,
    stock_quantity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data into inventory
INSERT INTO inventory (id, material_type, base_price_per_sqm, stock_quantity)
VALUES 
    ('ba9e9b5f-14c1-4b16-a1da-9b9db30abfc2', 'Vinyl', 150.00, 1000.00),
    ('c4b4a1a3-2c1b-4f99-92db-a70821b0dc38', 'Sticker_Clear', 250.00, 500.00),
    ('5df246e7-14e9-4091-8eb1-f8a1a9edab89', 'Sticker_Matte', 280.00, 500.00)
ON CONFLICT(id) DO NOTHING;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT, -- For future customers table connection
    material_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    width_m DOUBLE PRECISION NOT NULL,
    height_m DOUBLE PRECISION NOT NULL,
    total_sqm DOUBLE PRECISION NOT NULL,
    file_url TEXT,
    estimated_price DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending_Payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
