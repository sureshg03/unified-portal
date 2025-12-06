# CDOE Database Consolidation Guide

## Overview
This guide provides step-by-step instructions to safely consolidate three separate databases into a single unified database (`cdoe_db`).

### Current Structure (Before Consolidation)
- **lsc_portal_db** - Default database (Django core, LSC users)
- **online_edu** - Student portal data (applications, students, courses)
- **lsc_admindb** - Portal admin data (application settings, programs)

### Target Structure (After Consolidation)
- **cdoe_db** - Single consolidated database containing all tables

## Prerequisites

### 1. System Requirements
- MySQL/MariaDB server running
- Python 3.x with pip
- Access to MySQL root user (or user with admin privileges)

### 2. Required Python Packages
```bash
pip install mysql-connector-python
```

### 3. Backup Tools
Ensure `mysqldump` is available in your system PATH:
```bash
mysqldump --version
```

## Consolidation Process

### Step 1: Verify Current State

1. **Check existing databases:**
```bash
cd "c:\Users\SURESH G\OneDrive\Desktop\CDOE-TWO-PORTAL-main\CDOE-TWO-PORTAL-main\CDOE PORTAL"
```

2. **Verify Django settings:**
Open `backend/backend/settings.py` and confirm it's configured for `cdoe_db`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cdoe_db',  # Single consolidated database
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

3. **Ensure database router is DISABLED:**
```python
# DATABASE_ROUTERS = ['backend.db_router.LSCDatabaseRouter']  # Should be commented out
```

### Step 2: Run Consolidation Script

**Execute the consolidation script:**
```bash
python consolidate_databases.py
```

The script will:
1. ✅ **Backup** all three existing databases
2. ✅ **Create** new `cdoe_db` database
3. ✅ **Run** Django migrations to create table structure
4. ✅ **Migrate** all data preserving foreign keys
5. ✅ **Verify** data integrity
6. ✅ **Report** migration summary

### Step 3: Review Migration Results

The script will display:
- Number of rows migrated per table
- Any errors or warnings
- Location of backup files
- Verification status

**Example output:**
```
╔══════════════════════════════════════════════════════════════════╗
║                  MIGRATION VERIFICATION                          ║
╚══════════════════════════════════════════════════════════════════╝

✓ api_student: 150 rows
✓ api_application: 145 rows
✓ api_studentdetails: 145 rows
✓ auth_user: 25 rows
✓ authtoken_token: 25 rows
✓ portal_applicationsettings: 5 rows

✓ Migration verification passed!
```

### Step 4: Test Application

1. **Start backend server:**
```bash
cd backend
python manage.py runserver
```

2. **Test critical functionality:**
   - ✅ Student login
   - ✅ Application submission
   - ✅ Payment processing
   - ✅ LSC admin login
   - ✅ Application settings

3. **Check for errors in terminal output**

### Step 5: Verify Data Integrity

1. **Connect to MySQL:**
```sql
mysql -u root -p
USE cdoe_db;
```

2. **Verify critical tables exist:**
```sql
SHOW TABLES;
```

3. **Check row counts:**
```sql
SELECT COUNT(*) FROM api_student;
SELECT COUNT(*) FROM api_application;
SELECT COUNT(*) FROM auth_user;
SELECT COUNT(*) FROM portal_applicationsettings;
```

4. **Verify foreign keys:**
```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM
    information_schema.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'cdoe_db'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Database Table Mapping

### From lsc_portal_db → cdoe_db
| Source Table | Target Table | Description |
|---|---|---|
| auth_user | auth_user | Django users |
| auth_group | auth_group | User groups |
| auth_permission | auth_permission | Permissions |
| django_session | django_session | Sessions |
| authtoken_token | authtoken_token | API tokens |
| lsc_auth_lscuser | lsc_auth_lscuser | LSC users |

### From online_edu → cdoe_db
| Source Table | Target Table | Description |
|---|---|---|
| api_student | api_student | Student records |
| api_application | api_application | Applications |
| api_studentdetails | api_studentdetails | Student details |
| api_marksheet_uploads | api_marksheet_uploads | Marksheet uploads |
| courses | courses | Course catalog |
| payments | payments | Payment records |
| feepayment | feepayment | Fee payments |
| lsc_admins | lsc_admins | LSC admin records |

### From lsc_admindb → cdoe_db
| Source Table | Target Table | Description |
|---|---|---|
| portal_applicationsettings | portal_applicationsettings | Application settings |
| portal_systemsettings | portal_systemsettings | System settings |
| portal_program | portal_program | Programs |
| portal_student | portal_student | Portal students |
| portal_counsellor | portal_counsellor | Counsellors |

## Troubleshooting

### Issue 1: Migration Script Fails

**Error:** `mysqldump: command not found`

**Solution:**
1. Add MySQL bin directory to PATH
2. Or use full path to mysqldump:
```python
# In consolidate_databases.py, update cmd:
cmd = [
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    # ... rest of parameters
]
```

### Issue 2: Duplicate Key Errors

**Error:** `Duplicate entry for key 'PRIMARY'`

**Solution:**
The script uses `INSERT IGNORE` to skip duplicates. This is normal if you run the script multiple times.

### Issue 3: Foreign Key Constraints

**Error:** `Cannot add or update a child row: a foreign key constraint fails`

**Solution:**
1. Check migration order in the script
2. Ensure parent tables are migrated before child tables
3. Temporarily disable foreign key checks:
```sql
SET FOREIGN_KEY_CHECKS=0;
-- Run migration
SET FOREIGN_KEY_CHECKS=1;
```

### Issue 4: Connection Refused

**Error:** `Can't connect to MySQL server`

