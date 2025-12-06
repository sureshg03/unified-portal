import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='cdoe_db'
    )
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print("APPLICATION COURSES IN DATABASE")
    print("="*80)
    
    cursor.execute("""
        SELECT application_id, course, enrollment_no 
        FROM api_application 
        WHERE course LIKE '%COMPUTER%' OR course LIKE '%BUSINESS%'
        LIMIT 10
    """)
    
    rows = cursor.fetchall()
    
    if rows:
        print(f"\nApplications found: {len(rows)}\n")
        for row in rows:
            print(f"Application ID: {row[0]}")
            print(f"  Course: {row[1]}")
            print(f"  Enrollment: {row[2]}")
            print("-" * 80)
    else:
        print("\nNo applications found")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
