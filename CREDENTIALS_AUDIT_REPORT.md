# 🔐 Credentials Audit & Migration Report
## ThanuRaksha Health App - Comprehensive Security Audit

**Report Generated:** June 12, 2026  
**Purpose:** Identification of all hardcoded credentials for secure migration  
**Status:** ⚠️ CRITICAL - Multiple hardcoded credentials found

---

## 📋 Executive Summary

This application contains **multiple critical hardcoded credentials** that must be replaced before deployment. The audit identified:
- ✗ **3 Firebase projects** (mixed configurations)
- ✗ **4 Google OAuth Client IDs** (hardcoded in source files)
- ✗ **2 Gemini API Keys** (exposed in configuration and .env)
- ✗ **3 EmailJS credentials** (hardcoded)
- ✗ **Machine Learning Server IPs** (hardcoded)
- ✗ **1 Admin Email** (hardcoded email restriction)
- ✗ **Multiple Firebase Database URLs** (hardcoded in components)
- ✗ **Test phone numbers** (placeholder data)
- ✗ **Android signing credentials** (debug keystore passwords)

**Risk Level: CRITICAL** 🔴  
**Deployment Ready: NO** ❌

---

## 🔍 DETAILED CREDENTIALS INVENTORY

### 1. FIREBASE CONFIGURATION FILES

#### 1.1 Android Firebase Configuration
| Item | Details |
|------|---------|
| **File Path** | `/android/app/google-services.json` |
| **Lines** | 1-42 |
| **Firebase Project ID** | `fresh-a29f6` |
| **Project Number** | `425084232868` |
| **Storage Bucket** | `fresh-a29f6.firebasestorage.app` |
| **App Package** | `Balu.com` |
| **Mobile SDK App ID** | `1:425084232868:android:2fc337efdbaab5f955b231` |
| **Current API Key** | `AIzaSyDuc2MBzy2aWaQzVg13EKj659KblbcV-Vw` |
| **OAuth Client ID (Type 1)** | `425084232868-rnf6jps8gqnmhggl355s71h0mmebfijj.apps.googleusercontent.com` |
| **OAuth Client ID (Type 3)** | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com` |
| **Certificate Hash** | `5e8f16062ea3cd2c4a0d547876baa6f38cabf625` |
| **Purpose** | Firebase Authentication & Database |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Medium (file replacement needed) |

#### 1.2 iOS Firebase Configuration
| Item | Details |
|------|---------|
| **File Path** | `/ios/GoogleService-Info.plist` |
| **Lines** | 1-48 |
| **iOS Client ID** | `425258631760-82mvscsaigjva2o2qc11lsauhfiaqh0n.apps.googleusercontent.com` |
| **Reversed Client ID** | `com.googleusercontent.apps.425258631760-82mvscsaigjva2o2qc11lsauhfiaqh0n` |
| **API Key** | `YOUR_IOS_API_KEY` (placeholder) |
| **GCM Sender ID** | `YOUR_PROJECT_NUMBER` (placeholder) |
| **Bundle ID** | `com.yourcompany.thanurakshaapp` |
| **Project ID** | `YOUR_PROJECT_ID` (placeholder) |
| **Storage Bucket** | `YOUR_PROJECT_ID.appspot.com` (placeholder) |
| **Database URL** | `https://YOUR_PROJECT_ID.firebaseio.com` (placeholder) |
| **Purpose** | Firebase iOS App Configuration |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Medium (requires iOS Firebase setup) |

---

### 2. ENVIRONMENT VARIABLES (.env FILE)

