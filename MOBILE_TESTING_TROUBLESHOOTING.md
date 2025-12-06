# Mobile Testing Setup Guide

## Current Issue: Backend Not Responding

### Possible Causes:
1. ❌ Django not running on network interface (0.0.0.0)
2. ❌ Windows Firewall blocking port 8000
3. ❌ Backend not running at all
4. ❌ Network IP changed

---

## ✅ STEP-BY-STEP FIX:

### Step 1: Configure Windows Firewall (RUN AS ADMINISTRATOR)
```
Right-click setup-firewall.bat → Run as Administrator
```
This will allow ports 8000 and 8080 through Windows Firewall.

### Step 2: Start Backend on Network Interface
```
Double-click: start-backend-mobile.bat
```
**You should see:**
```
Starting development server at http://0.0.0.0:8000/
```

**If you see `http://127.0.0.1:8000/` instead, STOP and run:**
```
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Start Frontend on Network Interface
```
cd frontend
npm run dev -- --host 0.0.0.0 --port 8080
```

**You should see:**
```
Local:   http://localhost:8080/
Network: http://192.168.210.240:8080/
```

### Step 4: Test from Mobile
1. Connect mobile to **SAME WiFi** as your PC
2. Open browser on mobile
3. Go to: `http://192.168.210.240:8080`
4. Try logging in
5. **Open mobile browser console** (if possible) to see errors

---

## 🔍 DEBUGGING:

### Check if Backend is Accessible:
From your mobile browser, try accessing:
```
http://192.168.210.240:8000/api/
```

You should see Django REST Framework page.

### Check Desktop Browser Console:
1. Open: http://localhost:8080
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Try logging in
5. Look for messages like:
   - 🔐 Attempting login to: http://192.168.210.240:8000/api/login/
   - ❌ Network Error
   - ❌ CORS error

### Common Errors:

**"Network Error"**
→ Backend not running or firewall blocking

**"CORS Error"**
→ Check backend/settings.py CORS_ALLOWED_ORIGINS

**"Cannot connect"**
→ Wrong IP address or different network

---

## 📱 Quick Test Checklist:

- [ ] Windows Firewall configured (setup-firewall.bat as Admin)
- [ ] Backend running: `python manage.py runserver 0.0.0.0:8000`
- [ ] Frontend running: `npm run dev -- --host 0.0.0.0 --port 8080`
- [ ] Mobile and PC on same WiFi
- [ ] Can access http://192.168.210.240:8000/api/ from mobile
- [ ] Can access http://192.168.210.240:8080 from mobile
- [ ] Browser console shows: 🌐 API Base URL: http://192.168.210.240:8000

---

## 🔧 Alternative: Test on Desktop First

Before testing on mobile, verify everything works on desktop:

1. Open: http://localhost:8080
2. Press F12 → Console
3. Try logging in
4. Check console logs

If it works on desktop but not mobile:
→ Firewall or network issue

If it doesn't work on desktop:
→ Backend or frontend configuration issue
