"""
Update materials programme from MCA to Postgraduate to match student applications
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

# Update materials
materials = Material.objects.filter(programme='MCA')
count = materials.count()

if count > 0:
    print(f"Found {count} material(s) with programme='MCA'")
    print("\nUpdating to programme='Postgraduate'...")
    
    for mat in materials:
        print(f"  - {mat.title}")
        mat.programme = 'Postgraduate'
        mat.save()
    
    print(f"\n✅ Successfully updated {count} material(s)")
else:
    print("No materials found with programme='MCA'")

# Verify
print("\nCurrent materials:")
for mat in Material.objects.filter(status='ACTIVE'):
    print(f"  - {mat.title}: LSC={mat.lsc_code}, Programme={mat.programme}, Semester={mat.semester}")
