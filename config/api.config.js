/**
 * Centralized API Configuration
 *
 * This file contains all API endpoints and configurations used throughout the app.
 * To change any API endpoint, simply update the corresponding value here.
 *
 * Usage:
 * import { API_ENDPOINTS, API_KEYS, makeApiCall } from '@/config/api.config';
 *
 * const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
 */

// ===========================================
// API KEYS
// ===========================================
export const API_KEYS = {
  GOOGLE_GEMINI:
    process.env.GOOGLE_API_KEY || "",
  // Add other API keys here as needed
};

// ===========================================
// BASE URLs
// ===========================================
// Machine Learning Server IP - Will be updated from Firebase listener
let ML_SERVER_IP = "10.229.12.246"; // Default fallback

// Helper function to create BASE_URLS with current IP
const createBaseUrls = () => ({
  FIREBASE:
    "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app",
  IOT_FIREBASE:
    "https://thanu-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta/models",

  // Machine Learning Services - All use ML_SERVER_IP with different ports
  DISEASE_PREDICTION: `http://${ML_SERVER_IP}:5009`,
  DIABETES_PREDICTION: `http://${ML_SERVER_IP}:5005`,
  SKIN_DISEASE: `http://${ML_SERVER_IP}:5002`,
  EYE_CONDITION: `http://${ML_SERVER_IP}:5000`,
  EMAIL_SERVICE: `http://${ML_SERVER_IP}:5008`,
});

let BASE_URLS = createBaseUrls();

// Helper function to create API_ENDPOINTS with current BASE_URLS
const createApiEndpoints = () => ({
  // Firebase Realtime Database
  FIREBASE: {
    DOCTORS: `${BASE_URLS.FIREBASE}/doctors.json`,
    VERIFICATION: `${BASE_URLS.FIREBASE}/verification.json`,
    USERS: `${BASE_URLS.FIREBASE}/users.json`,
    USER_DETAILS: `${BASE_URLS.FIREBASE}/user-details`,
    APPOINTMENTS: `${BASE_URLS.FIREBASE}/appointments.json`,
    PRESCRIPTIONS: `${BASE_URLS.FIREBASE}/prescriptions.json`,
    MEDICINE_ORDERS: `${BASE_URLS.FIREBASE}/medicine-orders.json`,

    // Dynamic endpoints (use with ID)
    DOCTOR_BY_ID: (id) => `${BASE_URLS.FIREBASE}/doctors/${id}.json`,
    USER_BY_ID: (id) => `${BASE_URLS.FIREBASE}/users/${id}.json`,
    USER_DETAILS_BY_ID: (id) => `${BASE_URLS.FIREBASE}/user-details/${id}.json`,
    VERIFICATION_BY_ID: (id) => `${BASE_URLS.FIREBASE}/verification/${id}.json`,
    APPOINTMENT_BY_ID: (id) => `${BASE_URLS.FIREBASE}/appointments/${id}.json`,
    PRESCRIPTION_BY_ID: (id) =>
      `${BASE_URLS.FIREBASE}/prescriptions/${id}.json`,
    MEDICINE_ORDER_BY_ID: (id) =>
      `${BASE_URLS.FIREBASE}/medicine-orders/${id}.json`,
  },

  // IoT Firebase
  IOT: {
    SENSORS: `${BASE_URLS.IOT_FIREBASE}/sensors.json`,
  },

  // Google Gemini AI
  GEMINI: {
    GENERATE_CONTENT: (model = "gemini-2.5-flash") =>
      `${BASE_URLS.GEMINI}/${model}:generateContent?key=${API_KEYS.GOOGLE_GEMINI}`,
    GENERATE_FLASH: `${BASE_URLS.GEMINI}/gemini-2.5-flash:generateContent?key=${API_KEYS.GOOGLE_GEMINI}`,
    GENERATE_EXP: `${BASE_URLS.GEMINI}/gemini-2.0-flash-exp:generateContent?key=${API_KEYS.GOOGLE_GEMINI}`,
    GENERATE_LITE: `${BASE_URLS.GEMINI}/gemini-2.0-flash-vision:generateContent?key=${API_KEYS.GOOGLE_GEMINI}`,
  },

  // Machine Learning Prediction Services
  ML: {
    DISEASE_PREDICTION: `${BASE_URLS.DISEASE_PREDICTION}/predict`,
    DIABETES_PREDICTION: `${BASE_URLS.DIABETES_PREDICTION}/predict`,
    SKIN_DISEASE_PREDICT: `${BASE_URLS.SKIN_DISEASE}/predict`,
    SKIN_DISEASE_STATUS: `${BASE_URLS.SKIN_DISEASE}/status`,
    SKIN_DISEASE_BASE: BASE_URLS.SKIN_DISEASE,
    EYE_CONDITION_PREDICT: `${BASE_URLS.EYE_CONDITION}/predict`,
    EYE_CONDITION_STATUS: `${BASE_URLS.EYE_CONDITION}/status`,
    EYE_CONDITION_BASE: BASE_URLS.EYE_CONDITION,
  },

  // Email Service
  EMAIL: {
    SEND: `${BASE_URLS.EMAIL_SERVICE}/send-email`,
    SEND_MEETING_INVITE: `${BASE_URLS.EMAIL_SERVICE}/send-meeting-invite`,
    STATUS: `${BASE_URLS.EMAIL_SERVICE}/`,
  },

  // Flask Backend - Delivery & OTP Service (same as EMAIL_SERVICE)
  DELIVERY: {
    SEND_OTP: `${BASE_URLS.EMAIL_SERVICE}/send-medicine-delivery-otp`,
    WELCOME_EMAIL: `${BASE_URLS.EMAIL_SERVICE}/welcome`,
  },
});

