import os
import re

# Base directory
base_dir = r"c:\Users\SURESH G\Desktop\CDOE-TWO-PORTAL-main\CDOE-TWO-PORTAL-main\unified-portal\frontend\src"

# Files to update
files_to_update = []

# Find all .jsx and .js files in student-portal
for root, dirs, files in os.walk(os.path.join(base_dir, "student-portal")):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            files_to_update.append(os.path.join(root, file))

print(f"Found {len(files_to_update)} files to update")

# Process each file
for filepath in files_to_update:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if API_BASE_URL is used
        if '${API_BASE_URL}' in content or 'API_BASE_URL' in content:
            # Check if import already exists
            if 'import { API_BASE_URL }' not in content:
                # Calculate relative path to config/api
                rel_parts = os.path.relpath(os.path.join(base_dir, 'config', 'api.js'), os.path.dirname(filepath))
                rel_path = rel_parts.replace('\\', '/')
                if not rel_path.startswith('.'):
                    rel_path = './' + rel_path
                rel_path = rel_path.replace('.js', '')
                
                # Find the last import statement
                import_pattern = r"(import .+ from .+;)\n"
                matches = list(re.finditer(import_pattern, content))
                
                if matches:
                    last_import = matches[-1]
                    insert_pos = last_import.end()
                    new_import = f"import {{ API_BASE_URL }} from '{rel_path}';\n"
                    content = content[:insert_pos] + new_import + content[insert_pos:]
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Updated: {os.path.basename(filepath)}")
                else:
                    print(f"⚠️  No imports found in: {os.path.basename(filepath)}")
            else:
                print(f"✓ Already has import: {os.path.basename(filepath)}")
        else:
            print(f"- Skipped (no API_BASE_URL): {os.path.basename(filepath)}")
            
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")

print("\n✅ Done!")
