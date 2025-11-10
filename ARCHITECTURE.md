# System Architecture Diagram

## High-Level System Architecture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    UNIFIED EDUCATION PORTAL                       ┃
┃                      http://localhost:5173                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                 │
                    ┌────────────┴────────────┐
                    │   Landing Page (/)      │
                    │   Portal Selection      │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                         │
   ┌────────▼────────┐                       ┌───────▼────────┐
   │   LSC PORTAL    │                       │ STUDENT PORTAL │
   │   /lsc/*        │                       │  /student/*    │
   └────────┬────────┘                       └────────┬───────┘
            │                                         │
            │        ┏━━━━━━━━━━━━━━━━━━━━┓          │
            └───────►┃  REACT FRONTEND    ┃◄─────────┘
                     ┃  Vite + TypeScript ┃
                     ┃  Port 5173         ┃
                     ┗━━━━━━━━━┬━━━━━━━━━━┛
                               │ HTTP/HTTPS
                               │ REST API Calls
                     ┏━━━━━━━━━▼━━━━━━━━━━┓
                     ┃  DJANGO BACKEND    ┃
                     ┃  REST Framework    ┃
                     ┃  Port 8000         ┃
                     ┗━━━━━━━━━┬━━━━━━━━━━┛
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  ┏━━━━▼━━━━┓          ┏━━━━━━▼━━━━━┓         ┏━━━━▼━━━━┓
  ┃ MySQL  ┃          ┃   MySQL    ┃         ┃ MySQL  ┃
  ┃lsc_    ┃          ┃ online_edu ┃         ┃lsc_    ┃
  ┃portal  ┃          ┃            ┃         ┃admindb ┃
  ┃_db     ┃          ┃            ┃         ┃        ┃
  ┗━━━━━━━━┛          ┗━━━━━━━━━━━━┛         ┗━━━━━━━━┛
```

## Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│                    (React 19.1.0 + Vite 6.3.5)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐    ┌──────────────────────────┐   │
│  │   LSC Portal UI        │    │  Student Portal UI       │   │
│  │   (TypeScript)         │    │  (JavaScript)            │   │
│  ├────────────────────────┤    ├──────────────────────────┤   │
│  │ • AdminDashboard       │    │ • SignupForm             │   │
│  │ • UserDashboard        │    │ • Login                  │   │
│  │ • LoginPage            │    │ • Dashboard              │   │
│  │ • AdmissionManagement  │    │ • ApplicationPages       │   │
│  │ • LSCManagement        │    │ • Payment                │   │
│  │ • Reports              │    │ • DocumentUpload         │   │
│  │ • Settings             │    │ • Preview                │   │
│  └────────────────────────┘    └──────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Shared Components & Utilities                │  │
│  │  • Router (React Router 7.6.2)                           │  │
│  │  • State Management (TanStack Query)                     │  │
│  │  • UI Components (Radix UI + Tailwind)                   │  │
│  │  • Authentication Helpers                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ axios HTTP requests
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                         API LAYER                                │
│                  (Django REST Framework)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  LSC Auth API   │  │ Portal API  │  │ Student Portal API  ││
│  │  /api/auth/*    │  │ /api/portal/│  │  /api/student/*     ││
│  ├─────────────────┤  ├─────────────┤  ├─────────────────────┤│
│  │ • Login         │  │ • Settings  │  │ • Signup            ││
│  │ • Logout        │  │ • Toggle    │  │ • Login             ││
│  │ • Get User      │  │             │  │ • Application       ││
│  │                 │  └─────────────┘  │ • Upload            ││
│  └─────────────────┘                   │ • Payment           ││
│                                         │ • Courses           ││
│  ┌─────────────────────────────────┐   └─────────────────────┘│
│  │    Admissions API               │                           │
│  │    /api/admissions/*            │                           │
│  ├─────────────────────────────────┤                           │
│  │ • Sessions                      │                           │
│  │ • Applications                  │                           │
│  │ • Status Updates                │                           │
│  └─────────────────────────────────┘                           │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ Django ORM
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
│                      (Django Apps)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  lsc_auth   │  │   portal    │  │ admissions  │            │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤            │
│  │ • LSCUser   │  │ • Settings  │  │ • Sessions  │            │
│  │ • LSCAdmin  │  │ • App       │  │ • Status    │            │
│  │ • JWT Auth  │  │   Settings  │  │             │            │
│  │ • Dual Auth │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      api (Student Portal)                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Users                  • Applications                   │  │
│  │ • Courses                • Documents                      │  │
│  │ • Payments               • Email Service                  │  │
│  │ • Google Drive Service   • Payment Gateway Integration    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ DB Router
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                       DATA LAYER                                 │
│                     (MySQL Databases)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ lsc_portal_db    │  │  online_edu     │  │ lsc_admindb  │  │
│  ├──────────────────┤  ├─────────────────┤  ├──────────────┤  │
│  │ LSC Users        │  │ Admin Users     │  │ Portal       │  │
│  │ User Profiles    │  │ Students        │  │   Settings   │  │
│  │ Auth Sessions    │  │ Applications    │  │ Application  │  │
│  │                  │  │ Documents       │  │   Settings   │  │
│  │                  │  │ Payments        │  │ System       │  │
│  │                  │  │ Courses         │  │   Config     │  │
│  └──────────────────┘  └─────────────────┘  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       ├─────► LSC Portal Login (/lsc/login)
       │              │
       │              ├─► Check DualDatabaseAuthBackend
       │              │       │
       │              │       ├─► Try online_edu.lsc_admins (Admin)
       │              │       └─► Try lsc_portal_db.lsc_users (User)
       │              │
       │              ├─► Generate JWT Token
       │              └─► Redirect to Dashboard
       │
       └─────► Student Portal Login (/student/login)
                      │
                      ├─► Check online_edu.users
                      ├─► Generate Auth Token
                      └─► Redirect to Dashboard
```

## Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User Action (Click, Submit, etc.)
       │
┌──────▼──────┐
│   React     │
│ Component   │
└──────┬──────┘
       │
       │ 2. API Call (axios)
       │
┌──────▼──────┐
│   Django    │
│    View     │
└──────┬──────┘
       │
       │ 3. Business Logic
       │
┌──────▼──────┐
│   Django    │
│    Model    │
└──────┬──────┘
       │
       │ 4. Query (ORM)
       │
┌──────▼──────┐
│   MySQL     │
│  Database   │
└──────┬──────┘
       │
       │ 5. Data Response
       │
┌──────▼──────┐
│ Serializer  │
└──────┬──────┘
       │
       │ 6. JSON Response
       │
┌──────▼──────┐
│   React     │
│   State     │
└──────┬──────┘
       │
       │ 7. UI Update
       │
┌──────▼──────┐
│   Browser   │
│   Display   │
└─────────────┘
```

## Payment Processing Flow

```
┌────────────┐
│  Student   │
└─────┬──────┘
      │
      │ 1. Initiate Payment
      │
┌─────▼─────────────┐
│ Frontend          │
│ PaymentPage.jsx   │
└─────┬─────────────┘
      │
      │ 2. POST /api/student/initiate-payment/
      │
┌─────▼─────────────┐
│ Backend           │
│ views.py          │
└─────┬─────────────┘
      │
      │ 3. Generate Order
      │
┌─────▼─────────────┐
│ Payment Gateway   │
│ Razorpay/Paytm    │
└─────┬─────────────┘
      │
      │ 4. Payment UI
      │
┌─────▼─────────────┐
│ User Completes    │
│ Payment           │
└─────┬─────────────┘
      │
      │ 5. Callback
      │
┌─────▼─────────────┐
│ Backend           │
│ Verify Payment    │
└─────┬─────────────┘
      │
      │ 6. Update Database
      │
┌─────▼─────────────┐
│ MySQL             │
│ online_edu        │
└─────┬─────────────┘
      │
      │ 7. Send Email
      │
┌─────▼─────────────┐
│ Email Service     │
│ SMTP              │
└─────┬─────────────┘
      │
      │ 8. Success Response
      │
┌─────▼─────────────┐
│ Frontend          │
│ Success Page      │
└───────────────────┘
```

## File Upload Flow

```
┌────────────┐
│  Student   │
└─────┬──────┘
      │
      │ 1. Select File
      │
┌─────▼─────────────┐
│ React Dropzone    │
│ Component         │
└─────┬─────────────┘
      │
      │ 2. Validate File
      │    (Type, Size)
      │
┌─────▼─────────────┐
│ Upload to Backend │
│ POST /api/upload/ │
└─────┬─────────────┘
      │
      │ 3. Process File
      │
┌─────▼─────────────┐
│ Django View       │
│ File Handler      │
└─────┬─────────────┘
      │
      ├──────────────┐
      │              │
      │ 4a. Save     │ 4b. Upload
      │    Local     │     Google Drive
      │              │
┌─────▼─────┐  ┌────▼────────┐
│  media/   │  │ Google      │
│  folder   │  │ Drive API   │
└───────────┘  └─────────────┘
```

---

This architecture supports:
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Security
- ✅ Multi-database support
- ✅ Modern tech stack
- ✅ RESTful API design
- ✅ Component reusability
