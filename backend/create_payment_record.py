#!/usr/bin/env python
"""
Script to create a payment record for an existing paid application
"""
import os
import sys
import django
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from api.models import ApplicationPayment, Application, Student
from django.contrib.auth.models import User

def create_payment_for_existing_application():
    """Create payment record for existing paid application"""
    
    # Get the application
    application_id = input("Enter Application ID (e.g., PU/ODL/LC2101/A25/0001): ").strip()
    
    try:
        application = Application.objects.get(application_id=application_id)
        print(f"\n✓ Found application: {application_id}")
        print(f"  User: {application.user.email}")
        print(f"  Payment Status: {application.payment_status}")
        
        # Get student
        student = Student.objects.filter(email=application.user.email).first()
        
        # Check if payment record already exists
        existing = ApplicationPayment.objects.filter(application_id=application_id).first()
        if existing:
            print(f"\n⚠️  Payment record already exists (ID: {existing.id})")
            confirm = input("Do you want to recreate it? (yes/no): ").strip().lower()
            if confirm != 'yes':
                print("Aborted.")
                return
            existing.delete()
            print("✓ Deleted existing record")
        
        # Create payment details
        txn_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"
        bank_txn_id = f"BANK{datetime.now().strftime('%Y%m%d%H%M%S%f')[:20]}"
        order_id = f"ORDER{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create the payment record
        fee_payment = ApplicationPayment.objects.create(
            user=application.user,
            application_id=application_id,
            user_name=application.name_initial or (student.name if student else application.user.get_full_name()),
            email=application.user.email,
            phone=student.phone if student else '',
            transaction_id=txn_id,
            bank_transaction_id=bank_txn_id,
            order_id=order_id,
            amount=236.00,
            course=application.course,
            payment_status='TXN_SUCCESS',
            transaction_type='DEBIT',
            gateway_name='DUMMY_GATEWAY',
            response_code='01',
            response_message='Txn Success',
            bank_name='TEST_BANK',
            payment_mode='DUMMY',
            refund_amount='0',
            mid='MERCHANT001',
            transaction_date=datetime.now(),
            payment_type='APPLICATION_FEE'
        )
        
        print(f"\n✓ Successfully created payment record!")
        print(f"  Payment ID: {fee_payment.id}")
        print(f"  Transaction ID: {fee_payment.transaction_id}")
        print(f"  Bank Transaction ID: {fee_payment.bank_transaction_id}")
        print(f"  Order ID: {fee_payment.order_id}")
        print(f"  Amount: ₹{fee_payment.amount}")
        print(f"\n✓ You can now download the receipt with full transaction details!")
        
    except Application.DoesNotExist:
        print(f"\n✗ Application '{application_id}' not found!")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n=== Create Payment Record for Existing Application ===\n")
    create_payment_for_existing_application()
