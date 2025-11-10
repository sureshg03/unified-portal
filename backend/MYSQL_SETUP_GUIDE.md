# MySQL Database Setup Guide

This guide will help you set up all three MySQL databases for the CDOE Two Portal application.

## Overview

The application uses **THREE separate MySQL databases**:

1. **lsc_portal_db** - LSC Users, Django admin tables, sessions, and authentication
2. **online_edu** - LSC Admins table and Student Portal data (api app)
3. **lsc_admindb** - Application Settings and Portal configurations

## Prerequisites

- MySQL Server installed and running
- MySQL Workbench (optional but recommended)
- Python 3.x installed
- Django and required packages installed

## Method 1: Automatic Setup (Recommended)

### Step 1: Run the PowerShell Script

Open PowerShell in the backend directory and run:

```powershell
.\setup_databases.ps1
```

This script will:
- Install pymysql (Python MySQL connector)
- Create all three databases
- Run migrations to all databases
- Verify table creation

### Step 2: Verify in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. You should see three new databases:
   - `lsc_portal_db`
   - `online_edu`
   - `lsc_admindb`

## Method 2: Manual Setup

### Step 1: Create Databases in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the SQL script: `create_databases.sql`
4. Execute the entire script (Ctrl + Shift + Enter)

This will create all three databases with proper character encoding.

### Step 2: Update Database Password (if needed)

If your MySQL root user has a password, update it in `backend/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'lsc_portal_db',
        'USER': 'root',
        'PASSWORD': 'YOUR_PASSWORD_HERE',  # Add your password
        'HOST': 'localhost',
        'PORT': '3306',
    },
    # ... repeat for online_edu and lsc_admindb
}
```

### Step 3: Install pymysql

```powershell
pip install pymysql
```

### Step 4: Run Migrations

Run the Python migration script:

```powershell
python migrate_all_databases.py
```

Or run migrations manually:

```powershell
# Create migration files
python manage.py makemigrations

# Migrate default database (lsc_portal_db)
python manage.py migrate --database=default

# Migrate online_edu database
python manage.py migrate --database=online_edu

# Migrate lsc_admindb database
python manage.py migrate --database=lsc_admindb
```

## Database Structure

### 1. lsc_portal_db (Default Database)

**Purpose:** LSC User authentication and Django admin functionality

**Tables:**
- `auth_user` - Django admin users
- `auth_group`, `auth_permission` - Django permissions
- `django_session` - User sessions
- `django_content_type` - Content type framework
- `django_migrations` - Migration history
- `authtoken_token` - API authentication tokens
- `lsc_auth_lscuser` - LSC User accounts
- `admissions_*` - Admissions app tables (if any)

**Apps using this database:**
- Django built-in apps (admin, auth, sessions, etc.)
- lsc_auth (LSCUser model)
- admissions

### 2. online_edu Database

**Purpose:** LSC Admin accounts and Student Portal data

**Tables:**
- `lsc_admins` - LSC Administrator accounts (managed=False, read-only)
- `api_student` - Student information
- `api_document` - Student documents
- `api_payment` - Payment records
- `api_educationdetails` - Student education details
- `api_applicationsettings` - Application settings (if moved here)
- Other api app tables

**Apps using this database:**
- api (Student Portal)
- lsc_auth (LSCAdmin model - read-only)

### 3. lsc_admindb Database

**Purpose:** Portal configuration and application settings

**Tables:**
- `portal_applicationsettings` - Application settings
- `portal_*` - Other portal configuration tables

**Apps using this database:**
- portal (Application settings and configuration)

## Verification

### Check Databases in MySQL Workbench

1. Open MySQL Workbench
2. In the left sidebar, expand "Schemas"
3. You should see all three databases

### Check Tables

Click on each database to see its tables:

```sql
-- Check lsc_portal_db
USE lsc_portal_db;
SHOW TABLES;

-- Check online_edu
USE online_edu;
SHOW TABLES;

-- Check lsc_admindb
USE lsc_admindb;
SHOW TABLES;
```

### Check Table Count

```sql
SELECT 
    TABLE_SCHEMA as 'Database',
    COUNT(*) as 'Tables'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('lsc_portal_db', 'online_edu', 'lsc_admindb')
GROUP BY TABLE_SCHEMA;
```

## Testing

After setup, run these commands to test:

```powershell
# Create test users
python create_test_users.py

# Check database status
python check_status.py

# Start the server
python manage.py runserver
```

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'

**Solution:** Update the password in `backend/settings.py` for all three database configurations.

### Error: Unknown database

**Solution:** Run `create_databases.sql` in MySQL Workbench first.

### Error: No module named 'pymysql'

**Solution:** 
```powershell
pip install pymysql
```

### Tables created in wrong database

**Solution:** 
1. Drop all three databases
2. Re-run the setup script
3. Make sure `db_router.py` is properly configured

### Migration conflicts

**Solution:**
```powershell
# Delete migration files (except __init__.py)
# Then recreate:
python manage.py makemigrations
python migrate_all_databases.py
```

## Database Router Logic

The `db_router.py` file controls which models go to which database:

- **api app** → `online_edu` database
- **portal app** → `lsc_admindb` database
- **lsc_auth.LSCAdmin** → `online_edu` database
- **lsc_auth.LSCUser** → `default` (lsc_portal_db) database
- **All other apps** → `default` (lsc_portal_db) database

## Important Notes

1. **Always use the migration scripts** to ensure tables are created in the correct databases
2. **Don't manually create tables** - let Django migrations handle it
3. **Backup regularly** - especially before running migrations
4. **Test in development first** before deploying to production
5. **LSCAdmin is read-only** - it uses an existing table in online_edu database

## Next Steps

After successful database setup:

1. ✓ Create superuser: `python manage.py createsuperuser`
2. ✓ Create test data: `python create_test_users.py`
3. ✓ Start backend: `python manage.py runserver`
4. ✓ Start frontend: `cd ../frontend && npm run dev`
5. ✓ Test login with different user types

## Support

If you encounter any issues:
1. Check the error message carefully
2. Verify MySQL is running
3. Check database passwords in settings.py
4. Ensure all three databases exist
5. Review the migration output for errors
