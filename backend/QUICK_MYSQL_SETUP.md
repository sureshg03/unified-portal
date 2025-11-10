# Quick Start - MySQL Database Setup

## ⚡ Fastest Method

### Step 1: Open MySQL Workbench

1. Open **MySQL Workbench**
2. Connect to your MySQL server
3. Click on "Server" → "Data Import" OR open a new SQL tab

### Step 2: Run the SQL Script

Copy and paste this SQL code and execute it:

```sql
-- Create three databases for CDOE Portal
DROP DATABASE IF EXISTS lsc_portal_db;
CREATE DATABASE lsc_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP DATABASE IF EXISTS online_edu;
CREATE DATABASE online_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP DATABASE IF EXISTS lsc_admindb;
CREATE DATABASE lsc_admindb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
```

### Step 3: Update Password in Django Settings (if needed)

If your MySQL has a password, edit `backend/backend/settings.py`:

Find all three database configurations and update the PASSWORD field:

```python
'PASSWORD': 'your_mysql_password_here',
```

### Step 4: Run Migrations

Open PowerShell in the backend directory:

```powershell
# Make migrations
python manage.py makemigrations

# Migrate to default database (lsc_portal_db)
python manage.py migrate --database=default

# Migrate to online_edu database
python manage.py migrate --database=online_edu

# Migrate to lsc_admindb database
python manage.py migrate --database=lsc_admindb
```

## ✅ Verify Setup

### In MySQL Workbench:

1. Refresh the Schemas panel (right-click → Refresh All)
2. You should see three databases:
   - **lsc_portal_db** (12-15 tables)
   - **online_edu** (5-8 tables)
   - **lsc_admindb** (2-3 tables)

### Check Tables:

```sql
-- Check lsc_portal_db tables
USE lsc_portal_db;
SHOW TABLES;
-- Expected: auth_user, lsc_auth_lscuser, django_session, etc.

-- Check online_edu tables
USE online_edu;
SHOW TABLES;
-- Expected: api_student, api_document, api_payment, etc.

-- Check lsc_admindb tables
USE lsc_admindb;
SHOW TABLES;
-- Expected: portal_applicationsettings, etc.
```

## 🔧 Alternative Method: Interactive Script

If you prefer an automated approach:

```powershell
cd backend
python migrate_all_interactive.py
```

When prompted, enter:
- **MySQL Host**: localhost (or press Enter)
- **MySQL Port**: 3306 (or press Enter)
- **MySQL User**: root (or press Enter)
- **MySQL Password**: [Enter your password or press Enter if no password]

## 📊 Database Structure

### lsc_portal_db
- Django admin tables
- LSC Users
- Authentication tokens
- Sessions

### online_edu
- Student Portal data
- LSC Admins (read-only)
- Student documents
- Payment records

### lsc_admindb
- Application settings
- Portal configurations

## ⚠️ Common Issues

### Issue: Access denied for user 'root'@'localhost'

**Solution**: Your MySQL has a password. Update it in `settings.py`:

```python
'PASSWORD': 'your_actual_password',
```

### Issue: Unknown database

**Solution**: Run the SQL script in MySQL Workbench first to create databases.

### Issue: No module named 'pymysql'

**Solution**: 
```powershell
pip install pymysql
```

### Issue: Tables in wrong database

**Solution**: 
1. Drop all databases in MySQL Workbench
2. Re-run the SQL script
3. Run migrations again

## 🚀 Next Steps

After successful setup:

```powershell
# Create superuser for Django admin
python manage.py createsuperuser

# Create test users
python create_test_users.py

# Start the backend server
python manage.py runserver
```

Then visit:
- Admin Panel: http://localhost:8000/admin
- API: http://localhost:8000/api/

## 📝 Summary

**Three databases are required:**

1. ✅ **lsc_portal_db** - Main database for LSC users and Django
2. ✅ **online_edu** - Student portal and LSC admin data
3. ✅ **lsc_admindb** - Application settings and configurations

**All tables are automatically created** by Django migrations!
