import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Student

email = 'suresh169073@gmail.com'

print(f"\n=== Checking for: {email} ===\n")

# Check User table
users = User.objects.filter(email=email)
print(f"Django User table: {users.count()} found")
for user in users:
    print(f"  - Username: {user.username}, Email: {user.email}, Active: {user.is_active}")

# Check Student table
students = Student.objects.filter(email=email)
print(f"\nStudent table: {students.count()} found")
for student in students:
    print(f"  - Name: {student.name}, Email: {student.email}, Verified: {student.is_verified}")

# Check all Student emails
print(f"\n=== All Students in Database ===")
all_students = Student.objects.all()
print(f"Total students: {all_students.count()}")
for student in all_students[:10]:  # Show first 10
    print(f"  - {student.email} (Verified: {student.is_verified})")
