#!/usr/bin/env python
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("\n" + "="*60)
print("TESTING API ENDPOINT")
print("="*60 + "\n")

try:
    # Test the API endpoint
    url = "http://localhost:8000/api/application-settings/"
    print(f"Testing: GET {url}")
    print("-" * 60)
    
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Data:")
    print("-" * 60)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Received {len(data)} application setting(s)")
        print()
        for item in data:
            print(f"  - {item.get('admission_code')} | {item.get('admission_year')}")
            print(f"    Status: {item.get('status')} | is_open: {item.get('is_open')}")
            print(f"    Opening: {item.get('opening_date')} | Closing: {item.get('closing_date')}")
            print()
    else:
        print(f"✗ Error: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("✗ Cannot connect to backend server")
    print("\nMake sure Django is running:")
    print("cd backend && python manage.py runserver")
except Exception as e:
    print(f"✗ Error: {e}")

print("="*60 + "\n")
