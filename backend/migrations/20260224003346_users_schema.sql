-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user
INSERT INTO users (id, username, password_hash, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin', '$2b$12$zgwKxoGCZLJjROCepnl57eXByUb5ZDtvtEexERufSGw1VYrHqXimO', 'admin')
ON CONFLICT (username) DO NOTHING;