#### 2.1 .env File Credentials
| Item | Details |
|------|---------|
| **File Path** | `/.env` |
| **Line** | 1-2 |
| **Content** | Full Google Services JSON + API Key |
| **Primary Firebase Project** | `login-8c7d7` |
| **Project Number** | `166658289704` |
| **Firebase Database URL** | `https://login-8c7d7-default-rtdb.asia-southeast1.firebasedatabase.app` |
| **Storage Bucket** | `login-8c7d7.firebasestorage.app` |
| **Package Names** | `ThanuRaksha.com`, `tanuraksha.com` |
| **OAuth Client IDs** | Multiple (including `166658289704-8t31n0pa947fofa5udc9k6tif5n0p63r.apps.googleusercontent.com`) |
| **API Key** | `AIzaSyCv9--gtaM_sL7-pwdqglzhTurrexm9w5M` |
| **Certificate Hash** | `f199274e7c384e277eec523e3f448d2590c71a5d` |
| **Google Gemini API Key** | `AIzaSyBvGU9anUzfqhdX28UJ2S4CJ9t3vZ5O96A` |
| **Purpose** | Environment configuration for build system |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | High (contains multiple sensitive values) |
| **Visibility Risk** | 🔴 CRITICAL - Exposed in version control |

**⚠️ ALERT:** The `.env` file should be added to `.gitignore` immediately!

---

### 3. CONFIGURATION FILES

#### 3.1 API Configuration
| Item | Details |
|------|---------|
| **File Path** | `/config/api.config.js` |
| **Lines** | 14-165 |
| **Firebase Main Database URL** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` |
| **IoT Firebase URL** | `https://thanu-iot-default-rtdb.asia-southeast1.firebasedatabase.app` |
| **ML Server IP (Fallback)** | `10.229.12.246` |
| **Machine Learning Ports** | 5000-5009 (disease, diabetes, skin, eye, email services) |
| **Gemini API Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models` |
| **Gemini API Key** | Retrieved from `process.env.GOOGLE_API_KEY` |
| **Purpose** | Centralized API endpoint configuration |
| **Must Replace Before Deployment** | ✅ YES - Database URLs hardcoded |
| **Replacement Difficulty** | Medium (requires Firebase project swap) |
| **Additional Notes** | Contains dynamic IP fetching from Firebase (`admin/mlServerConfig/ip.json`) |

#### 3.2 Email Configuration
| Item | Details |
|------|---------|
| **File Path** | `/config/emailjs.config.js` |
| **Lines** | 3-11 |
| **EmailJS Public Key** | `ENMH9ibYfdT5ztnkd` |
| **EmailJS Service ID** | `service_n7sfb1s` |
| **EmailJS Template ID** | `template_2itsiqz` |
| **Purpose** | Doctor verification emails |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Low (direct credential replacement) |

#### 3.3 Gemini Configuration
| Item | Details |
|------|---------|
| **File Path** | `/config/env.js` |
| **Line** | 6 |
| **Google Gemini API Key** | `AIzaSyAAqtKe6EZAm3l5be3Lfbj7iKmXaOb2Cnk` |
| **Gemini API URL** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` |
| **Purpose** | AI chatbot and content generation |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Low (single credential) |
| **Visibility Risk** | 🔴 CRITICAL - Exposed in source code |

---

### 4. AUTHENTICATION SCREEN FILES

#### 4.1 Admin Login Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/auth/admin-login.jsx` |
| **Lines** | 27, 80 |
| **Google Sign-In WebClientId** | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com` |
| **Hardcoded Admin Email** | `gandalabalaji@gmail.com` |
| **Purpose** | Admin authentication & authorization |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Medium (code change + credential update) |
| **Security Risk** | 🔴 CRITICAL - Admin email hardcoded |

#### 4.2 Patient Login Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/auth/patient-login.jsx` |
| **Line** | 47 |
| **Google Sign-In WebClientId** | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com` |
| **Purpose** | Patient authentication via Google |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Low (credential replacement) |

#### 4.3 Doctor Login Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/auth/doctor-login.jsx` |
| **Lines** | 53, 102, 213 |
| **Google Sign-In WebClientId** | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com` |
| **Firebase Database URL (Doctors)** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/doctors.json` |
| **Firebase Main URL** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app` |
| **Purpose** | Doctor authentication & verification |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Low (credential replacement) |

#### 4.4 Doctor Verification Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/auth/doctor-verification.jsx` |
| **Lines** | 44, 84 |
| **Google Sign-In WebClientId** | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com` |
| **Firebase Database URL (Verification)** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/verification.json` |
| **Purpose** | Doctor verification workflow |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | Low (credential replacement) |

