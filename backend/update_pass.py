import sqlite3
conn = sqlite3.connect('vinyl.db')
hash_val = "$2b$12$zgwKxoGCZLJjROCepnl57eXByUb5ZDtvtEexERufSGw1VYrHqXimO"
conn.execute("UPDATE users SET password_hash = ? WHERE username = 'admin'", (hash_val,))
conn.commit()
print("Updated successfully")
