-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password relies on bcrypt hash for 'admin123')
-- The hash below is for 'admin123' generated via standard bcrypt cost 12
-- Default ID supplied manually since SQLite needs a generated UUID text value if no auto-gen text extension is used.
INSERT INTO users (id, username, password_hash, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin', '$2b$12$zgwKxoGCZLJjROCepnl57eXByUb5ZDtvtEexERufSGw1VYrHqXimO', 'admin')
ON CONFLICT (username) DO NOTHING;