let API_ENDPOINTS = createApiEndpoints();

// ===========================================
// Firebase Listener - Auto-update IP from Firebase (REST API)
// ===========================================
const FIREBASE_DB_URL = "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app";
const IP_CONFIG_PATH = "admin/mlServerConfig/ip.json";

// Fetch IP from Firebase on app start
const fetchMLServerIpFromFirebase = async () => {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/${IP_CONFIG_PATH}`);
    if (response.ok) {
      const newIp = await response.json();
      if (newIp && newIp !== ML_SERVER_IP) {
        ML_SERVER_IP = newIp;
        BASE_URLS = createBaseUrls();
        API_ENDPOINTS = createApiEndpoints();
        console.log("✅ ML Server IP updated from Firebase:", newIp);
      }
    }
  } catch (error) {
    console.warn("⚠️ Firebase IP fetch error:", error.message);
    console.log("Using fallback IP:", ML_SERVER_IP);
  }
};

// Fetch immediately on app load - ONLY ONCE
fetchMLServerIpFromFirebase();

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Make a standardized API call with error handling
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<object>} - The response data
 */
export const makeApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};

/**
 * Get the current configuration for easy access
 */
export const getConfig = () => ({
  apiKeys: API_KEYS,
  endpoints: API_ENDPOINTS,
  baseUrls: BASE_URLS,
});

// Export for re-export in modules
export { API_ENDPOINTS, BASE_URLS, ML_SERVER_IP };

// ===========================================
// CONFIGURATION MANAGEMENT
// ===========================================

/**
 * Update a base URL dynamically
 * Useful for switching between development and production servers
 */
export const updateBaseUrl = (service, newUrl) => {
  if (BASE_URLS[service]) {
    BASE_URLS[service] = newUrl;
    console.log(`Updated ${service} base URL to: ${newUrl}`);
  } else {
    console.warn(`Service ${service} not found in BASE_URLS`);
  }
};

/**
 * Get all available ML service URLs (for connection testing)
 */
export const getMLServiceUrls = () => [
  BASE_URLS.DISEASE_PREDICTION,
  BASE_URLS.DIABETES_PREDICTION,
  BASE_URLS.SKIN_DISEASE,
  BASE_URLS.EYE_CONDITION,
];

// Export for backward compatibility
export const config = {
  GOOGLE_API_KEY: API_KEYS.GOOGLE_GEMINI,
  GEMINI_API_URL: API_ENDPOINTS.GEMINI.GENERATE_FLASH,
};

// ===========================================
// INSTRUCTIONS
// ===========================================
/**
 * HOW TO USE THIS FILE:
 *
 * 1. Import the configuration in your component:
 *    import { API_ENDPOINTS, makeApiCall } from '@/config/api.config';
 *
 * 2. Use the endpoints:
 *    const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
 *
 * 3. For dynamic endpoints with IDs:
 *    const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID('doctor123'));
 *
 * 4. Use the helper function for standardized calls:
 *    const data = await makeApiCall(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
 *      method: 'POST',
 *      body: JSON.stringify({ symptoms: 'fever' })
 *    });
 *
 * 5. To change an IP address or endpoint:
 *    Simply update the BASE_URLS object at the top of this file
 *
 * 6. To add a new endpoint:
 *    Add it to the API_ENDPOINTS object following the existing pattern
 */

export default {
  API_ENDPOINTS,
  API_KEYS,
  makeApiCall,
  getConfig,
  updateBaseUrl,
  getMLServiceUrls,
  config,
};
