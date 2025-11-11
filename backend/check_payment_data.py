#!/usr/bin/env python
"""
Script to check feepayment table data
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from api.models import ApplicationPayment, Application, Student
from django.contrib.auth.models import User

def check_payment_data():
    """Check what payment data exists in the database"""
    
    print("\n=== Checking feepayment table data ===\n")
    
    # Get all payments
    payments = ApplicationPayment.objects.all()
    print(f"Total payments in feepayment table: {payments.count()}")
    
    if payments.count() > 0:
        print("\n--- Payment Records ---")
        for payment in payments:
            print(f"\nPayment ID: {payment.id}")
            print(f"  Application ID: {payment.application_id}")
            print(f"  User: {payment.user.email if payment.user else 'N/A'}")
            print(f"  Transaction ID: {payment.transaction_id}")
            print(f"  Bank Transaction ID: {payment.bank_transaction_id}")
            print(f"  Order ID: {payment.order_id}")
            print(f"  Amount: {payment.amount}")
            print(f"  Payment Status: {payment.payment_status}")
            print(f"  Payment Mode: {payment.payment_mode}")
            print(f"  Gateway: {payment.gateway_name}")
            print(f"  Bank Name: {payment.bank_name}")
            print(f"  Response Code: {payment.response_code}")
            print(f"  Response Message: {payment.response_message}")
            print(f"  Transaction Date: {payment.transaction_date}")
    
    # Check applications with payment status
    paid_apps = Application.objects.filter(payment_status='P')
    print(f"\n\nTotal paid applications: {paid_apps.count()}")
    
    if paid_apps.count() > 0:
        print("\n--- Paid Applications ---")
        for app in paid_apps:
            print(f"\nApplication ID: {app.application_id}")
            print(f"  User: {app.user.email}")
            print(f"  Payment Status: {app.payment_status}")
            
            # Check if there's a matching fee payment
            fee_payment = ApplicationPayment.objects.filter(
                application_id=app.application_id
            ).first()
            
            if fee_payment:
                print(f"  ✓ Has fee payment record (ID: {fee_payment.id})")
            else:
                print(f"  ✗ No fee payment record found!")
    
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    check_payment_data()
