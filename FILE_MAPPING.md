# File Structure Mapping

## Overview
This document shows how files from both original projects were combined into the unified portal.

## Backend Structure

### Django Apps Location
```
unified-portal/backend/
├── lsc_auth/          ← FROM: cdoe-lsc-portal/backend/lsc_auth/
├── portal/            ← FROM: cdoe-lsc-portal/backend/portal/
├── admissions/        ← FROM: cdoe-lsc-portal/backend/admissions/
└── api/               ← FROM: Student Admission Portal/backend/api/
```

### Configuration Files
```
unified-portal/backend/backend/
├── settings.py        ← MERGED: Both projects' settings
├── urls.py            ← MERGED: Both projects' URLs
├── wsgi.py            ← FROM: cdoe-lsc-portal/backend/backend/wsgi.py
├── asgi.py            ← FROM: cdoe-lsc-portal/backend/backend/asgi.py
└── db_router.py       ← FROM: cdoe-lsc-portal/backend/backend/db_router.py
```

### Root Files
```
unified-portal/backend/
├── manage.py          ← FROM: cdoe-lsc-portal/backend/manage.py
└── requirements.txt   ← MERGED: Both projects' dependencies
```

## Frontend Structure

### Source Files
```
unified-portal/frontend/src/
├── lsc-portal/              ← FROM: cdoe-lsc-portal/frontend/src/
│   ├── components/          # All LSC components
│   ├── pages/              # All LSC pages
│   ├── lib/                # Utilities and auth
│   └── hooks/              # Custom hooks
│
├── student-portal/          ← FROM: Student Admission Portal/frontend/src/
│   ├── components/          # All student components
│   ├── pages/              # All student pages
│   └── services/           # API services
│
├── App.tsx                  ← NEW: Unified routing
├── main.tsx                 ← FROM: cdoe-lsc-portal/frontend/src/main.tsx
└── index.css                ← FROM: cdoe-lsc-portal/frontend/src/index.css
```

### Configuration Files
```
unified-portal/frontend/
├── package.json         ← MERGED: All dependencies from both
├── vite.config.ts       ← FROM: cdoe-lsc-portal/frontend/
├── tsconfig.json        ← FROM: cdoe-lsc-portal/frontend/
├── tailwind.config.ts   ← FROM: cdoe-lsc-portal/frontend/
├── components.json      ← FROM: cdoe-lsc-portal/frontend/
└── index.html           ← FROM: cdoe-lsc-portal/frontend/
```

## New Files Created

### Documentation
```
unified-portal/
├── README.md              ← NEW: Complete documentation
├── QUICK_START.md         ← NEW: Quick setup guide
├── PROJECT_SUMMARY.md     ← NEW: Consolidation summary
└── FILE_MAPPING.md        ← NEW: This file
```

### Scripts
```
unified-portal/
├── setup.bat              ← NEW: Windows setup script
├── setup.sh               ← NEW: Linux/Mac setup script
├── start.bat              ← NEW: Windows startup script
└── start.sh               ← NEW: Linux/Mac startup script
```

### Configuration
```
unified-portal/
├── .gitignore            ← NEW: Git ignore rules
└── .env.example          ← NEW: Environment template
```

## URL Routing Changes

### Backend API Routes

**Before (Separate):**
```
cdoe-lsc-portal:
  /api/auth/              → lsc_auth
  /api/                   → portal
  /api/admissions/        → admissions

student-portal:
  /api/                   → api app
```

**After (Unified):**
```
unified-portal:
  /api/auth/              → lsc_auth
  /api/portal/            → portal
  /api/admissions/        → admissions
  /api/student/           → api app (renamed for clarity)
```

### Frontend Routes

**Before (Separate):**
```
cdoe-lsc-portal:
  /                       → Landing
  /login                  → LSC Login
  /dashboard/admin/*      → Admin Dashboard
  /dashboard/user         → User Dashboard

student-portal:
  /signup                 → Signup
  /login                  → Login
  /dashboard              → Dashboard
  /application/*          → Application Pages
```

