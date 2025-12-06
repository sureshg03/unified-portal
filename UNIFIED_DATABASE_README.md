# CDOE Unified Database Setup Guide

## Overview

This guide explains how to migrate from the previous three-database system (`lsc_portal_db`, `online_edu`, `lsc_admindb`) to a single unified database (`cdoe_unified_db`) that consolidates all tables from various CDOE systems.

## Previous Database Structure

The system previously used three separate MySQL databases:

1. **`lsc_portal_db`** - LSC User authentication and admissions
2. **`online_edu`** - LSC Admin authentication and student portal data
3. **`lsc_admindb`** - Portal configurations and settings

## New Unified Database Structure

All tables are now consolidated into one database: **`cdoe_unified_db`**

### Table Categories

#### Django Core Tables
- `auth_user`, `django_session`, `django_admin_log`, etc.

#### LSC Authentication Tables
- `lsc_auth_lscuser` - LSC center users
- `lsc_admins` - LSC administrators

#### Student Portal (API) Tables
- `api_student`, `api_course`, `api_payment`, `api_application`

#### Admissions Tables
- `admissions_student`, `admissions_admission`

#### Portal Configuration Tables
- `portal_applicationsettings`

#### External System Tables
- **Study Material**: `cdoe_study_material_*`
- **ODL CDOE**: `odl_cdoe_*`
- **Pride (Student Admission)**: `pride_*`
- **Pride No Dues**: `pridenodues_*`
- **PUCODE New LMS**: `pucodenewlms_*`
- **PUCODE OL**: `pucodeol_*`
- **System**: `sys_*`
- **Billdesk Payments**: `billdeskpayments_*`

## Migration Steps

### Step 1: Backup Your Data
```bash
# Create backups of existing databases
mysqldump -u root -p lsc_portal_db > backup_lsc_portal_db.sql
mysqldump -u root -p online_edu > backup_online_edu.sql
mysqldump -u root -p lsc_admindb > backup_lsc_admindb.sql
```

### Step 2: Create Unified Database
Run the schema creation script:
```bash
mysql -u root -p < CREATE_UNIFIED_DATABASE.sql
```

### Step 3: Migrate Existing Data
Use the automated migration script:
```bash
python migrate_to_unified.py
```

Or manually migrate data:
```bash
mysql -u root -p < MIGRATE_TO_UNIFIED_DATABASE.sql
```

### Step 4: Import External SQL Dumps
The migration script will automatically import SQL dump files from `e:\cdoe\Dump20251111\`. Make sure this directory exists and contains all the required SQL files.

### Step 5: Update Django Configuration

The Django settings have been updated to use the unified database. Key changes:

1. **Single Database Configuration**:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'cdoe_unified_db',
           'USER': 'root',
           'PASSWORD': '',  # Your password
           'HOST': 'localhost',
           'PORT': '3306',
           'OPTIONS': {
               'charset': 'utf8mb4',
               'collation': 'utf8mb4_unicode_ci',
           },
       }
   }
   ```

2. **Unified Authentication Backend**:
   ```python
   AUTHENTICATION_BACKENDS = [
       'lsc_auth.auth_backend.UnifiedAuthBackend',
       'django.contrib.auth.backends.ModelBackend',
   ]
   ```

3. **Removed Database Router**: No longer needed with single database.

### Step 6: Run Django Migrations
```bash
cd backend
python manage.py migrate
```

### Step 7: Test the System
1. Start the backend server: `python manage.py runserver`
2. Start the frontend: `npm run dev`
3. Test login functionality for both LSC users and admins
4. Verify data integrity across all modules

## File Structure

```
unified-portal/
├── CREATE_UNIFIED_DATABASE.sql          # Database schema
├── MIGRATE_TO_UNIFIED_DATABASE.sql      # Data migration script
├── migrate_to_unified.py                # Automated migration script
├── backend/
│   ├── backend/
│   │   ├── settings.py                  # Updated for unified DB
│   │   └── db_router.py                 # No longer used
│   └── lsc_auth/
│       └── auth_backend.py              # Updated for unified DB
└── frontend/
    └── src/
        └── components/
            └── AdminDashboard.tsx       # Updated routing
```

## Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Ensure both `lsc_admins` and `lsc_auth_lscuser` tables have data
   - Check that the UnifiedAuthBackend is properly configured

2. **Data Migration Errors**
   - Verify that source databases exist and are accessible
   - Check for foreign key constraint violations
   - Use `INSERT IGNORE` to skip duplicate entries

3. **SQL Import Errors**
   - Ensure SQL dump files are not corrupted
   - Check file permissions
   - Verify MySQL user has sufficient privileges

### Verification Queries

Check table counts:
```sql
USE cdoe_unified_db;
SHOW TABLES;
SELECT COUNT(*) FROM lsc_admins;
SELECT COUNT(*) FROM lsc_auth_lscuser;
SELECT COUNT(*) FROM api_student;
```

### Rollback Plan

If issues occur, you can rollback by:
1. Restoring from backups
2. Reverting Django settings to use multiple databases
3. Re-enabling the database router

## Benefits of Unified Database

1. **Simplified Architecture** - Single database connection
2. **Easier Maintenance** - One database to backup and monitor
3. **Better Performance** - No cross-database queries
4. **Simplified Development** - No database routing complexity
5. **Unified Data Model** - All related data in one place

## Support

For issues with the migration:
1. Check the migration script output for error messages
2. Verify database user permissions
3. Ensure all source databases and SQL files are accessible
4. Review the troubleshooting section above

## Next Steps

After successful migration:
1. Monitor application performance
2. Update any hardcoded database references in code
3. Consider archiving the old database files
4. Update documentation and deployment scripts