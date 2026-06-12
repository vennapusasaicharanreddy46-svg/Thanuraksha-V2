# CREDENTIALS MIGRATION - ONE PAGE CHEAT SHEET

## 🔴 CRITICAL CREDENTIALS TO REPLACE (18 total items)

### Firebase Projects (3)
- [ ] `fresh-a29f6` → YOUR_PROJECT_ID (Main app, 8+ files)
- [ ] `thanu-iot` → YOUR_IOT_PROJECT_ID (IoT, 1 file)  
- [ ] `login-8c7d7` → YOUR_LOGIN_PROJECT_ID (.env file)

### OAuth Client IDs (4)
- [ ] `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` → YOUR_NEW_ID (admin-login.jsx)
- [ ] `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` → YOUR_NEW_ID (patient-login.jsx)
- [ ] `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` → YOUR_NEW_ID (doctor-login.jsx)
- [ ] `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` → YOUR_NEW_ID (doctor-verification.jsx)
- [ ] `425258631760-82mvscsaigjva2o2qc11lsauhfiaqh0n...` → YOUR_iOS_CLIENT_ID (GoogleService-Info.plist)

### API Keys (4)
- [ ] `AIzaSyAAqtKe6EZAm3l5be3Lfbj7iKmXaOb2Cnk` → YOUR_GEMINI_KEY (config/env.js:6)
- [ ] `AIzaSyBvGU9anUzfqhdX28UJ2S4CJ9t3vZ5O96A` → YOUR_GEMINI_KEY (.env:2)
- [ ] `AIzaSyDuc2MBzy2aWaQzVg13EKj659KblbcV-Vw` → YOUR_API_KEY (google-services.json)
- [ ] `AIzaSyCv9--gtaM_sL7-pwdqglzhTurrexm9w5M` → YOUR_API_KEY (.env:1)

### EmailJS Credentials (3)
- [ ] `ENMH9ibYfdT5ztnkd` → YOUR_PUBLIC_KEY (config/emailjs.config.js:4)
- [ ] `service_n7sfb1s` → YOUR_SERVICE_ID (config/emailjs.config.js:7)
- [ ] `template_2itsiqz` → YOUR_TEMPLATE_ID (config/emailjs.config.js:10)

### Admin & Security (2)
- [ ] `gandalabalaji@gmail.com` → YOUR_ADMIN_EMAIL (app/auth/admin-login.jsx:80)
- [ ] `android` (password x2) → YOUR_KEYSTORE_PASSWORD (android/app/build.gradle:101,103)

### Infrastructure (1)
- [ ] `10.229.12.246` → YOUR_ML_SERVER_IP (config/api.config.js:26)

---

## 📂 FILES TO UPDATE (Priority Order)

| File | Lines | What | Time |
|------|-------|------|------|
| `.env` | 1-2 | Firebase config + API keys | 5 min |
| `/android/app/google-services.json` | All | Complete file | 5 min |
| `/ios/GoogleService-Info.plist` | All | Complete file | 5 min |
| `/config/emailjs.config.js` | 4,7,10 | EmailJS credentials | 2 min |
| `/config/env.js` | 6 | Gemini API key | 1 min |
| `/config/api.config.js` | 14-31 | Firebase URLs & ML IP | 5 min |
| `/app/auth/admin-login.jsx` | 27,80 | OAuth ID + Admin email | 2 min |
| `/app/auth/patient-login.jsx` | 47 | OAuth ID | 1 min |
| `/app/auth/doctor-login.jsx` | 53,102,213 | OAuth ID + Firebase URLs | 3 min |
| `/app/auth/doctor-verification.jsx` | 44,84 | OAuth ID + Firebase URLs | 2 min |
| `/app/admin-dashboard.jsx` | 87 | Firebase URL | 1 min |
| `/app/active-appointments.jsx` | 125,172,239 | Firebase URLs | 2 min |
| `/app/add-prescription.jsx` | 291 | Firebase URL | 1 min |
| `/app/doctor-profile.jsx` | 130,310 | Firebase URLs | 1 min |
| `/app/doctor-dashboard.jsx` | 470,526,567,723,763,986 | Firebase URLs | 5 min |
| `/app/pharmacy-dashboard.jsx` | 927-998 | Remove test phone #s | 2 min |
| `/app/prescription-view.jsx` | 501 | Firebase URL | 1 min |
| `/android/app/build.gradle` | 100-103 | Keystore passwords | 3 min |
| `.gitignore` | - | Add .env, *.jks, *.keystore | 1 min |

