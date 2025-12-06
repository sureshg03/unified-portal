import mysql.connector
import sys

try:
    # Connect to database
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='cdoe_db'
    )
    
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SHOW TABLES LIKE 'document_resubmissions'")
    result = cursor.fetchone()
    
    if result:
        print("✅ Table 'document_resubmissions' EXISTS")
        
        # Check table structure
        cursor.execute("DESCRIBE document_resubmissions")
        columns = cursor.fetchall()
        print("\nTable Structure:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")
        
        # Check if there are any records
        cursor.execute("SELECT COUNT(*) FROM document_resubmissions")
        count = cursor.fetchone()[0]
        print(f"\nTotal records: {count}")
        
        if count > 0:
            cursor.execute("SELECT token, application_id, status, expires_at FROM document_resubmissions ORDER BY created_at DESC LIMIT 5")
            records = cursor.fetchall()
            print("\nRecent tokens:")
            for rec in records:
                print(f"  Token: {rec[0][:20]}... | App: {rec[1]} | Status: {rec[2]} | Expires: {rec[3]}")
    else:
        print("❌ Table 'document_resubmissions' DOES NOT EXIST")
        print("\nThis table needs to be created for resubmission functionality to work.")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
