/**
 * EXAMPLE: How to use the centralized API configuration
 *
 * This file demonstrates various ways to use the API_ENDPOINTS
 * in your React Native components.
 */

// ============================================
// STEP 1: Import the API configuration
// ============================================

// Option A: Import everything you need
import { API_ENDPOINTS, makeApiCall } from "../config/api.config";

// Option B: Import specific items

// ============================================
// EXAMPLE 1: Basic Fetch Call
// ============================================

const fetchDoctors = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
    const data = await response.json();
    console.log("Doctors:", data);
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
};

// ============================================
// EXAMPLE 2: POST Request with Body
// ============================================

const predictDisease = async (symptoms) => {
  try {
    const response = await fetch(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symptoms: symptoms }),
    });

    const result = await response.json();
    console.log("Prediction:", result);
    return result;
  } catch (error) {
    console.error("Prediction error:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 3: Dynamic Endpoint with ID
// ============================================

const getDoctorById = async (doctorId) => {
  try {
    // The function API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId)
    // generates the full URL with the ID
    const url = API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId);
    const response = await fetch(url);
    const doctor = await response.json();
    return doctor;
  } catch (error) {
    console.error("Error fetching doctor:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 4: Using Helper Function
// ============================================

const predictWithHelper = async (symptoms) => {
  try {
    // makeApiCall handles headers and error checking automatically
    const result = await makeApiCall(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
      method: "POST",
      body: JSON.stringify({ symptoms: symptoms }),
    });

    return result;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 5: React Component Usage
// ============================================

import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ExampleComponent = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
      const data = await response.json();

      if (data) {
        const doctorsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setDoctors(doctorsList);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async () => {
    try {
      const result = await fetch(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: "fever, cough" }),
      });
      const data = await result.json();
      console.log("Prediction result:", data);
    } catch (error) {
      console.error("Prediction failed:", error);
    }
  };

  return (
    <View>
      <Text>Example Component</Text>
      <TouchableOpacity onPress={handlePrediction}>
        <Text>Run Prediction</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// EXAMPLE 6: Update/Delete Operations
// ============================================

const updateDoctor = async (doctorId, updatedData) => {
  try {
    const response = await fetch(
      API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId),
      {
        method: "PATCH", // or 'PUT' for full replacement
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      },
    );

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};

const deleteDoctor = async (doctorId) => {
  try {
    await fetch(API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId), {
      method: "DELETE",
    });
    console.log("Doctor deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 7: Email Service Usage
// ============================================

const sendVerificationEmail = async (email, name, code) => {
  try {
    const response = await fetch(API_ENDPOINTS.EMAIL.SEND, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        name: name,
        verification_code: code,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 8: Gemini AI Usage
// ============================================

const askGemini = async (question) => {
  try {
    const response = await fetch(API_ENDPOINTS.GEMINI.GENERATE_FLASH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: question,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      return answer;
    }

    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 9: IoT Sensor Data
// ============================================

const fetchSensorData = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.IOT.SENSORS);
    const data = await response.json();

    console.log("Temperature:", data.temperature);
    console.log("Heart Rate:", data.heartRate);
    console.log("Blood Pressure:", data.bloodPressure);

    return data;
  } catch (error) {
    console.error("Sensor data fetch error:", error);
    throw error;
  }
};

// ============================================
// EXAMPLE 10: Image Upload (FormData)
// ============================================

const uploadSkinImage = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "skin_image.jpg",
    });

    const response = await fetch(API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
};

// ============================================
// QUICK REFERENCE
// ============================================

/*
 * Common Endpoints:
 *
 * FIREBASE:
 * - API_ENDPOINTS.FIREBASE.DOCTORS
 * - API_ENDPOINTS.FIREBASE.USERS
 * - API_ENDPOINTS.FIREBASE.APPOINTMENTS
 * - API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(id)
 * - API_ENDPOINTS.FIREBASE.USER_BY_ID(id)
 *
 * MACHINE LEARNING:
 * - API_ENDPOINTS.ML.DISEASE_PREDICTION
 * - API_ENDPOINTS.ML.DIABETES_PREDICTION
 * - API_ENDPOINTS.ML.SKIN_DISEASE_PREDICT
 * - API_ENDPOINTS.ML.EYE_CONDITION_PREDICT
 *
 * AI (GEMINI):
 * - API_ENDPOINTS.GEMINI.GENERATE_FLASH
 * - API_ENDPOINTS.GEMINI.GENERATE_EXP
 *
 * EMAIL:
 * - API_ENDPOINTS.EMAIL.SEND
 * - API_ENDPOINTS.EMAIL.SEND_MEETING_INVITE
 *
 * IOT:
 * - API_ENDPOINTS.IOT.SENSORS
 */

export {
    askGemini, deleteDoctor, fetchDoctors, fetchSensorData, getDoctorById, predictDisease, sendVerificationEmail, updateDoctor, uploadSkinImage
};

