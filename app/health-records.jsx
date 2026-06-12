import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../config/api.config";

const { width } = Dimensions.get("window");

const HealthRecordsScreen = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [firebaseData, setFirebaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time vital readings from Firebase
  const [vitalReadings, setVitalReadings] = useState({
    temperature: {
      current: 0,
      unit: "°F",
      readings: [],
      times: [],
      status: "Loading...",
      color: "#FF6B6B",
    },
    heartRate: {
      current: 0,
      unit: "Raw_pulse",
      readings: [],
      times: [],
      status: "Loading...",
      color: "#4ECDC4",
    },
    bloodPressure: {
      systolic: 120,
      diastolic: 80,
      readings: [],
      times: [],
      status: "Normal",
      color: "#45B7D1",
    },
    humidity: {
      current: 0,
      unit: "%",
      readings: [],
      times: [],
      status: "Loading...",
      color: "#96CEB4",
    },
  });

  useEffect(() => {
    loadUserInfo();
    fetchFirebaseData();
    // Set up real-time listener
    const interval = setInterval(fetchFirebaseData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem("userSession");
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  // Fetch data from Firebase Realtime Database
  const fetchFirebaseData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.IOT.SENSORS);
      const data = await response.json();

      if (data) {
        console.log("Firebase data:", data);
        setFirebaseData(data);
        updateVitalReadings(data);
      }
    } catch (error) {
      console.error("Error fetching Firebase data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update vital readings with Firebase data
  const updateVitalReadings = (data) => {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setVitalReadings((prev) => ({
      temperature: {
        ...prev.temperature,
        current: data.dht_temp || 0,
        status: getTemperatureStatus(data.dht_temp),
        readings: [
          ...prev.temperature.readings.slice(-6),
          data.dht_temp || 0,
        ],
        times: [...prev.temperature.times.slice(-6), currentTime],
      },
      heartRate: {
        ...prev.heartRate,
        current: data.pulse || 0,
        status: getHeartRateStatus(data.pulse),
        readings: [...prev.heartRate.readings.slice(-6), data.pulse || 0],
        times: [...prev.heartRate.times.slice(-6), currentTime],
      },
      bloodPressure: {
        ...prev.bloodPressure,
        readings: [...prev.bloodPressure.readings.slice(-6), 120], // Keep static for now
        times: [...prev.bloodPressure.times.slice(-6), currentTime],
      },
      humidity: {
        ...prev.humidity,
        current: data.humidity || 0,
        status: getHumidityStatus(data.humidity),
        readings: [...prev.humidity.readings.slice(-6), data.humidity || 0],
        times: [...prev.humidity.times.slice(-6), currentTime],
      },
    }));
  };

  // Status determination functions
  const getTemperatureStatus = (temp) => {
    // Body temperature in Fahrenheit
    if (temp < 97.0) return "Low"; // Below normal body temp
    if (temp > 100.4) return "Fever"; // Fever range
    if (temp > 99.5) return "Elevated"; // Slightly elevated
    return "Normal"; // Normal body temp range
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

  const renderLineChart = (readings, color) => {
    const maxValue = Math.max(...readings);
    const minValue = Math.min(...readings);
    const range = maxValue - minValue || 1;
    const width = 120;
    const height = 50;

    let pathData = "";
    readings.forEach((value, index) => {
      const x = (index / (readings.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      pathData += index === 0 ? `M${x},${y}` : ` L${x},${y}`;
    });

    return (
      <View style={styles.lineChartContainer}>
        <View style={[styles.lineChart, { width, height }]}>
          {readings.map((value, index) => {
            const x = (index / (readings.length - 1)) * width - 2;
            const y = height - ((value - minValue) / range) * height - 2;
            return (
              <View
                key={index}
                style={[
                  styles.linePoint,
                  {
                    left: x,
                    top: y,
                    backgroundColor: color,
                  },
                ]}
              />
            );
          })}
          <View style={[styles.lineConnector, { backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const renderSpeedometer = (value, maxValue, color) => {
    const percentage = (value / maxValue) * 100;
    const rotation = (percentage / 100) * 180 - 90;

    return (
      <View style={styles.speedometerContainer}>
        <View style={styles.speedometerBase}>
          <View
            style={[styles.speedometerFill, { backgroundColor: `${color}20` }]}
          />
          <View
            style={[
              styles.speedometerIndicator,
              {
                backgroundColor: color,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          />
          <View style={styles.speedometerCenter} />
        </View>
        <Text style={[styles.speedometerText, { color }]}>{value}</Text>
      </View>
    );
  };

  const renderWaveChart = (readings, color) => {
    return (
      <View style={styles.waveContainer}>
        {readings.map((value, index) => {
          const height = 10 + (value / 100) * 30;
          return (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height,
                  backgroundColor: color,
                  opacity: 0.6 + index * 0.06,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderCircularProgress = (value, maxValue, color) => {
    const percentage = (value / maxValue) * 100;

    return (
      <View style={styles.circularContainer}>
        <View style={styles.circularBackground}>
          <View
            style={[
              styles.circularProgress,
              {
                borderColor: color,
                transform: [{ rotate: `${percentage * 3.6 - 90}deg` }],
              },
            ]}
          />
        </View>
        <Text style={[styles.circularText, { color }]}>{value}%</Text>
      </View>
    );
  };

  const renderVitalMonitor = (title, data, icon, chartType = "line") => {
    const renderChart = () => {
      switch (chartType) {
        case "speedometer":
          return renderSpeedometer(data.current, 200, data.color);
        case "wave":
          return renderWaveChart(data.readings, data.color);
        case "circular":
          return renderCircularProgress(data.current, 100, data.color);
        default:
          return renderLineChart(data.readings, data.color);
      }
    };

    return (
      <View style={styles.vitalMonitor}>
        <LinearGradient
          colors={[`${data.color}20`, `${data.color}10`]}
          style={styles.monitorGradient}
        >
          <View style={styles.monitorHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={icon} size={24} color={data.color} />
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.vitalTitle}>{title}</Text>
              <Text style={[styles.statusText, { color: data.color }]}>
                {data.status}
              </Text>
            </View>
          </View>

          <View style={styles.readingSection}>
            <View style={styles.currentReading}>
              {title === "Blood Pressure" ? (
                <Text style={styles.readingValue}>
                  {data.systolic}
                  <Text style={styles.separator}>/</Text>
                  {data.diastolic}
                </Text>
              ) : (
                <Text style={styles.readingValue}>{data.current}</Text>
              )}
              <Text style={styles.unitText}>
                {title === "Blood Pressure" ? "mmHg" : data.unit}
              </Text>
            </View>

            <View style={styles.chartSection}>{renderChart()}</View>
          </View>

          <View style={styles.trendIndicator}>
            <View style={styles.trendDots}>
              {data.readings.slice(-3).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.trendDot,
                    {
                      backgroundColor: data.color,
                      opacity: 0.3 + index * 0.35,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.trendText}>Last 7 readings</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      {/* Header */}
      <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Vital Monitoring</Text>
          <Text style={styles.headerSubtitle}>Real-time health analytics</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={fetchFirebaseData}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Firebase Connection Status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: firebaseData ? "#10B981" : "#EF4444" },
          ]}
        />
        <Text style={styles.statusText}>
          {isLoading
            ? "Connecting..."
            : firebaseData
              ? "Live Data Connected"
              : "Connection Lost"}
        </Text>
        {firebaseData && (
          <Text style={styles.statusDetail}>
            Last update: {new Date().toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Single Dashboard Card */}
        <View style={styles.dashboardSection}>
          <View style={styles.dashboardCard}>
            <LinearGradient
              colors={["#F8FAFC", "#EDF2F7"]}
              style={styles.dashboardGradient}
            >
              {/* Dashboard Header */}
              <View style={styles.dashboardHeader}>
                <Text style={styles.dashboardTitle}>Health Dashboard</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              {/* Vitals Grid - 2x2 Layout */}
              <View style={styles.vitalsGrid}>
                {/* Heart Rate - Top Left */}
                <View style={styles.vitalQuadrant}>
                  <View style={styles.quadrantHeader}>
                    <MaterialIcons
                      name="favorite"
                      size={20}
                      color={vitalReadings.heartRate.color}
                    />
                    <Text style={styles.quadrantTitle}>Heart Rate</Text>
                  </View>
                  <Text
                    style={[
                      styles.quadrantValue,
                      { color: vitalReadings.heartRate.color },
                    ]}
                  >
                    {vitalReadings.heartRate.current}
                  </Text>
                  <Text style={styles.quadrantUnit}>
                    {vitalReadings.heartRate.unit}
                  </Text>
                  <View style={styles.miniChart}>
                    {renderLineChart(
                      vitalReadings.heartRate.readings,
                      vitalReadings.heartRate.color,
                    )}
                  </View>
                </View>

                {/* Temperature - Top Right */}
                <View style={styles.vitalQuadrant}>
                  <View style={styles.quadrantHeader}>
                    <MaterialIcons
                      name="thermostat"
                      size={20}
                      color={vitalReadings.temperature.color}
                    />
                    <Text style={styles.quadrantTitle}>Temperature</Text>
                  </View>
                  <Text
                    style={[
                      styles.quadrantValue,
                      { color: vitalReadings.temperature.color },
                    ]}
                  >
                    {vitalReadings.temperature.current}
                  </Text>
                  <Text style={styles.quadrantUnit}>
                    {vitalReadings.temperature.unit}
                  </Text>
                  <View style={styles.miniChart}>
                    {renderSpeedometer(
                      vitalReadings.temperature.current,
                      110,
                      vitalReadings.temperature.color,
                    )}
                  </View>
                </View>

                {/* Blood Pressure - Bottom Left */}
                <View style={styles.vitalQuadrant}>
                  <View style={styles.quadrantHeader}>
                    <MaterialIcons
                      name="monitor-heart"
                      size={20}
                      color={vitalReadings.bloodPressure.color}
                    />
                    <Text style={styles.quadrantTitle}>Blood Pressure</Text>
                  </View>
                  <Text
                    style={[
                      styles.quadrantValue,
                      { color: vitalReadings.bloodPressure.color },
                    ]}
                  >
                    {vitalReadings.bloodPressure.systolic}/
                    {vitalReadings.bloodPressure.diastolic}
                  </Text>
                  <Text style={styles.quadrantUnit}>mmHg</Text>
                  <View style={styles.miniChart}>
                    {renderWaveChart(
                      vitalReadings.bloodPressure.readings,
                      vitalReadings.bloodPressure.color,
                    )}
                  </View>
                </View>

                {/* Humidity - Bottom Right */}
                <View style={styles.vitalQuadrant}>
                  <View style={styles.quadrantHeader}>
                    <MaterialIcons
                      name="water-drop"
                      size={20}
                      color={vitalReadings.humidity.color}
                    />
                    <Text style={styles.quadrantTitle}>Humidity</Text>
                  </View>
                  <Text
                    style={[
                      styles.quadrantValue,
                      { color: vitalReadings.humidity.color },
                    ]}
                  >
                    {vitalReadings.humidity.current}
                  </Text>
                  <Text style={styles.quadrantUnit}>
                    {vitalReadings.humidity.unit}
                  </Text>
                  <View style={styles.miniChart}>
                    {renderCircularProgress(
                      vitalReadings.humidity.current,
                      100,
                      vitalReadings.humidity.color,
                    )}
                  </View>
                </View>
              </View>

              {/* Overall Status */}
              <View style={styles.overallStatus}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.overallStatusText}>
                  All vitals are normal
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statusSection: {
    padding: 20,
    paddingBottom: 10,
  },
  statusGradient: {
    borderRadius: 20,
    padding: 20,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  statusSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4757",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  monitorsSection: {
    padding: 20,
    paddingTop: 10,
  },
  dashboardSection: {
    padding: 20,
    paddingTop: 50,
  },
  dashboardCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dashboardGradient: {
    padding: 20,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  vitalQuadrant: {
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
    minHeight: 140,
  },
  quadrantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quadrantTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  quadrantValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quadrantUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  miniChart: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  overallStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  overallStatusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 8,
  },
  vitalMonitor: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  monitorGradient: {
    padding: 20,
    borderRadius: 20,
  },
  monitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  titleSection: {
    flex: 1,
  },
  vitalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  readingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currentReading: {
    flex: 1,
  },
  readingValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
  },
  separator: {
    fontSize: 24,
    color: "#6B7280",
  },
  unitText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  graphSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  chartSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  // Line Chart Styles
  lineChartContainer: {
    width: 80,
    height: 30,
  },
  lineChart: {
    position: "relative",
  },
  linePoint: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  lineConnector: {
    position: "absolute",
    height: 1,
    width: "100%",
    top: "50%",
    opacity: 0.3,
  },
  // Speedometer Styles
  speedometerContainer: {
    alignItems: "center",
    width: 60,
    height: 60,
  },
  speedometerBase: {
    width: 40,
    height: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  speedometerFill: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  speedometerIndicator: {
    position: "absolute",
    width: 1,
    height: 15,
    bottom: 0,
    left: "50%",
    marginLeft: -0.5,
    transformOrigin: "bottom",
  },
  speedometerCenter: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#374151",
    bottom: -2,
    left: "50%",
    marginLeft: -2,
  },
  speedometerText: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 3,
  },
  // Wave Chart Styles
  waveContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
    width: 70,
    justifyContent: "space-between",
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 8,
  },
  // Circular Progress Styles
  circularContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  circularBackground: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 3,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  circularProgress: {
    position: "absolute",
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    transformOrigin: "center",
  },
  circularText: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "bold",
  },
  graphContainer: {
    width: 120,
    height: 60,
  },
  graphArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    justifyContent: "space-between",
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  graphBar: {
    width: 12,
    borderRadius: 6,
    minHeight: 10,
  },
  trendIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  trendDots: {
    flexDirection: "row",
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  bottomPadding: {
    height: 30,
  },
  // Firebase Connection Status Styles
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  statusDetail: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
});

export default HealthRecordsScreen;
