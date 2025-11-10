"""
CDOE Two Portal - Interactive Database Migration Script
========================================================
This script prompts for MySQL password and sets up all databases.

Usage:
    python migrate_all_interactive.py
"""

import os
import sys
import subprocess
import pymysql
from pymysql import Error
import getpass

# Databases to create
DATABASES = {
    'lsc_portal_db': 'LSC Portal database for LSC users, Django admin, and sessions',
    'online_edu': 'Online education database for LSC admins and student portal data',
    'lsc_admindb': 'Admin database for application settings and portal configuration'
}

def get_mysql_credentials():
    """Get MySQL credentials from user"""
    print("="*60)
    print("MySQL Connection Setup")
    print("="*60)
    
    host = input("MySQL Host [localhost]: ").strip() or "localhost"
    port = input("MySQL Port [3306]: ").strip() or "3306"
    user = input("MySQL User [root]: ").strip() or "root"
    password = getpass.getpass("MySQL Password (press Enter if no password): ")
    
    return {
        'host': host,
        'user': user,
        'password': password,
        'port': int(port),
        'charset': 'utf8mb4'
    }

def test_connection(config):
    """Test MySQL connection"""
    try:
        connection = pymysql.connect(**config)
        connection.close()
        print("✓ MySQL connection successful!\n")
        return True
    except Error as e:
        print(f"✗ MySQL connection failed: {e}\n")
        return False

def create_connection(config, database=None):
    """Create a database connection"""
    try:
        cfg = config.copy()
        if database:
            cfg['database'] = database
        connection = pymysql.connect(**cfg)
        return connection
    except Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        return None

def create_databases(config):
    """Create all three databases"""
    connection = create_connection(config)
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        print("\n" + "="*60)
        print("Creating MySQL Databases")
        print("="*60 + "\n")
        
        for db_name, description in DATABASES.items():
            try:
                # Drop database if exists
                cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
                print(f"  - Dropped existing database '{db_name}' (if it existed)")
                
                # Create database
                cursor.execute(f"""
                    CREATE DATABASE {db_name} 
                    CHARACTER SET utf8mb4 
                    COLLATE utf8mb4_unicode_ci
                """)
                print(f"✓ Created database '{db_name}'")
                print(f"  Description: {description}\n")
            except Error as e:
                print(f"✗ Error creating database '{db_name}': {e}")
                return False
        
        cursor.close()
        connection.close()
        return True
    except Error as e:
        print(f"✗ Error in database creation: {e}")
        return False

def update_settings_file(config):
    """Update Django settings.py with MySQL password"""
    settings_path = os.path.join('backend', 'settings.py')
    
    try:
        with open(settings_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update password for all three databases
        password = config['password']
        
        # Replace password in all database configs
        import re
        pattern = r"('PASSWORD':\s*)'[^']*'(\s*,\s*#\s*Your MySQL password)"
        replacement = f"\\1'{password}'\\2"
        content = re.sub(pattern, replacement, content)
        
        with open(settings_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ Updated settings.py with MySQL password\n")
        return True
    except Exception as e:
        print(f"✗ Error updating settings.py: {e}\n")
        return False

def run_migrations():
    """Run Django migrations for all databases"""
    print("\n" + "="*60)
    print("RUNNING DJANGO MIGRATIONS")
    print("="*60 + "\n")
    
    try:
        # Step 1: Make migrations
        print("Step 1: Creating migration files...")
        result = subprocess.run(
            [sys.executable, 'manage.py', 'makemigrations'],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.returncode != 0 and "No changes detected" not in result.stdout:
            print(f"Warning: {result.stderr}")
        
        # Step 2: Migrate default database (lsc_portal_db)
        print("\nStep 2: Migrating 'default' database (lsc_portal_db)...")
        print("  - Django admin tables")
        print("  - LSC Users")
        print("  - Admissions app")
        result = subprocess.run(
            [sys.executable, 'manage.py', 'migrate', '--database=default'],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return False
        
        # Step 3: Migrate online_edu database
        print("\nStep 3: Migrating 'online_edu' database...")
        print("  - LSC Admins table")
        print("  - Student Portal tables (api app)")
        result = subprocess.run(
            [sys.executable, 'manage.py', 'migrate', '--database=online_edu'],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return False
        
        # Step 4: Migrate lsc_admindb database
        print("\nStep 4: Migrating 'lsc_admindb' database...")
        print("  - Application Settings")
        print("  - Portal configuration tables")
        result = subprocess.run(
            [sys.executable, 'manage.py', 'migrate', '--database=lsc_admindb'],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return False
        
        print("\n✓ All migrations completed successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False

def verify_tables(config):
    """Verify that tables were created in the correct databases"""
    print("\n" + "="*60)
    print("VERIFYING DATABASE TABLES")
    print("="*60 + "\n")
    
    for db_name in DATABASES.keys():
        connection = create_connection(config, db_name)
        if connection:
            try:
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                
                print(f"Database: {db_name}")
                print(f"  Total tables: {len(tables)}")
                if tables:
                    print("  Tables:")
                    for table in tables[:10]:  # Show first 10 tables
                        print(f"    - {table[0]}")
                    if len(tables) > 10:
                        print(f"    ... and {len(tables) - 10} more tables")
                else:
                    print("  ⚠ No tables found!")
                print()
                
                cursor.close()
                connection.close()
            except Error as e:
                print(f"✗ Error verifying tables in '{db_name}': {e}\n")

def main():
    """Main execution function"""
    print("="*60)
    print("CDOE TWO PORTAL - INTERACTIVE DATABASE SETUP")
    print("="*60)
    print("\nThis script will:")
    print("1. Connect to your MySQL server")
    print("2. Create three MySQL databases")
    print("3. Update Django settings with your password")
    print("4. Run Django migrations to all databases")
    print("5. Verify table creation")
    print("\nDatabases to be created:")
    for db_name, desc in DATABASES.items():
        print(f"  • {db_name}: {desc}")
    print("\n" + "="*60 + "\n")
    
    # Get MySQL credentials
    config = get_mysql_credentials()
    
    # Test connection
    if not test_connection(config):
        print("✗ Failed to connect to MySQL. Please check your credentials.")
        return False
    
    # Create databases
    print("Creating MySQL Databases...")
    if not create_databases(config):
        print("\n✗ Database creation failed. Exiting...")
        return False
    
    # Update settings file
    if config['password']:
        print("Updating Django settings...")
        update_settings_file(config)
    
    # Run migrations
    if not run_migrations():
        print("\n✗ Migration failed. Exiting...")
        return False
    
    # Verify tables
    verify_tables(config)
    
    print("="*60)
    print("✓ DATABASE SETUP COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. ✓ All three databases created in MySQL")
    print("2. ✓ All tables migrated successfully")
    print("3. Run backend server: python manage.py runserver")
    print("4. Create test users: python create_test_users.py")
    print("\nYou can now open MySQL Workbench to verify the databases!")
    print("\n")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
