# 🔧 API Configuration Files

This folder contains all API endpoint configurations for the Thanu-Raksha application.

## 📁 Files in this Folder

### 1. `api.config.js` ⭐ **MAIN FILE - START HERE**

**This is where you change all API endpoints!**

Contains:

- All API base URLs
- All endpoint configurations
- Helper functions for API calls
- API keys (Google Gemini)

**Quick Example:**

```javascript
// Change Skin Disease Server IP:
const BASE_URLS = {
  SKIN_DISEASE: "http://10.2.16.82:5002", // ← Change this line
};
```

---

### 2. `API_CONFIGURATION_GUIDE.md`

Complete documentation with:

- How to use the API configuration
- All available endpoints
- Troubleshooting tips
- Examples for every use case

**Read this if you want to understand how everything works!**

---

### 3. `api-usage-examples.js`

10 practical code examples:

- Basic fetch calls
- POST requests with body
- Dynamic endpoints with IDs
- React component integration
- Image uploads
- Email services
- And more!

**Copy-paste these examples into your components!**

---

### 4. `env.js` (Legacy)

Old configuration file for backward compatibility.
**Use `api.config.js` instead for new code!**

---

### 5. `emailjs.config.js`

EmailJS configuration (if used).

---

## 🚀 Quick Start

### To Change an API Endpoint:

1. Open `api.config.js`
2. Find the URL you want to change in `BASE_URLS`
3. Update it
4. Save
5. Done! All components will use the new URL automatically.

### To Use in a Component:

```javascript
// Import
import { API_ENDPOINTS } from "../config/api.config";

// Use
const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
```

---

## 📚 What Should I Read?

**If you want to...**

- **Change an API URL** → Open `api.config.js` (30 seconds)
- **Learn how to use it** → Read `API_CONFIGURATION_GUIDE.md` (5 minutes)
- **See code examples** → Check `api-usage-examples.js` (2 minutes)
- **Understand the architecture** → See `/API_ARCHITECTURE_DIAGRAM.md` (3 minutes)

---

## ✅ What's Already Done

✔️ All health components migrated  
✔️ Admin dashboard migrated  
✔️ Doctor dashboard partially migrated  
✔️ Video call and health records migrated  
✔️ Complete documentation created  
✔️ 10+ practical examples provided

---

## 🎯 Available Endpoints

### Firebase

- `API_ENDPOINTS.FIREBASE.DOCTORS` - All doctors
- `API_ENDPOINTS.FIREBASE.USERS` - All users
- `API_ENDPOINTS.FIREBASE.APPOINTMENTS` - All appointments
- `API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(id)` - Specific doctor
- `API_ENDPOINTS.FIREBASE.USER_BY_ID(id)` - Specific user

### Machine Learning

- `API_ENDPOINTS.ML.DISEASE_PREDICTION` - Disease prediction
- `API_ENDPOINTS.ML.DIABETES_PREDICTION` - Diabetes risk
- `API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT` - Skin disease detection
- `API_ENDPOINTS.ML.EYE_CONDITION_PREDICT` - Eye condition analysis

### AI (Google Gemini)

- `API_ENDPOINTS.GEMINI.GENERATE_FLASH` - Fast AI responses
- `API_ENDPOINTS.GEMINI.GENERATE_EXP` - AI with vision support

### Email Services

- `API_ENDPOINTS.EMAIL.SEND` - Send email
- `API_ENDPOINTS.EMAIL.SEND_MEETING_INVITE` - Meeting invites

### IoT

- `API_ENDPOINTS.IOT.SENSORS` - Real-time sensor data

---

## 🔑 Main Takeaway

**Edit `api.config.js` to change ANY API endpoint!**

All components will automatically use the new configuration. No need to manually update multiple files!

---

## 📞 Need Help?

1. Check `api-usage-examples.js` for code samples
2. Read `API_CONFIGURATION_GUIDE.md` for detailed docs
3. Look at how existing components use it (e.g., `SkinDiseaseDetector.jsx`)
4. Check comments in `api.config.js` for inline help

---

**Last Updated:** February 2, 2026  
**Status:** ✅ Fully Implemented and Documented
