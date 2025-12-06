import os
import django
import sys

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Application

print("=" * 80)
print("CHECKING ENROLLMENT NUMBERS IN DATABASE")
print("=" * 80)

applications = Application.objects.all()
print(f"\nTotal Applications: {applications.count()}\n")

for app in applications[:5]:
    print(f"Application ID: {app.application_id}")
    print(f"  Enrollment No: {app.enrollment_no}")
    print(f"  DEB ID: {app.deb_id}")
    print(f"  Name: {app.name_initial}")
    print(f"  Eligibility Verified: {app.eligibility_verified}")
    print(f"  Admission Confirmed: {app.admission_confirmed}")
    print("-" * 80)

print("\nApplications WITH enrollment numbers:")
with_enrollment = Application.objects.filter(enrollment_no__isnull=False).exclude(enrollment_no='')
print(f"Count: {with_enrollment.count()}")
for app in with_enrollment:
    print(f"  - {app.application_id}: {app.enrollment_no}")

print("\nApplications WITHOUT enrollment numbers:")
without_enrollment = Application.objects.filter(enrollment_no__isnull=True) | Application.objects.filter(enrollment_no='')
print(f"Count: {without_enrollment.count()}")
for app in without_enrollment[:5]:
    print(f"  - {app.application_id}")
