# Multi-Database Query Fixes - Status Report

## Problem
The unified portal uses multiple databases:
- `default` (lsc_portal_db): Django admin, auth_user, authtoken_token, sessions
- `online_edu`: Student Portal data (api app models: Student, Application, StudentDetails, etc.)
- `lsc_admindb`: LSC Portal data (portal app models)

The issue was that queries didn't explicitly specify which database to use, causing cross-database foreign key errors.

## Solution
Add explicit `.using('database_name')` to all ORM operations.

---

## ✅ FIXED QUERIES

### 1. **signup view** (Line ~97)
```python
# BEFORE:
Student.objects.create(...)

# AFTER:
Student.objects.using('online_edu').create(...)
```

### 2. **login_view** (Lines ~150-180)
```python
# BEFORE:
student = Student.objects.get(email=email, password=password, is_verified=True)
user, created = User.objects.get_or_create(username=email, defaults={'email': email})
token, _ = Token.objects.get_or_create(user=user)
if Student.objects.filter(email=email, is_verified=False).exists():

# AFTER:
student = Student.objects.using('online_edu').get(email=email, password=password, is_verified=True)
user, created = User.objects.using('default').get_or_create(username=email, defaults={'email': email})
token, _ = Token.objects.using('default').get_or_create(user=user)
if Student.objects.using('online_edu').filter(email=email, is_verified=False).exists():
```
**Key Change**: Removed cross-database foreign key assignment (`student.user = user`)

### 3. **forgot_password** (Line ~200)
```python
# BEFORE:
Student.objects.get(email=email)

# AFTER:
Student.objects.using('online_edu').get(email=email)
```

### 4. **reset_password** (Lines ~242-248)
```python
# BEFORE:
student = Student.objects.get(email=email)
student.set_password(new_password)
student.user.set_password(new_password)
student.user.save()
student.save()

# AFTER:
student = Student.objects.using('online_edu').get(email=email)
student.set_password(new_password)
user = User.objects.using('default').get(username=email)
user.set_password(new_password)
user.save(using='default')
student.save(using='online_edu')
```
**Key Change**: Removed cross-database foreign key access (`student.user`)

### 5. **get_user_profile** (Line ~258)
```python
# BEFORE:
student = Student.objects.filter(user=user).first()

# AFTER:
student = Student.objects.using('online_edu').filter(email=user.email).first()
```
**Key Change**: Changed from `user=user` (foreign key) to `email=user.email` (email matching)

### 6. **upload_marksheet** (Line ~818)
```python
# BEFORE:
student = Student.objects.get(user=user)

# AFTER:
student = Student.objects.using('online_edu').get(email=user.email)
```

### 7. **get_application_preview** (Lines ~992-999)
```python
# BEFORE:
student = Student.objects.get(user=user)
application = Application.objects.get(user=user)

# AFTER:
student = Student.objects.using('online_edu').get(email=user.email)
application = Application.objects.using('online_edu').get(email=user.email)
```

---

## ⏳ QUERIES THAT STILL NEED FIXING

### Student Model Queries (Need `.using('online_edu')` and email matching)

**Lines to fix:**
- Line 1276: `Student.objects.filter(user=request.user).first()`
- Line 1478: `Student.objects.filter(user=request.user).first()`
- Line 1481: `Student.objects.filter(email=request.user.email).first()` (add .using)
- Line 1488: `Student.objects.create(...)` (add .using)
- Line 1596: `Student.objects.filter(user=user).first()`
- Line 1743: `Student.objects.filter(user=user).first()`
- Line 2141: `Student.objects.filter(user=user).first()`

### Application Model Queries (Need `.using('online_edu')` and email matching)

**Lines to fix:**
- Line 284: `Application.objects.filter(user=user, is_active=True, status='In Progress')`
- Line 285: `Application.objects.filter(user=user, is_active=True, status='Draft')`
- Line 286: `Application.objects.filter(user=user, is_active=False, status='Completed')`
- Line 287: `Application.objects.filter(user=user, is_active=False, status='Cancelled')`
- Line 353: `Application.objects.get(user=user, academic_year=academic_year)`
- Line 404: `Application.objects.get_or_create(...)`
- Line 518: `Application.objects.filter(user=user).first()`
- Line 543: `Application.objects.filter(user=request.user).first()`
- Line 576: `Application.objects.filter(user=request.user).first()`
- Line 825: `Application.objects.get(user=user)`
- Line 1203: `Application.objects.get(...)`
- Line 1277: `Application.objects.filter(user=request.user, status__in=['Draft', 'In Progress']).first()`
- Line 1397: `Application.objects.get(...)`
- Line 1604: `Application.objects.filter(user=user, status__in=['Draft', 'In Progress', 'Completed']).first()`
- Line 1671: `Application.objects.filter(user=user, status__in=['Draft', 'In Progress']).first()`
- Line 1727: `Application.objects.filter(user=user, status__in=['Draft', 'In Progress']).first()`
- Line 1860: `Application.objects.filter(user=payment.user).first()`
- Line 1993: `Application.objects.filter(user=user).first()`
- Line 2055: `Application.objects.filter(user=user).first()`
- Line 2133: `Application.objects.filter(user=user, status='Completed').first()`

