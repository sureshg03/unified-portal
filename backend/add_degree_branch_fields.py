#!/usr/bin/env python
"""
Script to add degree and branch_name fields to Application model
Run this script from the backend directory: python add_degree_branch_fields.py
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def add_fields():
    with connection.cursor() as cursor:
        # Try different possible table names
        table_names = ['api_application', 'applications', 'application']
        
        for table_name in table_names:
            try:
                # Check if table exists
                cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
                if cursor.fetchone():
                    print(f"✓ Found table: {table_name}")
                    
                    try:
                        # Add degree field
                        cursor.execute(f"""
                            ALTER TABLE {table_name} 
                            ADD COLUMN degree VARCHAR(100) NULL
                        """)
                        print(f"✓ Added 'degree' field to {table_name} table")
                    except Exception as e:
                        if 'Duplicate column name' in str(e) or 'already exists' in str(e):
                            print(f"⚠ 'degree' field already exists in {table_name}")
                        else:
                            print(f"✗ Error adding 'degree' field: {e}")
                    
                    try:
                        # Add branch_name field
                        cursor.execute(f"""
                            ALTER TABLE {table_name} 
                            ADD COLUMN branch_name VARCHAR(100) NULL
                        """)
                        print(f"✓ Added 'branch_name' field to {table_name} table")
                    except Exception as e:
                        if 'Duplicate column name' in str(e) or 'already exists' in str(e):
                            print(f"⚠ 'branch_name' field already exists in {table_name}")
                        else:
                            print(f"✗ Error adding 'branch_name' field: {e}")
                    
                    return  # Exit after finding and updating the correct table
            except Exception as e:
                continue
        
        print("✗ Could not find Application table. Tried: api_application, applications, application")

if __name__ == '__main__':
    print("Adding degree and branch_name fields to Application model...")
    add_fields()
    print("\nDone! You can now use degree and branch_name fields in your application.")
