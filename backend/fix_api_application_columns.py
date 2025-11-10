import pymysql

# Connect to database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='online_edu'
)

cursor = conn.cursor()

# Get existing columns
cursor.execute('SHOW COLUMNS FROM api_application')
existing_columns = {row[0] for row in cursor.fetchall()}

print('✓ Existing columns:', len(existing_columns))

# Define all required columns from the Application model
required_columns = {
    'gender': "ALTER TABLE api_application ADD COLUMN gender VARCHAR(20) NULL",
    'payment_status': "ALTER TABLE api_application ADD COLUMN payment_status VARCHAR(1) DEFAULT 'N'",
    'status': "ALTER TABLE api_application ADD COLUMN status VARCHAR(20) DEFAULT 'Draft'",
    'is_active': "ALTER TABLE api_application ADD COLUMN is_active TINYINT(1) DEFAULT 1",
}

print('\n✓ Adding missing columns:')
print('=' * 60)

added_count = 0
for column_name, alter_query in required_columns.items():
    if column_name not in existing_columns:
        try:
            cursor.execute(alter_query)
            conn.commit()
            print(f'  ✓ Added column: {column_name}')
            added_count += 1
        except Exception as e:
            print(f'  ✗ Error adding {column_name}: {e}')
    else:
        print(f'  • Column already exists: {column_name}')

print(f'\n✓ Added {added_count} new columns')

# Verify final structure
cursor.execute('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "online_edu" AND TABLE_NAME = "api_application"')
total_columns = cursor.fetchone()[0]
print(f'✓ Total columns in api_application: {total_columns}')

conn.close()
print('\n✓ Done!')