### StudentDetails Model Queries (Need `.using('online_edu')`)

Search for: `StudentDetails.objects.get(user=user)` or similar

### MarksheetUpload Model Queries (Need `.using('online_edu')`)

- Line 1007: `MarksheetUpload.objects.filter(student__user=user)` → Change to `filter(student__email=user.email)`

### Payment Model Queries (If in api app, need `.using('online_edu')`)

Search for: `Payment.objects.filter(user=user)` or similar

---

## 🔧 HOW TO FIX REMAINING QUERIES

### Pattern 1: Simple filter/get with user
```python
# BEFORE:
Student.objects.filter(user=user)

# AFTER:
Student.objects.using('online_edu').filter(email=user.email)
```

### Pattern 2: get_or_create with user
```python
# BEFORE:
Application.objects.get_or_create(user=user, defaults={...})

# AFTER:
Application.objects.using('online_edu').get_or_create(
    email=user.email,
    defaults={...}  # Make sure defaults don't include 'user' field
)
```

### Pattern 3: Related queries
```python
# BEFORE:
MarksheetUpload.objects.filter(student__user=user)

# AFTER:
MarksheetUpload.objects.using('online_edu').filter(student__email=user.email)
```

### Pattern 4: Save operations
```python
# BEFORE:
student.save()

# AFTER:
student.save(using='online_edu')
```

---

## ✅ TESTING CHECKLIST

After all fixes are applied:

1. **Test Student Portal Login**
   - Navigate to: http://localhost:8082/student/login
   - Try logging in with existing email
   - Should not get "database router prevents relation" error

2. **Test Student Portal Signup**
   - Navigate to: http://localhost:8082/student/signup
   - Complete registration
   - Verify student created in online_edu database

3. **Test Password Reset**
   - Click "Forgot Password"
   - Enter email and get OTP
   - Reset password
   - Login with new password

4. **Test Profile View**
   - After login, check if profile data loads
   - Verify student name, email, phone displayed

5. **Test Application Submission**
   - Fill out application form (page 1, 2, 3)
   - Upload documents
   - Save and preview
   - Submit application

6. **Test Payment**
   - Complete payment process
   - Verify payment recorded in online_edu database

---

## 📋 PRIORITY ORDER

### HIGH PRIORITY (Test login first)
1. ✅ login_view - **FIXED**
2. ✅ signup - **FIXED**
3. ✅ get_user_profile - **FIXED**

### MEDIUM PRIORITY (Common operations)
4. applications_view (Line 284-287) - Fix all 4 filters
5. save_application_page1/2/3 - Need to check and fix
6. get_application - Need to check and fix

### LOW PRIORITY (Less frequent operations)
7. upload_marksheet
8. upload_documents
9. payment functions
10. Other utility functions

---

## 🚨 IMPORTANT NOTES

1. **Foreign Key Removal**: The `Student.user` foreign key cannot be used across databases. Always use email matching instead:
   ```python
   # ❌ DON'T DO THIS:
   student.user = user
   student.save()
   
   # ✅ DO THIS:
   # Store email, match later:
   # Student has email field, User has username=email
   ```

2. **Database Router**: The `LSCDatabaseRouter` in `backend/db_router.py` routes:
   - `api` app → `online_edu` database
   - `portal` app → `lsc_admindb` database
   - `lsc_auth` app → `default` or `online_edu` based on model

3. **Explicit is Better**: Always use explicit `.using()` calls even though router exists. Makes code clearer and prevents issues.

4. **Save Operations**: Don't forget to specify database in save:
   ```python
   student.save(using='online_edu')
   user.save(using='default')
   ```

---

## NEXT STEPS

1. **Test current fixes** - Try logging in to see if basic authentication works
2. **Fix remaining queries** - Work through the list above systematically
3. **Check api/models.py** - Verify Student model doesn't have user foreign key or mark it as nullable
4. **Update serializers** - Check if serializers reference user field, update to use email
5. **Test complete workflow** - Signup → Login → Apply → Upload → Pay → Preview

