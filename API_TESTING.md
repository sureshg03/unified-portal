# API Endpoint Testing Guide

## Backend Server Status
✅ Backend running on: http://localhost:8000
✅ Frontend running on: http://localhost:8081

## LSC Portal API Endpoints

### Authentication
- **Login**: `POST http://localhost:8000/api/auth/login/`
  ```json
  {
    "lscNumber": "LSC001",
    "password": "your_password"
  }
  ```
  
- **Logout**: `POST http://localhost:8000/api/auth/logout/`
  - Headers: `Authorization: Bearer <token>`

- **Token Refresh**: `POST http://localhost:8000/api/auth/token/refresh/`
  ```json
  {
    "refresh": "<refresh_token>"
  }
  ```

- **Change Password**: `POST http://localhost:8000/api/auth/change-password/`
  ```json
  {
    "oldPassword": "old",
    "newPassword": "new"
  }
  ```

### LSC Management
- **List LSC Centers**: `GET http://localhost:8000/api/auth/lsc-centers/`
- **Get LSC Detail**: `GET http://localhost:8000/api/auth/lsc-centers/<lsc_number>/`

### Portal APIs
- **Students**: `GET/POST http://localhost:8000/api/portal/students/`
- **Attendance**: `GET/POST http://localhost:8000/api/portal/attendance/`
- **Assignment Marks**: `GET/POST http://localhost:8000/api/portal/assignment-marks/`
- **Counsellors**: `GET/POST http://localhost:8000/api/portal/counsellors/`

### Admissions APIs
- **Application Settings**: `GET http://localhost:8000/api/admissions/application-settings/`
- **System Settings**: `GET http://localhost:8000/api/admissions/system-settings/`
- **Notification Settings**: `GET http://localhost:8000/api/admissions/notification-settings/`

## Student Portal API Endpoints

### Authentication
- **Signup**: `POST http://localhost:8000/api/student/signup/`
- **Login**: `POST http://localhost:8000/api/student/login/`
  ```json
  {
    "email": "student@example.com",
    "password": "password"
  }
  ```
  
- **Send OTP**: `POST http://localhost:8000/api/student/send-otp/`
- **Verify OTP**: `POST http://localhost:8000/api/student/verify-otp/`
- **Forgot Password**: `POST http://localhost:8000/api/student/forgot-password/`
- **Reset Password**: `POST http://localhost:8000/api/student/reset-password/`

### Application Management
- **Get Application**: `GET http://localhost:8000/api/student/get-application/`
- **Save Page 1**: `POST http://localhost:8000/api/student/application/page1/`
- **Save Page 2**: `POST http://localhost:8000/api/student/application/page2/`
- **Save Page 3**: `POST http://localhost:8000/api/student/application/page3/`
- **Preview**: `GET http://localhost:8000/api/student/application/preview/`
- **Confirm Preview**: `POST http://localhost:8000/api/student/application/confirm-preview/`

### Payment
- **Create Order**: `POST http://localhost:8000/api/student/create-order/`
- **Verify Payment**: `POST http://localhost:8000/api/student/verify-payment/`
- **Payment Status**: `GET http://localhost:8000/api/student/payment-status/`
- **Initiate Payment**: `POST http://localhost:8000/api/student/initiate-payment/`

### Utility
- **Get Courses**: `GET http://localhost:8000/api/student/courses/`
- **Get Academic Year**: `GET http://localhost:8000/api/student/academic-year/`
- **Upload Documents**: `POST http://localhost:8000/api/student/upload-documents/`
- **Download Application**: `GET http://localhost:8000/api/student/download-application/`

## Frontend Routes

### Landing Page
- **Home**: http://localhost:8081/

### LSC Portal Routes
- **Login**: http://localhost:8081/lsc/login
- **Admin Dashboard**: http://localhost:8081/lsc/dashboard/admin
- **User Dashboard**: http://localhost:8081/lsc/dashboard/user

### Student Portal Routes
- **Login**: http://localhost:8081/student/login
- **Signup**: http://localhost:8081/student/signup
- **Dashboard**: http://localhost:8081/student/dashboard
- **Application Pages**: http://localhost:8081/student/application/page1
- **Payment**: http://localhost:8081/student/application/payment

## Testing Authentication

### Test LSC Portal Login
1. Navigate to http://localhost:8081/lsc/login
2. Enter LSC Number and Password
3. Should redirect to dashboard based on user type

### Test Student Portal Login
1. Navigate to http://localhost:8081/student/login
2. Enter Email and Password
3. Should redirect to student dashboard

## Common Issues & Solutions

### Issue: 404 Page Not Found
**Solution**: Check if route exists in App.tsx and backend URLs match

### Issue: Authentication Failed
**Solutions**:
- Check if backend server is running
- Verify API endpoints are correct
- Check CORS settings in Django
- Clear browser localStorage

### Issue: CORS Errors
**Solution**: Add frontend URL to CORS_ALLOWED_ORIGINS in backend/backend/settings.py

### Issue: Token Expired
**Solution**: Token refresh happens automatically, or manually clear localStorage and re-login

## Database Check

Run these commands to verify database setup:

```bash
# Check if databases exist
cd backend
python manage.py dbshell
SHOW DATABASES;

# Check if tables exist
USE lsc_portal_db;
SHOW TABLES;
```

## Quick Health Check

```bash
# Backend Health
curl http://localhost:8000/admin/

# Frontend Health
curl http://localhost:8081/
```
