import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

# Show table structure
with connections['online_edu'].cursor() as cursor:
    cursor.execute("DESCRIBE api_student;")
    columns = cursor.fetchall()
    
    print("✅ Current api_student table structure:\n")
    print(f"{'Field':<20} {'Type':<20} {'Null':<8} {'Key':<8} {'Default':<15} {'Extra'}")
    print("-" * 100)
    for col in columns:
        field, type_, null, key, default, extra = col
        print(f"{field:<20} {type_:<20} {null:<8} {key:<8} {str(default):<15} {extra}")