---

### 5. DASHBOARD SCREENS

#### 5.1 Admin Dashboard
| Item | Details |
|------|---------|
| **File Path** | `/app/admin-dashboard.jsx` |
| **Line** | 87 |
| **Firebase Doctors URL** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/doctors.json` |
| **Test Data** | Admin profile with name "Admin Test" |
| **Purpose** | Admin panel for doctor management |
| **Must Replace Before Deployment** | ✅ YES - Database URL |
| **Replacement Difficulty** | Low (API endpoint reference) |

#### 5.2 Active Appointments Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/active-appointments.jsx` |
| **Lines** | 125, 172, 239 |
| **Firebase Appointments URLs** | Multiple hardcoded URLs to `fresh-a29f6` database |
| **Purpose** | Appointment management |
| **Must Replace Before Deployment** | ✅ YES - Database URLs |
| **Replacement Difficulty** | Low (API endpoint references) |

#### 5.3 Doctor Dashboard
| Item | Details |
|------|---------|
| **File Path** | `/app/doctor-dashboard.jsx` |
| **Lines** | 470, 526, 567, 723, 763, 986 |
| **Firebase Database URLs** | Multiple hardcoded URLs to `fresh-a29f6` database (doctors, appointments, prescriptions, lab-test-orders) |
| **Purpose** | Doctor portal for managing patients and appointments |
| **Must Replace Before Deployment** | ✅ YES - Database URLs |
| **Replacement Difficulty** | Low (API endpoint references) |

#### 5.4 Pharmacy Dashboard
| Item | Details |
|------|---------|
| **File Path** | `/app/pharmacy-dashboard.jsx` |
| **Lines** | 927, 936, 947, 958, 967, 978, 989, 998 |
| **Test Phone Numbers** | `+91 9876543213` through `+91 9876543220` (8 hardcoded test numbers) |
| **Firebase URLs** | Multiple URLs to `fresh-a29f6` database (medicine-orders, delivery-orders, lab-test-orders) |
| **Purpose** | Pharmacy order management |
| **Must Replace Before Deployment** | ✅ YES - Test data must be removed |
| **Replacement Difficulty** | Low (test data cleanup) |

---

### 6. OTHER COMPONENTS

#### 6.1 Add Prescription Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/add-prescription.jsx` |
| **Line** | 291 |
| **Firebase Prescriptions URL** | `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/prescriptions.json` |
| **Purpose** | Prescription creation |
| **Must Replace Before Deployment** | ✅ YES - Database URL |
| **Replacement Difficulty** | Low (API endpoint reference) |

#### 6.2 Doctor Profile Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/doctor-profile.jsx` |
| **Lines** | 130, 310 |
| **Firebase URLs** | `fresh-a29f6` database URLs for doctors and appointments |
| **Purpose** | Doctor profile display |
| **Must Replace Before Deployment** | ✅ YES - Database URLs |
| **Replacement Difficulty** | Low (API endpoint references) |

#### 6.3 Prescription View Screen
| Item | Details |
|------|---------|
| **File Path** | `/app/prescription-view.jsx` |
| **Line** | 501 |
| **Purpose** | Prescription display |
| **Must Replace Before Deployment** | ✅ YES - If using Firebase URLs |
| **Replacement Difficulty** | Low (API endpoint references) |

---

### 7. ANDROID BUILD CONFIGURATION

