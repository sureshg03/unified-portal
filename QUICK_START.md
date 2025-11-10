# 🚀 Quick Start Guide - Unified Education Portal

## One-Command Setup & Run

### Windows Users

1. **First Time Setup:**
   ```cmd
   setup.bat
   ```
   Then configure MySQL databases and run migrations.

2. **Start Application:**
   ```cmd
   start.bat
   ```

### Linux/Mac Users

1. **First Time Setup:**
   ```bash
   chmod +x setup.sh start.sh
   ./setup.sh
   ```
   Then configure MySQL databases and run migrations.

2. **Start Application:**
   ```bash
   ./start.sh
   ```

## 📋 Pre-Setup Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 16+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Git installed (optional)

## 🗄️ Database Setup (Required)

```sql
-- Login to MySQL
mysql -u root -p

-- Create databases
CREATE DATABASE lsc_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE online_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE lsc_admindb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Exit MySQL
exit;
```

## 🔧 Configuration

1. **Update Database Password:**
   - Open `backend/backend/settings.py`
   - Find `DATABASES` section
   - Update `PASSWORD` field for all three databases

2. **Run Migrations:**
   ```bash
   cd backend
   # Activate venv first
   python manage.py migrate
   python manage.py migrate --database=online_edu
   python manage.py migrate --database=lsc_admindb
   ```

## 🌐 Access URLs

After starting the application:

| Portal | URL |
|--------|-----|
| **Landing Page** | http://localhost:5173/ |
| **LSC Portal Login** | http://localhost:5173/lsc/login |
| **Student Portal Login** | http://localhost:5173/student/login |
| **Django Admin** | http://localhost:8000/admin/ |

## 🆘 Common Issues

### Port Already in Use

**Backend (Port 8000):**
```cmd
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Frontend (Port 5173):**
```cmd
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### MySQL Connection Error

1. Verify MySQL is running
2. Check username/password in settings.py
3. Ensure databases are created
4. Check MySQL port (default: 3306)

### Module Not Found

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## 📁 Project Structure

```
unified-portal/
├── backend/              # Django Backend
│   ├── api/             # Student Admission APIs
│   ├── lsc_auth/        # LSC Authentication
│   ├── portal/          # Portal Management
│   ├── admissions/      # Admission Management
│   ├── backend/         # Django Configuration
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── lsc-portal/        # LSC Portal
│   │   ├── student-portal/    # Student Portal
│   │   ├── App.tsx            # Main Router
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── README.md            # Full Documentation
├── QUICK_START.md       # This file
├── start.bat/.sh        # Startup scripts
└── setup.bat/.sh        # Setup scripts
```

## 🎯 Features Overview

### CDOE LSC Portal
- ✅ Admin & User Dashboards
- ✅ Admission Session Management
- ✅ Student Application Review
- ✅ Reports & Analytics
- ✅ Settings Configuration

### Student Admission Portal
- ✅ Student Registration
- ✅ Multi-step Application Form
- ✅ Document Upload
- ✅ Payment Integration (Razorpay/Paytm)
- ✅ Application Status Tracking
- ✅ Email Notifications

## 🔐 Default Credentials

Create superuser for Django admin:
```bash
cd backend
python manage.py createsuperuser
```

Then access: http://localhost:8000/admin/

## 📞 Need Help?

Refer to the full `README.md` for:
- Detailed API documentation
- Environment variable configuration
- Production deployment guide
- Troubleshooting tips

---

**Quick Tip:** Keep both terminal windows open to see backend and frontend logs!