**After (Unified):**
```
unified-portal:
  /                       → Portal Selection Landing
  
  /lsc/login              → LSC Login
  /lsc/dashboard/admin/*  → Admin Dashboard
  /lsc/dashboard/user     → User Dashboard
  
  /student/signup         → Student Signup
  /student/login          → Student Login
  /student/dashboard      → Student Dashboard
  /student/application/*  → Application Pages
```

## Database Configuration

### Before (Separate Projects)
```
cdoe-lsc-portal:
  - lsc_portal_db (default)
  - online_edu (admin auth)
  - lsc_admindb (settings)

student-portal:
  - online_edu (single database)
```

### After (Unified)
```
unified-portal:
  - lsc_portal_db (default)    → LSC users
  - online_edu                  → Student data + Admin auth
  - lsc_admindb                 → Portal settings
```

## Dependencies Merged

### Python (Backend)
```
CDOE LSC Portal:
  - Django 4.2.16
  - djangorestframework
  - mysqlclient
  - djangorestframework-simplejwt
  - django-cors-headers

Student Admission Portal:
  - Django 5.2.1
  - djangorestframework
  - mysqlclient
  - razorpay
  - google-api-python-client
  - python-decouple

Unified (Latest stable versions):
  - Django 4.2.16
  - All dependencies from both
```

### Node.js (Frontend)
```
CDOE LSC Portal (TypeScript):
  - React 18.3.1
  - Radix UI components
  - shadcn/ui
  - TanStack Query
  - React Router 6.30.1

Student Admission Portal (JavaScript):
  - React 19.1.0
  - Tailwind CSS
  - Framer Motion
  - React Router 7.6.2
  - PDF libraries

Unified:
  - React 19.1.0 (latest)
  - All UI libraries from both
  - React Router 7.6.2 (latest)
```

## Component Organization

### LSC Portal Components
```
src/lsc-portal/components/
├── AdminDashboard.tsx
├── UserDashboard.tsx
├── LoginPage.tsx
├── ProtectedRoute.tsx
├── modules/
│   ├── AdmissionManagement.tsx
│   ├── LSCManagement.tsx
│   ├── ReportsModule.tsx
│   └── SettingsModule.tsx
└── ui/                    # 60+ Radix UI components
```

### Student Portal Components
```
src/student-portal/components/
├── SignupForm.jsx
├── Login.jsx
├── Dashboard/
├── Applications.jsx
└── Payment.jsx

src/student-portal/pages/
├── ApplicationPage1.jsx
├── ApplicationPage2.jsx
├── Preview.jsx
└── PaymentPage.jsx
```

## Static Files

### Public Assets
```
unified-portal/frontend/public/
├── Logo.ico              ← FROM: cdoe-lsc-portal
├── Logo.png              ← FROM: cdoe-lsc-portal
├── Logo.svg              ← FROM: cdoe-lsc-portal
├── placeholder.svg       ← FROM: cdoe-lsc-portal
└── robots.txt            ← FROM: cdoe-lsc-portal
```

### Media Files
```
unified-portal/backend/media/
└── (Created at runtime for uploads)
```

## Migration Path

If you need to migrate data from old projects to unified:

1. **Database:** Already using same databases (online_edu, etc.)
2. **Media Files:** Copy from old `Student Admission Portal/backend/media/`
3. **Credentials:** Copy from old projects to `backend/credentials/`
4. **Environment:** Use `.env.example` as template

## Testing Access

After setup, you can verify both portals work:

**LSC Portal Test:**
1. Visit: http://localhost:5173/lsc/login
2. Should see LSC login page
3. Admin features should work

**Student Portal Test:**
1. Visit: http://localhost:5173/student/login
2. Should see student login page
3. Can register new student
4. Application flow should work

## Key Improvements

1. ✅ **Single Codebase** - One repository instead of two
2. ✅ **Unified Dependencies** - No version conflicts
3. ✅ **Shared Resources** - Common utilities and libraries
4. ✅ **Single Deployment** - Deploy once, run both portals
5. ✅ **Consistent Styling** - Unified theme system
6. ✅ **Better Organization** - Clear separation of concerns
7. ✅ **Easy Maintenance** - Update once, benefits both
8. ✅ **Single Server** - One backend, one frontend server

---

This mapping helps you understand where each file came from and how the projects were consolidated.