**TOTAL TIME: ~50 minutes**

---

## 🚀 QUICK START

### Step 1: Create Credentials (1 hour)
```bash
# 1. Go to Firebase Console → Create 2 new projects (Android + iOS)
# 2. Generate google-services.json (Android)
# 3. Generate GoogleService-Info.plist (iOS)
# 4. Go to Google Cloud Console → Create OAuth Client IDs
# 5. Create EmailJS account → Get credentials
# 6. Generate Gemini API keys
# 7. Generate new Android keystore:
keytool -genkey -v -keystore app-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias app-release
```

### Step 2: Update Credentials (50 minutes)
Use find & replace in your IDE:
- Find: `fresh-a29f6` Replace: `YOUR_NEW_ID`
- Find: `425084232868-6d6muuik0hddgq228i96d9aiav7e4jke...` Replace: `YOUR_NEW_OAUTH_ID`
- Then manually update remaining items

### Step 3: Test (15 minutes)
```bash
# Build and test:
npm run build:android
# OR
npm run build:ios

# Test all features:
- Google Sign-In (all 3 roles)
- Firebase read/write
- Email sending
- AI features
```

### Step 4: Deploy (30 minutes)
```bash
# Update .gitignore
echo ".env" >> .gitignore
echo "*.jks" >> .gitignore

# Commit
git add .
git commit -m "Update credentials for production"
git push

# Build release
npm run build:release
```

---

## 🔍 VERIFICATION COMMANDS

```bash
# Find any remaining hardcoded credentials:
grep -r "fresh-a29f6" .
grep -r "thanu-iot" .
grep -r "10.229.12.246" .
grep -r "425084232868" .
grep -r "gandalabalaji" .
grep -r "AIzaSy" .
grep -r "ENMH9" .

# Check .gitignore
cat .gitignore | grep -E "\.env|\.jks|\.keystore"
```

---

## ⚠️ COMMON MISTAKES

- ❌ Forgetting to update `.env` file
- ❌ Not updating all 8+ Firebase URL references
- ❌ Using debug keystore for production build
- ❌ Forgetting to update admin email
- ❌ Not removing test phone numbers
- ❌ Forgetting to add `.env` to `.gitignore`
- ❌ Updating only some OAuth Client IDs (there are 4!)

---

## ✅ FINAL CHECKLIST

Before deploying to production:
- [ ] All Firebase URLs updated
- [ ] All OAuth IDs updated
- [ ] All API keys updated
- [ ] EmailJS credentials updated
- [ ] Admin email updated
- [ ] Test phone numbers removed
- [ ] Keystore updated for release
- [ ] `.gitignore` updated
- [ ] `.env` added to `.gitignore`
- [ ] All tests pass
- [ ] No console errors
- [ ] App builds successfully
- [ ] No hardcoded credentials remain

---

## 📞 HELP

For detailed info, see:
- `CREDENTIALS_AUDIT_REPORT.md` - Full report
- `QUICK_REPLACEMENT_GUIDE.md` - Specific locations
- `CREDENTIALS_SUMMARY.md` - Executive summary

---

**⏰ TOTAL EFFORT: ~4 hours**  
**🔴 STATUS: CRITICAL - DO NOT DEPLOY WITHOUT COMPLETING**

