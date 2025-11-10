import pymysql

# Connect to database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='online_edu'
)

cursor = conn.cursor()

# Get current columns
cursor.execute('SHOW COLUMNS FROM lsc_admins')
existing_columns = [row[0] for row in cursor.fetchall()]
print('Current columns:', existing_columns)

# Define all required columns based on LSCAdmin model
required_columns = {
    'admin_password': "ALTER TABLE lsc_admins ADD COLUMN admin_password VARCHAR(256) NULL",
    'admin_name': "ALTER TABLE lsc_admins ADD COLUMN admin_name VARCHAR(100) NULL",
    'mobile': "ALTER TABLE lsc_admins ADD COLUMN mobile VARCHAR(15) NULL",
    'district': "ALTER TABLE lsc_admins ADD COLUMN district VARCHAR(100) NULL",
    'state': "ALTER TABLE lsc_admins ADD COLUMN state VARCHAR(100) NULL",
    'pincode': "ALTER TABLE lsc_admins ADD COLUMN pincode VARCHAR(10) NULL",
    'created_at': "ALTER TABLE lsc_admins ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    'updated_at': "ALTER TABLE lsc_admins ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    'created_by': "ALTER TABLE lsc_admins ADD COLUMN created_by VARCHAR(254) NULL"
}

print('\n✓ Adding missing columns:')
print('=' * 60)

for column_name, alter_query in required_columns.items():
    if column_name not in existing_columns:
        try:
            cursor.execute(alter_query)
            conn.commit()
            print(f'  ✓ Added column: {column_name}')
        except Exception as e:
            print(f'  ✗ Error adding {column_name}: {e}')
    else:
        print(f'  • Column already exists: {column_name}')

# Verify final structure
cursor.execute('SHOW COLUMNS FROM lsc_admins')
print('\n✓ Final lsc_admins table columns:')
print('=' * 60)
for row in cursor.fetchall():
    print(f'  • {row[0]:20} ({row[1]})')

conn.close()
print('\n✓ Table update complete!')
