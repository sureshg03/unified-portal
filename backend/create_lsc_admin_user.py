"""
Create LSC Admin users with proper password hashing
Run: python create_lsc_admin_user.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from django.db import connections

def create_lsc_admins_table():
    """Create the lsc_admins table if it doesn't exist"""
    
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
    
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute(create_table_sql)
            print("✓ lsc_admins table created/verified")
            return True
    except Exception as e:
        print(f"✗ Error creating table: {e}")
        return False

def create_admin_user(username, email, password, first_name, last_name, lsc_code, lsc_name, phone=None):
    """Create an LSC Admin user with properly hashed password"""
    
    # Hash the password using Django's password hasher
    hashed_password = make_password(password)
    
    insert_sql = """
    INSERT INTO lsc_admins 
    (username, password, email, first_name, last_name, is_active, is_staff, is_superuser, lsc_code, lsc_name, phone)
    VALUES (%s, %s, %s, %s, %s, 1, 1, 1, %s, %s, %s)
    """
    
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute(insert_sql, [
                username, hashed_password, email, first_name, last_name, 
                lsc_code, lsc_name, phone
            ])
            print(f"✓ Created admin user: {username}")
            return True
    except Exception as e:
        if '1062' in str(e):  # Duplicate entry
            print(f"ℹ Admin user '{username}' already exists")
        else:
            print(f"✗ Error creating admin: {e}")
        return False

def list_admin_users():
    """List all admin users"""
    try:
        with connections['online_edu'].cursor() as cursor:
            cursor.execute("""
                SELECT id, username, email, first_name, last_name, 
                       is_active, lsc_code, lsc_name, date_joined
                FROM lsc_admins
                ORDER BY id
            """)
            admins = cursor.fetchall()
            
            if admins:
                print("\n" + "="*80)
                print("LSC ADMIN USERS")
                print("="*80)
                for admin in admins:
                    print(f"\nID: {admin[0]}")
                    print(f"  Username: {admin[1]}")
                    print(f"  Email: {admin[2]}")
                    print(f"  Name: {admin[3]} {admin[4]}")
                    print(f"  Active: {'Yes' if admin[5] else 'No'}")
                    print(f"  LSC Code: {admin[6]}")
                    print(f"  LSC Name: {admin[7]}")
                    print(f"  Joined: {admin[8]}")
            else:
                print("\nℹ No admin users found")
                
    except Exception as e:
        print(f"✗ Error listing admins: {e}")

def main():
    print("="*80)
    print("LSC ADMIN USER CREATION")
    print("="*80)
    print()
    
    # Step 1: Create table
    print("Step 1: Creating/verifying lsc_admins table...")
    if not create_lsc_admins_table():
        print("\n✗ Failed to create table. Please check your database connection.")
        return
    print()
    
    # Step 2: Create default admin users
    print("Step 2: Creating default admin users...")
    print()
    
    # Create main admin
    create_admin_user(
        username='admin@cdoe.com',
        email='admin@cdoe.com',
        password='admin123',  # Change this password!
        first_name='Admin',
        last_name='User',
        lsc_code='LSC001',
        lsc_name='Main LSC Center',
        phone='9999999999'
    )
    
    # Create test admin
    create_admin_user(
        username='test@cdoe.com',
        email='test@cdoe.com',
        password='test123',  # Change this password!
        first_name='Test',
        last_name='Admin',
        lsc_code='LSC002',
        lsc_name='Test LSC Center',
        phone='8888888888'
    )
    
    print()
    
    # Step 3: List all admins
    print("Step 3: Listing all admin users...")
    list_admin_users()
    
    print("\n" + "="*80)
    print("✓ COMPLETE!")
    print("="*80)
    print("\nDefault Admin Credentials:")
    print("  Username: admin@cdoe.com")
    print("  Password: admin123")
    print()
    print("  Username: test@cdoe.com")
    print("  Password: test123")
    print()
    print("⚠ IMPORTANT: Change these default passwords after first login!")
    print()
    print("You can now:")
    print("  1. Start the server: python manage.py runserver")
    print("  2. Login as LSC Admin with the credentials above")
    print("  3. Change the default passwords")
    print()

if __name__ == "__main__":
    main()
