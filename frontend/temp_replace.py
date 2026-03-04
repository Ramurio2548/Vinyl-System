import os
for root, _, files in os.walk('d:/Work/VINYL/frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'http://localhost:3000' in content:
                content = content.replace('http://localhost:3000', 'http://localhost:3001')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
