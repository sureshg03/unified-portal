import pymysql

# Connect to database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='online_edu'
)

cursor = conn.cursor()
cursor.execute('SHOW COLUMNS FROM lsc_admins')

print('\n✓ Current lsc_admins table columns:')
print('=' * 60)
for row in cursor.fetchall():
    print(f'  • {row[0]:20} ({row[1]})')

conn.close()
print('\n✓ Verification complete!')
