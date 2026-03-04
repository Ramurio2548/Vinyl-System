import os
import re

# Corrected pattern: Find `${API_BASE_URL}` followed by non-backtick characters and ending with a double quote
# Look for `${API_BASE_URL}` inside what used to be a double-quoted string but is now starting with a backtick
pattern = re.compile(r'(\`${API_BASE_URL}[^`"]*)"')

files_to_update = [
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\showcase\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\customer\profile\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\customer\order\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\customer\dashboard\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\admin\users\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\admin\showcase\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\admin\inventory\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\admin\dashboard\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\admin\analytics\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\(auth)\register\page.tsx",
    r"d:\Work\Vinyl-System-main-main\Vinyl-System-main-main\frontend\src\app\(auth)\login\page.tsx"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for the broken pattern: `${API_BASE_URL}/... "
    # We want to replace the trailing " with `
    new_content = pattern.sub(r'\1`', content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed syntax errors in: {file_path}")
    else:
        print(f"No syntax errors found in: {file_path}")
