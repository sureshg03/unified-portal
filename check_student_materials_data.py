"""
Check if students have the required data to view materials
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

from django.contrib.auth.models import User
from api.models import Student, Application, Material

def check_student_materials_data():
    print("=" * 80)
    print("CHECKING STUDENT MATERIALS DATA")
    print("=" * 80)
    
    # Get all students
    students = Student.objects.all()
    print(f"\nTotal Students: {students.count()}")
    
    if students.count() == 0:
        print("\n⚠️  No students found in database!")
        return
    
    # Check first 5 students
    for i, student in enumerate(students[:5], 1):
        print(f"\n{'='*80}")
        print(f"Student #{i}: {student.name if hasattr(student, 'name') else 'Unknown'} ({student.email})")
        print(f"{'='*80}")
        
        # Check if student has lsc_code
        if student.lsc_code:
            print(f"✅ LSC Code: {student.lsc_code}")
        else:
            print(f"❌ LSC Code: NOT SET")
        
        # Find corresponding User
        user = User.objects.filter(email=student.email).first()
        if user:
            print(f"✅ User account: Found (ID: {user.id})")
            
            # Check if application exists
            application = Application.objects.filter(user=user).first()
            if application:
                print(f"✅ Application: Found (ID: {application.id})")
                print(f"   Programme Applied: {application.programme_applied}")
                
                # Check if materials exist for this student
                if student.lsc_code:
                    materials = Material.objects.filter(
                        lsc_code=student.lsc_code,
                        programme=application.programme_applied,
                        status='ACTIVE'
                    )
                    print(f"   📚 Available Materials: {materials.count()}")
                    
                    if materials.count() > 0:
                        print("\n   Materials List:")
                        for mat in materials[:3]:
                            print(f"      - {mat.title} ({mat.material_type})")
                    else:
                        print(f"\n   ⚠️  No materials found for:")
                        print(f"      LSC Code: {student.lsc_code}")
                        print(f"      Programme: {application.programme_applied}")
                else:
                    print(f"   ❌ Cannot check materials - LSC Code not set")
            else:
                print(f"❌ Application: NOT FOUND")
        else:
            print(f"❌ User account: NOT FOUND")
    
    # Show available materials in database
    print(f"\n{'='*80}")
    print("ALL MATERIALS IN DATABASE")
    print(f"{'='*80}")
    
    all_materials = Material.objects.filter(status='ACTIVE')
    print(f"\nTotal Active Materials: {all_materials.count()}")
    
    if all_materials.count() > 0:
        print("\nMaterials by LSC Code and Programme:")
        lsc_programmes = {}
        for mat in all_materials:
            key = f"{mat.lsc_code} - {mat.programme}"
            if key not in lsc_programmes:
                lsc_programmes[key] = 0
            lsc_programmes[key] += 1
        
        for key, count in lsc_programmes.items():
            print(f"   {key}: {count} material(s)")
    else:
        print("\n⚠️  No active materials in database!")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    check_student_materials_data()
