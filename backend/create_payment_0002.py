import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import ApplicationPayment
from django.utils import timezone

app_id = 'PU/ODL/LC2101/A25/0002'
now = timezone.now()

txn_id = 'TXN' + now.strftime('%Y%m%d%H%M%S')
bank_txn = 'BANK' + now.strftime('%Y%m%d%H%M%S%f')
order = 'ORDER' + now.strftime('%Y%m%d%H%M%S')

# Check if payment already exists
existing = ApplicationPayment.objects.filter(application_id=app_id).first()
if existing:
    print(f"Payment already exists for {app_id}")
    print(f"Payment ID: {existing.id}")
    print(f"Transaction ID: {existing.transaction_id}")
    print(f"Bank Transaction ID: {existing.bank_transaction_id}")
    print(f"Order ID: {existing.order_id}")
else:
    # Create new payment record
    payment = ApplicationPayment.objects.create(
        application_id=app_id,
        email='suresh179073@gmail.com',
        transaction_id=txn_id,
        bank_transaction_id=bank_txn,
        order_id=order,
        amount=236.00,
        payment_status='success',
        transaction_type='APPLICATION_FEE',
        gateway_name='DUMMY_GATEWAY',
        response_code='01',
        response_message='Txn Success',
        bank_name='TEST_BANK',
        payment_mode='DUMMY',
        mid='TESTMERCHANT',
        transaction_date=now,
        payment_type='APPLICATION_FEE'
    )
    
    print(f"✅ Payment record created successfully!")
    print(f"Payment ID: {payment.id}")
    print(f"Application ID: {payment.application_id}")
    print(f"Transaction ID: {payment.transaction_id}")
    print(f"Bank Transaction ID: {payment.bank_transaction_id}")
    print(f"Order ID: {payment.order_id}")
    print(f"Amount: {payment.amount}")
    print(f"Payment Status: {payment.payment_status}")
