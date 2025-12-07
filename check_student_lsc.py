#!/usr/bin/env python
import os
import sys

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from api.models import Student

def check_and_update_student_lsc():
    # Check current student data
    student = Student.objects.filter(email='suresh169073@periyaruniversity.ac.in').first()
    if not student:
        print("Student not found!")
        return

    print(f"Current student data:")
    print(f"  Name: {student.name}")
    print(f"  Email: {student.email}")
    print(f"  LSC Code: {repr(student.lsc_code)}")
    print(f"  LSC Name: {repr(student.lsc_name)}")

    # Update LSC information if empty
    if not student.lsc_code or not student.lsc_name:
        student.lsc_code = 'LC2101'
        student.lsc_name = 'CDOE-CENTRE FOR DISTANCE AND ONLINE EDUCATION'
        student.save()
        print("\n✅ Updated LSC information:")
        print(f"  LSC Code: {student.lsc_code}")
        print(f"  LSC Name: {student.lsc_name}")
    else:
        print("\n✅ LSC information already exists")

if __name__ == '__main__':
    check_and_update_student_lsc()