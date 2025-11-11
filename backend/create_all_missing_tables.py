#!/usr/bin/env python
"""
Script to create all missing tables in the online_edu database
This script ensures all Django models have their corresponding database tables.
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.db import connections

def check_and_create_tables():
    """Check for missing tables and create them if needed"""
    
    tables_to_create = {
        'api_marksheet_uploads': """
        CREATE TABLE `api_marksheet_uploads` (
            `id` bigint(20) NOT NULL AUTO_INCREMENT,
            `email` varchar(191) NOT NULL,
            `qualification_type` varchar(50) NOT NULL,
            `file_url` varchar(500) NOT NULL,
            `uploaded_at` datetime(6) NOT NULL,
            `student_id` bigint(20) NOT NULL,
            PRIMARY KEY (`id`),
            KEY `api_marksheet_uploads_student_id_fk` (`student_id`),
            CONSTRAINT `api_marksheet_uploads_student_id_fk` FOREIGN KEY (`student_id`) REFERENCES `api_studentdetails` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        'feepayment': """
        CREATE TABLE `feepayment` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `application_id` varchar(20) NOT NULL,
            `user_name` varchar(100) DEFAULT NULL,
            `email` varchar(191) NOT NULL,
            `phone` varchar(15) DEFAULT NULL,
            `transaction_id` varchar(1000) DEFAULT NULL,
            `bank_transaction_id` varchar(1000) DEFAULT NULL,
            `order_id` varchar(1000) NOT NULL,
            `amount` decimal(10,2) DEFAULT NULL,
            `course` varchar(100) DEFAULT NULL,
            `payment_status` varchar(20) NOT NULL DEFAULT 'CREATED',
            `transaction_type` varchar(1000) DEFAULT NULL,
            `gateway_name` varchar(1000) DEFAULT NULL,
            `response_code` varchar(1000) DEFAULT NULL,
            `response_message` varchar(1000) DEFAULT NULL,
            `bank_name` varchar(1000) DEFAULT NULL,
            `payment_mode` varchar(1000) DEFAULT NULL,
            `refund_amount` varchar(1000) DEFAULT '0',
            `mid` varchar(1000) DEFAULT NULL,
            `transaction_date` datetime(6) DEFAULT NULL,
            `payment_type` varchar(45) DEFAULT NULL,
            `user_id` int(11) DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `feepayment_user_id_fk` (`user_id`),
            CONSTRAINT `feepayment_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    }
    
    # Use the online_edu database connection
    with connections['online_edu'].cursor() as cursor:
        print("\n=== Checking tables in online_edu database ===\n")
        
        for table_name, create_sql in tables_to_create.items():
            # Check if table exists
            cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
            if cursor.fetchone():
                print(f"✓ Table '{table_name}' already exists!")
            else:
                try:
                    cursor.execute(create_sql)
                    print(f"✓ Successfully created table '{table_name}'!")
                except Exception as e:
                    print(f"✗ Error creating table '{table_name}': {e}")
        
        print("\n=== Table check complete ===\n")

if __name__ == "__main__":
    check_and_create_tables()
