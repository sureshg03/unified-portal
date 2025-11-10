"""
Quick Database Creator - Creates all 3 databases
"""
import pymysql

# Get password from user
password = input("Enter your MySQL root password (or press Enter if no password): ")

print("\nConnecting to MySQL...")

try:
    # Connect to MySQL (without specifying database)
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password=password,
        charset='utf8mb4'
    )
    
    cursor = connection.cursor()
    
    print("✓ Connected to MySQL successfully!\n")
    
    # Create databases
    databases = ['lsc_portal_db', 'online_edu', 'lsc_admindb']
    
    for db in databases:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✓ Created database: {db}")
    
    # Create lsc_admins table in online_edu
    cursor.execute("USE online_edu")
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS `lsc_admins` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `username` varchar(150) NOT NULL UNIQUE,
        `password` varchar(255) NOT NULL,
        `email` varchar(254) DEFAULT NULL,
        `first_name` varchar(150) DEFAULT NULL,
        `last_name` varchar(150) DEFAULT NULL,
        `is_active` tinyint(1) DEFAULT 1,
        `is_staff` tinyint(1) DEFAULT 1,
        `is_superuser` tinyint(1) DEFAULT 0,
        `date_joined` datetime DEFAULT CURRENT_TIMESTAMP,
        `last_login` datetime DEFAULT NULL,
        `lsc_code` varchar(50) DEFAULT NULL,
        `lsc_name` varchar(255) DEFAULT NULL,
        `phone` varchar(15) DEFAULT NULL,
        `address` text DEFAULT NULL,
        PRIMARY KEY (`id`),
        KEY `idx_username` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    cursor.execute(create_table_sql)
    print("✓ Created lsc_admins table in online_edu")
    
    connection.commit()
    cursor.close()
    connection.close()
    
    print("\n" + "="*60)
    print("✓ SUCCESS! All databases created!")
    print("="*60)
    print("\nDatabases created:")
    print("  1. lsc_portal_db")
    print("  2. online_edu (with lsc_admins table)")
    print("  3. lsc_admindb")
    print("\nNow run migrations:")
    print("  python manage.py migrate --database=default")
    print("  python manage.py migrate --database=online_edu")
    print("  python manage.py migrate --database=lsc_admindb")
    print()
    
except pymysql.err.OperationalError as e:
    print(f"\n✗ Error: {e}")
    print("\nPlease check:")
    print("  1. MySQL is running")
    print("  2. Password is correct")
    print("  3. Root user has necessary permissions")
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
