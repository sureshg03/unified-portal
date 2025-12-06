import mysql.connector

try:
    # Connect to database
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='cdoe_db'
    )
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print("COURSE CODES IN tbl_course TABLE")
    print("="*80)
    
    cursor.execute("""
        SELECT id, course_code, course_short_code, degree, course_full_name 
        FROM tbl_course 
        ORDER BY id
    """)
    
    rows = cursor.fetchall()
    
    if rows:
        print(f"\nTotal courses found: {len(rows)}\n")
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"  Course Code: {row[1]}")
            print(f"  Short Code: {row[2]}")
            print(f"  Degree: {row[3]}")
            print(f"  Full Name: {row[4]}")
            print("-" * 80)
    else:
        print("\n❌ No courses found in tbl_course table!")
        print("Please ensure the table is populated with course data.")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"\n❌ Database Error: {e}")
except Exception as e:
    print(f"\n❌ Error: {e}")
