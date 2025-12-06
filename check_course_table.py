import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='cdoe_db'
)

cursor = conn.cursor()

# Check if tbl_course exists
cursor.execute("SHOW TABLES LIKE 'tbl_course'")
if cursor.fetchone():
    print("✅ tbl_course table exists\n")
    
    # Show structure
    cursor.execute("DESCRIBE tbl_course")
    print("Table Structure:")
    for col in cursor.fetchall():
        print(f"  - {col[0]} ({col[1]})")
    
    # Show sample data
    cursor.execute("SELECT * FROM tbl_course LIMIT 5")
    print("\nSample Data:")
    columns = [desc[0] for desc in cursor.description]
    print(f"  Columns: {', '.join(columns)}")
    for row in cursor.fetchall():
        print(f"  {row}")
else:
    print("❌ tbl_course table NOT found")
    
    # Check for similar tables
    cursor.execute("SHOW TABLES LIKE '%course%'")
    results = cursor.fetchall()
    if results:
        print("\nSimilar tables found:")
        for table in results:
            print(f"  - {table[0]}")

cursor.close()
conn.close()