#### 7.1 Android Signing Configuration
| Item | Details |
|------|---------|
| **File Path** | `/android/app/build.gradle` |
| **Lines** | 100-103 |
| **Keystore File** | `debug.keystore` |
| **Store Password** | `android` |
| **Key Alias** | `androiddebugkey` |
| **Key Password** | `android` |
| **Build Type** | Debug & Release (both using debug keystore) |
| **Purpose** | APK signing |
| **Must Replace Before Deployment** | ✅ YES - CRITICAL |
| **Replacement Difficulty** | High (requires new keystore generation) |
| **Security Risk** | 🔴 CRITICAL - Default credentials; production keystore not configured |

---

## 📊 CREDENTIALS SUMMARY TABLE

| Type | Count | Critical | File Locations |
|------|-------|----------|-----------------|
| Firebase Project IDs | 3 | ✅ | `.env`, `google-services.json`, `api.config.js` |
| Google OAuth Client IDs | 4 | ✅ | `.env`, `google-services.json`, auth files (3x) |
| API Keys | 4 | ✅ | `.env`, `google-services.json`, `env.js`, `api.config.js` |
| EmailJS Credentials | 3 | ✅ | `emailjs.config.js` |
| Gemini API Keys | 2 | ✅ | `env.js`, `api.config.js` |
| Firebase Database URLs | 8+ | ✅ | Multiple components |
| ML Server IPs | 1 | ⚠️ | `api.config.js` |
| Admin Emails | 1 | ✅ | `admin-login.jsx` |
| Test Phone Numbers | 8 | ⚠️ | `pharmacy-dashboard.jsx` |
| Android Keystore Passwords | 2 | ✅ | `build.gradle` |

---

## 🚀 MIGRATION CHECKLIST

### Phase 1: Pre-Migration Planning (Week 1)

- [ ] **1.1** Create new Firebase projects (Android and iOS)
- [ ] **1.2** Set up Google Cloud Console projects
- [ ] **1.3** Generate new OAuth Client IDs for both Android and iOS
- [ ] **1.4** Create EmailJS account and get new credentials
- [ ] **1.5** Generate new Gemini API keys
- [ ] **1.6** Plan database migration strategy from old Firebase to new
- [ ] **1.7** Update app bundle ID/package name in all configuration files
- [ ] **1.8** Create .gitignore rules for sensitive files

### Phase 2: Firebase Migration (Week 2)

#### Step 1: Create New Firebase Projects
- [ ] **2.1.1** Create new Firebase project for Android app
  - [ ] Generate new `google-services.json`
  - [ ] Download and save securely
  - [ ] Document Project ID: `_________________`
  - [ ] Document Project Number: `_________________`

- [ ] **2.1.2** Create new Firebase project for iOS app
  - [ ] Generate new `GoogleService-Info.plist`
  - [ ] Download and save securely
  - [ ] Document Project ID: `_________________`

- [ ] **2.1.3** Create Firestore/Realtime Database in both projects
  - [ ] Enable Authentication (Google Sign-In)
  - [ ] Create database structure matching current schema
  - [ ] Set up Security Rules

#### Step 2: Update Configuration Files
- [ ] **2.2.1** Replace `/android/app/google-services.json`
- [ ] **2.2.2** Replace `/ios/GoogleService-Info.plist`
- [ ] **2.2.3** Update `/.env` file
  - [ ] Update GOOGLE_SERVICES_JSON value
  - [ ] Update GOOGLE_API_KEY value
- [ ] **2.2.4** Update `/config/api.config.js`
  - [ ] Update FIREBASE BASE_URLS
  - [ ] Update IOT_FIREBASE URL
  - [ ] Update API_KEYS.GOOGLE_GEMINI

#### Step 3: Generate OAuth Credentials
- [ ] **2.3.1** Generate Android OAuth Client ID
  - [ ] Document new Client ID: `_________________`
  - [ ] Note SHA-1 certificate hash: `_________________`
- [ ] **2.3.2** Generate iOS OAuth Client ID
  - [ ] Document new Client ID: `_________________`

