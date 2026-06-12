import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { API_ENDPOINTS } from "../config/api.config";

const { width, height } = Dimensions.get("window");

// Try importing Zego
let ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG;
let isZegoAvailable = false;

try {
  const ZegoImports = require("@zegocloud/zego-uikit-prebuilt-call-rn");
  ZegoUIKitPrebuiltCall = ZegoImports.ZegoUIKitPrebuiltCall;
  ONE_ON_ONE_VIDEO_CALL_CONFIG = ZegoImports.ONE_ON_ONE_VIDEO_CALL_CONFIG;
  isZegoAvailable = true;
} catch (error) {
  console.log("Zego not available:", error.message);
}

export default function VideoCall() {
  const router = useRouter();
  const { roomId, userName, userId } = useLocalSearchParams();
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);
  const [firebaseData, setFirebaseData] = useState(null);
  const [isToggling, setIsToggling] = useState(false); // Prevent rapid toggles

  // Simple toggle function with debugging and debouncing
  const toggleHealthDashboard = useCallback(() => {
    if (isToggling) {
      console.log("Toggle ignored - already toggling");
      return;
    }

    setIsToggling(true);
    console.log("Toggle clicked, current state:", showHealthDashboard);
    setShowHealthDashboard((prev) => {
      const newState = !prev;
      console.log("Setting new state:", newState);
      return newState;
    });

    // Reset toggle flag after a short delay
    setTimeout(() => {
      setIsToggling(false);
    }, 500);
  }, [isToggling, showHealthDashboard]);

  // Draggable small video position
  const translateX = useSharedValue(width - 140); // Start at right side
  const translateY = useSharedValue(height - 200); // Start at bottom

  // TODO: Replace with your new Zego credentials
  const yourAppID = 192646607; // Replace with your new App ID
  const yourAppSign =
    "c154de456f2685fe3464c8432769ac9ef9af39df07e6be90578adea60a36d660"; // Replace with your new App Sign

  const callID = roomId;
  const displayName = userName;
  const userIdentifier = userId;

  // Vital readings state (simplified version of health records)
  const [vitalReadings, setVitalReadings] = useState({
    temperature: {
      current: 0,
      unit: "°F",
      status: "Loading...",
      color: "#FF6B6B",
    },
    heartRate: {
      current: 0,
      unit: "BPM",
      status: "Loading...",
      color: "#4ECDC4",
    },
    bloodPressure: {
      systolic: 120,
      diastolic: 80,
      status: "Normal",
      color: "#45B7D1",
    },
    humidity: {
      current: 0,
      unit: "%",
      status: "Loading...",
      color: "#96CEB4",
    },
  });

  useEffect(() => {
    fetchFirebaseData();
    const interval = setInterval(fetchFirebaseData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data from Firebase Realtime Database
  const fetchFirebaseData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.IOT.SENSORS);
      const data = await response.json();

      if (data) {
        setFirebaseData(data);
        updateVitalReadings(data);
      }
    } catch (error) {
      console.error("Error fetching Firebase data:", error);
    }
  };

  // Update vital readings with Firebase data
  const updateVitalReadings = (data) => {
    setVitalReadings((prev) => ({
      temperature: {
        ...prev.temperature,
        current: data.dht_temp || 0,
        status: getTemperatureStatus(data.dht_temp),
      },
      heartRate: {
        ...prev.heartRate,
        current: data.pulse || 0,
        status: getHeartRateStatus(data.pulse),
      },
      bloodPressure: {
        ...prev.bloodPressure,
      },
      humidity: {
        ...prev.humidity,
        current: data.humidity || 0,
        status: getHumidityStatus(data.humidity),
      },
    }));
  };

  // Status determination functions
  const getTemperatureStatus = (temp) => {
    if (temp < 97.0) return "Low";
    if (temp > 100.4) return "Fever";
    if (temp > 99.5) return "Elevated";
    return "Normal";
  };

  const getHeartRateStatus = (bpm) => {
    if (bpm < 60) return "Low";
    if (bpm > 100) return "High";
    return "Normal";
  };

  const getHumidityStatus = (humidity) => {
    if (humidity < 30) return "Dry";
    if (humidity > 70) return "Humid";
    return "Normal";
  };

  // Gesture handler for draggable small video
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.translateX = translateX.value;
      context.translateY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.translateX + event.translationX;
      translateY.value = context.translateY + event.translationY;
    },
    onEnd: () => {
      // Keep within screen bounds
      translateX.value = withSpring(
        Math.max(10, Math.min(width - 130, translateX.value)),
      );
      translateY.value = withSpring(
        Math.max(60, Math.min(height - 180, translateY.value)),
      );
    },
  });

  // Animated style for small video
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const renderMiniVital = (title, data, icon) => (
    <View style={styles.miniVitalCard}>
      <View style={styles.miniVitalHeader}>
        <MaterialIcons name={icon} size={16} color={data.color} />
        <Text style={styles.miniVitalTitle}>{title}</Text>
      </View>
      <View style={styles.miniVitalContent}>
        {title === "Blood Pressure" ? (
          <Text style={[styles.miniVitalValue, { color: data.color }]}>
            {data.systolic}/{data.diastolic}
          </Text>
        ) : (
          <Text style={[styles.miniVitalValue, { color: data.color }]}>
            {data.current}
          </Text>
        )}
        <Text style={styles.miniVitalUnit}>
          {title === "Blood Pressure" ? "mmHg" : data.unit}
        </Text>
      </View>
      <Text style={[styles.miniVitalStatus, { color: data.color }]}>
        {data.status}
      </Text>
    </View>
  );

  const HealthDashboardOverlay = () => (
    <Modal
      visible={showHealthDashboard}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {}}
      hardwareAccelerated={true}
    >
      <View style={styles.overlayContainer}>
        <View style={styles.dashboardOverlay}>
          <LinearGradient
            colors={["#F8FAFC", "#EDF2F7"]}
            style={styles.overlayGradient}
          >
            {/* Overlay Header */}
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Live Health Monitoring</Text>
              <View style={styles.overlayControls}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <TouchableOpacity
                  onPress={toggleHealthDashboard}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Connection Status */}
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: firebaseData ? "#10B981" : "#EF4444" },
                ]}
              />
              <Text style={styles.connectionText}>
                {firebaseData ? "Real-time data connected" : "Connection lost"}
              </Text>
            </View>

            {/* Mini Vitals Grid */}
            <ScrollView
              style={styles.overlayContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.miniVitalsGrid}>
                {renderMiniVital(
                  "Heart Rate",
                  vitalReadings.heartRate,
                  "favorite",
                )}
                {renderMiniVital(
                  "Temperature",
                  vitalReadings.temperature,
                  "thermostat",
                )}
                {renderMiniVital(
                  "Blood Pressure",
                  vitalReadings.bloodPressure,
                  "monitor-heart",
                )}
                {renderMiniVital(
                  "Humidity",
                  vitalReadings.humidity,
                  "water-drop",
                )}
              </View>

              {/* Last Update */}
              <View style={styles.lastUpdateContainer}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.lastUpdateText}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  // Validate required parameters
  if (!callID || !displayName || !userIdentifier) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={64} color="#e53e3e" />
        <Text style={styles.errorTitle}>Missing Parameters</Text>
        <Text style={styles.errorText}>
          Room ID, username, and user ID are required.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if credentials are set
  if (!yourAppID || !yourAppSign) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="settings-outline" size={64} color="#f59e0b" />
        <Text style={styles.errorTitle}>Setup Required</Text>
        <Text style={styles.errorText}>
          Please add your Zego App ID and App Sign in video-call.jsx
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isZegoAvailable) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={64} color="#e53e3e" />
        <Text style={styles.errorTitle}>Zego Not Available</Text>
        <Text style={styles.errorText}>
          Video calling requires native build.{"\n"}
          Run: npx expo run:android
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

        {/* Zego Video Call */}
        <ZegoUIKitPrebuiltCall
          appID={yourAppID}
          appSign={yourAppSign}
          userID={userIdentifier}
          userName={displayName}
          callID={callID}
          config={{
            ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
            onCallEnd: (callID, reason, duration) => {
              console.log("Call ended:", { callID, reason, duration });
              router.back();
            },
          }}
        />

        {/* Draggable Small Video Window */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.draggableVideo, animatedStyle]}>
            <View style={styles.smallVideoContainer}>
              <View style={styles.smallVideoPlaceholder}>
                <MaterialIcons name="person" size={30} color="#ffffff" />
              </View>
              <View style={styles.dragHandle}>
                <View style={styles.dragIndicator} />
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>

        {/* Health Records Toggle Button - Floating over video call */}
        <TouchableOpacity
          style={styles.healthToggleButton}
          onPress={toggleHealthDashboard}
          activeOpacity={0.8}
          disabled={isToggling}
          delayPressIn={0}
          delayPressOut={100}
        >
          <LinearGradient
            colors={["#4ECDC4", "#44A08D"]}
            style={styles.toggleGradient}
          >
            <MaterialIcons name="monitor-heart" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Health Dashboard Overlay */}
        <HealthDashboardOverlay />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Health Toggle Button
  healthToggleButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1100, // Higher than draggable video
  },
  toggleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Draggable Video Styles
  draggableVideo: {
    position: "absolute",
    width: 130,
    height: 180,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallVideoContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2C3E50",
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  smallVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#34495E",
  },
  dragHandle: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
  },
  dragIndicator: {
    width: 12,
    height: 2,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    opacity: 0.7,
  },

  // Overlay Styles
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dashboardOverlay: {
    height: height * 0.6, // Takes 60% of screen height
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  overlayGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  // Overlay Header
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  overlayControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#EF4444",
  },
  closeButton: {
    padding: 4,
  },

  // Connection Status
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },

  // Overlay Content
  overlayContent: {
    flex: 1,
  },
  miniVitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  // Mini Vital Cards
  miniVitalCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  miniVitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  miniVitalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 6,
  },
  miniVitalContent: {
    marginBottom: 8,
  },
  miniVitalValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  miniVitalUnit: {
    fontSize: 10,
    color: "#6B7280",
  },
  miniVitalStatus: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Last Update
  lastUpdateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },

  // Original Error Styles (keeping for fallback)
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e53e3e",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
