import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

def add_application_id_field():
    """Add application_id field to api_application table"""
    try:
        with connections['online_edu'].cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = 'online_edu' 
                AND TABLE_NAME = 'api_application' 
                AND COLUMN_NAME = 'application_id'
            """)
            exists = cursor.fetchone()[0]
            
            if exists:
                print("✅ application_id column already exists")
                return
            
            # Add the column
            cursor.execute("""
                ALTER TABLE api_application 
                ADD COLUMN application_id VARCHAR(100) NULL UNIQUE
                COMMENT 'Format: PU/MODE/LSC_CODE/YEAR/NUMBER'
            """)
            print("✅ Added application_id column to api_application table")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    add_application_id_field()
    print("✅ Done!")
