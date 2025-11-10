# Unified Education Portal

A comprehensive education management system combining **CDOE LSC Portal** and **Student Admission Portal** into a single unified application.

## 🎯 Overview

This unified portal provides:

### CDOE LSC Portal
- **Admin Dashboard**: Comprehensive management for LSC administrators
- **User Dashboard**: Access for LSC users
- **Admission Management**: Manage admission sessions and processes
- **Reports & Analytics**: Generate reports and view statistics
- **Settings Management**: Configure system settings
- **Dual Authentication**: Supports both admin and LSC user authentication

### Student Admission Portal
- **Student Registration & Login**: Secure authentication system
- **Application Management**: Multi-step application process
- **Document Upload**: Upload and manage application documents
- **Payment Integration**: Razorpay & Paytm payment gateway support
- **Application Preview**: Review application before submission
- **Email Notifications**: Automated email notifications
- **Google Drive Integration**: Store and manage documents

## 📁 Project Structure

```
unified-portal/
├── backend/                    # Django Backend
│   ├── api/                   # Student Admission API
│   ├── lsc_auth/             # LSC Authentication
│   ├── portal/               # Portal Management
│   ├── admissions/           # Admission Management
│   ├── backend/              # Django settings
│   │   ├── settings.py      # Unified settings
│   │   ├── urls.py          # Unified URL configuration
│   │   └── db_router.py     # Database router
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                  # React Frontend
    ├── src/
    │   ├── lsc-portal/       # CDOE LSC Portal components
    │   │   ├── components/   # LSC UI components
    │   │   ├── pages/        # LSC pages
    │   │   └── lib/          # LSC utilities
    │   ├── student-portal/   # Student Admission components
    │   │   ├── components/   # Student UI components
    │   │   ├── pages/        # Student pages
    │   │   └── services/     # API services
    │   ├── App.tsx           # Unified routing
    │   ├── main.tsx          # Application entry
    │   └── index.css         # Global styles
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 🚀 Quick Start

### Prerequisites

- **Python** 3.9 or higher
- **Node.js** 16 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure MySQL databases:**
   
   Create three MySQL databases:
   ```sql
   CREATE DATABASE lsc_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE online_edu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE lsc_admindb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Update database credentials:**
   
   Edit `backend/settings.py` and update MySQL password in DATABASES configuration.

6. **Run migrations:**
   ```bash
   python manage.py migrate
   python manage.py migrate --database=online_edu
   python manage.py migrate --database=lsc_admindb
   ```

7. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:5173`

## 🌐 Access Points

### Main Landing Page
- **URL**: `http://localhost:5173/`
- **Description**: Choose between LSC Portal or Student Admission Portal

### CDOE LSC Portal
- **Login**: `http://localhost:5173/lsc/login`
- **Admin Dashboard**: `http://localhost:5173/lsc/dashboard/admin`
- **User Dashboard**: `http://localhost:5173/lsc/dashboard/user`

### Student Admission Portal
- **Login**: `http://localhost:5173/student/login`
- **Signup**: `http://localhost:5173/student/signup`
- **Dashboard**: `http://localhost:5173/student/dashboard`
- **Application**: `http://localhost:5173/student/application/page1`

## 🔐 API Endpoints

### LSC Portal APIs
```
POST   /api/auth/login/                 # LSC Login
POST   /api/auth/logout/                # LSC Logout
GET    /api/auth/me/                    # Get current user
GET    /api/portal/settings/            # Get portal settings
POST   /api/admissions/sessions/        # Create admission session
GET    /api/admissions/sessions/        # List admission sessions
```

### Student Admission APIs
```
POST   /api/student/signup/             # Student registration
POST   /api/student/login/              # Student login
GET    /api/student/courses/            # List available courses
POST   /api/student/application/        # Submit application
GET    /api/student/application/:id/    # Get application details
POST   /api/student/upload/             # Upload documents
POST   /api/student/payment/            # Process payment
```

## 🗄️ Database Configuration

The application uses **three MySQL databases**:

1. **lsc_portal_db** (default)
   - LSC user authentication
   - LSC user profiles
   - Django admin data

2. **online_edu**
   - Student admission data
   - Application forms
   - Payment records
   - Admin authentication

3. **lsc_admindb**
   - Portal settings
   - Application settings
   - System configuration

## ⚙️ Configuration

### Environment Variables

Create `.env` file in backend directory:

```env
# Database
DB_PASSWORD=your_mysql_password

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Paytm
PAYTM_MERCHANT_KEY=your_paytm_key
PAYTM_MERCHANT_MID=your_paytm_mid
PAYTM_ENVIRONMENT=PROD

# Email
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

### CORS Configuration

Already configured in `settings.py` for:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (React)
- `http://localhost:5175` (Alternative)

## 📦 Build for Production

### Frontend Build
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

### Backend Production
1. Update `DEBUG = False` in settings.py
2. Configure allowed hosts
3. Set up static files
4. Use production server (Gunicorn/uWSGI)

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📝 Key Features

### Authentication
- JWT-based authentication for LSC Portal
- Token-based authentication for Student Portal
- Dual database authentication backend
- Secure password hashing

### File Management
- Google Drive integration for document storage
- Local media file storage
- File upload with validation

### Payment Processing
- Razorpay integration
- Paytm integration
- Payment status tracking
- Transaction history

### Email System
- SMTP email configuration
- Automated notifications
- Password reset emails
- Application status updates

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Verify MySQL is running
mysql -u root -p

# Check database exists
SHOW DATABASES;
```

### Port Already in Use
```bash
# Backend (8000)
# Kill process using port
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module Import Errors
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

## 📚 Technology Stack

### Backend
- **Framework**: Django 4.2.16
- **API**: Django REST Framework
- **Database**: MySQL 8.0
- **Authentication**: JWT, Token Auth
- **Payment**: Razorpay, Paytm

### Frontend
- **Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router 7.6.2
- **UI Library**: Radix UI, Shadcn/ui
- **Styling**: TailwindCSS 4.1.8
- **State Management**: TanStack Query

## 👥 User Roles

### LSC Admin
- Manage admission sessions
- View all applications
- Generate reports
- Configure system settings

### LSC User
- View assigned applications
- Update application status
- Access reports

### Student
- Register and login
- Submit applications
- Upload documents
- Make payments
- Track application status

## 🔒 Security

- JWT token authentication
- CSRF protection enabled
- CORS configured
- Password hashing with Django's bcrypt
- Secure file upload validation
- Environment variable protection

## 📄 License

This is a proprietary education portal system.

## 🤝 Support

For support, please contact the development team.

---

**Last Updated**: November 2025
**Version**: 1.0.0
