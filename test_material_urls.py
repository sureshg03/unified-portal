"""
Test material file URLs and backend serving
"""
import os
import sys
import django

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Material

print("=" * 80)
print("TESTING MATERIAL FILE URLS")
print("=" * 80)

materials = Material.objects.filter(status='ACTIVE')
print(f"\nFound {materials.count()} active materials\n")

for mat in materials:
    print(f"Material ID: {mat.id}")
    print(f"Title: {mat.title}")
    print(f"Type: {mat.material_type}")
    print(f"File: {mat.file}")
    
    if mat.file:
        print(f"File Path: {mat.file.path}")
        print(f"File URL: {mat.file.url}")
        print(f"File Exists: {os.path.exists(mat.file.path)}")
        print(f"File Size: {os.path.getsize(mat.file.path) if os.path.exists(mat.file.path) else 'N/A'} bytes")
    else:
        print("No file attached!")
    
    print(f"Full URL would be: http://localhost:8000{mat.file.url if mat.file else 'N/A'}")
    print("-" * 80)
