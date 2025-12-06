import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='cdoe_db'
)

cursor = conn.cursor()

# Check what course values are stored in api_application
cursor.execute("""
    SELECT application_id, course, programme_applied 
    FROM api_application 
    WHERE course IS NOT NULL 
    LIMIT 5
""")

print("Applications with course data:")
print("-" * 80)
for row in cursor.fetchall():
    app_id, course, programme = row
    print(f"App ID: {app_id}")
    print(f"  Course: {course}")
    print(f"  Programme: {programme}")
    print()

# Show all courses in tbl_course
cursor.execute("SELECT course_short_code, course_full_name, course_code FROM tbl_course")
print("\nAvailable courses in tbl_course:")
print("-" * 80)
for row in cursor.fetchall():
    short, full, code = row
    print(f"{code} - {short} - {full}")

cursor.close()
conn.close()
