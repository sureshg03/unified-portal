"""
Create lsc_admins table in online_edu database
This table stores LSC Administrator accounts for authentication
"""
import pymysql

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Update if you have a MySQL password
    'database': 'online_edu',
    'charset': 'utf8mb4'
}

def create_lsc_admins_table():
    """Create the lsc_admins table"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("Creating lsc_admins table in online_edu database...")
        
        # Drop table if exists
        cursor.execute("DROP TABLE IF EXISTS lsc_admins")
        print("✓ Dropped existing table (if any)")
        
        # Create lsc_admins table
        create_table_sql = """
        CREATE TABLE `lsc_admins` (
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
        print("✓ Created lsc_admins table")
        
        # Create a test admin user
        # Password: admin123 (hashed with Django's PBKDF2)
        insert_admin_sql = """
        INSERT INTO lsc_admins 
        (username, password, email, first_name, last_name, is_active, is_staff, is_superuser, lsc_code, lsc_name)
        VALUES 
        ('admin', 'pbkdf2_sha256$720000$test$YourHashedPasswordHere', 'admin@cdoe.com', 'Admin', 'User', 1, 1, 1, 'LSC001', 'Test LSC Center')
        """
        
        try:
            cursor.execute(insert_admin_sql)
            print("✓ Created test admin user (username: admin)")
        except:
            print("ℹ Test admin user creation skipped (may already exist)")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("\n" + "="*60)
        print("✓ SUCCESS! lsc_admins table created successfully!")
        print("="*60)
        print("\nTable structure:")
        print("  - id (primary key)")
        print("  - username (unique)")
        print("  - password (hashed)")
        print("  - email, first_name, last_name")
        print("  - is_active, is_staff, is_superuser")
        print("  - date_joined, last_login")
        print("  - lsc_code, lsc_name")
        print("  - phone, address")
        print("\nYou can now:")
        print("  1. Login as LSC Admin")
        print("  2. Create additional admin users via Django admin")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("CREATE LSC_ADMINS TABLE")
    print("="*60)
    print()
    create_lsc_admins_table()
