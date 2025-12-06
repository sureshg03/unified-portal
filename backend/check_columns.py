import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections

cursor = connections['online_edu'].cursor()
cursor.execute('DESCRIBE api_application')
columns = cursor.fetchall()

print("=== api_application columns ===")
for col in columns:
    print(f"{col[0]:30} {col[1]}")

cursor.close()
