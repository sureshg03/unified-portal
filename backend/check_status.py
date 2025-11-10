import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Application, Student

# Check user's application status
email = "studies3773@gmail.com"

try:
    user = User.objects.get(email=email)
    print(f"\n✅ User found: {user.email}")
    print(f"   Username: {user.username}")
    
    # Check Student
    try:
        student = Student.objects.get(email=user.email)
        print(f"\n✅ Student found:")
        print(f"   Name: {student.name}")
        print(f"   LSC Code: {student.lsc_code}")
    except Student.DoesNotExist:
        print("\n❌ No Student profile found")
    
    # Check Application
    try:
        application = Application.objects.get(user=user)
        print(f"\n✅ Application found:")
        print(f"   ID: {application.id}")
        print(f"   Application ID: {application.application_id or 'NOT GENERATED YET'}")
        print(f"   Status: {application.status}")
        print(f"   Payment Status: {'Paid' if application.payment_status == 'P' else 'Not Paid'}")
        print(f"   Course: {application.course}")
        print(f"   Mode of Study: {application.mode_of_study}")
        print(f"   Academic Year: {application.academic_year}")
        
        if not application.application_id:
            print("\n📌 Application ID not generated yet.")
            print("   To generate, complete the payment process.")
    except Application.DoesNotExist:
        print("\n❌ No Application found")
        print("   User needs to fill out the application form.")

except User.DoesNotExist:
    print(f"\n❌ User not found: {email}")

print("\n" + "="*50)
print("INSTRUCTIONS:")
print("="*50)
print("1. Make sure you've completed ALL 4 pages of application form")
print("2. Go to Preview & Payment page")
print("3. You should see TWO payment buttons:")
print("   - 'Pay with Paytm Gateway' (Blue) - Realistic experience")
print("   - 'Quick Pay' (Green) - Direct payment")
print("4. Click either button to complete payment")
print("5. Application ID will be generated automatically")
print("6. You'll be redirected to download page with your Application ID")
print("\nIf you want to start over, click the RED 'Clear Payment' button")
print("at the top right of the payment page.")
