#!/usr/bin/env python
"""
Script to create the missing feepayment table
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.db import connections

def create_feepayment_table():
    # Use the online_edu database connection
    with connections['online_edu'].cursor() as cursor:
        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'feepayment'")
        if cursor.fetchone():
            print("Table feepayment already exists!")
            return

        # Create the table
        create_table_sql = """
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

        try:
            cursor.execute(create_table_sql)
            print("✓ Successfully created feepayment table!")
        except Exception as e:
            print(f"✗ Error creating table: {e}")

if __name__ == "__main__":
    create_feepayment_table()