### Phase 3: Application Code Updates (Week 3)

#### Step 1: Update Authentication Files
- [ ] **3.1.1** Update `/app/auth/admin-login.jsx`
  - [ ] Replace Google Sign-In webClientId
  - [ ] Change admin email authorization (line 80)
  - [ ] Document new admin email(s): `_________________`

- [ ] **3.1.2** Update `/app/auth/patient-login.jsx`
  - [ ] Replace Google Sign-In webClientId

- [ ] **3.1.3** Update `/app/auth/doctor-login.jsx`
  - [ ] Replace Google Sign-In webClientId
  - [ ] Update all Firebase database URLs

- [ ] **3.1.4** Update `/app/auth/doctor-verification.jsx`
  - [ ] Replace Google Sign-In webClientId

#### Step 2: Update Configuration Files
- [ ] **3.2.1** Update `/config/emailjs.config.js`
  - [ ] Replace EMAILJS_CONFIG.PUBLIC_KEY
  - [ ] Replace EMAILJS_CONFIG.SERVICE_ID
  - [ ] Replace EMAILJS_CONFIG.TEMPLATE_ID
  - [ ] Verify EmailJS account setup

- [ ] **3.2.2** Update `/config/env.js`
  - [ ] Replace GOOGLE_API_KEY

#### Step 3: Update Component Files
- [ ] **3.3.1** Update `/app/admin-dashboard.jsx` (line 87)
- [ ] **3.3.2** Update `/app/active-appointments.jsx` (lines 125, 172, 239)
- [ ] **3.3.3** Update `/app/add-prescription.jsx` (line 291)
- [ ] **3.3.4** Update `/app/doctor-profile.jsx` (lines 130, 310)
- [ ] **3.3.5** Update `/app/doctor-dashboard.jsx` (lines 470, 526, 567, 723, 763, 986)
- [ ] **3.3.6** Update `/app/prescription-view.jsx` (line 501)
- [ ] **3.3.7** Clean up `/app/pharmacy-dashboard.jsx` (remove test phone numbers lines 927-998)

### Phase 4: Android Build Configuration (Week 3)

#### Step 1: Generate Production Keystore
- [ ] **4.1.1** Generate new production keystore file
  ```bash
  keytool -genkey -v -keystore app-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias app-release
  ```
  - [ ] Store keystore password securely
  - [ ] Store key password securely
  - [ ] Document keystore location: `_________________`
  - [ ] Document keystore password: `_________________` (store in secure vault)
  - [ ] Document key alias: `_________________`
  - [ ] Document key password: `_________________` (store in secure vault)

#### Step 2: Update Build Configuration
- [ ] **4.2.1** Update `/android/app/build.gradle`
  - [ ] Replace debug keystore with production keystore for release build
  - [ ] Update storeFile path
  - [ ] Update storePassword
  - [ ] Update keyAlias
  - [ ] Update keyPassword

#### Step 3: Secure Storage
- [ ] **4.3.1** Move keystore to secure location outside of version control
- [ ] **4.3.2** Add keystore to `.gitignore`:
  ```
  *.jks
  *.keystore
  debug.keystore
  ```

### Phase 5: Environment Variables & Secrets Management (Week 4)

#### Step 1: Set Up .env Management
- [ ] **5.1.1** Verify `.env` is in `.gitignore`
  ```
  .env
  .env.local
  .env.*.local
  *.keystore
  *.jks
  ```

- [ ] **5.1.2** Create `.env.example` template (without sensitive values)
  ```
  GOOGLE_SERVICES_JSON={"project_info":{"project_number":"YOUR_PROJECT_NUMBER",...}}
  GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
  ```

- [ ] **5.1.3** Document how to generate `.env` file for new developers

#### Step 2: Secrets Management
- [ ] **5.2.1** Set up secure storage for:
  - Firebase Project IDs
  - OAuth Client IDs
  - API Keys
  - Keystore passwords
  - EmailJS credentials