**Solution:**
1. Verify MySQL service is running:
```bash
# Windows
net start MySQL80

# Check status
sc query MySQL80
```

2. Check credentials in `DB_CONFIG`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Update this
    'port': 3306
}
```

## Post-Migration Cleanup

### Option 1: Keep Old Databases (Recommended for 1 week)

Keep old databases as backup for 1 week, then drop:
```sql
-- After 1 week of successful testing:
DROP DATABASE lsc_portal_db;
DROP DATABASE online_edu;
DROP DATABASE lsc_admindb;
```

### Option 2: Rename Old Databases

```sql
-- Rename instead of dropping
RENAME DATABASE lsc_portal_db TO lsc_portal_db_old;
RENAME DATABASE online_edu TO online_edu_old;
RENAME DATABASE lsc_admindb TO lsc_admindb_old;

-- Note: RENAME DATABASE is deprecated, use mysqldump instead:
mysqldump lsc_portal_db > lsc_portal_db_backup.sql
DROP DATABASE lsc_portal_db;
```

### Option 3: Export Backups and Drop

```bash
# Export all old databases
mysqldump -u root -p lsc_portal_db > backups/lsc_portal_db_final.sql
mysqldump -u root -p online_edu > backups/online_edu_final.sql
mysqldump -u root -p lsc_admindb > backups/lsc_admindb_final.sql

# Then drop old databases
mysql -u root -p -e "DROP DATABASE lsc_portal_db;"
mysql -u root -p -e "DROP DATABASE online_edu;"
mysql -u root -p -e "DROP DATABASE lsc_admindb;"
```

## Rollback Procedure

If you need to rollback to the old database structure:

### 1. Stop the application
```bash
# Stop Django server (Ctrl+C)
```

### 2. Restore from backups
```bash
cd database_backups

# Restore each database
mysql -u root -p -e "DROP DATABASE IF EXISTS lsc_portal_db; CREATE DATABASE lsc_portal_db;"
mysql -u root -p lsc_portal_db < lsc_portal_db_YYYYMMDD_HHMMSS.sql

mysql -u root -p -e "DROP DATABASE IF EXISTS online_edu; CREATE DATABASE online_edu;"
mysql -u root -p online_edu < online_edu_YYYYMMDD_HHMMSS.sql

mysql -u root -p -e "DROP DATABASE IF EXISTS lsc_admindb; CREATE DATABASE lsc_admindb;"
mysql -u root -p lsc_admindb < lsc_admindb_YYYYMMDD_HHMMSS.sql
```

### 3. Restore old settings.py
```python
# Uncomment the DATABASE_ROUTERS line
DATABASE_ROUTERS = ['backend.db_router.LSCDatabaseRouter']

# Restore multi-database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'lsc_portal_db',
        # ...
    },
    'online_edu': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'online_edu',
        # ...
    },
    'lsc_admindb': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'lsc_admindb',
        # ...
    }
}
```

### 4. Restart application
```bash
python manage.py runserver
```

## Verification Checklist

After consolidation, verify:

- [ ] All student records accessible
- [ ] Student login works
- [ ] Application submission works
- [ ] Payment processing works
- [ ] LSC admin login works
- [ ] Application settings load correctly
- [ ] File uploads work
- [ ] PDF generation works
- [ ] Email notifications work
- [ ] No database connection errors in logs

## Benefits of Single Database

✅ **Simplified Management**
- One database to backup
- One database to maintain
- Simpler connection management

✅ **Better Performance**
- No cross-database queries
- Efficient joins across all tables
- Single transaction context

✅ **Easier Development**
- Simpler Django configuration
- No database routers needed
- Straightforward foreign keys

✅ **Improved Reliability**
- Atomic transactions across all tables
- Better referential integrity
- Simpler disaster recovery

## Support

If you encounter issues:

1. Check the backup files in `database_backups/`
2. Review error messages in the script output
3. Check Django logs: `backend/logs/`
4. Verify MySQL error log

## Summary

The consolidation process is **SAFE** because:

1. ✅ **Automatic backups** created before any changes
2. ✅ **Non-destructive** - original databases remain untouched
3. ✅ **Reversible** - can rollback using backups
4. ✅ **Verified** - data integrity checks after migration
5. ✅ **Tested** - includes comprehensive verification steps

**Estimated Time:** 10-15 minutes (depending on database size)

**Recommended Schedule:**
- Run during low-traffic period
- Keep old databases for 1 week
- Monitor application for any issues
- Drop old databases after successful verification
