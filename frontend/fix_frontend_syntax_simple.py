import os

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
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Manually fix specific patterns
    # `${API_BASE_URL}/api/something"
    # Should be `${API_BASE_URL}/api/something`
    
    # We want to replace all occurrences where `${API_BASE_URL}` is in a template literal starting with `
    # but terminated with "
    
    # Let's use a simpler heuristic: if a line contains `${API_BASE_URL}` and ONE backtick and ONE double quote, 
    # it's likely broken.
    
    lines = content.splitlines()
    new_lines = []
    changed = False
    
    for line in lines:
        if "${API_BASE_URL}" in line and '`' in line and '"' in line:
            # Check if the " comes after the ` and is followed by , or ) or { or ;
            # Example: fetch(`${API_BASE_URL}/api/orders", {
            if '", ' in line or '")' in line or '"{' in line or '";' in line:
                new_line = line.replace('", ', '`, ').replace('")', '`)').replace('"{', '`{').replace('";', '`;')
                if new_line != line:
                    new_lines.append(new_line)
                    changed = True
                    continue
        new_lines.append(line)
        
    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(new_lines) + "\n")
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes: {file_path}")