- [ ] **5.2.2** Use environment-specific configurations:
  - `.env.development` (for development)
  - `.env.staging` (for staging)
  - `.env.production` (for production)

#### Step 3: CI/CD Integration (if applicable)
- [ ] **5.3.1** Set up CI/CD pipeline secrets (GitHub Secrets, GitLab CI/CD, etc.)
- [ ] **5.3.2** Configure build system to use environment variables
- [ ] **5.3.3** Test build process with new credentials

### Phase 6: Testing & Validation (Week 4)

#### Step 1: Development Testing
- [ ] **6.1.1** Test all authentication flows
  - [ ] Google Sign-In (Admin)
  - [ ] Google Sign-In (Doctor)
  - [ ] Google Sign-In (Patient)
  - [ ] Admin authorization check

- [ ] **6.1.2** Test Firebase connectivity
  - [ ] Database read operations
  - [ ] Database write operations
  - [ ] Real-time listener functionality

- [ ] **6.1.3** Test API integrations
  - [ ] Gemini AI services
  - [ ] EmailJS email sending
  - [ ] ML Server connectivity

#### Step 2: Staging Testing
- [ ] **6.2.1** Build and deploy to staging environment
- [ ] **6.2.2** Perform full UAT with new credentials
- [ ] **6.2.3** Verify all integrations work correctly
- [ ] **6.2.4** Check for any hardcoded references missed

#### Step 3: Production Preparation
- [ ] **6.3.1** Final code review for any hardcoded credentials
- [ ] **6.3.2** Verify all test data has been removed
- [ ] **6.3.3** Confirm keystore setup for production build
- [ ] **6.3.4** Run security scan for exposed credentials

### Phase 7: Deployment (Week 5)

#### Step 1: Final Security Check
- [ ] **7.1.1** Run credential scanner (e.g., git-secrets, truffleHog)
- [ ] **7.1.2** Verify no API keys in source code
- [ ] **7.1.3** Verify no passwords in source code
- [ ] **7.1.4** Verify all sensitive files in `.gitignore`

#### Step 2: Production Build
- [ ] **7.2.1** Build Android APK/AAB with production credentials
- [ ] **7.2.2** Build iOS app with production credentials
- [ ] **7.2.3** Sign with production keystore
- [ ] **7.2.4** Verify app builds successfully

#### Step 3: Post-Deployment
- [ ] **7.3.1** Deploy to app stores
- [ ] **7.3.2** Monitor logs for any credential-related errors
- [ ] **7.3.3** Set up alerts for authentication failures
- [ ] **7.3.4** Rotate credentials if any issues detected

### Phase 8: Cleanup & Documentation (Ongoing)

- [ ] **8.1** Document all credential locations
- [ ] **8.2** Create credential rotation schedule
- [ ] **8.3** Set up automated credential scanning in CI/CD
- [ ] **8.4** Train team on credential management best practices
- [ ] **8.5** Create runbook for emergency credential revocation
- [ ] **8.6** Archive this audit report in secure location

---

## 🔒 SECURITY BEST PRACTICES

### Immediate Actions Required

1. **Revoke All Exposed Credentials**
   - Disable all API keys listed in this report
   - Revoke OAuth credentials
   - Disable EmailJS service accounts
   - Rotate Gemini API keys

2. **Add to .gitignore**
   ```
   .env
   .env.local
   .env.*.local
   *.keystore
   *.jks
   debug.keystore
   google-services.json
   GoogleService-Info.plist
   ```

3. **Clean Git History**
   - Use `git filter-branch` or `bfg-repo-cleaner` to remove exposed credentials from history
   - Force push to all remotes
   - Notify all developers

4. **Set Up Credential Scanning**
   ```bash
   # Install git-secrets
   brew install git-secrets
   
   # Configure patterns
   git secrets --add 'AIzaSy[a-zA-Z0-9\-_]{32,}'  # Google API Keys
   git secrets --add 'ENMH[a-zA-Z0-9]{13,}'        # EmailJS keys
   git secrets --install
   ```

