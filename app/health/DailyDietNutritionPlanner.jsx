import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
      style={[style, { backgroundColor: colors?.[0] || "#10B981" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const DailyDietNutritionPlanner = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    weight: "",
    height: "",
    diet_preference: "Vegetarian",
    activity_level: "Moderate",
    weekly_activity: "3",
    disease: "None",
    allergies: "None",
    health_goal: "Maintenance",
  });

  const genderOptions = ["Male", "Female"];
  const dietOptions = [
    "Non-Vegetarian",
    "Vegetarian",
    "Vegan",
    "Plant-Based",
    "Mediterranean",
    "Keto",
    "Paleo",
    "Low-Carb",
    "Gluten-Free",
    "Pescatarian",
    "Flexitarian",
  ];
  const activityOptions = [
    "Sedentary",
    "Light",
    "Moderate",
    "Active",
    "Very Active",
  ];
  const diseaseOptions = [
    "None",
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "GERD",
    "IBS",
    "Celiac",
    "Obesity",
    "Thyroid",
    "Iron Deficiency",
    "B12 Deficiency",
  ];
  const allergyOptions = [
    "None",
    "Peanuts",
    "Tree Nuts",
    "Milk",
    "Eggs",
    "Soy",
    "Fish",
    "Shellfish",
    "Wheat",
    "Multiple",
  ];
  const goalOptions = [
    "Weight Loss",
    "Maintenance",
    "Weight Gain",
    "Muscle Gain",
    "Better Health",
    "Athletic Performance",
  ];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.age && formData.weight && formData.height;
      case 2:
        return formData.gender && formData.diet_preference;
      case 3:
        return formData.activity_level && formData.weekly_activity;
      case 4:
        return formData.disease && formData.allergies && formData.health_goal;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        submitForm();
      }
    } else {
      Alert.alert(
        "Incomplete Form",
        "Please fill in all required fields before proceeding.",
      );
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = async () => {
    setIsLoading(true);
    try {
      // Calculate BMI
      const heightInMeters = parseFloat(formData.height) / 100;
      const bmi = (
        parseFloat(formData.weight) /
        (heightInMeters * heightInMeters)
      ).toFixed(1);

      // Create detailed prompt for Gemini
      const prompt = `You are an expert nutritionist and dietitian. Create a personalized daily diet and nutrition plan based on the following information:

**User Profile:**
- Age: ${formData.age} years
- Gender: ${formData.gender}
- Weight: ${formData.weight} kg
- Height: ${formData.height} cm
- BMI: ${bmi}
- Diet Preference: ${formData.diet_preference}
- Activity Level: ${formData.activity_level}
- Weekly Exercise: ${formData.weekly_activity} days/week
- Health Condition: ${formData.disease}
- Allergies: ${formData.allergies}
- Health Goal: ${formData.health_goal}

Provide a comprehensive, realistic, and practical nutrition plan. Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "success": true,
  "daily_calories": <number>,
  "bmi": "<number>",
  "bmi_category": "<Underweight/Normal/Overweight/Obese>",
  "macros": {
    "protein": "<number>g",
    "carbs": "<number>g",
    "fats": "<number>g",
    "fiber": "<number>g"
  },
  "meal_plan": {
    "breakfast": {
      "time": "7:00 AM - 8:00 AM",
      "items": ["<item 1>", "<item 2>", "<item 3>"],
      "calories": <number>,
      "description": "<brief description>"
    },
    "mid_morning": {
      "time": "10:00 AM - 11:00 AM",
      "items": ["<item 1>", "<item 2>"],
      "calories": <number>,
      "description": "<brief description>"
    },
    "lunch": {
      "time": "12:30 PM - 1:30 PM",
      "items": ["<item 1>", "<item 2>", "<item 3>", "<item 4>"],
      "calories": <number>,
      "description": "<brief description>"
    },
    "evening_snack": {
      "time": "4:00 PM - 5:00 PM",
      "items": ["<item 1>", "<item 2>"],
      "calories": <number>,
      "description": "<brief description>"
    },
    "dinner": {
      "time": "7:30 PM - 8:30 PM",
      "items": ["<item 1>", "<item 2>", "<item 3>"],
      "calories": <number>,
      "description": "<brief description>"
    }
  },
  "hydration": "<water intake recommendation>",
  "supplements": ["<supplement 1 if needed>", "<supplement 2 if needed>"],
  "recommendations": [
    "<practical tip 1>",
    "<practical tip 2>",
    "<practical tip 3>",
    "<practical tip 4>"
  ],
  "foods_to_avoid": ["<food 1>", "<food 2>", "<food 3>"],
  "health_insights": "<personalized health advice based on their condition and goal>"
}

Important:
- Make meal suggestions based on their diet preference (${formData.diet_preference})
- Avoid foods related to their allergies (${formData.allergies})
- Consider their health condition (${formData.disease})
- Align with their health goal (${formData.health_goal})
- Provide realistic, easy-to-follow Indian/International meal options
- Include proper portion sizes and timing
- Be specific with food items and quantities

Return ONLY the JSON object, nothing else.`;

      // Call Gemini API
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
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error Response:", response.status, errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Gemini API Response:", JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const resultText = data.candidates[0].content.parts[0].text;
        const finishReason = data.candidates[0].finishReason;

        console.log("Raw result text:", resultText);
        console.log("Finish reason:", finishReason);

        // Handle truncated response
        if (finishReason === "MAX_TOKENS") {
          console.warn(
            "Response was truncated due to MAX_TOKENS - attempting to fix JSON",
          );
        }

        // Clean the response - remove markdown code blocks if present
        let cleanedText = resultText.trim();
        cleanedText = cleanedText.replace(/```json\s*/g, "");
        cleanedText = cleanedText.replace(/```\s*/g, "");
        cleanedText = cleanedText.trim();

        // Fix incomplete JSON
        if (!cleanedText.endsWith("}")) {
          console.log("Fixing incomplete JSON structure...");

          // Count opening and closing braces/brackets
          const openBraces = (cleanedText.match(/{/g) || []).length;
          const closeBraces = (cleanedText.match(/}/g) || []).length;
          const openBrackets = (cleanedText.match(/\[/g) || []).length;
          const closeBrackets = (cleanedText.match(/\]/g) || []).length;

          // Remove incomplete string at the end (everything after last complete value)
          const lastCompleteQuote = cleanedText.lastIndexOf('"');
          const lastOpenQuote = cleanedText.lastIndexOf('": "');

          if (lastOpenQuote > lastCompleteQuote - 10) {
            // There's an incomplete string value, truncate it
            const truncatePoint = cleanedText.lastIndexOf('",');
            if (truncatePoint === -1) {
              // Find last complete property
              const lastComma = cleanedText.lastIndexOf(",");
              if (lastComma > 0) {
                cleanedText = cleanedText.substring(0, lastComma);
              }
            } else {
              cleanedText = cleanedText.substring(0, truncatePoint + 1);
            }
          }

          // Close any open brackets
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            cleanedText += "]";
          }

          // Close any open braces
          for (let i = 0; i < openBraces - closeBraces; i++) {
            cleanedText += "}";
          }

          console.log("Fixed JSON structure");
        }

        console.log(
          "Cleaned text (first 500 chars):",
          cleanedText.substring(0, 500),
        );

        try {
          const nutritionData = JSON.parse(cleanedText);
          console.log("✅ Successfully parsed nutrition data");
          console.log("Daily calories:", nutritionData.daily_calories);
          console.log("BMI:", nutritionData.bmi);

          // Validate the data structure
          if (!nutritionData.meal_plan) {
            console.error("Invalid data structure - missing meal_plan");
            throw new Error("Invalid nutrition plan structure");
          }

          setResults(nutritionData);
          setShowResults(true);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("Failed text sample:", cleanedText.substring(0, 500));
          throw new Error("Failed to parse nutrition plan. Please try again.");
        }
      } else {
        console.error("Invalid API response structure:", data);
        throw new Error("Invalid response from Gemini API");
      }
    } catch (error) {
      console.error("API Error:", error);
      console.error("Error stack:", error.stack);
      Alert.alert(
        "Error",
        "Failed to generate nutrition plan. Please try again.\n\n" +
          (error.message || "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setResults(null);
    setShowResults(false);
    setFormData({
      age: "",
      gender: "Male",
      weight: "",
      height: "",
      diet_preference: "Vegetarian",
      activity_level: "Moderate",
      weekly_activity: "3",
      disease: "None",
      allergies: "None",
      health_goal: "Maintenance",
    });
  };

  const renderDropdown = (value, options, onSelect, placeholder) => (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{placeholder}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.optionsScroll}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionChip, value === option && styles.selectedChip]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionText,
                value === option && styles.selectedText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📊 Basic Information</Text>
      <Text style={styles.stepSubtitle}>
        Let's start with your basic details
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age (years)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.age}
          onChangeText={(text) => updateFormData("age", text)}
          placeholder="Enter your age"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight (kg)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.weight}
          onChangeText={(text) => updateFormData("weight", text)}
          placeholder="Enter your weight"
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.height}
          onChangeText={(text) => updateFormData("height", text)}
          placeholder="Enter your height"
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>👤 Personal Preferences</Text>
      <Text style={styles.stepSubtitle}>Tell us about your preferences</Text>

      {renderDropdown(
        formData.gender,
        genderOptions,
        (value) => updateFormData("gender", value),
        "Gender",
      )}
      {renderDropdown(
        formData.diet_preference,
        dietOptions,
        (value) => updateFormData("diet_preference", value),
        "Diet Preference",
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏃‍♂️ Activity Level</Text>
      <Text style={styles.stepSubtitle}>How active are you?</Text>

      {renderDropdown(
        formData.activity_level,
        activityOptions,
        (value) => updateFormData("activity_level", value),
        "Activity Level",
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weekly Activity Days</Text>
        <TextInput
          style={styles.textInput}
          value={formData.weekly_activity}
          onChangeText={(text) => updateFormData("weekly_activity", text)}
          placeholder="How many days per week?"
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏥 Health Information</Text>
      <Text style={styles.stepSubtitle}>Health conditions and goals</Text>

      {renderDropdown(
        formData.disease,
        diseaseOptions,
        (value) => updateFormData("disease", value),
        "Health Conditions",
      )}
      {renderDropdown(
        formData.allergies,
        allergyOptions,
        (value) => updateFormData("allergies", value),
        "Food Allergies",
      )}
      {renderDropdown(
        formData.health_goal,
        goalOptions,
        (value) => updateFormData("health_goal", value),
        "Health Goal",
      )}
    </View>
  );

  const renderResults = () => {
    if (!results || !results.meal_plan) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No results available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>🎉 Your Nutrition Plan</Text>
          <Text style={styles.caloriesText}>
            {results.daily_calories || 0} kcal/day
          </Text>
          {results.bmi && (
            <Text style={styles.bmiText}>
              BMI: {results.bmi} ({results.bmi_category})
            </Text>
          )}
        </View>

        {/* Macros */}
        {results.macros && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📊 Daily Macros</Text>
            <View style={styles.nutrientGrid}>
              <View style={styles.nutrientCard}>
                <Text style={styles.nutrientValue}>
                  {results.macros.protein}
                </Text>
                <Text style={styles.nutrientLabel}>Protein</Text>
              </View>
              <View style={styles.nutrientCard}>
                <Text style={styles.nutrientValue}>{results.macros.carbs}</Text>
                <Text style={styles.nutrientLabel}>Carbs</Text>
              </View>
              <View style={styles.nutrientCard}>
                <Text style={styles.nutrientValue}>{results.macros.fats}</Text>
                <Text style={styles.nutrientLabel}>Fats</Text>
              </View>
              <View style={styles.nutrientCard}>
                <Text style={styles.nutrientValue}>{results.macros.fiber}</Text>
                <Text style={styles.nutrientLabel}>Fiber</Text>
              </View>
            </View>
          </View>
        )}

        {/* Meal Plan */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🍽️ Daily Meal Plan</Text>
          {Object.entries(results.meal_plan).map(([mealType, meal]) => (
            <View key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealType}>
                  {mealType.replace(/_/g, " ").toUpperCase()}
                </Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <Text style={styles.mealCalories}>🔥 {meal.calories} kcal</Text>
              <View style={styles.mealItems}>
                {meal.items &&
                  meal.items.map((item, idx) => (
                    <Text key={idx} style={styles.mealItem}>
                      • {item}
                    </Text>
                  ))}
              </View>
              {meal.description && (
                <Text style={styles.mealDescription}>{meal.description}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Hydration */}
        {results.hydration && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>💧 Hydration</Text>
            <Text style={styles.infoText}>{results.hydration}</Text>
          </View>
        )}

        {/* Recommendations */}
        {results.recommendations && results.recommendations.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>✨ Health Tips</Text>
            {results.recommendations.map((tip, idx) => (
              <Text key={idx} style={styles.tipItem}>
                • {tip}
              </Text>
            ))}
          </View>
        )}

        {/* Foods to Avoid */}
        {results.foods_to_avoid && results.foods_to_avoid.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⚠️ Foods to Avoid</Text>
            <View style={styles.avoidList}>
              {results.foods_to_avoid.map((food, idx) => (
                <Text key={idx} style={styles.avoidItem}>
                  • {food}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Health Insights */}
        {results.health_insights && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>💡 Personalized Advice</Text>
            <Text style={styles.insightsText}>{results.health_insights}</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / 4) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 4</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#10B981", "#059669"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Nutrition Planner</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Diet Planning</Text>
          </View>
          <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {!showResults && renderProgressBar()}

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          {!showResults && (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        {!showResults && (
          <View style={styles.navigationContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, { flex: currentStep === 1 ? 1 : 0.6 }]}
              onPress={nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === 4 ? "Get My Plan" : "Next"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Analyzing your profile...</Text>
            <Text style={styles.loadingSubtext}>
              Creating personalized nutrition plan
            </Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      )}

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowResults(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetForm} style={styles.newPlanButton}>
              <Text style={styles.newPlanText}>New Plan</Text>
            </TouchableOpacity>
          </View>
          {results && renderResults()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FDF4",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
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
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  resetButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  progressText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "white",
    color: "#1F2937",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  optionsScroll: {
    flexDirection: "row",
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  selectedChip: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  optionText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  selectedText: {
    color: "white",
  },
  navigationContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  prevButton: {
    flex: 0.4,
    paddingVertical: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  nextButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F0FDF4",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  newPlanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  newPlanText: {
    color: "white",
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10B981",
  },
  bmiText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 20,
  },
  loaderSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  nutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutrientCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    minWidth: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  mealCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  mealTime: {
    fontSize: 14,
    color: "#6B7280",
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 8,
  },
  mealItems: {
    marginBottom: 8,
  },
  mealItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  mealSuggestion: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
  },
  tipItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  avoidList: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
  },
  avoidItem: {
    fontSize: 14,
    color: "#DC2626",
    marginBottom: 4,
  },
  insightsText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    minWidth: 280,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 20,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
});

export default DailyDietNutritionPlanner;
