# ✅ MySQL Database Setup - Complete

## 📦 What I've Created for You

I've created **5 files** to help you set up all three MySQL databases:

### 1. **create_databases.sql** 
   - SQL script to create all three databases in MySQL Workbench
   - Can be executed directly in MySQL Workbench

### 2. **migrate_all_databases.py**
   - Python script for automatic database setup (no password)
   - Creates databases and runs migrations

### 3. **migrate_all_interactive.py** ⭐ RECOMMENDED
   - Interactive Python script that prompts for MySQL password
   - Creates databases, updates settings.py, and runs migrations
   - Works with password-protected MySQL

### 4. **setup_mysql.bat**
   - Windows batch file for easy execution
   - Double-click to run the interactive setup

### 5. **QUICK_MYSQL_SETUP.md**
   - Quick reference guide
   - Step-by-step instructions

## 🎯 Choose Your Setup Method

### Method 1: Manual (Recommended for First-Time) ⭐

**Step 1:** Open MySQL Workbench and run this SQL:

```sql
DROP DATABASE IF EXISTS lsc_portal_db;
CREATE DATABASE lsc_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP DATABASE IF EXISTS online_edu;
CREATE DATABASE online_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP DATABASE IF EXISTS lsc_admindb;
CREATE DATABASE lsc_admindb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Step 2:** Update password in `backend/settings.py` (if you have a MySQL password):

```python
'PASSWORD': 'your_password_here',
```

**Step 3:** Run migrations in PowerShell:

```powershell
cd backend
python manage.py makemigrations
python manage.py migrate --database=default
python manage.py migrate --database=online_edu
python manage.py migrate --database=lsc_admindb
```

### Method 2: Automated (Interactive Script)

**In PowerShell:**

```powershell
cd backend
python migrate_all_interactive.py
```

Then enter your MySQL credentials when prompted.

### Method 3: Double-Click (Easiest)

1. Navigate to `backend` folder
2. Double-click **setup_mysql.bat**
3. Follow the prompts

## 📊 Three Databases Explained

### 🗄️ Database 1: **lsc_portal_db**
**Purpose:** LSC Users and Django Admin

**Tables:**
- `auth_user` - Django admin users
- `auth_group`, `auth_permission` - Permissions
- `django_session` - User sessions
- `django_migrations` - Migration history
- `authtoken_token` - API tokens
- `lsc_auth_lscuser` - LSC User accounts
- `admissions_*` - Admissions app tables

**Size:** ~12-15 tables

### 🗄️ Database 2: **online_edu**
**Purpose:** Student Portal and LSC Admins

**Tables:**
- `lsc_admins` - LSC Administrator accounts (read-only)
- `api_student` - Student information
- `api_document` - Student documents
- `api_payment` - Payment records
- `api_educationdetails` - Education details
- Other api app tables

**Size:** ~5-8 tables

### 🗄️ Database 3: **lsc_admindb**
**Purpose:** Application Settings

**Tables:**
- `portal_applicationsettings` - Application settings
- `portal_*` - Portal configuration tables

**Size:** ~2-3 tables

## ✅ Verification Checklist

After setup, verify:

- [ ] All three databases exist in MySQL Workbench
- [ ] Each database has tables (see counts above)
- [ ] No migration errors in console
- [ ] Can run `python manage.py runserver` without errors

### Quick Verification SQL:

```sql
SELECT 
    TABLE_SCHEMA as 'Database',
    COUNT(*) as 'Tables'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('lsc_portal_db', 'online_edu', 'lsc_admindb')
GROUP BY TABLE_SCHEMA;
```

**Expected Output:**
```
lsc_portal_db  → 12-15 tables
online_edu     → 5-8 tables
lsc_admindb    → 2-3 tables
```

## 🚀 Next Steps After Setup

```powershell
# 1. Create Django superuser
python manage.py createsuperuser

# 2. Create test users (optional)
python create_test_users.py

# 3. Start backend server
python manage.py runserver

# 4. Start frontend (in new terminal)
cd ../frontend
npm run dev
```

## 🔧 Troubleshooting

### Error: Access denied
- **Cause:** MySQL requires a password
- **Fix:** Update `PASSWORD` in `settings.py` for all three databases

### Error: Unknown database
- **Cause:** Databases not created
- **Fix:** Run the SQL script in MySQL Workbench first

### Error: No module named 'pymysql'
- **Cause:** Package not installed
- **Fix:** Run `pip install pymysql`

### Tables in wrong database
- **Cause:** Router not working properly
- **Fix:** 
  1. Drop all databases
  2. Recreate with SQL script
  3. Run migrations again

## 📁 Files Location

All setup files are in: `backend/`

- `create_databases.sql` - SQL script
- `migrate_all_databases.py` - Auto script (no password)
- `migrate_all_interactive.py` - Interactive script
- `setup_mysql.bat` - Batch file
- `QUICK_MYSQL_SETUP.md` - Quick guide
- `MYSQL_SETUP_GUIDE.md` - Full guide

## 🎓 Understanding the Setup

The application uses **Database Router** (`backend/db_router.py`) to route models to correct databases:

- **api app** → online_edu
- **portal app** → lsc_admindb  
- **lsc_auth.LSCAdmin** → online_edu
- **lsc_auth.LSCUser** → lsc_portal_db (default)
- **Django core** → lsc_portal_db (default)

This is why we need three separate databases!

## 💡 Pro Tips

1. **Always backup** before running migrations
2. **Use MySQL Workbench** to verify tables visually
3. **Check migration output** for errors
4. **Test connections** before running migrations
5. **Document your MySQL password** (don't lose it!)

## ✨ You're Ready!

Once you run the setup, you'll have:
- ✅ Three MySQL databases created
- ✅ All tables properly migrated
- ✅ Ready to run the application

**Need help?** Check:
- `QUICK_MYSQL_SETUP.md` for quick reference
- `MYSQL_SETUP_GUIDE.md` for detailed guide
