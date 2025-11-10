import pymysql

# Connect to database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='lsc_admindb'
)

cursor = conn.cursor()

# Create portal_applicationsettings table
create_table_sql = """
CREATE TABLE IF NOT EXISTS portal_applicationsettings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_code VARCHAR(20) UNIQUE NOT NULL,
    admission_type VARCHAR(50) NOT NULL,
    admission_year VARCHAR(20) NOT NULL,
    admission_key VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'CLOSED',
    is_active TINYINT(1) DEFAULT 1,
    opening_date DATE NULL,
    closing_date DATE NULL,
    is_open TINYINT(1) DEFAULT 0,
    is_close TINYINT(1) DEFAULT 1,
    max_applications INT UNSIGNED DEFAULT 0,
    current_applications INT UNSIGNED DEFAULT 0,
    description TEXT,
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

try:
    cursor.execute(create_table_sql)
    conn.commit()
    print('✓ Created portal_applicationsettings table in lsc_admindb')
    
    # Verify table was created
    cursor.execute('SHOW TABLES')
    tables = [row[0] for row in cursor.fetchall()]
    print(f'\n✓ Tables in lsc_admindb: {", ".join(tables)}')
    
    # Show table structure
    cursor.execute('DESCRIBE portal_applicationsettings')
    print('\n✓ Table structure:')
    print('=' * 60)
    for row in cursor.fetchall():
        print(f'  • {row[0]:25} {row[1]:20} {row[2]}')
    
except Exception as e:
    print(f'✗ Error: {e}')
    conn.rollback()

conn.close()
print('\n✓ Done!')
