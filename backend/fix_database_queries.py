"""
Script to fix all database queries in api/views.py to use explicit database routing.
This will update Student, Application, StudentDetails, MarksheetUpload queries.
"""
import re

# Read the file
with open('api/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Patterns to replace (excluding already fixed ones with .using())
patterns = [
    # Student.objects patterns (not already fixed)
    (r'Student\.objects\.filter\(user=', r'Student.objects.using(\'online_edu\').filter(email=user.email if hasattr(user, \'email\') else '),
    (r'Student\.objects\.get\(user=', r'Student.objects.using(\'online_edu\').get(email=user.email if hasattr(user, \'email\') else '),
    (r'Student\.objects\.filter\(email=', r'Student.objects.using(\'online_edu\').filter(email='),
    (r'Student\.objects\.get\(email=', r'Student.objects.using(\'online_edu\').get(email='),
    (r'Student\.objects\.create\(', r'Student.objects.using(\'online_edu\').create('),
    
    # Application.objects patterns
    (r'Application\.objects\.filter\(user=', r'Application.objects.using(\'online_edu\').filter(email=user.email if hasattr(user, \'email\') else '),
    (r'Application\.objects\.get\(user=', r'Application.objects.using(\'online_edu\').get(email=user.email if hasattr(user, \'email\') else '),
    (r'Application\.objects\.get_or_create\(', r'Application.objects.using(\'online_edu\').get_or_create('),
    (r'Application\.objects\.filter\(email=', r'Application.objects.using(\'online_edu\').filter(email='),
    (r'Application\.objects\.get\(email=', r'Application.objects.using(\'online_edu\').get(email='),
    
    # StudentDetails.objects patterns
    (r'StudentDetails\.objects\.filter\(user=', r'StudentDetails.objects.using(\'online_edu\').filter(email=user.email if hasattr(user, \'email\') else '),
    (r'StudentDetails\.objects\.get\(user=', r'StudentDetails.objects.using(\'online_edu\').get(email=user.email if hasattr(user, \'email\') else '),
    (r'StudentDetails\.objects\.get_or_create\(', r'StudentDetails.objects.using(\'online_edu\').get_or_create('),
    
    # MarksheetUpload.objects patterns
    (r'MarksheetUpload\.objects\.filter\(student__user=', r'MarksheetUpload.objects.using(\'online_edu\').filter(student__email=user.email if hasattr(user, \'email\') else '),
    (r'MarksheetUpload\.objects\.filter\(student=', r'MarksheetUpload.objects.using(\'online_edu\').filter(student='),
    
    # Payment.objects patterns (if Payment model is also in api app)
    (r'Payment\.objects\.filter\(user=', r'Payment.objects.using(\'online_edu\').filter(email=user.email if hasattr(user, \'email\') else '),
    (r'Payment\.objects\.get\(user=', r'Payment.objects.using(\'online_edu\').get(email=user.email if hasattr(user, \'email\') else '),
]

print("Original patterns found:")
for pattern, replacement in patterns:
    matches = re.findall(pattern, content)
    if matches:
        print(f"  {pattern}: {len(matches)} matches")

print("\nNote: This script shows what needs to be fixed.")
print("Manual fixes are recommended to handle context-specific cases properly.")
print("\nKey changes needed:")
print("1. All Student.objects queries → .using('online_edu')")
print("2. All Application.objects queries → .using('online_edu')")
print("3. All queries with user=user or user=request.user → email=user.email")
print("4. Save operations → .save(using='online_edu')")
