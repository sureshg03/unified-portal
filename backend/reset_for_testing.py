import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Application, Payment

# Reset the payment status for testing
email = "studies3773@gmail.com"

try:
    user = User.objects.get(email=email)
    application = Application.objects.get(user=user)
    
    print(f"\n📋 Current State:")
    print(f"   Application ID: {application.application_id or 'None'}")
    print(f"   Status: {application.status}")
    print(f"   Payment Status: {'Paid' if application.payment_status == 'P' else 'Not Paid'}")
    
    # Reset to allow new payment
    application.application_id = None
    application.payment_status = 'N'  # Not Paid
    application.status = 'In Progress'  # Keep form data but allow payment
    application.save()
    
    # Delete old payment records
    Payment.objects.filter(user=user).delete()
    
    print(f"\n✅ RESET COMPLETE!")
    print(f"\n📋 New State:")
    print(f"   Application ID: {application.application_id or 'None (Ready for generation)'}")
    print(f"   Status: {application.status}")
    print(f"   Payment Status: {'Paid' if application.payment_status == 'P' else 'Not Paid'}")
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"   1. Refresh your payment page")
    print(f"   2. You should now see TWO payment buttons:")
    print(f"      • 'Pay with Paytm Gateway' (Blue) - Opens realistic payment modal")
    print(f"      • 'Quick Pay' (Green) - Instant payment")
    print(f"   3. Click either button to generate Application ID")
    print(f"   4. Application ID will be generated in format: PU/ODL/LSC001/A25/0001")
    print(f"   5. You'll be redirected to download page automatically")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
