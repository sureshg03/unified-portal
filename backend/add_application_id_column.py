import pymysql

# Connect to database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='online_edu'
)

cursor = conn.cursor()

# Add application_id column
try:
    cursor.execute("""
        ALTER TABLE api_application 
        ADD COLUMN application_id VARCHAR(100) NULL UNIQUE 
        COMMENT 'Format: PU/MODE/LSC_CODE/YEAR/NUMBER'
    """)
    conn.commit()
    print('✓ Added application_id column to api_application table')
except Exception as e:
    if '1060' in str(e):  # Duplicate column name
        print('• application_id column already exists')
    else:
        print(f'✗ Error: {e}')

# Verify
cursor.execute('SHOW COLUMNS FROM api_application')
print('\n✓ Current api_application columns:')
for row in cursor.fetchall():
    print(f'  • {row[0]:25} ({row[1]})')

conn.close()
print('\n✓ Done!')