### Ongoing Security Measures

1. **Environment-Specific Configurations**
   - Development: Use dev Firebase project
   - Staging: Use staging Firebase project
   - Production: Use production Firebase project (separate credentials)

2. **Access Control**
   - Limit access to `.env` files to authorized developers only
   - Use separate credentials per environment
   - Implement role-based access control (RBAC)

3. **Credential Rotation Schedule**
   - Rotate API keys every 90 days
   - Rotate OAuth Client IDs annually or if compromised
   - Rotate Admin emails as staff changes

4. **Monitoring & Alerting**
   - Set up Firebase security alerts
   - Monitor API key usage patterns
   - Alert on unusual authentication patterns
   - Log all credential access

5. **Secure Storage Solutions** (Recommended)
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - Azure Key Vault
   - HashiCorp Vault

---

## 📝 REPLACEMENT MAPPING TABLE

Use this table to ensure you update all locations:

| Credential | Old Value | New Value | File Locations | Status |
|------------|-----------|-----------|-----------------|--------|
| Firebase Project ID (Main) | `fresh-a29f6` | `[NEW_ID]` | 8+ files | ⏳ Pending |
| Firebase Project ID (IoT) | `thanu-iot` | `[NEW_ID]` | 1 file | ⏳ Pending |
| Firebase Project ID (Login) | `login-8c7d7` | `[NEW_ID]` | .env | ⏳ Pending |
| Google OAuth WebClientId | `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` | `[NEW_ID]` | 4 files | ⏳ Pending |
| Gemini API Key | `AIzaSyAAqtKe6EZAm3l5be3Lfbj7iKmXaOb2Cnk` | `[NEW_KEY]` | env.js | ⏳ Pending |
| Gemini API Key 2 | `AIzaSyBvGU9anUzfqhdX28UJ2S4CJ9t3vZ5O96A` | `[NEW_KEY]` | .env | ⏳ Pending |
| EmailJS Public Key | `ENMH9ibYfdT5ztnkd` | `[NEW_KEY]` | emailjs.config.js | ⏳ Pending |
| EmailJS Service ID | `service_n7sfb1s` | `[NEW_ID]` | emailjs.config.js | ⏳ Pending |
| EmailJS Template ID | `template_2itsiqz` | `[NEW_ID]` | emailjs.config.js | ⏳ Pending |
| Admin Email | `gandalabalaji@gmail.com` | `[NEW_EMAIL]` | admin-login.jsx | ⏳ Pending |
| Android Keystore Password | `android` | `[NEW_PASSWORD]` | build.gradle | ⏳ Pending |
| ML Server IP | `10.229.12.246` | `[NEW_IP]` | api.config.js | ⏳ Pending |

---

## 📞 SUPPORT & DOCUMENTATION

For questions or issues during migration:
1. Refer to Firebase documentation: https://firebase.google.com/docs
2. Check EmailJS setup guide: https://www.emailjs.com/docs/
3. Gemini API docs: https://ai.google.dev/
4. Contact your security team for credential management policies

---

## 📅 AUDIT TRAIL

| Date | Action | Status | Notes |
|------|--------|--------|-------|
| 2026-06-12 | Credentials audit completed | ✅ Complete | All hardcoded credentials identified |
| | Migration planning | ⏳ In Progress | Following checklist |
| | Development environment setup | ⏳ Pending | New Firebase projects needed |
| | Code updates | ⏳ Pending | 20+ files to update |
| | Testing | ⏳ Pending | Full UAT required |
| | Production deployment | ⏳ Pending | After testing phase |

---

**Prepared by:** AI Security Audit  
**Classification:** CONFIDENTIAL  
**Distribution:** Development Team Only  
**Review Frequency:** Quarterly or after security incidents

