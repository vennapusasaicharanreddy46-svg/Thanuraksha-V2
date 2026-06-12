# API Configuration Guide

## 📌 Overview

All API endpoints in this application are now centralized in `/config/api.config.js`. This means you only need to update API URLs in **ONE PLACE** instead of manually changing them in every file.

## 🎯 Quick Start

### Changing an API Endpoint

1. Open `/config/api.config.js`
2. Find the `BASE_URLS` section
3. Update the IP address or URL you want to change
4. Save the file - **ALL components will automatically use the new URL!**

### Example: Change Skin Disease Server IP

**Before (in `api.config.js`):**

```javascript
const BASE_URLS = {
  SKIN_DISEASE: "http://10.2.16.82:5002",
};
```

**After:**

```javascript
const BASE_URLS = {
  SKIN_DISEASE: "http://192.168.1.100:5002", // <-- Changed IP address
};
```

**That's it!** All components (SkinDiseaseDetector, etc.) will now use the new IP automatically.

## 📂 What's Centralized?

### 1. **Firebase URLs**

- Doctors database
- User authentication
- Appointments
- Verification data
- IoT sensor data

### 2. **Machine Learning Services**

- Disease Prediction (symptoms → specialist)
- Diabetes Risk Prediction
- Skin Disease Detection
- Eye Condition Analysis

### 3. **Google Gemini AI**

- Breast Cancer Chatbot
- Fever/Flu Symptom Checker
- Plate Calorie Checker
- Diet Nutrition Planner

### 4. **Email Services**

- Verification emails
- Meeting invitations

## 📖 Usage Examples

### In a Component

```javascript
import { API_ENDPOINTS } from "@/config/api.config";

// Fetch doctors from Firebase
const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);

// Use ML prediction service
const result = await fetch(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ symptoms: "fever" }),
});

// Use Gemini AI
const aiResponse = await fetch(API_ENDPOINTS.GEMINI.GENERATE_FLASH, {
  method: "POST",
  body: JSON.stringify({
    /* your request */
  }),
});
```

### Dynamic Endpoints with IDs

```javascript
// Get specific doctor by ID
const doctorId = "doctor123";
const url = API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId);
// Returns: "https://...firebasedatabase.app/doctors/doctor123.json"

// Get specific user
const userId = "user456";
const userUrl = API_ENDPOINTS.FIREBASE.USER_BY_ID(userId);
```

## 🔧 Available Endpoints

### Firebase Endpoints

| Endpoint                                       | Usage                    | Type    |
| ---------------------------------------------- | ------------------------ | ------- |
| `API_ENDPOINTS.FIREBASE.DOCTORS`               | Get all doctors          | Static  |
| `API_ENDPOINTS.FIREBASE.USERS`                 | Get all users            | Static  |
| `API_ENDPOINTS.FIREBASE.APPOINTMENTS`          | Get all appointments     | Static  |
| `API_ENDPOINTS.FIREBASE.VERIFICATION`          | Get verification data    | Static  |
| `API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(id)`      | Get specific doctor      | Dynamic |
| `API_ENDPOINTS.FIREBASE.USER_BY_ID(id)`        | Get specific user        | Dynamic |
| `API_ENDPOINTS.FIREBASE.APPOINTMENT_BY_ID(id)` | Get specific appointment | Dynamic |

### IoT Endpoints

| Endpoint                    | Usage                       |
| --------------------------- | --------------------------- |
| `API_ENDPOINTS.IOT.SENSORS` | Fetch real-time sensor data |

### ML Services

| Endpoint                                 | Usage                            |
| ---------------------------------------- | -------------------------------- |
| `API_ENDPOINTS.ML.DISEASE_PREDICTION`    | Symptom to specialist prediction |
| `API_ENDPOINTS.ML.DIABETES_PREDICTION`   | Diabetes risk assessment         |
| `API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT`  | Skin disease image analysis      |
| `API_ENDPOINTS.ML.EYE_CONDITION_PREDICT` | Eye condition image analysis     |

### Gemini AI

| Endpoint                              | Usage                             |
| ------------------------------------- | --------------------------------- |
| `API_ENDPOINTS.GEMINI.GENERATE_FLASH` | Gemini 2.5 Flash (fast responses) |
| `API_ENDPOINTS.GEMINI.GENERATE_EXP`   | Gemini 2.0 Exp (vision support)   |

### Email Services

| Endpoint                                  | Usage                   |
| ----------------------------------------- | ----------------------- |
| `API_ENDPOINTS.EMAIL.SEND`                | Send verification email |
| `API_ENDPOINTS.EMAIL.SEND_MEETING_INVITE` | Send meeting invitation |

## 🛠️ Helper Functions

### makeApiCall()

Standardized API call with error handling:

```javascript
import { makeApiCall, API_ENDPOINTS } from "@/config/api.config";

try {
  const data = await makeApiCall(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
    method: "POST",
    body: JSON.stringify({ symptoms: "fever" }),
  });
  console.log(data);
} catch (error) {
  console.error("API call failed:", error);
}
```

### updateBaseUrl()

Dynamically change URLs at runtime:

```javascript
import { updateBaseUrl } from "@/config/api.config";

// Switch to production server
updateBaseUrl("SKIN_DISEASE", "https://production-server.com:5002");
```

