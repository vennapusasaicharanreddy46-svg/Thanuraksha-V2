# 🎯 QUICK REFERENCE - CREDENTIAL REPLACEMENT GUIDE

## FILES THAT NEED CREDENTIAL UPDATES (Exact Locations)

### 1. CONFIGURATION FILES (4 files)

#### `/config/api.config.js`
**Lines to Update:**
- Line 29: `FIREBASE: "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app"`
- Line 31: `IOT_FIREBASE: "https://thanu-iot-default-rtdb.asia-southeast1.firebasedatabase.app"`
- Line 26: `ML_SERVER_IP = "10.229.12.246"`
- Search entire file for `fresh-a29f6` and `thanu-iot` references

**Action:** Replace with your new Firebase database URLs

---

#### `/config/emailjs.config.js`
**Lines to Update:**
- Line 4: `PUBLIC_KEY: 'ENMH9ibYfdT5ztnkd'`
- Line 7: `SERVICE_ID: 'service_n7sfb1s'`
- Line 10: `TEMPLATE_ID: 'template_2itsiqz'`

**Action:** Replace with your EmailJS credentials from dashboard

---

#### `/config/env.js`
**Lines to Update:**
- Line 6: `GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "AIzaSyAAqtKe6EZAm3l5be3Lfbj7iKmXaOb2Cnk"`

**Action:** Use environment variable (remove hardcoded fallback)

---

#### `/.env`
**Lines to Update:**
- Line 1: `GOOGLE_SERVICES_JSON={...project_id":"login-8c7d7"...}`
- Line 2: `GOOGLE_API_KEY=AIzaSyBvGU9anUzfqhdX28UJ2S4CJ9t3vZ5O96A`

**Action:** Replace with your new Firebase and API key values

**IMPORTANT:** Add `.env` to `.gitignore`

---

### 2. AUTHENTICATION FILES (4 files - Search for WebClientId)

#### `/app/auth/admin-login.jsx`
**Lines to Update:**
- Line 27: `webClientId: '425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com'`
- **Line 80: `const adminEmails = ['gandalabalaji@gmail.com'];`** ← ADMIN EMAIL HARDCODED

**Action:** 
1. Replace webClientId with your new Google OAuth Client ID
2. Update admin email to your email address

---

#### `/app/auth/patient-login.jsx`
**Lines to Update:**
- Line 47: `webClientId: '425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com'`

**Action:** Replace webClientId with your new Google OAuth Client ID

---

#### `/app/auth/doctor-login.jsx`
**Lines to Update:**
- Line 53: `webClientId: '425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com'`
- Line 102: Firebase URL - search and replace `fresh-a29f6`
- Line 213: Firebase URL - search and replace `fresh-a29f6`

**Action:** Replace webClientId and Firebase URLs

---

#### `/app/auth/doctor-verification.jsx`
**Lines to Update:**
- Line 44: `webClientId: '425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com'`
- Line 84: Firebase URL - search and replace `fresh-a29f6`

**Action:** Replace webClientId and Firebase URLs

---

### 3. FIREBASE CONFIGURATION FILES (2 files)

#### `/android/app/google-services.json`
**Complete file replacement needed**

**Items to replace:**
```json
"project_number": "425084232868" → "YOUR_PROJECT_NUMBER"
"project_id": "fresh-a29f6" → "YOUR_PROJECT_ID"
"storage_bucket": "fresh-a29f6.firebasestorage.app" → "YOUR_STORAGE_BUCKET"
"mobilesdk_app_id": "1:425084232868:android:..." → "YOUR_MOBILE_SDK_APP_ID"
"package_name": "Balu.com" → "YOUR_PACKAGE_NAME"
"client_id": "425084232868-..." → "YOUR_CLIENT_ID"
"certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625" → "YOUR_CERTIFICATE_HASH"
"current_key": "AIzaSyDuc2MBzy2aWaQzVg13EKj659KblbcV-Vw" → "YOUR_API_KEY"
```

**Action:** Download from Firebase Console and replace entire file

---

#### `/ios/GoogleService-Info.plist`
**Complete file replacement needed**

**Items to replace:**
```xml
<string>425258631760-82mvscsaigjva2o2qc11lsauhfiaqh0n.apps.googleusercontent.com</string> → "YOUR_iOS_CLIENT_ID"
<string>YOUR_IOS_API_KEY</string> → "YOUR_ACTUAL_IOS_API_KEY"
<string>YOUR_PROJECT_NUMBER</string> → "YOUR_ACTUAL_PROJECT_NUMBER"
<string>YOUR_PROJECT_ID</string> → "YOUR_ACTUAL_PROJECT_ID"
<string>YOUR_GOOGLE_APP_ID</string> → "YOUR_ACTUAL_GOOGLE_APP_ID"
```

