"""
CDOE Two Portal - Database Migration Script
============================================
This script creates all three databases and runs migrations to all of them.

Usage:
    python migrate_all_databases.py

What this script does:
1. Verifies MySQL connection
2. Creates all three databases (lsc_portal_db, online_edu, lsc_admindb)
3. Runs migrations for each database
4. Creates necessary tables in the correct databases
"""

import os
import sys
import subprocess
import pymysql
from pymysql import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Update this with your MySQL password if needed
    'port': 3306,
    'charset': 'utf8mb4'
}

# Databases to create
DATABASES = {
    'lsc_portal_db': 'LSC Portal database for LSC users, Django admin, and sessions',
    'online_edu': 'Online education database for LSC admins and student portal data',
    'lsc_admindb': 'Admin database for application settings and portal configuration'
}

def create_connection(database=None):
    """Create a database connection"""
    try:
        config = DB_CONFIG.copy()
        if database:
            config['database'] = database
        connection = pymysql.connect(**config)
        print(f"✓ Successfully connected to MySQL{' database: ' + database if database else ''}")
        return connection
    except Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        return None

def create_databases():
    """Create all three databases"""
    connection = create_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
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
        if result.returncode != 0:
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

def verify_tables():
    """Verify that tables were created in the correct databases"""
    print("\n" + "="*60)
    print("VERIFYING DATABASE TABLES")
    print("="*60 + "\n")
    
    for db_name in DATABASES.keys():
        connection = create_connection(db_name)
        if connection:
            try:
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                
                print(f"Database: {db_name}")
                print(f"  Total tables: {len(tables)}")
                if tables:
                    print("  Tables:")
                    for table in tables:
                        print(f"    - {table[0]}")
                else:
                    print("  No tables found!")
                print()
                
                cursor.close()
                connection.close()
            except Error as e:
                print(f"✗ Error verifying tables in '{db_name}': {e}\n")

def main():
    """Main execution function"""
    print("="*60)
    print("CDOE TWO PORTAL - DATABASE SETUP")
    print("="*60)
    print("\nThis script will:")
    print("1. Create three MySQL databases")
    print("2. Run Django migrations to all databases")
    print("3. Verify table creation")
    print("\nDatabases to be created:")
    for db_name, desc in DATABASES.items():
        print(f"  • {db_name}: {desc}")
    print("\n" + "="*60 + "\n")
    
    # Check if pymysql is installed
    try:
        import pymysql
    except ImportError:
        print("✗ pymysql is not installed. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'pymysql'])
        print("✓ pymysql installed successfully\n")
    
    # Step 1: Create databases
    print("STEP 1: Creating MySQL Databases")
    print("-" * 60)
    if not create_databases():
        print("\n✗ Database creation failed. Exiting...")
        return False
    
    # Step 2: Run migrations
    if not run_migrations():
        print("\n✗ Migration failed. Exiting...")
        return False
    
    # Step 3: Verify tables
    verify_tables()
    
    print("="*60)
    print("✓ DATABASE SETUP COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Check your MySQL Workbench to verify all databases")
    print("2. Run the backend server: python manage.py runserver")
    print("3. Create test data if needed: python create_test_users.py")
    print("\n")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
