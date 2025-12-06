#!/usr/bin/env python
import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Application

def check_eligibility_status():
    apps = Application.objects.all()
    print(f"Total applications: {apps.count()}")

    eligible_apps = apps.filter(eligibility_status='Eligible')
    print(f"Applications with eligibility_status='Eligible': {eligible_apps.count()}")

    verified_apps = apps.filter(eligibility_verified=True)
    print(f"Applications with eligibility_verified=True: {verified_apps.count()}")

    # Update applications that have Eligible status but not verified
    updated_count = 0
    for app in eligible_apps:
        if not app.eligibility_verified:
            app.eligibility_verified = True
            app.save()
            updated_count += 1
            print(f"Updated app {app.application_id}")

    print(f"Updated {updated_count} applications")

    # Show sample data
    print("\nSample applications:")
    for app in apps[:3]:
        print(f"ID: {app.application_id}, status: {app.eligibility_status}, verified: {app.eligibility_verified}")

if __name__ == '__main__':
    check_eligibility_status()