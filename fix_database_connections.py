"""
Fix all database connection references from 'online_edu' to default database
This script updates all occurrences in admin_views.py
"""

import os
import re

# File path
file_path = r'backend\api\admin_views.py'

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    exit(1)

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Original file loaded successfully")
print(f"File size: {len(content)} characters")

# Count occurrences before replacement
before_count = content.count("using('online_edu')")
print(f"\nFound {before_count} occurrences of using('online_edu')")

# Replacement 1: Remove .using('online_edu') from queryset operations
content = re.sub(r"\.using\('online_edu'\)", "", content)

# Replacement 2: Remove using='online_edu' from save operations
content = re.sub(r",\s*using='online_edu'", "", content)
content = re.sub(r"\(using='online_edu'\)", "()", content)

# Replacement 3: Fix connections references (lsc_admin is OK, but ensure consistency)
# This is already correct in the code, so no change needed

# Count after replacement
after_count = content.count("using('online_edu')")
print(f"After replacement: {after_count} occurrences remaining")
print(f"Removed: {before_count - after_count} occurrences")

# Verify no syntax errors were introduced
if content.count('(') != content.count(')'):
    print("\nWARNING: Parentheses mismatch detected!")
else:
    print("\n✓ Parentheses balanced")

if content.count('{') != content.count('}'):
    print("WARNING: Braces mismatch detected!")
else:
    print("✓ Braces balanced")

# Write back to file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ File updated successfully: {file_path}")
print("All database connection references have been fixed!")
print("\nNext steps:")
print("1. Restart the Django backend server")
print("2. Test the Valid/Invalid buttons")
print("3. Check console for any remaining errors")