## 🗺️ File Structure

```
config/
├── api.config.js              ← Main configuration file (UPDATE HERE!)
├── env.js                      ← API keys (for backward compatibility)
└── API_CONFIGURATION_GUIDE.md ← This guide

app/
├── health/
│   ├── SkinDiseaseDetector.jsx    ✅ Uses API_ENDPOINTS
│   ├── EyeConditionAnalyzer.jsx   ✅ Uses API_ENDPOINTS
│   ├── DiabetesGlucoseRiskMonitor.jsx ✅ Uses API_ENDPOINTS
│   └── ... (other health components)
├── admin-dashboard.jsx            ✅ Uses API_ENDPOINTS
├── doctor-dashboard.jsx           ✅ Uses API_ENDPOINTS
└── ... (other components)
```

## ⚙️ Configuration Options

### BASE_URLS Section

```javascript
const BASE_URLS = {
  FIREBASE:
    "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app",
  IOT_FIREBASE:
    "https://thanu-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta/models",

  // Machine Learning Services - CHANGE THESE IPs
  DISEASE_PREDICTION: "http://10.2.8.64:5000", // ← Change this
  DIABETES_PREDICTION: "http://10.3.5.210:5001", // ← Change this
  SKIN_DISEASE: "http://10.2.16.82:5002", // ← Change this
  EYE_CONDITION: "http://10.2.16.82:5003", // ← Change this
  EMAIL_SERVICE: "http://10.3.5.210:5008", // ← Change this
};
```

### API_KEYS Section

```javascript
export const API_KEYS = {
  GOOGLE_GEMINI: process.env.GOOGLE_API_KEY || "YOUR_API_KEY_HERE",
  // Add more API keys as needed
};
```

## 📋 Migration Checklist

If you need to verify which files have been updated:

### ✅ Fully Migrated Components

- [x] `/app/health/SkinDiseaseDetector.jsx`
- [x] `/app/health/EyeConditionAnalyzer.jsx`
- [x] `/app/health/DiabetesGlucoseRiskMonitor.jsx`
- [x] `/app/health/BreastCancerRiskChatbot.jsx`
- [x] `/app/health/FeverFluSymptomChecker.jsx`
- [x] `/app/health/PlateCalorieChecker.jsx`
- [x] `/app/health/index.jsx`
- [x] `/app/admin-dashboard.jsx`
- [x] `/app/doctor-dashboard.jsx` (partially)
- [x] `/app/video-call.jsx`
- [x] `/app/health-records.jsx`

### ⏳ Remaining Files (Low Priority)

These files still have hardcoded URLs but are used less frequently:

- [ ] `/app/auth/patient-login.jsx`
- [ ] `/app/auth/doctor-login.jsx`
- [ ] `/app/auth/doctor-verification.jsx`
- [ ] `/app/(tabs)/profile.jsx`
- [ ] `/app/(tabs)/index.jsx`
- [ ] `/app/active-appointments.jsx`
- [ ] `/app/doctor-profile.jsx`

**To migrate these:** Simply import `API_ENDPOINTS` and replace hardcoded URLs with the appropriate endpoint.

## 🚀 Benefits

### Before Centralization ❌

```
Need to change API:
→ Open 20+ files
→ Search for URLs in each file
→ Manually update each one
→ Hope you didn't miss any
→ Test everything
```

### After Centralization ✅

```
Need to change API:
→ Open api.config.js
→ Update ONE line
→ Save
→ Done! ✨
```

## 🔐 Security Notes

1. **API Keys**: Store sensitive keys in environment variables
2. **Production**: Use HTTPS endpoints in production
3. **Firebase Rules**: Ensure proper security rules are configured
4. **Rate Limiting**: Implement rate limiting for public APIs

## 📞 Common Scenarios

### Scenario 1: New Developer Setup

1. Clone the repository
2. Open `/config/api.config.js`
3. Update IP addresses to match your local ML servers
4. Update Firebase URLs if using a different database
5. Add your Google Gemini API key
6. Start the app - everything works!

### Scenario 2: Production Deployment

1. Open `/config/api.config.js`
2. Change all `http://` to `https://`
3. Update IPs to production server domains
4. Set environment variables for API keys
5. Deploy!

### Scenario 3: Testing New Server

```javascript
// Temporarily change for testing
updateBaseUrl("SKIN_DISEASE", "http://test-server:5002");

// Run your tests

// Change back when done
updateBaseUrl("SKIN_DISEASE", "http://10.2.16.82:5002");
```

## 🐛 Troubleshooting

### Problem: "API call failed" errors

**Solution:**

1. Check if the server is running
2. Verify the IP address in `BASE_URLS`
3. Test connectivity: `ping 10.2.16.82`

### Problem: "Cannot find module '@/config/api.config'"

**Solution:**

- Use relative path: `'../../config/api.config'`
- Or configure path alias in your bundler

### Problem: Old URLs still being used

**Solution:**

- Make sure you imported `API_ENDPOINTS`
- Search for hardcoded URLs: `grep -r "https://fresh-a29f6"`
- Replace with appropriate `API_ENDPOINTS.*` call

## 📚 Additional Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Fetch API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Last Updated:** February 2, 2026

**Questions?** Check the inline comments in `/config/api.config.js` for detailed instructions!
