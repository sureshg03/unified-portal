import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Student
from django.db import connections

# Check using online_edu database
print("\n=== Checking online_edu Database ===")
with connections['online_edu'].cursor() as cursor:
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"\nTotal tables: {len(tables)}")
    print("\nTables in online_edu:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check if api_student table exists
    table_names = [table[0] for table in tables]
    if 'api_student' in table_names:
        print("\n✅ api_student table EXISTS!")
        cursor.execute("SELECT COUNT(*) FROM api_student")
        count = cursor.fetchone()[0]
        print(f"   Total students: {count}")
        
        if count > 0:
            cursor.execute("SELECT id, name, email, is_verified FROM api_student LIMIT 5")
            students = cursor.fetchall()
            print("\n   Sample students:")
            for student in students:
                print(f"   - ID: {student[0]}, Name: {student[1]}, Email: {student[2]}, Verified: {student[3]}")
    else:
        print("\n❌ api_student table DOES NOT EXIST!")
        print("   Need to run migrations!")
