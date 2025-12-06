import requests
import sys

print("=" * 60)
print("Backend Connection Test")
print("=" * 60)

# Test URLs
urls_to_test = [
    "http://localhost:8000/api/",
    "http://192.168.210.240:8000/api/",
]

for url in urls_to_test:
    print(f"\nTesting: {url}")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ SUCCESS - Server is responding")
            print(f"   Status: {response.status_code}")
        else:
            print(f"⚠️  RESPONSE - Server returned: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"❌ FAILED - Cannot connect to server")
        print(f"   Make sure Django is running: python manage.py runserver 0.0.0.0:8000")
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT - Server not responding")
    except Exception as e:
        print(f"❌ ERROR - {str(e)}")

print("\n" + "=" * 60)
print("Test Complete")
print("=" * 60)

print("\nIf localhost works but 192.168.210.240 doesn't:")
print("1. Run: python manage.py runserver 0.0.0.0:8000")
print("2. Run setup-firewall.bat as Administrator")
print("3. Check if Windows Firewall is blocking the connection")
