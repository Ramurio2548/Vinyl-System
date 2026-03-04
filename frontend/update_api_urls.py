import os
import re

api_util_import = 'import { API_BASE_URL } from "@/lib/api";\n'
target_url = "http://localhost:3001"

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
        
    # Replace URL
    if target_url in content:
        new_content = content.replace(target_url, "${API_BASE_URL}")
        # Next.js pages often use template literals already or need them
        new_content = new_content.replace('"${API_BASE_URL}', '`${API_BASE_URL}')
        new_content = new_content.replace('${API_BASE_URL}"', '${API_BASE_URL}`')
        
        # Add import if not present
        if 'from "@/lib/api"' not in new_content:
            # Add after first line or after "use client"
            if '"use client"' in new_content or "'use client'" in new_content:
                lines = new_content.splitlines()
                lines.insert(1, api_util_import.strip())
                new_content = "\n".join(lines)
            else:
                new_content = api_util_import + new_content
                
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")
    else:
        print(f"URL not found in: {file_path}")
