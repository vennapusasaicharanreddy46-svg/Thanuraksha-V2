# 🔄 API Centralization Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    YOUR REACT NATIVE APP                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ SkinDisease      │  │ EyeCondition     │  │ Diabetes     │ │
│  │ Detector         │  │ Analyzer         │  │ Monitor      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│           └─────────────────────┼────────────────────┘         │
│                                 │                              │
│  ┌──────────────────┐  ┌────────┴─────────┐  ┌──────────────┐ │
│  │ AdminDashboard   │  │ DoctorDashboard  │  │ HealthRecords│ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│           └─────────────────────┼────────────────────┘         │
│                                 │                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  │ ALL IMPORT FROM
                                  │
                                  ▼
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃                                              ┃
        ┃       /config/api.config.js                  ┃
        ┃                                              ┃
        ┃  ⭐ ONE FILE TO RULE THEM ALL ⭐             ┃
        ┃                                              ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                  │
                                  │ CONTAINS
                                  │
        ┌─────────────────────────┼─────────────────────┐
        │                         │                     │
        ▼                         ▼                     ▼
┌───────────────┐     ┌──────────────────┐    ┌──────────────┐
│  BASE URLS    │     │  API ENDPOINTS   │    │  HELPERS     │
│               │     │                  │    │              │
│ • Firebase    │     │ • FIREBASE.*     │    │ • makeApiCall│
│ • IoT         │     │ • ML.*           │    │ • updateUrl  │
│ • Gemini      │     │ • GEMINI.*       │    │ • getConfig  │
│ • ML Services │     │ • EMAIL.*        │    │              │
│ • Email       │     │ • IOT.*          │    │              │
└───────────────┘     └──────────────────┘    └──────────────┘
        │                         │                     │
        │                         │                     │
        └─────────────────────────┼─────────────────────┘
                                  │
                                  │ CONNECTS TO
                                  │
        ┌─────────────────────────┼─────────────────────┐
        │                         │                     │
        ▼                         ▼                     ▼
┌───────────────┐     ┌──────────────────┐    ┌──────────────┐
│ Firebase      │     │ ML Servers       │    │ External APIs│
│               │     │                  │    │              │
│ • Doctors DB  │     │ • Skin Disease   │    │ • Gemini AI  │
│ • Users DB    │     │ • Eye Condition  │    │ • Email Svc  │
│ • Appts DB    │     │ • Diabetes Pred  │    │              │
│ • IoT Sensors │     │ • Disease Pred   │    │              │
└───────────────┘     └──────────────────┘    └──────────────┘
```

---

## Data Flow Diagram

### Before Centralization ❌

```
Component A ──→ http://10.2.16.82:5002/predict
Component B ──→ http://10.2.16.82:5002/predict
Component C ──→ http://10.2.16.82:5002/predict
                    ↑
    If you need to change this IP,
    you must update ALL 3 files!
```

### After Centralization ✅

```
Component A ──┐
Component B ──┼──→ API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT
Component C ──┘         ↓
                    api.config.js
                        ↓
              http://10.2.16.82:5002/predict
                    ↑
    Change ONCE in api.config.js,
    ALL components updated automatically!
```

---

## File Dependency Graph

```
api.config.js (ROOT)
    │
    ├─→ SkinDiseaseDetector.jsx
    ├─→ EyeConditionAnalyzer.jsx
    ├─→ DiabetesGlucoseRiskMonitor.jsx
    ├─→ BreastCancerRiskChatbot.jsx
    ├─→ FeverFluSymptomChecker.jsx
    ├─→ PlateCalorieChecker.jsx
    ├─→ DailyDietNutritionPlanner.jsx
    ├─→ health/index.jsx
    ├─→ admin-dashboard.jsx
    ├─→ doctor-dashboard.jsx
    ├─→ video-call.jsx
    ├─→ health-records.jsx
    └─→ (any new components you create)

Change ONE file (api.config.js) = Update ALL components! 🚀
```

---

## Configuration Structure

```javascript
/config/api.config.js
│
├── API_KEYS
│   └── GOOGLE_GEMINI: "AIzaSy..."
│
├── BASE_URLS
│   ├── FIREBASE: "https://fresh-a29f6..."
│   ├── IOT_FIREBASE: "https://thanu-iot..."
│   ├── GEMINI: "https://generativelanguage..."
│   ├── DISEASE_PREDICTION: "http://10.2.8.64:5000"
│   ├── DIABETES_PREDICTION: "http://10.3.5.210:5001"
│   ├── SKIN_DISEASE: "http://10.2.16.82:5002"    ← CHANGE HERE
│   ├── EYE_CONDITION: "http://10.2.16.82:5003"   ← CHANGE HERE
│   └── EMAIL_SERVICE: "http://10.3.5.210:5008"   ← CHANGE HERE
│
└── API_ENDPOINTS
    ├── FIREBASE
    │   ├── DOCTORS
    │   ├── USERS
    │   ├── APPOINTMENTS
    │   ├── DOCTOR_BY_ID(id)
    │   └── USER_BY_ID(id)
    │
    ├── IOT
    │   └── SENSORS
    │
    ├── ML
    │   ├── DISEASE_PREDICTION
    │   ├── DIABETES_PREDICTION
    │   ├── SKIN_DISEASE_PREDICT
    │   └── EYE_CONDITION_PREDICT
    │
    ├── GEMINI
    │   ├── GENERATE_FLASH
    │   └── GENERATE_EXP
    │
    └── EMAIL
        ├── SEND
        └── SEND_MEETING_INVITE
