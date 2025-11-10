import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Student

email = 'suresh169073@gmail.com'
students = Student.objects.filter(email=email)

print(f"\n=== Checking Student: {email} ===")
print(f"Total students found: {students.count()}")

for student in students:
    print(f"\nStudent ID: {student.id}")
    print(f"Name: {student.name}")
    print(f"Email: {student.email}")
    print(f"Phone: {student.phone}")
    print(f"Is Verified: {student.is_verified}")
    print(f"Has User: {student.user is not None}")
    print(f"Password stored: {'Yes' if student.password else 'No'}")

if students.count() == 0:
    print("\n❌ No student found with this email!")
else:
    student = students.first()
    if not student.is_verified:
        print("\n⚠️ ISSUE FOUND: Student is NOT verified!")
        print("To fix: Run this command:")
        print(f"Student.objects.filter(email='{email}').update(is_verified=True)")
