import requests
import json

# Get the latest token from database
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='cdoe_db'
)

cursor = conn.cursor()
cursor.execute("SELECT token FROM document_resubmissions WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1")
result = cursor.fetchone()

if result:
    token = result[0]
    print(f"Testing with token: {token[:30]}...")
    
    # Test the API endpoint
    url = f"http://localhost:8000/api/resubmit-documents/verify/{token}/"
    print(f"\nCalling: {url}")
    
    try:
        response = requests.get(url)
        print(f"\nStatus Code: {response.status_code}")
        print(f"\nResponse Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"Response text: {response.text}")
else:
    print("❌ No pending tokens found in database")

cursor.close()
conn.close()