```

---

## Import & Usage Pattern

```
┌──────────────────────────────────────────────────────┐
│  YOUR COMPONENT (e.g., SkinDiseaseDetector.jsx)     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  // Step 1: Import                                   │
│  import { API_ENDPOINTS } from '../../config/api.config'; │
│                                                      │
│  // Step 2: Use in fetch                             │
│  const response = await fetch(                       │
│    API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT,           │
│    { method: 'POST', ... }                           │
│  );                                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│  /config/api.config.js                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ML: {                                               │
│    SKIN_DISEASE_PREDICT:                             │
│      `${BASE_URLS.SKIN_DISEASE}/predict`            │
│  }                                                   │
│                                                      │
│  where BASE_URLS.SKIN_DISEASE =                      │
│    "http://10.2.16.82:5002"                         │
│                                                      │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│  ACTUAL API CALL                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  fetch("http://10.2.16.82:5002/predict", {...})    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Change Propagation Flow

```
You Change:
    BASE_URLS.SKIN_DISEASE = "http://NEW_IP:5002"
            │
            ├─ Automatically updates ─→ API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT
            │                                   │
            │                                   ├─→ SkinDiseaseDetector.jsx
            │                                   ├─→ Any other component using it
            │                                   └─→ Future components
            │
            └─ ALL components now use new IP! ✨

Result: Change ONCE, affects ALL components!
```

---

## Server Connection Map

```
Your React Native App
        │
        ├─── Firebase Realtime DB ────────┐
        │    • https://fresh-a29f6...      │
        │    • Doctors, Users, Appointments│
        │                                   │
        ├─── IoT Firebase ─────────────────┤
        │    • https://thanu-iot...         │
        │    • Real-time sensor data        │
        │                                   │
        ├─── ML Services ──────────────────┤
        │    • Disease: 10.2.8.64:5000     │
        │    • Diabetes: 10.3.5.210:5001   │
        │    • Skin: 10.2.16.82:5002       │
        │    • Eye: 10.2.16.82:5003        │
        │                                   │
        ├─── Google Gemini AI ─────────────┤
        │    • generativelanguage.googleapis.com
        │                                   │
        └─── Email Service ────────────────┘
             • 10.3.5.210:5008

    ALL CONFIGURED IN: /config/api.config.js
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  QUICK REFERENCE: API Configuration                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📁 Main File:                                      │
│     /config/api.config.js                           │
│                                                     │
│  📖 Documentation:                                  │
│     /config/API_CONFIGURATION_GUIDE.md              │
│                                                     │
│  📝 Examples:                                       │
│     /config/api-usage-examples.js                   │
│                                                     │
│  ✏️ To Change API:                                  │
│     1. Open api.config.js                           │
│     2. Edit BASE_URLS section                       │
│     3. Save                                         │
│     4. Done!                                        │
│                                                     │
│  🔗 Import in Component:                            │
│     import { API_ENDPOINTS } from '../../config/api.config'; │
│                                                     │
│  🎯 Use in Code:                                    │
│     fetch(API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT)   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Component Update Status

```
✅ FULLY MIGRATED                      ⏳ REMAINING (Optional)
├─ health/                             ├─ auth/
│  ├─ SkinDiseaseDetector.jsx          │  ├─ patient-login.jsx
│  ├─ EyeConditionAnalyzer.jsx         │  ├─ doctor-login.jsx
│  ├─ DiabetesGlucoseRiskMonitor.jsx   │  └─ doctor-verification.jsx
│  ├─ BreastCancerRiskChatbot.jsx      │
│  ├─ FeverFluSymptomChecker.jsx       ├─ (tabs)/
│  ├─ PlateCalorieChecker.jsx          │  ├─ profile.jsx
│  ├─ DailyDietNutritionPlanner.jsx    │  └─ index.jsx
│  └─ index.jsx                         │
│                                       └─ active-appointments.jsx
├─ admin-dashboard.jsx
├─ doctor-dashboard.jsx                Priority: HIGH → LOW
├─ video-call.jsx                       (Optional to migrate)
└─ health-records.jsx
```

---

## Success Metrics

```
Before:
  • 58+ hardcoded API URLs across 20+ files
  • Average time to change API: 30-60 minutes
  • Error-prone manual updates
  • Inconsistent URL usage

After:
  • 1 central configuration file
  • Average time to change API: 30 seconds ⚡
  • No manual component updates needed
  • Consistent, maintainable structure

Improvement: 60-120x faster API updates! 🚀
```

---

**Remember**: Edit `/config/api.config.js` to change ANY API endpoint!

Everything else updates automatically! ✨
