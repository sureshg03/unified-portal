import mysql.connector
import json

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='cdoe_db'
)

cursor = conn.cursor()

# Get an application that has resubmitted documents
cursor.execute("""
    SELECT application_id, document_validation 
    FROM api_application 
    WHERE document_validation LIKE '%resubmitted%' 
    LIMIT 1
""")

result = cursor.fetchone()

if result:
    app_id, doc_val = result
    print(f"Application ID: {app_id}")
    print(f"\nDocument Validation JSON:")
    if doc_val:
        parsed = json.loads(doc_val)
        print(json.dumps(parsed, indent=2))
    else:
        print("NULL")
else:
    print("No applications with resubmitted documents found")
    
    # Check all applications with document_validation
    cursor.execute("""
        SELECT application_id, document_validation 
        FROM api_application 
        WHERE document_validation IS NOT NULL 
        LIMIT 3
    """)
    
    results = cursor.fetchall()
    print("\nSample applications with document_validation:")
    for app_id, doc_val in results:
        print(f"\n{app_id}:")
        if doc_val:
            try:
                parsed = json.loads(doc_val)
                print(json.dumps(parsed, indent=2))
            except:
                print(doc_val)

cursor.close()
conn.close()
