"""
Script to replace hardcoded localhost:8000 URLs with API_BASE_URL import in student portal files
"""

import os
import re

# Base directory
base_dir = r"c:\Users\SURESH G\OneDrive\Desktop\CDOE-TWO-PORTAL-main\CDOE-TWO-PORTAL-main\CDOE PORTAL\frontend\src\student-portal\pages"

# Files to update
files_to_update = [
    "ApplicationPage2.jsx",
    "ApplicationPage4.jsx",
    "ApplicationPage5.jsx",
    "ApplicationPrintPreview.jsx",
    "ApplicationDownload.jsx",
    "DocumentPreviewModal.jsx",
    "EducationalQualificationPage.jsx",
    "NotFound.jsx",
    "PaymentHistory.jsx",
    "Preview.jsx",
    "QualificationsAndSemesters.jsx",
    "SubmittedApplication.jsx",
]

def add_api_import(content):
    """Add API_BASE_URL import if not present"""
    # Check if already imported
    if "API_BASE_URL" in content or "from '../../config/api'" in content:
        return content
    
    # Find the first import statement
    import_pattern = r"(import\s+.*?from\s+['\"](react|axios|.*?)['\"];?\n)"
    match = re.search(import_pattern, content)
    
    if match:
        # Add after the first few imports
        lines = content.split('\n')
        import_inserted = False
        new_lines = []
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            # Insert after import statements but before component definition
            if not import_inserted and line.startswith('import') and i < 10:
                # Check if next line is not an import
                if i + 1 < len(lines) and not lines[i + 1].strip().startswith('import'):
                    new_lines.append("import { API_BASE_URL } from '../../config/api';")
                    import_inserted = True
        
        if not import_inserted:
            # Fallback: add after all imports
            for i, line in enumerate(lines):
                if line.startswith('import'):
                    continue
                else:
                    lines.insert(i, "import { API_BASE_URL } from '../../config/api';")
                    break
            return '\n'.join(lines)
        
        return '\n'.join(new_lines)
    
    return content

def replace_hardcoded_urls(content):
    """Replace hardcoded localhost URLs with API_BASE_URL"""
    # Replace 'http://localhost:8000 with `${API_BASE_URL}
    content = re.sub(
        r"'http://localhost:8000",
        r"`${API_BASE_URL}",
        content
    )
    
    # Replace "http://localhost:8000 with `${API_BASE_URL}
    content = re.sub(
        r'"http://localhost:8000',
        r'`${API_BASE_URL}',
        content
    )
    
    # Fix closing quotes/backticks
    content = re.sub(
        r"`\$\{API_BASE_URL\}([^`'\"]*)'",
        r"`${API_BASE_URL}\1`",
        content
    )
    content = re.sub(
        r'`\$\{API_BASE_URL\}([^`\'"]*)

"',
        r"`${API_BASE_URL}\1`",
        content
    )
    
    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Add import
        content = add_api_import(content)
        
        # Replace URLs
        content = replace_hardcoded_urls(content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {os.path.basename(filepath)}")
            return True
        else:
            print(f"- No changes: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"✗ Error processing {os.path.basename(filepath)}: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("STUDENT PORTAL URL REPLACEMENT SCRIPT")
    print("=" * 60)
    print(f"\nBase directory: {base_dir}\n")
    
    updated_count = 0
    
    for filename in files_to_update:
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            if process_file(filepath):
                updated_count += 1
        else:
            print(f"⚠ File not found: {filename}")
    
    print("\n" + "=" * 60)
    print(f"COMPLETE: {updated_count} files updated")
    print("=" * 60)

if __name__ == '__main__':
    main()
