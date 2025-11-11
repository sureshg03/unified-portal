#!/usr/bin/env python
"""
Script to create the missing api_marksheet_uploads table
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from django.db import connection

def create_marksheet_uploads_table():
    with connection.cursor() as cursor:
        # Switch to the correct database
        cursor.execute("USE online_edu")

        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'api_marksheet_uploads'")
        if cursor.fetchone():
            print("Table api_marksheet_uploads already exists!")
            return

        # Create the table
        create_table_sql = """
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
        """

        try:
            cursor.execute(create_table_sql)
            print("✓ Successfully created api_marksheet_uploads table!")
        except Exception as e:
            print(f"✗ Error creating table: {e}")

if __name__ == "__main__":
    create_marksheet_uploads_table()