#!/usr/bin/env python
"""
Script to create the semester_payments table for tracking semester-wise fee payments
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.db import connections

def create_semester_payments_table():
    """Create the semester_payments table in default database"""
    
    with connections['default'].cursor() as cursor:
        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'semester_payments'")
        if cursor.fetchone():
            print("✓ Table semester_payments already exists!")
            return

        # Create the table
        create_table_sql = """
        CREATE TABLE `semester_payments` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `application_id` varchar(100) DEFAULT NULL,
            `student_email` varchar(191) NOT NULL,
            `student_name` varchar(200) DEFAULT NULL,
            `semester` varchar(20) NOT NULL,
            `semester_number` int(11) NOT NULL,
            `amount` decimal(10,2) NOT NULL,
            `transaction_id` varchar(100) NOT NULL UNIQUE,
            `receipt_number` varchar(100) NOT NULL UNIQUE,
            `payment_method` varchar(50) DEFAULT 'Credit/Debit Card',
            `payment_status` varchar(20) NOT NULL DEFAULT 'PENDING',
            `card_last_four` varchar(4) DEFAULT NULL,
            `payment_date` datetime(6) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_id` (`user_id`),
            KEY `idx_student_email` (`student_email`),
            KEY `idx_semester` (`semester`),
            KEY `idx_payment_status` (`payment_status`),
            KEY `idx_transaction_id` (`transaction_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        cursor.execute(create_table_sql)
        print("✓ Created semester_payments table successfully!")
        
        # Create index for faster queries
        print("✓ Indexes created successfully!")

if __name__ == '__main__':
    try:
        print("Creating semester_payments table...")
        create_semester_payments_table()
        print("\n✅ All operations completed successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
