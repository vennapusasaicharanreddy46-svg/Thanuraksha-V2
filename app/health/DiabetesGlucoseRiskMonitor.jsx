import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../../config/api.config";

// Conditional import for LinearGradient with fallback
let LinearGradient;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View
      style={[style, { backgroundColor: colors?.[0] || "#4C51BF" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const DiabetesGlucoseRiskMonitor = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    pregnancies: "",
    glucose: "",
    bloodpressure: "",
    skinthickness: "",
    insulin: "",
    bmi: "",
    dpf: "",
    age: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (showResult) {
      // Result animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();

      // Rotate animation for high risk
      if (result?.risk_level === "High") {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ).start();
      }
    }
  }, [showResult, result]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "pregnancies",
      "glucose",
      "bloodpressure",
      "skinthickness",
      "insulin",
      "bmi",
      "dpf",
      "age",
    ];
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        Alert.alert("Validation Error", `Please fill in the ${field} field`);
        return false;
      }
    }
    return true;
  };

  const analyzeRisk = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const requestData = {
        pregnancies: parseFloat(formData.pregnancies),
        glucose: parseFloat(formData.glucose),
        bloodpressure: parseFloat(formData.bloodpressure),
        skinthickness: parseFloat(formData.skinthickness),
        insulin: parseFloat(formData.insulin),
        bmi: parseFloat(formData.bmi),
        dpf: parseFloat(formData.dpf),
        age: parseFloat(formData.age),
      };

      const response = await fetch(API_ENDPOINTS.ML.DIABETES_PREDICTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResult(data);
        setShowResult(true);
        // Reset animations
        scaleAnim.setValue(0);
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      } else {
        throw new Error(data.error || "Prediction failed");
      }
    } catch (error) {
      Alert.alert(
        "Analysis Error",
        error.message || "Failed to analyze diabetes risk.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pregnancies: "",
      glucose: "",
      bloodpressure: "",
      skinthickness: "",
      insulin: "",
      bmi: "",
      dpf: "",
      age: "",
    });
    setResult(null);
    setShowResult(false);
    scaleAnim.setValue(0);
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
  };

  const getRiskAnimation = () => {
    if (!result) return {};

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return {
      transform: [
        { scale: pulseAnim },
        ...(result.risk_level === "High" ? [{ rotate: rotation }] : []),
      ],
    };
  };

  const getRiskColors = () => {
    if (!result) return ["#4C51BF", "#667EEA"];

    return result.risk_level === "High"
      ? ["#F56565", "#E53E3E"]
      : ["#48BB78", "#38A169"];
  };

  const getRiskIcon = () => {
    if (!result) return "analytics";

    return result.risk_level === "High" ? "warning" : "checkmark-circle";
  };

  const formFields = [
    {
      key: "pregnancies",
      label: "Pregnancies",
      placeholder: "Number of pregnancies",
      icon: "person-add",
    },
    {
      key: "glucose",
      label: "Glucose Level",
      placeholder: "mg/dL (70-200)",
      icon: "water",
    },
    {
      key: "bloodpressure",
      label: "Blood Pressure",
      placeholder: "mmHg (60-140)",
      icon: "heart",
    },
    {
      key: "skinthickness",
      label: "Skin Thickness",
      placeholder: "mm (10-50)",
      icon: "body",
    },
    {
      key: "insulin",
      label: "Insulin Level",
      placeholder: "μU/mL (15-276)",
      icon: "medical",
    },
    {
      key: "bmi",
      label: "BMI",
      placeholder: "Body Mass Index (15-50)",
      icon: "fitness",
    },
    {
      key: "dpf",
      label: "Diabetes Pedigree Function",
      placeholder: "0.078-2.42",
      icon: "analytics",
    },
    { key: "age", label: "Age", placeholder: "Years (21-81)", icon: "time" },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <Animated.View
              style={[
                styles.loadingSpinner,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="analytics" size={60} color="white" />
            </Animated.View>
            <Text style={styles.loadingText}>Analyzing Diabetes Risk...</Text>
            <Text style={styles.loadingSubtext}>
              Processing your health data with AI
            </Text>
            <View style={styles.loadingProgress}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[styles.progressFill, { opacity: pulseAnim }]}
                />
              </View>
              <Text style={styles.progressText}>Please wait...</Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#667EEA", "#764BA2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diabetes Risk Monitor</Text>
          <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Animated.View
            style={[
              styles.welcomeSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={["#667EEA", "#764BA2"]}
                style={styles.welcomeGradient}
              >
                <Ionicons name="analytics" size={32} color="white" />
                <Text style={styles.welcomeTitle}>
                  AI Diabetes Risk Assessment
                </Text>
                <Text style={styles.welcomeText}>
                  Enter your health metrics to get an accurate diabetes risk
                  prediction using machine learning
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {!showResult ? (
            <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Health Information</Text>
                <Text style={styles.formSubtitle}>
                  Please provide accurate information for better prediction
                </Text>
                {formFields.map((field, index) => (
                  <Animated.View
                    key={field.key}
                    style={[
                      styles.inputContainer,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, 50 + index * 10],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.inputHeader}>
                      <Ionicons name={field.icon} size={20} color="#667EEA" />
                      <Text style={styles.inputLabel}>{field.label}</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder={field.placeholder}
                      placeholderTextColor="#A0AEC0"
                      value={formData[field.key]}
                      onChangeText={(value) =>
                        handleInputChange(field.key, value)
                      }
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </Animated.View>
                ))}
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={analyzeRisk}
                >
                  <LinearGradient
                    colors={["#667EEA", "#764BA2"]}
                    style={styles.analyzeGradient}
                  >
                    <Ionicons name="analytics" size={24} color="white" />
                    <Text style={styles.analyzeText}>Analyze Risk</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.resultSection,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={getRiskColors()}
                style={styles.resultCard}
              >
                <Animated.View style={[styles.resultIcon, getRiskAnimation()]}>
                  <Ionicons name={getRiskIcon()} size={60} color="white" />
                </Animated.View>
                <Text style={styles.resultTitle}>
                  {result?.prediction || "Analysis Complete"}
                </Text>
                <Text style={styles.resultSubtitle}>
                  Risk Level: {result?.risk_level}
                </Text>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <Text style={styles.confidenceValue}>
                    {result?.confidence_percentage}
                  </Text>
                </View>
                <View style={styles.resultDetails}>
                  <Text style={styles.resultMessage}>{result?.message}</Text>
                </View>
              </LinearGradient>
              {/* Health Metrics Summary */}
              <View style={styles.metricsCard}>
                <Text style={styles.metricsTitle}>📊 Your Health Metrics</Text>
                <View style={styles.metricsGrid}>
                  {result?.input_features &&
                    Object.entries(result.input_features).map(
                      ([key, value]) => (
                        <View key={key} style={styles.metricItem}>
                          <Text style={styles.metricLabel}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Text>
                          <Text style={styles.metricValue}>{value}</Text>
                        </View>
                      ),
                    )}
                </View>
              </View>
              {/* Risk-based Recommendations */}
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsTitle}>
                  {result?.risk_level === "High"
                    ? "⚠️ Important Recommendations"
                    : "✅ Health Tips"}
                </Text>
                {result?.risk_level === "High" ? (
                  <View style={styles.recommendationsList}>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="medical" size={16} color="#E53E3E" />
                      <Text style={styles.recommendationText}>
                        Consult a healthcare professional immediately
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="fitness" size={16} color="#E53E3E" />
                      <Text style={styles.recommendationText}>
                        Start a regular exercise routine
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="nutrition" size={16} color="#E53E3E" />
                      <Text style={styles.recommendationText}>
                        Follow a diabetic-friendly diet
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="time" size={16} color="#E53E3E" />
                      <Text style={styles.recommendationText}>
                        Monitor blood glucose regularly
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.recommendationsList}>
                    <View style={styles.recommendationItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#38A169"
                      />
                      <Text style={styles.recommendationText}>
                        Maintain your healthy lifestyle
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="fitness" size={16} color="#38A169" />
                      <Text style={styles.recommendationText}>
                        Continue regular physical activity
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="nutrition" size={16} color="#38A169" />
                      <Text style={styles.recommendationText}>
                        Keep eating balanced meals
                      </Text>
                    </View>
                    <View style={styles.recommendationItem}>
                      <Ionicons name="heart" size={16} color="#38A169" />
                      <Text style={styles.recommendationText}>
                        Annual health check-ups recommended
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.newTestButton}
                  onPress={resetForm}
                >
                  <LinearGradient
                    colors={["#4299E1", "#3182CE"]}
                    style={styles.newTestGradient}
                  >
                    <Ionicons name="refresh" size={20} color="white" />
                    <Text style={styles.newTestText}>New Test</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                  <LinearGradient
                    colors={["#48BB78", "#38A169"]}
                    style={styles.shareGradient}
                  >
                    <Ionicons name="share" size={20} color="white" />
                    <Text style={styles.shareText}>Share Result</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingSpinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 32,
    textAlign: "center",
  },
  loadingProgress: {
    width: width * 0.7,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeGradient: {
    padding: 24,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2D3748",
    backgroundColor: "#FAFAFA",
  },
  analyzeButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  analyzeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginLeft: 8,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  resultIcon: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  confidenceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
  },
  resultDetails: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },
  resultMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  metricsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  metricItem: {
    width: "50%",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
  },
  recommendationsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 16,
  },
  recommendationsList: {
    space: 12,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: "#4A5568",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  newTestButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  newTestGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  newTestText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  shareButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default DiabetesGlucoseRiskMonitor;
