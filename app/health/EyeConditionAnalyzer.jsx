import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
      style={[style, { backgroundColor: colors?.[0] || "#667eea" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const EyeConditionAnalyzer = () => {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isGettingRecommendations, setIsGettingRecommendations] =
    useState(false);

  // API configuration from centralized config
  const API_URLS = [API_ENDPOINTS.ML.EYE_CONDITION_BASE];

  const [currentApiUrl, setCurrentApiUrl] = useState(
    API_ENDPOINTS.ML.EYE_CONDITION_BASE,
  );

  // Animation refs - these were causing the error
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    // Test connection to backend on component mount
    testConnectionToAvailableServer();

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const testConnectionToAvailableServer = async () => {
    for (const url of API_URLS) {
      console.log(`Testing connection to: ${url}/status`);
      try {
        const response = await fetch(`${url}/status`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          console.log(`✅ Successfully connected to: ${url}`);
          const data = await response.json();
          console.log("Backend response:", data);
          setCurrentApiUrl(url);
          setIsConnected(true);
          return true;
        }
      } catch (error) {
        console.log(`❌ Failed to connect to: ${url}`);
        console.log("Error:", error.message);
      }
    }

    console.log("❌ No API servers are reachable");
    setIsConnected(false);
    return false;
  };

  const testConnection = async () => {
    try {
      console.log("Testing connection to:", `${currentApiUrl}/status`);

      const response = await fetch(`${currentApiUrl}/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Connection response status:", response.status);
      console.log("Connection response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Backend response:", data);
      }

      setIsConnected(response.ok);
      return response.ok;
    } catch (error) {
      console.log("Connection test failed:", error);
      console.log("Error details:", error.message);
      setIsConnected(false);
      return false;
    }
  };

  const requestPermissions = async () => {
    // Request both camera and media library permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      cameraPermission.status !== "granted" ||
      mediaPermission.status !== "granted"
    ) {
      Alert.alert(
        "Permissions needed",
        "Please grant camera and gallery permissions to use this feature.",
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Selected image URI:", result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
        setAnalysisResults(null);
      } else {
        console.log("Image selection was cancelled or failed");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Image Source",
      "Choose how you want to add the eye image",
      [
        { text: "Camera", onPress: () => pickImage("camera") },
        { text: "Gallery", onPress: () => pickImage("gallery") },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const getGeminiRecommendations = async (condition, confidence) => {
    try {
      setIsGettingRecommendations(true);

      const prompt = `As a medical AI assistant, provide detailed precautions and treatment recommendations for a patient diagnosed with "${condition}" with ${confidence}% confidence. 

Please provide:
1. Immediate precautions to take
2. Treatment options available
3. Lifestyle modifications
4. When to seek urgent medical care
5. Long-term management strategies

Format the response as JSON with the following structure:
{
  "precautions": ["precaution1", "precaution2", ...],
  "treatments": ["treatment1", "treatment2", ...],
  "lifestyle": ["lifestyle1", "lifestyle2", ...],
  "urgentCare": ["urgent1", "urgent2", ...],
  "longTerm": ["longterm1", "longterm2", ...]
}

Keep recommendations professional, accurate, and emphasize the importance of consulting healthcare professionals.`;

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
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Gemini API response:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log("Gemini response text:", responseText);

        // Try to parse JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          return recommendations;
        }
      }

      // Fallback if JSON parsing fails
      return {
        precautions: [
          "Consult an eye specialist immediately",
          "Avoid eye strain",
          "Follow prescribed medications",
        ],
        treatments: [
          "Professional medical evaluation required",
          "Treatment plan based on specialist consultation",
        ],
        lifestyle: [
          "Maintain good eye hygiene",
          "Regular eye check-ups",
          "Healthy diet rich in vitamins",
        ],
        urgentCare: [
          "Sudden vision changes",
          "Severe eye pain",
          "Light sensitivity",
        ],
        longTerm: [
          "Regular monitoring",
          "Follow-up appointments",
          "Lifestyle modifications",
        ],
      };
    } catch (error) {
      console.error("Gemini API error:", error);

      // Return fallback recommendations
      return {
        precautions: [
          "Consult an eye specialist immediately",
          "Avoid eye strain",
          "Follow prescribed medications",
        ],
        treatments: [
          "Professional medical evaluation required",
          "Treatment plan based on specialist consultation",
        ],
        lifestyle: [
          "Maintain good eye hygiene",
          "Regular eye check-ups",
          "Healthy diet rich in vitamins",
        ],
        urgentCare: [
          "Sudden vision changes",
          "Severe eye pain",
          "Light sensitivity",
        ],
        longTerm: [
          "Regular monitoring",
          "Follow-up appointments",
          "Lifestyle modifications",
        ],
      };
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an eye image first.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error(
          "Unable to connect to analysis server. Please check your internet connection.",
        );
      }

      // Create FormData for the API request
      const formData = new FormData();
      formData.append("file", {
        uri: selectedImage,
        name: "eye_image.jpg",
        type: "image/jpeg",
      });

      console.log("Sending image URI:", selectedImage);
      console.log("FormData created with file field");
      console.log("Making request to:", `${currentApiUrl}/predict`);

      // Make API call to the eye disease detection server
      const response = await fetch(`${currentApiUrl}/predict`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Prediction response:", data);
      console.log("Prediction:", data.prediction);
      console.log("Confidence:", data.confidence_percentage);

      // Parse confidence_percentage (e.g., "94.56%") to number
      const percent =
        typeof data.confidence_percentage === "string"
          ? parseFloat(data.confidence_percentage.replace("%", ""))
          : data.confidence * 100;

      // Process the API response and update the analysis result
      const processedResult = {
        condition: data.prediction || "Unknown Condition",
        confidence: Math.round(percent || 0),
        details: getConditionDetails(data.prediction),
        recommendations: getRecommendationsForCondition(data.prediction),
        riskLevel: getRiskLevel(data.prediction),
        consultDoctor: shouldConsultDoctor(data.prediction),
        allPredictions: data.all_predictions || {},
      };

      setAnalysisResults(processedResult);

      // Navigate to results screen
      router.push({
        pathname: "/eye-results",
        params: {
          condition: processedResult.condition,
          confidence: processedResult.confidence,
          imageUri: selectedImage.uri,
          details: JSON.stringify(processedResult.details),
          recommendations: JSON.stringify(processedResult.recommendations),
          riskLevel: processedResult.riskLevel,
          consultDoctor: processedResult.consultDoctor,
        },
      });
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert(
        "Analysis Failed",
        "Unable to analyze the image. Please check your internet connection and try again.\n\nError: " +
          error.message,
        [
          { text: "Retry", onPress: () => analyzeImage() },
          { text: "Cancel", style: "cancel" },
        ],
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions for processing API response
  const getConditionDetails = (condition) => {
    const detailsMap = {
      Normal: [
        "Pupil appears normal in size and shape",
        "No visible signs of inflammation",
        "Clear cornea and lens",
        "Normal blood vessel pattern",
      ],
      Cataract: [
        "Clouding detected in the lens area",
        "Reduced transparency affecting vision",
        "May cause glare and light sensitivity",
        "Progressive condition requiring monitoring",
      ],
      "Diabetic Retinopathy": [
        "Changes detected in retinal blood vessels",
        "May indicate diabetes-related complications",
        "Risk of vision impairment if untreated",
        "Regular monitoring essential",
      ],
      Glaucoma: [
        "Possible increased intraocular pressure",
        "Risk of optic nerve damage",
        "May lead to peripheral vision loss",
        "Early intervention is crucial",
      ],
    };
    return detailsMap[condition] || ["Analysis completed using AI detection"];
  };

  const getRecommendationsForCondition = (condition) => {
    const recommendationsMap = {
      Normal: [
        "Continue regular eye check-ups",
        "Maintain good eye hygiene",
        "Use proper lighting when reading",
        "Take breaks from screen time",
      ],
      Cataract: [
        "Schedule an appointment with an ophthalmologist",
        "Consider cataract surgery if vision is significantly affected",
        "Use sunglasses to reduce glare",
        "Regular monitoring of progression",
      ],
      "Diabetic Retinopathy": [
        "Consult an eye specialist immediately",
        "Monitor and control blood sugar levels",
        "Regular diabetic eye exams are essential",
        "Consider laser treatment if recommended",
      ],
      Glaucoma: [
        "See an ophthalmologist for comprehensive eye exam",
        "Regular eye pressure monitoring",
        "Follow prescribed eye drop regimen if diagnosed",
        "Avoid activities that increase eye pressure",
      ],
    };
    return (
      recommendationsMap[condition] || [
        "Consult an eye care professional for proper diagnosis",
      ]
    );
  };

  const getRiskLevel = (condition) => {
    const riskMap = {
      Normal: "Low",
      Cataract: "Medium",
      "Diabetic Retinopathy": "High",
      Glaucoma: "High",
    };
    return riskMap[condition] || "Medium";
  };

  const shouldConsultDoctor = (condition) => {
    return condition !== "Normal";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Eye Condition Analyzer</Text>
            <View style={styles.aiIndicator}>
              <Ionicons name="sparkles" size={16} color="white" />
              <Text style={styles.aiText}>AI</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <Ionicons name="eye" size={40} color="#667eea" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>AI-Powered Eye Analysis</Text>
              <Text style={styles.infoDescription}>
                Upload a clear photo of your eye for AI-based condition
                screening
              </Text>
            </View>
          </View>
          <View style={styles.accuracyBadge}>
            <Text style={styles.accuracyText}>94% Accuracy</Text>
          </View>

          <View style={styles.connectionStatus}>
            <Ionicons
              name={isConnected ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={isConnected ? "#667eea" : "#e74c3c"}
            />
            <Text
              style={[
                styles.connectionText,
                { color: isConnected ? "#667eea" : "#e74c3c" },
              ]}
            >
              {isConnected
                ? `AI Server Connected (${currentApiUrl})`
                : "Connection Issue"}
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={testConnectionToAvailableServer}
            >
              <Ionicons name="refresh" size={14} color="#667eea" />
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Image Upload Section */}
        <Animated.View
          style={[
            styles.uploadSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Upload Eye Image</Text>

          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <LinearGradient
                colors={["#E8F4FD", "#F8F9FF"]}
                style={styles.uploadGradient}
              >
                <Ionicons name="eye" size={60} color="#667eea" />
                <Text style={styles.uploadText}>No image selected</Text>
                <Text style={styles.uploadSubtext}>
                  Take a photo or choose from gallery
                </Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage("camera")}
            >
              <LinearGradient
                colors={["#43e97b", "#38f9d7"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage("gallery")}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="images" size={20} color="white" />
                <Text style={styles.buttonText}>Gallery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Alternative single button with picker options */}
          <TouchableOpacity
            style={styles.quickPickButton}
            onPress={() => showImagePickerOptions()}
          >
            <Ionicons name="add-circle" size={20} color="#667eea" />
            <Text style={styles.quickPickText}>Choose Image Source</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Analysis Button */}
        {selectedImage && (
          <Animated.View
            style={[
              styles.analyzeSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                isAnalyzing && styles.analyzeButtonDisabled,
              ]}
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              <LinearGradient
                colors={
                  isAnalyzing ? ["#BDC3C7", "#95A5A6"] : ["#f093fb", "#f5576c"]
                }
                style={styles.analyzeGradient}
              >
                {isAnalyzing ? (
                  <View style={styles.analyzingContent}>
                    <Animated.View
                      style={[
                        styles.loadingSpinner,
                        {
                          transform: [
                            {
                              rotate: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Ionicons name="refresh" size={24} color="white" />
                    </Animated.View>
                    <Text style={styles.analyzeText}>Analyzing...</Text>
                  </View>
                ) : (
                  <View style={styles.analyzeContent}>
                    <Ionicons name="sparkles" size={24} color="white" />
                    <Text style={styles.analyzeText}>
                      Analyze Eye Condition
                    </Text>
                    <Ionicons name="arrow-forward" size={24} color="white" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Results Section */}
        {analysisResults && (
          <Animated.View
            style={[
              styles.resultsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>Analysis Results</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.conditionInfo}>
                  <Text style={styles.conditionName}>
                    {analysisResults.condition}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <View
                      style={[
                        styles.riskBadge,
                        analysisResults.riskLevel === "Low"
                          ? styles.lowRisk
                          : analysisResults.riskLevel === "Medium"
                            ? styles.mediumRisk
                            : styles.highRisk,
                      ]}
                    >
                      <Text style={styles.riskText}>
                        {analysisResults.riskLevel} Risk
                      </Text>
                    </View>
                    <Text style={styles.confidence}>
                      {analysisResults.confidence}% confidence
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Analysis Details:</Text>
                {analysisResults.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#43e97b"
                    />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>
                  AI-Powered Recommendations:
                </Text>

                {isGettingRecommendations && (
                  <View style={styles.loadingRecommendations}>
                    <Ionicons name="sparkles" size={16} color="#667eea" />
                    <Text style={styles.loadingText}>
                      Getting personalized recommendations...
                    </Text>
                  </View>
                )}

                {analysisResults.recommendations &&
                  !isGettingRecommendations && (
                    <>
                      {/* Immediate Precautions */}
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>
                          <Ionicons
                            name="shield-checkmark"
                            size={16}
                            color="#e74c3c"
                          />{" "}
                          Immediate Precautions
                        </Text>
                        {analysisResults.recommendations.precautions?.map(
                          (precaution, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Ionicons
                                name="alert-circle"
                                size={16}
                                color="#e74c3c"
                              />
                              <Text style={styles.recommendationText}>
                                {precaution}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {/* Treatment Options */}
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>
                          <Ionicons name="medical" size={16} color="#43e97b" />{" "}
                          Treatment Options
                        </Text>
                        {analysisResults.recommendations.treatments?.map(
                          (treatment, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#43e97b"
                              />
                              <Text style={styles.recommendationText}>
                                {treatment}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {/* Lifestyle Modifications */}
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>
                          <Ionicons name="fitness" size={16} color="#667eea" />{" "}
                          Lifestyle Modifications
                        </Text>
                        {analysisResults.recommendations.lifestyle?.map(
                          (lifestyle, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Ionicons
                                name="heart"
                                size={16}
                                color="#667eea"
                              />
                              <Text style={styles.recommendationText}>
                                {lifestyle}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {/* Urgent Care Indicators */}
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>
                          <Ionicons name="warning" size={16} color="#f39c12" />{" "}
                          When to Seek Urgent Care
                        </Text>
                        {analysisResults.recommendations.urgentCare?.map(
                          (urgent, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Ionicons
                                name="warning"
                                size={16}
                                color="#f39c12"
                              />
                              <Text style={styles.recommendationText}>
                                {urgent}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>

                      {/* Long-term Management */}
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>
                          <Ionicons name="calendar" size={16} color="#9b59b6" />{" "}
                          Long-term Management
                        </Text>
                        {analysisResults.recommendations.longTerm?.map(
                          (longTerm, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Ionicons name="time" size={16} color="#9b59b6" />
                              <Text style={styles.recommendationText}>
                                {longTerm}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    </>
                  )}
              </View>

              {analysisResults.consultDoctor && (
                <View style={styles.consultSection}>
                  <LinearGradient
                    colors={["#FF6B6B", "#FF5252"]}
                    style={styles.consultGradient}
                  >
                    <Ionicons name="warning" size={20} color="white" />
                    <Text style={styles.consultText}>
                      Consult a doctor immediately
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Disclaimer */}
        <Animated.View
          style={[
            styles.disclaimer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Ionicons name="information-circle" size={20} color="#7F8C8D" />
          <Text style={styles.disclaimerText}>
            This tool provides preliminary screening only. Always consult with
            an eye care professional for proper diagnosis and treatment.
            Recommendations are AI-generated and should not replace professional
            medical advice.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    position: "relative",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  aiIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    fontSize: 12,
    color: "white",
    marginLeft: 4,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  accuracyBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  accuracyText: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "600",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#667eea",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },
  testButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#667eea",
  },
  uploadSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
    alignItems: "center",
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: width / 2 - 110,
    backgroundColor: "white",
    borderRadius: 12,
  },
  uploadPlaceholder: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  uploadGradient: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8F4FD",
    borderStyle: "dashed",
    borderRadius: 15,
  },
  uploadText: {
    fontSize: 16,
    color: "#667eea",
    fontWeight: "600",
    marginTop: 10,
  },
  uploadSubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 5,
  },
  uploadButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  quickPickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#667eea",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },
  quickPickText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    marginLeft: 8,
  },
  analyzeSection: {
    marginBottom: 20,
  },
  analyzeButton: {
    borderRadius: 15,
    overflow: "hidden",
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeGradient: {
    paddingVertical: 18,
    paddingHorizontal: 25,
  },
  analyzeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    marginRight: 10,
  },
  analyzeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  conditionInfo: {
    alignItems: "center",
  },
  conditionName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 15,
  },
  lowRisk: {
    backgroundColor: "#D4EDDA",
  },
  mediumRisk: {
    backgroundColor: "#FFF3CD",
  },
  highRisk: {
    backgroundColor: "#F8D7DA",
  },
  riskText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E50",
  },
  confidence: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#2C3E50",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 15,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 15,
  },
  loadingRecommendations: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#667eea",
    fontStyle: "italic",
  },
  recommendationCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#2C3E50",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  consultSection: {
    borderRadius: 10,
    overflow: "hidden",
  },
  consultGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  consultText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});

export default EyeConditionAnalyzer;
