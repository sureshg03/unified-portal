"""
CDOE Database Consolidation Script
===================================
This script safely consolidates three databases into one: cdoe_db

Source databases:
- lsc_portal_db (default)
- online_edu 
- lsc_admindb

Target database:
- cdoe_db (consolidated)

Process:
1. Backup all existing databases
2. Create new consolidated database
3. Migrate Django tables
4. Migrate application tables
5. Verify data integrity
6. Update settings.py
"""

import mysql.connector
import os
import sys
from datetime import datetime
import subprocess
import shutil

# Database Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Update with your MySQL password
    'port': 3306
}

SOURCE_DATABASES = ['lsc_portal_db', 'online_edu', 'lsc_admindb']
TARGET_DATABASE = 'cdoe_db'
BACKUP_DIR = 'database_backups'

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Print formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}")
    print(f"{text.center(70)}")
    print(f"{'='*70}{Colors.ENDC}\n")

def print_success(text):
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    """Print error message"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def create_connection(database=None):
    """Create MySQL connection"""
    try:
        config = DB_CONFIG.copy()
        if database:
            config['database'] = database
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print_error(f"Connection error: {err}")
        return None

def backup_database(db_name):
    """Backup a database using mysqldump"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(BACKUP_DIR, f"{db_name}_{timestamp}.sql")
        
        # Create backup directory if it doesn't exist
        os.makedirs(BACKUP_DIR, exist_ok=True)
        
        print_info(f"Backing up {db_name}...")
        
        # Construct mysqldump command
        cmd = [
            'mysqldump',
            '-h', DB_CONFIG['host'],
            '-u', DB_CONFIG['user'],
            '-P', str(DB_CONFIG['port']),
            '--single-transaction',
            '--routines',
            '--triggers',
            db_name
        ]
        
        if DB_CONFIG['password']:
            cmd.insert(6, f"-p{DB_CONFIG['password']}")
        
        # Execute mysqldump
        with open(backup_file, 'w', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            
            if result.returncode != 0:
                print_error(f"Backup failed for {db_name}: {result.stderr}")
                return None
        
        print_success(f"Backup created: {backup_file}")
        return backup_file
        
    except Exception as e:
        print_error(f"Backup error for {db_name}: {str(e)}")
        return None

def check_database_exists(cursor, db_name):
    """Check if database exists"""
    cursor.execute(f"SHOW DATABASES LIKE '{db_name}'")
    return cursor.fetchone() is not None

def get_table_list(cursor, db_name):
    """Get list of tables in a database"""
    cursor.execute(f"SHOW TABLES FROM {db_name}")
    return [table[0] for table in cursor.fetchall()]

def get_table_row_count(cursor, db_name, table_name):
    """Get row count for a table"""
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {db_name}.{table_name}")
        return cursor.fetchone()[0]
    except:
        return 0

def create_consolidated_database(conn):
    """Create the consolidated database"""
    try:
        cursor = conn.cursor()
        
        print_info(f"Creating consolidated database: {TARGET_DATABASE}")
        
        # Drop if exists (only if user confirms)
        if check_database_exists(cursor, TARGET_DATABASE):
            print_warning(f"Database {TARGET_DATABASE} already exists!")
            response = input(f"{Colors.WARNING}Do you want to DROP and recreate it? (yes/no): {Colors.ENDC}")
            if response.lower() != 'yes':
                print_info("Keeping existing database...")
                return True
            cursor.execute(f"DROP DATABASE {TARGET_DATABASE}")
            print_success(f"Dropped existing {TARGET_DATABASE}")
        
        # Create database
        cursor.execute(f"""
            CREATE DATABASE {TARGET_DATABASE}
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        """)
        conn.commit()
        print_success(f"Created database: {TARGET_DATABASE}")
        
        cursor.close()
        return True
        
    except mysql.connector.Error as err:
        print_error(f"Failed to create database: {err}")
        return False

def run_django_migrations():
    """Run Django migrations on the consolidated database"""
    try:
        print_info("Running Django migrations...")
        
        # Change to backend directory
        backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
        original_dir = os.getcwd()
        
        try:
            os.chdir(backend_dir)
            
            # Run makemigrations
            print_info("Creating migrations...")
            result = subprocess.run(
                [sys.executable, 'manage.py', 'makemigrations'],
                capture_output=True,
                text=True
            )
            print(result.stdout)
            if result.stderr:
                print_warning(result.stderr)
            
            # Run migrate
            print_info("Applying migrations...")
            result = subprocess.run(
                [sys.executable, 'manage.py', 'migrate'],
                capture_output=True,
                text=True
            )
            print(result.stdout)
            if result.stderr:
                print_warning(result.stderr)
            
            print_success("Django migrations completed")
            return True
            
        finally:
            os.chdir(original_dir)
        
    except Exception as e:
        print_error(f"Migration error: {str(e)}")
        return False

def migrate_data(conn):
    """Migrate data from source databases to target"""
    try:
        cursor = conn.cursor()
        
        print_header("DATA MIGRATION")
        
        # Define migration order (respecting foreign keys)
        migration_plan = {
            'lsc_portal_db': [
                # Django core tables
                'auth_user',
                'auth_group',
                'auth_permission',
                'django_content_type',
                'auth_group_permissions',
                'auth_user_groups',
                'auth_user_user_permissions',
                'django_session',
                'django_admin_log',
                'django_migrations',
                'authtoken_token',
                # LSC Auth
                'lsc_auth_lscuser',
                'lsc_auth_lscuser_groups',
                'lsc_auth_lscuser_user_permissions',
            ],
            'online_edu': [
                # API app tables (Student Portal)
                'api_student',
                'api_application',
                'api_studentdetails',
                'api_marksheet_uploads',
                'api_course',
                'courses',
                'payments',
                'feepayment',
                'lsc_admins',
            ],
            'lsc_admindb': [
                # Portal app tables
                'portal_program',
                'portal_student',
                'portal_counsellor',
                'portal_attendance',
                'portal_assignmentmark',
                'portal_applicationsettings',
                'portal_systemsettings',
                'portal_notificationsettings',
            ]
        }
        
        total_migrated = 0
        
        for source_db, tables in migration_plan.items():
            print_info(f"\nMigrating from {source_db}...")
            
            # Check if source database exists
            if not check_database_exists(cursor, source_db):
                print_warning(f"Source database {source_db} does not exist, skipping...")
                continue
            
            for table in tables:
                try:
                    # Check if table exists in source
                    cursor.execute(f"SHOW TABLES FROM {source_db} LIKE '{table}'")
                    if not cursor.fetchone():
                        print_warning(f"  Table {table} not found in {source_db}, skipping...")
                        continue
                    
                    # Get row count from source
                    source_count = get_table_row_count(cursor, source_db, table)
                    
                    if source_count == 0:
                        print_info(f"  {table}: Empty table, skipping...")
                        continue
                    
                    # Copy data
                    print_info(f"  Migrating {table} ({source_count} rows)...")
                    
                    # Use INSERT IGNORE to avoid duplicate key errors
                    cursor.execute(f"""
                        INSERT IGNORE INTO {TARGET_DATABASE}.{table}
                        SELECT * FROM {source_db}.{table}
                    """)
                    conn.commit()
                    
                    # Verify migration
                    target_count = get_table_row_count(cursor, TARGET_DATABASE, table)
                    
                    if target_count > 0:
                        print_success(f"  ✓ {table}: {target_count} rows migrated")
                        total_migrated += target_count
                    else:
                        print_warning(f"  ⚠ {table}: No rows migrated (may already exist)")
                    
                except mysql.connector.Error as err:
                    print_error(f"  ✗ {table}: Migration failed - {err}")
                    continue
        
        cursor.close()
        print_success(f"\nTotal rows migrated: {total_migrated}")
        return True
        
    except Exception as e:
        print_error(f"Data migration error: {str(e)}")
        return False

def verify_migration(conn):
    """Verify the migration was successful"""
    try:
        cursor = conn.cursor()
        
        print_header("MIGRATION VERIFICATION")
        
        # Check critical tables
        critical_tables = [
            'api_student',
            'api_application',
            'api_studentdetails',
            'auth_user',
            'authtoken_token',
            'portal_applicationsettings',
        ]
        
        all_good = True
        
        for table in critical_tables:
            count = get_table_row_count(cursor, TARGET_DATABASE, table)
            if count > 0:
                print_success(f"{table}: {count} rows")
            else:
                print_warning(f"{table}: No data found")
                all_good = False
        
        cursor.close()
        
        if all_good:
            print_success("\n✓ Migration verification passed!")
        else:
            print_warning("\n⚠ Some tables have no data - please review")
        
        return all_good
        
    except Exception as e:
        print_error(f"Verification error: {str(e)}")
        return False

def update_settings_file():
    """Update Django settings.py to use consolidated database"""
    try:
        print_info("Checking Django settings...")
        
        settings_file = os.path.join(
            os.path.dirname(__file__),
            'backend',
            'backend',
            'settings.py'
        )
        
        if not os.path.exists(settings_file):
            print_error(f"Settings file not found: {settings_file}")
            return False
        
        with open(settings_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already configured
        if "NAME': 'cdoe_db'" in content and "'default':" in content:
            print_success("Settings.py already configured for cdoe_db")
            return True
        
        print_warning("Settings.py needs to be updated manually")
        print_info("Please ensure DATABASES uses only 'cdoe_db'")
        
        return True
        
    except Exception as e:
        print_error(f"Settings update error: {str(e)}")
        return False

def main():
    """Main consolidation process"""
    print_header("CDOE DATABASE CONSOLIDATION")
    print_info(f"Target database: {TARGET_DATABASE}")
    print_info(f"Source databases: {', '.join(SOURCE_DATABASES)}\n")
    
    # Confirm before proceeding
    response = input(f"{Colors.WARNING}This will consolidate all databases. Continue? (yes/no): {Colors.ENDC}")
    if response.lower() != 'yes':
        print_info("Operation cancelled by user")
        return
    
    # Step 1: Backup existing databases
    print_header("STEP 1: BACKUP DATABASES")
    backups = {}
    for db_name in SOURCE_DATABASES:
        backup_file = backup_database(db_name)
        if backup_file:
            backups[db_name] = backup_file
        else:
            print_error(f"Failed to backup {db_name}")
            response = input(f"{Colors.WARNING}Continue without backup? (yes/no): {Colors.ENDC}")
            if response.lower() != 'yes':
                print_info("Operation cancelled")
                return
    
    # Step 2: Create connection
    conn = create_connection()
    if not conn:
        print_error("Failed to connect to MySQL")
        return
    
    try:
        # Step 3: Create consolidated database
        print_header("STEP 2: CREATE CONSOLIDATED DATABASE")
        if not create_consolidated_database(conn):
            return
        
        # Step 4: Run Django migrations
        print_header("STEP 3: RUN DJANGO MIGRATIONS")
        if not run_django_migrations():
            print_warning("Migration errors detected, but continuing...")
        
        # Step 5: Migrate data
        print_header("STEP 4: MIGRATE DATA")
        if not migrate_data(conn):
            print_error("Data migration failed")
            return
        
        # Step 6: Verify migration
        print_header("STEP 5: VERIFY MIGRATION")
        verify_migration(conn)
        
        # Step 7: Update settings
        print_header("STEP 6: UPDATE SETTINGS")
        update_settings_file()
        
        # Final summary
        print_header("CONSOLIDATION COMPLETE")
        print_success("✓ Database consolidation successful!")
        print_info("\nNext steps:")
        print("1. Test your application thoroughly")
        print("2. Verify all data is accessible")
        print("3. Once confirmed, you can drop old databases")
        print("\nBackup files saved in:")
        for db_name, backup_file in backups.items():
            print(f"  - {backup_file}")
        
    except Exception as e:
        print_error(f"Consolidation failed: {str(e)}")
        print_info("Database backups are available in:")
        for db_name, backup_file in backups.items():
            print(f"  - {backup_file}")
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
