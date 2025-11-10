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
cursor.execute('SHOW COLUMNS FROM api_student')
existing_columns = [row[0] for row in cursor.fetchall()]

print('✓ Current columns in api_student table:')
for col in existing_columns:
    print(f'  • {col}')

# Define missing LSC columns
lsc_columns = {
    'lsc_code': "ALTER TABLE api_student ADD COLUMN lsc_code VARCHAR(50) NULL COMMENT 'LSC Center Code'",
    'lsc_name': "ALTER TABLE api_student ADD COLUMN lsc_name VARCHAR(200) NULL COMMENT 'LSC Center Name'",
    'referral_date': "ALTER TABLE api_student ADD COLUMN referral_date DATETIME NULL COMMENT 'Date when student signed up via LSC'"
}

print('\n✓ Adding missing LSC columns:')
print('=' * 60)

for column_name, alter_query in lsc_columns.items():
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
cursor.execute('SHOW COLUMNS FROM api_student')
print('\n✓ Final api_student table columns:')
print('=' * 60)
for row in cursor.fetchall():
    print(f'  • {row[0]:25} ({row[1]})')

conn.close()
print('\n✓ Table update complete!')
