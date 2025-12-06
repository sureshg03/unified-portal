# Database Consolidation - Quick Start

## 🎯 Goal
Consolidate three separate databases into one unified `cdoe_db` database.

## ⚡ Quick Start (One Command)

### Windows:
```bash
run_database_consolidation.bat
```

### Manual Steps:
```bash
# 1. Check current status
python check_database_status.py

# 2. Run consolidation
python consolidate_databases.py

# 3. Verify results
python check_database_status.py
```

## 📋 What This Does

### Before:
```
├── lsc_portal_db    (Django core, LSC users)
├── online_edu       (Student applications, courses)
└── lsc_admindb      (Portal settings, programs)
```

### After:
```
└── cdoe_db          (Everything in one place!)
```

## ✅ Safety Features

- ✅ **Automatic backups** before any changes
- ✅ **Non-destructive** - original databases untouched  
- ✅ **Reversible** - can rollback using backups
- ✅ **Verified** - data integrity checks included
- ✅ **Tested** - comprehensive verification

## 📊 What Gets Migrated

| Source DB | Tables | Description |
|---|---|---|
| **lsc_portal_db** | 15+ tables | Django auth, sessions, LSC users |
| **online_edu** | 10+ tables | Students, applications, payments |
| **lsc_admindb** | 8+ tables | Settings, programs, counsellors |

**Total:** All tables consolidated into **cdoe_db**

## 🚀 Process Flow

```
1. Check Status     → Verify current databases
2. Backup           → Automatic backup of all DBs
3. Create DB        → Create cdoe_db
4. Run Migrations   → Django table structure
5. Migrate Data     → Copy all data
6. Verify           → Check data integrity
7. Complete!        → Ready to use
```

## ⏱️ Timeline

- **Backup:** 2-3 minutes
- **Migration:** 5-10 minutes  
- **Verification:** 1-2 minutes
- **Total:** ~10-15 minutes

## 📁 Files Created

### Scripts:
- `consolidate_databases.py` - Main consolidation script
- `check_database_status.py` - Status verification script
- `run_database_consolidation.bat` - One-command launcher

### Documentation:
- `DATABASE_CONSOLIDATION_GUIDE.md` - Complete guide
- `DATABASE_CONSOLIDATION_README.md` - This file

### Backups (auto-created):
- `database_backups/lsc_portal_db_YYYYMMDD_HHMMSS.sql`
- `database_backups/online_edu_YYYYMMDD_HHMMSS.sql`
- `database_backups/lsc_admindb_YYYYMMDD_HHMMSS.sql`

## ⚙️ Configuration

### Database Settings (already configured):
```python
# backend/backend/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cdoe_db',  # ✓ Single database
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# Database router DISABLED (correct for single DB)
# DATABASE_ROUTERS = ['backend.db_router.LSCDatabaseRouter']
```

## 🧪 Testing After Migration

### Quick Test:
```bash
cd backend
python manage.py runserver
```

Then verify:
- ✅ Student login works
- ✅ Application submission works
- ✅ Payment processing works
- ✅ LSC admin login works
- ✅ No database errors

### Database Test:
```sql
USE cdoe_db;

-- Check key tables
SELECT COUNT(*) FROM api_student;
SELECT COUNT(*) FROM api_application;
SELECT COUNT(*) FROM auth_user;
```

## 🗑️ Cleanup (After 1 Week)

Once you've verified everything works:

```sql
-- Drop old databases
DROP DATABASE lsc_portal_db;
DROP DATABASE online_edu;
DROP DATABASE lsc_admindb;
```

## 🔄 Rollback (If Needed)

If something goes wrong:

```bash
# Restore from backups
cd database_backups

mysql -u root -p lsc_portal_db < lsc_portal_db_20241206_123456.sql
mysql -u root -p online_edu < online_edu_20241206_123456.sql
mysql -u root -p lsc_admindb < lsc_admindb_20241206_123456.sql
```

Then uncomment the database router in settings.py.

## ❓ Troubleshooting

### Issue: mysqldump not found
**Fix:** Add MySQL bin directory to PATH or update script with full path

### Issue: Connection refused
**Fix:** Ensure MySQL is running: `net start MySQL80`

### Issue: Permission denied
**Fix:** Update MySQL credentials in script:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Update here
    'port': 3306
}
```

## 📞 Support

1. Check `DATABASE_CONSOLIDATION_GUIDE.md` for detailed instructions
2. Review backup files in `database_backups/`
3. Check console output for specific errors

## 🎉 Benefits

### Simplified:
- ✅ One database to manage
- ✅ One backup to maintain
- ✅ Simpler configuration

### Performance:
- ✅ Faster queries (no cross-database joins)
- ✅ Better transaction handling
- ✅ Efficient foreign keys

### Development:
- ✅ Easier debugging
- ✅ Simpler migrations
- ✅ Better data integrity

## 📝 Summary

This consolidation process is:
- **Safe**: Automatic backups + non-destructive
- **Fast**: 10-15 minutes total
- **Tested**: Includes verification steps
- **Reversible**: Can rollback anytime

**Ready?** Run: `run_database_consolidation.bat`