**Action:** Download from Firebase Console and replace entire file

---

### 4. DASHBOARD & COMPONENT FILES (Search and Replace)

| File | Lines | Search For | Replace With |
|------|-------|-----------|--------------|
| `/app/admin-dashboard.jsx` | 87 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/active-appointments.jsx` | 125, 172, 239 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/add-prescription.jsx` | 291 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/doctor-profile.jsx` | 130, 310 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/doctor-dashboard.jsx` | 470, 526, 567, 723, 763, 986 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/prescription-view.jsx` | 501 | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` | `YOUR_NEW_FIREBASE_URL` |
| `/app/pharmacy-dashboard.jsx` | 927-998 | `"+91 9876543213"` through `"+91 9876543220"` | **DELETE OR REPLACE WITH REAL DATA** |

**Action:** Search and replace all instances of `fresh-a29f6` with your new Firebase Project ID

---

### 5. ANDROID BUILD CONFIGURATION

#### `/android/app/build.gradle`
**Lines to Update:**
- Line 100: `storeFile file('debug.keystore')`
- Line 101: `storePassword 'android'`
- Line 102: `keyAlias 'androiddebugkey'`
- Line 103: `keyPassword 'android'`

**Action:** 
1. Generate new keystore file
2. Update all credentials
3. For release build, use separate signing config

---

### 6. GIT CONFIGURATION

#### Update `.gitignore`

Add these lines:
```
# Environment variables
.env
.env.local
.env.*.local

# Android keystore files
*.keystore
*.jks
debug.keystore

# Firebase configuration files (optional - if treating as secrets)
google-services.json
GoogleService-Info.plist
```

---

## 🔄 BULK SEARCH & REPLACE COMMANDS

Use your IDE's Find and Replace feature (Ctrl+Shift+H / Cmd+Shift+H):

### Search Pattern 1: Firebase Database URLs
**Find:** `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app`  
**Replace with:** `https://YOUR_NEW_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app`

### Search Pattern 2: IoT Firebase URLs
**Find:** `https://thanu-iot-default-rtdb.asia-southeast1.firebasedatabase.app`  
**Replace with:** `https://YOUR_NEW_IOT_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app`

### Search Pattern 3: Project ID Pattern
**Find:** `fresh-a29f6`  
**Replace with:** `YOUR_NEW_PROJECT_ID`

### Search Pattern 4: Google OAuth Client ID
**Find:** `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com`  
**Replace with:** `YOUR_NEW_OAUTH_CLIENT_ID`

### Search Pattern 5: ML Server IP
**Find:** `10.229.12.246`  
**Replace with:** `YOUR_NEW_ML_SERVER_IP`

---

## ✅ VERIFICATION CHECKLIST

After updating credentials, verify:

- [ ] No hardcoded `fresh-a29f6` references remain
- [ ] No hardcoded `thanu-iot` references remain
- [ ] No hardcoded `10.229.12.246` IP references remain
- [ ] No hardcoded `425084232868-*` OAuth IDs remain
- [ ] No hardcoded `gandalabalaji@gmail.com` references remain
- [ ] No hardcoded `ENMH9ibYfdT5ztnkd` EmailJS keys remain
- [ ] No hardcoded `AIzaSyAAqtKe6EZAm3l5be3Lfbj7iKmXaOb2Cnk` API key remains
- [ ] No test phone numbers (`+91 9876543213-9876543220`) remain
- [ ] `.env` file is in `.gitignore`
- [ ] All configuration files reference environment variables where appropriate
- [ ] New credentials work in development environment
- [ ] Authentication flows tested
- [ ] Firebase connectivity tested
- [ ] Email service tested
- [ ] API integrations tested

---

## 🚀 QUICK DEPLOYMENT STEPS

1. **Create new Firebase projects** (Android & iOS)
2. **Download new google-services.json & GoogleService-Info.plist**
3. **Generate new OAuth Client IDs** in Google Cloud Console
4. **Create new EmailJS service**
5. **Generate new Gemini API keys**
6. **Update all files using the mapping above**
7. **Create .env file with new credentials**
8. **Add .gitignore rules**
9. **Generate new Android keystore for production**
10. **Test all authentication and integrations**
11. **Build production APK/AAB & iOS app**
12. **Deploy to app stores**

---

**Last Updated:** June 12, 2026  
**Total Files Requiring Updates:** 20+  
**Estimated Time:** 4-6 hours  
**Risk Level:** CRITICAL - Must complete before production deployment

