"""
Test script to verify the fixed endpoints work correctly.
Tests Student lookup by email instead of user FK.
"""
import os
import django
import sys

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Student, Application

User = get_user_model()

def test_student_lookup():
    """Test that Student can be found by email"""
    print("\n" + "="*70)
    print("🔍 TESTING STUDENT LOOKUP FIX")
    print("="*70)
    
    # Get the user
    test_email = "studies3773@gmail.com"
    try:
        user = User.objects.get(email=test_email)
        print(f"✅ User found: {user.email}")
    except User.DoesNotExist:
        print(f"❌ User not found: {test_email}")
        return False
    
    # Test OLD method (should fail)
    print("\n📌 Testing OLD method: Student.objects.filter(user=user)")
    student_old = Student.objects.filter(user=user).first()
    if student_old:
        print(f"   ⚠️  OLD method found student: {student_old.name}")
    else:
        print(f"   ❌ OLD method failed: No student found (Expected)")
    
    # Test NEW method (should work)
    print("\n📌 Testing NEW method: Student.objects.filter(email=user.email)")
    student_new = Student.objects.filter(email=user.email).first()
    if student_new:
        print(f"   ✅ NEW method found student: {student_new.name}")
        print(f"      LSC Code: {student_new.lsc_code}")
        print(f"      Phone: {student_new.phone}")
        return True
    else:
        print(f"   ❌ NEW method failed: No student found")
        return False

def test_application_status_filter():
    """Test that Application can be found with multiple statuses"""
    print("\n" + "="*70)
    print("🔍 TESTING APPLICATION STATUS FILTER FIX")
    print("="*70)
    
    test_email = "studies3773@gmail.com"
    try:
        user = User.objects.get(email=test_email)
        print(f"✅ User found: {user.email}")
    except User.DoesNotExist:
        print(f"❌ User not found: {test_email}")
        return False
    
    # Test OLD filter (Completed only)
    print("\n📌 Testing OLD filter: status='Completed'")
    app_old = Application.objects.filter(user=user, status='Completed').first()
    if app_old:
        print(f"   ✅ OLD filter found application: {app_old.status}")
    else:
        print(f"   ❌ OLD filter failed: No completed application found (Expected if status='In Progress')")
    
    # Test NEW filter (Completed or In Progress)
    print("\n📌 Testing NEW filter: status__in=['In Progress', 'Completed']")
    app_new = Application.objects.filter(user=user, status__in=['In Progress', 'Completed']).first()
    if app_new:
        print(f"   ✅ NEW filter found application:")
        print(f"      Status: {app_new.status}")
        print(f"      Payment Status: {'Paid' if app_new.payment_status == 'P' else 'Not Paid'}")
        print(f"      Application ID: {app_new.application_id or 'Not Generated'}")
        print(f"      Course: {app_new.course}")
        return True
    else:
        print(f"   ❌ NEW filter failed: No application found")
        return False

if __name__ == "__main__":
    print("\n" + "🚀 TESTING ENDPOINT FIXES" + "\n")
    
    result1 = test_student_lookup()
    result2 = test_application_status_filter()
    
    print("\n" + "="*70)
    print("📊 TEST RESULTS")
    print("="*70)
    print(f"Student Lookup Fix: {'✅ PASSED' if result1 else '❌ FAILED'}")
    print(f"Application Status Filter Fix: {'✅ PASSED' if result2 else '❌ FAILED'}")
    
    if result1 and result2:
        print("\n✅ ALL TESTS PASSED! Endpoints should work now.")
        print("\n🎯 NEXT STEPS:")
        print("   1. Restart Django server (if running)")
        print("   2. Go to payment page: http://localhost:8082/student/payment")
        print("   3. Test payment with Paytm Gateway button")
        print("   4. Test download after payment")
    else:
        print("\n⚠️  SOME TESTS FAILED. Please check the errors above.")
    
    print("="*70 + "\n")
