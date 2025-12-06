import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Application

print("Checking Applications in database:")
print("=" * 60)

apps = Application.objects.using('online_edu').all()
print(f"Total applications found: {apps.count()}")
print()

for idx, app in enumerate(apps, 1):
    print(f"{idx}. Application ID: {app.application_id}")
    print(f"   User: {app.user.username if app.user else 'No user'}")
    print(f"   Name: {app.name_initial}")
    print(f"   Email: {app.email}")
    print(f"   Programme: {app.programme_applied}")
    print()
