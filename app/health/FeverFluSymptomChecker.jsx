import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
      style={[style, { backgroundColor: colors?.[0] || "#6366f1" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const FeverFluSymptomChecker = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const resultsFadeAnim = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const analyzeButtonAnim = useRef(new Animated.Value(1)).current;

  // Form data
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    fever: "",
    cold: "",
    sneezing: "",
    cough: "",
    sore_throat: "",
    headache: "",
    fatigue: "",
    breathing_difficulty: "",
    loss_of_smell_taste: "",
    diarrhea: "",
    symptom_duration_days: "",
    vaccinated: "",
    covid_test_result: "",
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep / (steps.length - 1)) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Animate analyze button
  const animateAnalyzeButton = () => {
    Animated.sequence([
      Animated.timing(analyzeButtonAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(analyzeButtonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Gemini 1.5 Flash API call
  const analyzeSymptoms = async (symptoms) => {
    animateAnalyzeButton();
    setIsLoading(true);

    // Prepare prompt for Gemini (specialist, structured output)
    const prompt = `You are a general specialist. Given the following patient symptoms, provide a list of all possible diagnoses with probability scores (out of 100, distributed across all possibilities) and a brief explanation for each. Format your response as a JSON array named 'possibilities', each with 'condition', 'probability', and 'description'. Symptoms: ${JSON.stringify(symptoms)}`;

    try {
      const response = await fetch(API_ENDPOINTS.GEMINI.GENERATE_FLASH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      let resultText = "";
      if (
        data &&
        data.candidates &&
        data.candidates[0]?.content?.parts[0]?.text
      ) {
        resultText = data.candidates[0].content.parts[0].text;
      } else {
        resultText = "No response from Gemini.";
      }

      // Try to extract JSON from Gemini output robustly
      let possibilities = [];
      let jsonMatch = resultText.match(
        /\{\s*"possibilities"\s*:\s*\[.*?\]\s*\}/s,
      );
      if (!jsonMatch) {
        // Try to match just the array
        let arrMatch = resultText.match(/\[\s*\{.*?\}\s*\]/s);
        if (arrMatch) {
          try {
            possibilities = JSON.parse(arrMatch[0]);
          } catch {}
        }
      } else {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          possibilities = parsed.possibilities || [];
        } catch {}
      }

      // If still not parsed, try full text parse
      if (possibilities.length === 0) {
        try {
          const parsed = JSON.parse(resultText);
          possibilities = parsed.possibilities || [];
        } catch {}
      }

      // Fallback: try to parse lines for scores
      if (possibilities.length === 0) {
        const lines = resultText.split("\n").filter((l) => l.trim());
        for (let line of lines) {
          const match = line.match(/^(.*?)\s*\((\d{1,3})\%\)\s*\:\s*(.*)$/);
          if (match) {
            possibilities.push({
              condition: match[1].trim(),
              probability: parseInt(match[2]),
              description: match[3].trim(),
            });
          }
        }
      }

      setPrediction({
        primary_diagnosis:
          possibilities.length > 0 ? possibilities[0].condition : "See below",
        possibilities,
        recommendations: [],
        severity: "",
        confidence: "",
        riskLevel: "",
        gemini_output: resultText,
      });
    } catch (error) {
      setPrediction({
        primary_diagnosis: "Error",
        possibilities: [],
        recommendations: [],
        severity: "",
        confidence: "",
        riskLevel: "",
        gemini_output: error.message,
      });
    }
    setIsLoading(false);
    setShowResults(true);
    // Start fade-in animation for results
    resultsFadeAnim.setValue(0);
    Animated.timing(resultsFadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const steps = [
    {
      id: "basic_info",
      title: "Basic Information",
      icon: "person-outline",
      color: ["#667eea", "#764ba2"],
      questions: [
        {
          key: "age",
          question: "What is your age?",
          type: "number",
          placeholder: "Enter your age",
        },
        {
          key: "gender",
          question: "What is your gender?",
          type: "select",
          options: ["male", "female", "other"],
        },
      ],
    },
    {
      id: "fever_symptoms",
      title: "Fever & Temperature",
      icon: "thermometer-outline",
      color: ["#fa709a", "#fee140"],
      questions: [
        {
          key: "fever",
          question: "What is your current body temperature?",
          type: "select",
          options: [
            "Normal (98.6°F)",
            "99-100°F",
            "101-102°F",
            "103°F+",
            "Not measured",
          ],
        },
      ],
    },
    {
      id: "respiratory_symptoms",
      title: "Respiratory Symptoms",
      icon: "medical-outline",
      color: ["#4facfe", "#00f2fe"],
      questions: [
        {
          key: "cold",
          question: "Do you have a runny or stuffy nose?",
          type: "boolean",
        },
        {
          key: "sneezing",
          question: "How often are you sneezing?",
          type: "select",
          options: ["none", "occasional", "frequent", "very frequent"],
        },
        {
          key: "cough",
          question: "What type of cough do you have?",
          type: "select",
          options: ["none", "dry cough", "wet cough", "persistent cough"],
        },
      ],
    },
    {
      id: "other_symptoms",
      title: "Other Symptoms",
      icon: "body-outline",
      color: ["#43e97b", "#38f9d7"],
      questions: [
        {
          key: "sore_throat",
          question: "Do you have a sore throat?",
          type: "boolean",
        },
        {
          key: "headache",
          question: "Do you have a headache?",
          type: "boolean",
        },
        {
          key: "fatigue",
          question: "How is your energy level?",
          type: "select",
          options: [
            "normal",
            "mild fatigue",
            "moderate fatigue",
            "severe fatigue",
          ],
        },
      ],
    },
    {
      id: "serious_symptoms",
      title: "Serious Symptoms",
      icon: "warning-outline",
      color: ["#ff6b6b", "#ee5a24"],
      questions: [
        {
          key: "breathing_difficulty",
          question: "Are you having difficulty breathing?",
          type: "boolean",
        },
        {
          key: "loss_of_smell_taste",
          question: "Have you lost sense of smell or taste?",
          type: "boolean",
        },
        {
          key: "diarrhea",
          question: "Do you have diarrhea?",
          type: "boolean",
        },
      ],
    },
    {
      id: "duration_vaccination",
      title: "Duration & Vaccination",
      icon: "time-outline",
      color: ["#a8edea", "#fed6e3"],
      questions: [
        {
          key: "symptom_duration_days",
          question: "How many days have you had these symptoms?",
          type: "number",
          placeholder: "Number of days",
        },
        {
          key: "vaccinated",
          question: "Are you vaccinated against COVID-19?",
          type: "boolean",
        },
        {
          key: "covid_test_result",
          question: "Have you taken a COVID-19 test recently?",
          type: "select",
          options: ["not tested", "positive", "negative", "pending results"],
        },
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      // Restart animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Final step - analyze symptoms
      analyzeSymptoms(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderBooleanQuestion = (question) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.booleanContainer}>
        <TouchableOpacity
          style={[
            styles.booleanOption,
            formData[question.key] === "yes" && styles.booleanOptionActive,
          ]}
          onPress={() => updateFormData(question.key, "yes")}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={formData[question.key] === "yes" ? "white" : "#10b981"}
          />
          <Text
            style={[
              styles.booleanText,
              formData[question.key] === "yes" && styles.booleanTextActive,
            ]}
          >
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.booleanOption,
            formData[question.key] === "no" && styles.booleanOptionActiveNo,
          ]}
          onPress={() => updateFormData(question.key, "no")}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={formData[question.key] === "no" ? "white" : "#ef4444"}
          />
          <Text
            style={[
              styles.booleanText,
              formData[question.key] === "no" && styles.booleanTextActive,
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelectQuestion = (question) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              formData[question.key] === option && styles.optionButtonActive,
            ]}
            onPress={() => updateFormData(question.key, option)}
          >
            <Text
              style={[
                styles.optionText,
                formData[question.key] === option && styles.optionTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNumberQuestion = (question) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.question}</Text>
      <TextInput
        style={styles.numberInput}
        placeholder={question.placeholder}
        placeholderTextColor="#9CA3AF"
        value={formData[question.key]}
        onChangeText={(value) => updateFormData(question.key, value)}
        keyboardType="numeric"
      />
    </View>
  );

  const renderQuestion = (question, index) => {
    return (
      <Animated.View
        key={question.key}
        style={[
          styles.questionWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {question.type === "boolean" && renderBooleanQuestion(question)}
        {question.type === "select" && renderSelectQuestion(question)}
        {question.type === "number" && renderNumberQuestion(question)}
      </Animated.View>
    );
  };

  const renderResults = () => (
    <Animated.View
      style={[styles.resultsContainer, { opacity: resultsFadeAnim }]}
    >
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.resultsHeader}
      >
        <Ionicons name="medical" size={32} color="white" />
        <Text style={styles.resultsTitle}>Analysis Complete</Text>
        <Text style={styles.resultsSubtitle}>Based on your symptoms</Text>
      </LinearGradient>

      <View style={styles.diagnosisContainer}>
        <Text style={styles.primaryDiagnosis}>
          Primary Assessment: {prediction?.primary_diagnosis}
        </Text>

        <Text style={styles.sectionTitle}>Possibilities:</Text>
        {prediction?.possibilities.map((item, index) => (
          <View key={index} style={styles.possibilityItem}>
            <View style={styles.possibilityHeader}>
              <Text style={styles.conditionName}>{item.condition}</Text>
              <View
                style={[
                  styles.probabilityBadge,
                  {
                    backgroundColor:
                      item.probability > 50
                        ? "#ef4444"
                        : item.probability > 20
                          ? "#f59e0b"
                          : "#10b981",
                  },
                ]}
              >
                <Text style={styles.probabilityText}>{item.probability}%</Text>
              </View>
            </View>
            <Text style={styles.conditionDescription}>{item.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recommendations:</Text>
        {prediction?.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons
              name={rec.icon || "checkmark-circle"}
              size={20}
              color="#10b981"
            />
            <Text style={styles.recommendationText}>{rec.text}</Text>
          </View>
        ))}

        <View
          style={[
            styles.severityContainer,
            {
              backgroundColor:
                prediction?.severity === "high" ? "#fee2e2" : "#fef3c7",
            },
          ]}
        >
          <Ionicons
            name={
              prediction?.severity === "high" ? "warning" : "information-circle"
            }
            size={24}
            color={prediction?.severity === "high" ? "#dc2626" : "#d97706"}
          />
          <Text
            style={[
              styles.severityText,
              {
                color: prediction?.severity === "high" ? "#dc2626" : "#d97706",
              },
            ]}
          >
            {prediction?.severity === "high"
              ? "High Priority - Seek immediate medical attention"
              : "Moderate - Monitor symptoms and rest"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.restartButton}
        onPress={() => {
          setShowResults(false);
          setCurrentStep(0);
          setFormData({
            age: "",
            gender: "",
            fever: "",
            cold: "",
            sneezing: "",
            cough: "",
            sore_throat: "",
            headache: "",
            fatigue: "",
            breathing_difficulty: "",
            loss_of_smell_taste: "",
            diarrhea: "",
            symptom_duration_days: "",
            vaccinated: "",
            covid_test_result: "",
          });
        }}
      >
        <LinearGradient
          colors={["#10b981", "#34d399"]}
          style={styles.restartButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.restartButtonText}>New Assessment</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.loadingCard}
      >
        <View style={styles.loadingIconContainer}>
          <ActivityIndicator size="large" color="white" />
          <Ionicons
            name="medical"
            size={32}
            color="rgba(255,255,255,0.7)"
            style={styles.loadingIcon}
          />
        </View>
        <Text style={styles.loadingText}>Analyzing your symptoms...</Text>
        <Text style={styles.loadingSubtext}>
          AI is processing your health data
        </Text>
        <View style={styles.loadingProgress}>
          <View style={styles.loadingProgressBar} />
        </View>
      </LinearGradient>
    </View>
  );

  // Show engaging waiting animation/message while loading Gemini response
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.loadingCard}
          >
            <View style={styles.loadingIconContainer}>
              <Ionicons
                name="sparkles"
                size={32}
                color="rgba(255,255,255,0.7)"
                style={styles.loadingIcon}
              />
            </View>
            <Text style={styles.loadingText}>Analyzing your symptoms...</Text>
            <Text style={styles.loadingSubtext}>
              AI is processing your health data
            </Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderResults()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <View style={styles.titleContainer}>
              <Ionicons
                name="medical"
                size={28}
                color="white"
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitleText}>Fever & Flu Checker</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((currentStep / (steps.length - 1)) * 100)}% Complete
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.stepContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Step Header */}
          <LinearGradient
            colors={currentStepData.color}
            style={styles.stepHeader}
          >
            <Ionicons name={currentStepData.icon} size={32} color="white" />
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          </LinearGradient>

          {/* Questions */}
          <View style={styles.questionsContainer}>
            {currentStepData.questions.map((question, index) =>
              renderQuestion(question, index),
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Enhanced Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <LinearGradient
              colors={["#f3f4f6", "#e5e7eb"]}
              style={styles.previousButtonGradient}
            >
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
              <Text style={styles.previousButtonText}>Previous</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Animated.View style={{ transform: [{ scale: analyzeButtonAnim }] }}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === steps.length - 1 && styles.analyzeButton,
            ]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={
                currentStep === steps.length - 1
                  ? ["#10b981", "#34d399"]
                  : currentStepData.color
              }
              style={[
                styles.nextButtonGradient,
                currentStep === steps.length - 1 &&
                  styles.analyzeButtonGradient,
              ]}
            >
              {currentStep === steps.length - 1 && (
                <View style={styles.analyzeIconContainer}>
                  <Ionicons name="sparkles" size={18} color="white" />
                </View>
              )}
              <Text
                style={[
                  styles.nextButtonText,
                  currentStep === steps.length - 1 && styles.analyzeButtonText,
                ]}
              >
                {currentStep === steps.length - 1 ? "Analyze Symptoms" : "Next"}
              </Text>
              <Ionicons
                name={
                  currentStep === steps.length - 1
                    ? "medical"
                    : "chevron-forward"
                }
                size={20}
                color="white"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    marginRight: 4,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#667eea",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepHeader: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 12,
    textAlign: "center",
  },
  questionsContainer: {
    gap: 24,
  },
  questionWrapper: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  questionContainer: {
    gap: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 24,
  },
  booleanContainer: {
    flexDirection: "row",
    gap: 12,
  },
  booleanOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  booleanOptionActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  booleanOptionActiveNo: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  booleanText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  booleanTextActive: {
    color: "white",
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  optionButtonActive: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  optionTextActive: {
    color: "white",
  },
  numberInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  previousButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  previousButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  nextButton: {
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 160,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  analyzeButton: {
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
  },
  analyzeButtonGradient: {
    padding: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: "bold",
  },
  analyzeIconContainer: {
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    padding: 48,
    borderRadius: 24,
    alignItems: "center",
    width: width * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingIconContainer: {
    position: "relative",
    marginBottom: 24,
  },
  loadingIcon: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  loadingText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 24,
  },
  loadingProgress: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingProgressBar: {
    width: "70%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  resultsContainer: {
    padding: 20,
  },
  resultsHeader: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 12,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  diagnosisContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryDiagnosis: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 12,
  },
  possibilityItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  possibilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  probabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  conditionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  severityContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  severityText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  restartButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  restartButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});

export default FeverFluSymptomChecker;
