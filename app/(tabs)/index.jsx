import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

// Replace the problematic image imports with these corrected ones:

// Replace with the exact filenames from your assets folder
const bloodSugarMonitorImage = require("../../assets/images/blood-sugar-monitor.jpg");
const breastCancerImage = require("../../assets/images/breast-cancer.png"); // Updated breast cancer image
const eyeImage = require("../../assets/images/eye.jpg");
const feverAndColdCheckerImage = require("../../assets/images/fever-cold-checker.jpg");
const foodCalorieCheckerImage = require("../../assets/images/food-calorie-checker.jpg");
const skinDiseaseDetectorImage = require("../../assets/images/skin-disease-detector.jpg");
const sleepHealthCheckerImage = require("../../assets/images/sleep-health-checker.jpg");
const dietNutritionPlannerImage = require("../../assets/images/diet-nutrition-planner.jpg"); // New diet planner image

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showAllHealthServices, setShowAllHealthServices] = useState(false);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userPhoto, setUserPhoto] = useState(null);
  const [doctorsData, setDoctorsData] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // New: Store filtered doctors for search
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [showNoSpecialistFound, setShowNoSpecialistFound] = useState(false);
  const [searchActive, setSearchActive] = useState(false); // <-- Add this state

  // Modified search submit to fetch doctors by specialty
  const handleSearchSubmit = async () => {
    console.log("🔘 [TABS] SEARCH BUTTON CLICKED!");
    console.log("[TABS] Current search query:", searchQuery);

    if (!searchQuery.trim()) {
      console.log("❌ [TABS] Search query empty - resetting");
      setFilteredDoctors([]);
      setSearchActive(false);
      setShowNoSpecialistFound(false);
      return;
    }

    console.log("🔍 [TABS] Starting symptom search...");
    console.log("📡 [TABS] Calling API:", API_ENDPOINTS.ML.DISEASE_PREDICTION);

    try {
      // Send symptoms to backend
      const response = await fetch(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: searchQuery }),
      });

      console.log("✅ [TABS] API Response Status:", response.status);
      const data = await response.json();
      console.log(
        "📦 [TABS] API Response Data:",
        JSON.stringify(data, null, 2),
      );

      if (data.doctor_specialist) {
        const recommendedSpecialist = data.doctor_specialist.trim();
        console.log("🎯 [TABS] Recommended Specialist:", recommendedSpecialist);

        setLoadingDoctors(true);
        console.log("📡 [TABS] Fetching doctors from Firebase...");
        const doctorsResponse = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
        const doctorsJson = await doctorsResponse.json();
        if (doctorsJson) {
          const doctorsArray = Object.keys(doctorsJson).map((key) => ({
            id: key,
            ...doctorsJson[key],
            colors: generateDoctorColors(key),
            isOnline: Math.random() > 0.3,
            responseTime: `${Math.floor(Math.random() * 15) + 3} mins`,
            patients: `${(Math.random() * 3 + 1).toFixed(1)}K+`,
            nextAvailable: getNextAvailableTime(),
            isVerified: true,
            specialty: (
              doctorsJson[key].specialization ||
              doctorsJson[key].specialty ||
              "General Medicine"
            ).trim(),
          }));
          console.log("👨‍⚕️ [TABS] Total doctors fetched:", doctorsArray.length);

          const specialist = data.doctor_specialist.trim().toLowerCase();
          const filtered = doctorsArray.filter(
            (doc) =>
              doc.specialty &&
              doc.specialty.trim().toLowerCase() === specialist &&
              doc.approvedAt &&
              doc.approvedAt !== null,
          );

          console.log("✅ [TABS] Matching doctors found:", filtered.length);
          console.log(
            "📋 [TABS] Filtered doctors:",
            filtered.map((d) => `${d.name} (${d.specialty})`),
          );

          setFilteredDoctors(filtered);
          setSearchActive(true);

          if (filtered.length === 0) {
            console.log(
              "⚠️ [TABS] No specialist found matching:",
              recommendedSpecialist,
            );
            setShowNoSpecialistFound(true);
          } else {
            setShowNoSpecialistFound(false);
          }
        } else {
          console.log("❌ [TABS] No doctors data from Firebase");
          setFilteredDoctors([]);
          setShowNoSpecialistFound(true);
        }
        setLoadingDoctors(false);
      } else {
        console.log("❌ [TABS] No doctor_specialist in API response");
        setFilteredDoctors([]);
        setShowNoSpecialistFound(true);
        setSearchActive(true);
      }
    } catch (error) {
      console.error("❌ [TABS] Error during search:", error);
      console.error("[TABS] Error details:", error.message);
      setFilteredDoctors([]);
      setShowNoSpecialistFound(true);
      setSearchActive(true);
    }
  };

  // Clear search and show all doctors
  const handleClearSearch = () => {
    console.log("🔄 [TABS] Clearing search - resetting to all doctors");
    setSearchQuery("");
    setFilteredDoctors([]);
    setShowNoSpecialistFound(false);
    setSearchActive(false);
  };

  // Language cycling function
  const cycleLanguage = () => {
    const languages = ["en", "hi", "te", "ta"];
    const currentIndex = languages.indexOf(selectedLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setSelectedLanguage(languages[nextIndex]);
  };

  // Language display names
  const languageNames = {
    en: "EN",
    hi: "हिं",
    te: "తె",
    ta: "த",
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Load user session data
    const loadUserData = async () => {
      try {
        const userSession = await AsyncStorage.getItem("userSession");
        if (userSession) {
          const userData = JSON.parse(userSession);
          setUserName(userData.name || "User");
          setUserPhoto(userData.photoURL || null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    // Load doctors from Firebase
    const loadDoctorsData = async () => {
      try {
        setLoadingDoctors(true);
        console.log("[TABS] Starting to load doctors from Firebase...");

        const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
        const doctorsResponse = await response.json();

        console.log("Firebase response:", doctorsResponse);

        if (doctorsResponse) {
          // Convert Firebase object to array with IDs
          const doctorsArray = Object.keys(doctorsResponse).map((key) => ({
            id: key,
            ...doctorsResponse[key],
            // Generate colors for UI
            colors: generateDoctorColors(key),
            isOnline: Math.random() > 0.3, // Random online status
            responseTime: `${Math.floor(Math.random() * 15) + 3} mins`,
            patients: `${(Math.random() * 3 + 1).toFixed(1)}K+`,
            nextAvailable: getNextAvailableTime(),
            isVerified: true,
            // Normalize specialty field
            specialty:
              doctorsResponse[key].specialization ||
              doctorsResponse[key].specialty ||
              "General Medicine",
          }));

          console.log("All doctors before filtering:", doctorsArray);

          // Filter only approved doctors (those with approvedAt field)
          const approvedDoctors = doctorsArray.filter(
            (doctor) => doctor.approvedAt && doctor.approvedAt !== null,
          );

          setDoctorsData(approvedDoctors);
          console.log("Loaded doctors:", approvedDoctors.length);
          console.log("Doctor data sample:", approvedDoctors[0]);
        } else {
          console.log("No doctors data received from Firebase");
          setDoctorsData([]);
        }
      } catch (error) {
        console.error("Error loading doctors:", error);
        setDoctorsData([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadUserData();
    loadDoctorsData();

    // Animation
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Multi-language support
  const translations = {
    en: {
      greeting: "Hello",
      userName: "User",
      subtitle: "How are you today?",
      search: "Search health services...",
      todayHealth: "Today's Health",
      quickActions: "Quick Actions",
      healthAnalysis: "Health Services",
      topDoctors: "Available Doctors",
      seeAll: "See All",
      bookAppointment: "Book Doctor",
      healthRecords: "Health Records",
      activeAppointments: "Active Appointments",
      findPharmacy: "Find Medicine",
      skinDisease: "Skin Problem\nDetector",
      eyeCondition: "Eye Problem\nAnalyzer",
      plateCalorie: "Food Calorie\nChecker",
      breastCancer: "Health Chat\nAssistant",
      feverFlu: "Fever & Cold\nChecker",
      dietNutrition: "Diet & Nutrition\nPlanner",
      sleepBedtime: "Sleep Health\nTracker",
      diabetesGlucose: "Blood Sugar\nMonitor",
      patients: "people helped",
      bookNow: "Book Now",
      experience: "experience",
      availableToday: "Available Today",
      languages: "Languages",
    },
    hi: {
      greeting: "नमस्ते",
      userName: "उपयोगकर्ता",
      subtitle: "आज आप कैसे हैं?",
      search: "स्वास्थ्य सेवाएं खोजें...",
      todayHealth: "आज का स्वास्थ्य",
      quickActions: "त्वरित सेवाएं",
      healthAnalysis: "स्वास्थ्य सेवाएं",
      topDoctors: "उपलब्ध डॉक्टर",
      seeAll: "सभी देखें",
      bookAppointment: "डॉक्टर बुक करें",
      healthRecords: "स्वास्थ्य रिकॉर्ड",
      activeAppointments: "सक्रिय अपॉइंटमेंट",
      findPharmacy: "दवा खोजें",
      skinDisease: "त्वचा समस्या\nजांच",
      eyeCondition: "आंख समस्या\nविश्लेषक",
      plateCalorie: "भोजन कैलोरी\nजांच",
      breastCancer: "स्वास्थ्य चैट\nसहायक",
      feverFlu: "बुखार सर्दी\nजांच",
      dietNutrition: "आहार पोषण\nयोजनाकर्ता",
      sleepBedtime: "नींद स्वास्थ्य\nट्रैकर",
      diabetesGlucose: "रक्त शुगर\nमॉनिटर",
      patients: "लोगों की मदद",
      bookNow: "बुक करें",
      experience: "अनुभव",
      availableToday: "आज उपलब्ध",
      languages: "भाषाएं",
    },
    te: {
      greeting: "హలో",
      userName: "వినియోగదారు",
      subtitle: "ఈరోజు మీరు ఎలా ఉన్నారు?",
      search: "ఆరోగ్య సేవలను వెతకండి...",
      todayHealth: "నేటి ఆరోగ్యం",
      quickActions: "త్వరిత చర్యలు",
      healthAnalysis: "ఆరోగ్య సేవలు",
      topDoctors: "అందుబాటులో ఉన్న వైద్యులు",
      seeAll: "అన్నీ చూడండి",
      bookAppointment: "వైద్యుడిని బుక్ చేయండి",
      healthRecords: "ఆరోగ్య రికార్డులు",
      activeAppointments: "క్రియాశీల అపాయింట్‌మెంట్లు",
      findPharmacy: "మందు కనుగొనండి",
      skinDisease: "చర్మ సమస్య\nగుర్తింపు",
      eyeCondition: "కంటి సమస్య\nవిశ్లేషణ",
      plateCalorie: "ఆహార కేలరీ\nతనిఖీ",
      breastCancer: "ఆరోగ్య చాట్\nసహాయకుడు",
      feverFlu: "జ్వరం జలుబు\nతనిఖీ",
      dietNutrition: "ఆహార పోషణ\nప్లానర్",
      sleepBedtime: "నిద్ర ఆరోగ్యం\nట్రాకర్",
      diabetesGlucose: "రక్తంలో చక్కెర\nమానిటర్",
      patients: "ప్రజలకు సహాయం",
      bookNow: "బుక్ చేయండి",
      experience: "అనుభవం",
      availableToday: "ఈరోజు అందుబాటులో",
      languages: "భాషలు",
    },
    ta: {
      greeting: "வணக்கம்",
      userName: "பயனர்",
      subtitle: "இன்று நீங்கள் எப்படி இருக்கிறீர்கள்?",
      search: "உடல்நலப் பணிகளைத் தேடுங்கள்...",
      todayHealth: "இன்றைய உடல்நலம்",
      quickActions: "விரைவு நடவடிக்கைகள்",
      healthAnalysis: "உடல்நலப் பணிகள்",
      topDoctors: "கிடைக்கும் மருத்துவர்கள்",
      seeAll: "அனைத்தையும் பார்க்க",
      bookAppointment: "மருத்துவரை பதிவு செய்யுங்கள்",
      healthRecords: "உடல்நலப் பதிவுகள்",
      activeAppointments: "செயல்படும் முந்தைய நியமனங்கள்",
      findPharmacy: "மருந்து கண்டுபிடிக்க",
      skinDisease: "தோல் பிரச்சனை\nகண்டறிதல்",
      eyeCondition: "கண் பிரச்சனை\nபகுப்பாய்வு",
      plateCalorie: "உணவு கலோரி\nசோதனை",
      breastCancer: "உடல்நல அரட்டை\nதோழன்",
      feverFlu: "காய்ச்சல் சளி\nசோதனை",
      dietNutrition: "உணவு ஊட்டச்சத்து\nதிட்டமிடல்",
      sleepBedtime: "தூக்க உடல்நலம்\nகண்காணிப்பு",
      diabetesGlucose: "ரத்த சர்க்கரை\nகண்காணிப்பு",
      patients: "மக்களுக்கு உதவி",
      bookNow: "பதிவு செய்யுங்கள்",
      experience: "அனுபவம்",
      availableToday: "இன்று கிடைக்கும்",
      languages: "மொழிகள்",
    },
  };

  const t = translations[selectedLanguage] || translations.en;

  // Helper functions for doctor data
  const generateDoctorColors = (id) => {
    const colorSets = [
      ["#667eea", "#764ba2"],
      ["#4ECDC4", "#44D8A8"],
      ["#6C5CE7", "#A29BFE"],
      ["#FF9A8B", "#A8E6CF"],
      ["#FFD93D", "#6BCF7F"],
      ["#A8E6CF", "#88D8C0"],
      ["#fd746c", "#ff9068"],
      ["#36d1dc", "#5b86e5"],
    ];
    const index = id.length % colorSets.length;
    return colorSets[index];
  };

  const getNextAvailableTime = () => {
    const times = [
      "Today 2:00 PM",
      "Today 5:00 PM",
      "Tomorrow 10 AM",
      "Tomorrow 11 AM",
      "Today 4:30 PM",
      "Tomorrow 9 AM",
    ];
    return times[Math.floor(Math.random() * times.length)];
  };

  // Medical categories data - Simple and Visual for All Users
  const medicalCategories = [
    {
      id: "1",
      title: t.skinDisease,
      icon: "body-outline",
      color: ["#667eea", "#764ba2"],
      route: "/health/SkinDiseaseDetector",
      image: skinDiseaseDetectorImage,
    },
    {
      id: "2",
      title: t.eyeCondition,
      icon: "eye-outline",
      color: ["#f093fb", "#f5576c"],
      route: "/health/EyeConditionAnalyzer", // Try this route instead
      image: eyeImage,
    },
    {
      id: "3",
      title: t.plateCalorie,
      icon: "restaurant-outline",
      color: ["#4facfe", "#00f2fe"],
      route: "/health/PlateCalorieChecker",
      image: foodCalorieCheckerImage,
    },
    {
      id: "4",
      title: t.breastCancer,
      icon: "chatbubbles-outline",
      color: ["#43e97b", "#38f9d7"],
      route: "/health/BreastCancerRiskChatbot",
      image: breastCancerImage, // Now using the updated breast cancer image
    },
    {
      id: "5",
      title: t.feverFlu,
      icon: "thermometer-outline",
      color: ["#fa709a", "#fee140"],
      route: "/health/FeverFluSymptomChecker",
      image: feverAndColdCheckerImage,
    },
    {
      id: "6",
      title: t.dietNutrition,
      icon: "nutrition-outline",
      color: ["#a8edea", "#fed6e3"],
      route: "/health/DailyDietNutritionPlanner",
      image: dietNutritionPlannerImage, // Now using the specific diet nutrition planner image
    },
    {
      id: "7",
      title: t.sleepBedtime,
      icon: "bed-outline",
      color: ["#d299c2", "#fef9d7"],
      route: "/health/SmartSleepBedtimeCompanion",
      image: sleepHealthCheckerImage,
    },
    {
      id: "8",
      title: t.diabetesGlucose,
      icon: "water-outline",
      color: ["#89f7fe", "#66a6ff"],
      route: "/health/DiabetesGlucoseRiskMonitor",
      image: bloodSugarMonitorImage,
    },
  ];

  // Quick actions data - Visual and Simple
  const quickActions = [
    {
      id: "1",
      title: t.bookAppointment,
      icon: "calendar",
      colors: ["#6366f1", "#8b5cf6"],
      bgColor: "#F0F0FF",
      route: "/explore",
    },
    {
      id: "2",
      title: t.healthRecords,
      icon: "document-text",
      colors: ["#10b981", "#34d399"],
      bgColor: "#F0FFF8",
      route: "/health-records",
    },
    {
      id: "3",
      title: t.activeAppointments,
      icon: "calendar-outline",
      colors: ["#f59e0b", "#fbbf24"],
      bgColor: "#FFFEF0",
      route: "/active-appointments",
    },
    {
      id: "4",
      title: t.findPharmacy,
      icon: "medical",
      colors: ["#ef4444", "#f87171"],
      bgColor: "#FFF0F0",
      route: "/prescription-view",
    },
    {
      id: "5",
      title: "Order Status",
      icon: "bag",
      colors: ["#4ECDC4", "#44D8A8"],
      bgColor: "#F0FFF8",
      route: "/order-status",
    },
  ];

  // Health stats data - Simple numbers farmers can understand
  const healthStats = [
    {
      id: "1",
      icon: "heart",
      value: "86",
      label: "Heart Rate",
      unit: "BPM",
      color: "#ef4444",
      bgColor: "#FFF0F0",
      status: "Normal",
    },
    {
      id: "2",
      icon: "walk",
      value: "7,200",
      label: "Steps Today",
      unit: "steps",
      color: "#10b981",
      bgColor: "#F0FFF8",
      status: "Good",
    },
    {
      id: "3",
      icon: "moon",
      value: "8",
      label: "Sleep Hours",
      unit: "hours",
      color: "#8b5cf6",
      bgColor: "#F8F0FF",
      status: "Good",
    },
    {
      id: "4",
      icon: "water",
      value: "2.1",
      label: "Water Intake",
      unit: "liters",
      color: "#3b82f6",
      bgColor: "#F0F9FF",
      status: "Good",
    },
  ];

  const renderStatCard = ({ item }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: item.bgColor,
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={28} color="white" />
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statUnit}>{item.unit}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
      <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </Animated.View>
  );

  const renderQuickAction = (item, index) => (
    <Animated.View
      key={item.id}
      style={[
        styles.quickActionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.quickActionContent}
        onPress={() => {
          if (item.route) {
            router.push(item.route);
          }
        }}
      >
        <LinearGradient
          colors={item.colors}
          style={styles.quickActionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={28} color="white" />
        </LinearGradient>
        <Text style={styles.quickActionText}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategoryCard = (item, index) => (
    <Animated.View
      key={item.id}
      style={[
        styles.categoryCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push(item.route)}
        style={styles.categoryCardContent}
      >
        <LinearGradient
          colors={item.color}
          style={styles.categoryIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={28} color="white" />
        </LinearGradient>

        <Text style={styles.categoryTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategoryCircle = (item, index) => (
    <Animated.View
      key={item.id}
      style={[
        styles.categoryCircle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push(item.route)}
        style={styles.categoryCircleContent}
      >
        <LinearGradient
          colors={item.color}
          style={styles.categoryCircleIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={38} color="white" />
        </LinearGradient>

        <Text style={styles.categoryCircleTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Regular doctor card (No pricing)
  const renderDoctorCard = ({ item, isGridView = false }) => (
    <Animated.View
      style={[
        styles.doctorCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          width: isGridView ? "100%" : width * 0.65,
          marginRight: isGridView ? 0 : 12,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.doctorCardContent}
        onPress={() => router.push(`/doctor-profile?doctorId=${item.id}`)}
      >
        <View style={styles.doctorHeader}>
          <LinearGradient
            colors={item.colors}
            style={styles.doctorAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="person" size={20} color="white" />
          </LinearGradient>

          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
            <View style={styles.doctorRating}>
              <AntDesign name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.experienceText}>• {item.experience}</Text>
            </View>
          </View>

          {/* Online Status */}
          {item.isOnline && (
            <View style={styles.onlineStatusCard}>
              <View style={styles.onlineDotCard} />
              <Text style={styles.onlineTextCard}>Online</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => router.push(`/doctor-profile?doctorId=${item.id}`)}
        >
          <LinearGradient
            colors={item.colors}
            style={styles.viewDetailsButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  // Circular doctor profile (like health services style)
  const renderCircleDoctorProfile = (item) => (
    <View style={styles.doctorCircleContainer}>
      <TouchableOpacity
        onPress={() => router.push(`/doctor-profile?doctorId=${item.id}`)}
        style={styles.doctorCircleContent}
      >
        {/* Perfect Circle Profile Picture */}
        <View style={styles.profileCircleContainer}>
          <LinearGradient
            colors={item.colors}
            style={styles.perfectCircleProfile}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={styles.doctorCircleImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={35} color="white" />
            )}
          </LinearGradient>

          {/* Verified Badge - Top Right */}
          {item.isVerified && (
            <View style={styles.verifiedBadgeCircle}>
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
            </View>
          )}

          {/* Online Status Badge - Top Left */}
          {item.isOnline && (
            <View style={styles.onlineBadgeCircle}>
              <View style={styles.onlineDotSmall} />
            </View>
          )}
        </View>

        {/* Doctor Name and Specialty */}
        <Text style={styles.doctorNameOnly} numberOfLines={1}>
          {item.name || "Dr. Unknown"}
        </Text>
        <Text style={styles.doctorSpecialtySmall} numberOfLines={1}>
          {item.specialty || item.specialization || "Specialist"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Enhanced renderHealthServiceCard function for better image display:

  const renderHealthServiceCard = (item) => (
    <Animated.View
      style={[
        styles.naturalHealthCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push(item.route)}
        style={styles.naturalCardContent}
        activeOpacity={0.9}
      >
        {/* Full Image Background - Medical Quality */}
        <View style={styles.naturalImageContainer}>
          <Image
            source={item.image}
            style={styles.naturalServiceImage}
            resizeMode="cover"
          />

          {/* Enhanced Overlay for Better Medical Look */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.6)"]}
            style={styles.naturalOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Medical Icon Badge with Service Color */}
            <View style={styles.medicalIconBadge}>
              <LinearGradient
                colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.85)"]}
                style={styles.iconBadgeGradient}
              >
                <Ionicons name={item.icon} size={28} color={item.color[0]} />
              </LinearGradient>
            </View>

            {/* Service Title and Action */}
            <View style={styles.naturalTextContainer}>
              <Text style={styles.naturalTitle} numberOfLines={3}>
                {item.title}
              </Text>

              {/* Enhanced Action Indicator */}
              <View style={styles.analyzeIndicator}>
                <LinearGradient
                  colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]}
                  style={styles.tapToAnalyze}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={16} color="white" />
                  <Text style={styles.tapText}>Tap to Analyze</Text>
                  <Ionicons name="arrow-forward" size={14} color="white" />
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#4d4ae7ff", "#3b38d8ff"]} // New medical teal gradient
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header Content */}
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              {/* User Profile Picture */}
              <View style={styles.profilePictureHeader}>
                {userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={styles.userProfileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.defaultProfileIcon}
                  >
                    <Ionicons name="person" size={24} color="white" />
                  </LinearGradient>
                )}
              </View>

              {/* User Name Only */}
              <Text style={styles.userNameHeader}>{userName}</Text>
            </View>

            <View style={styles.headerActions}>
              {/* Language Selector */}
              <TouchableOpacity
                style={styles.languageButton}
                onPress={cycleLanguage}
              >
                <Text style={styles.languageText}>
                  {languageNames[selectedLanguage]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="white"
                />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Section */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t.search}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.filterButton}
                onPress={searchActive ? handleClearSearch : handleSearchSubmit}
              >
                <AntDesign
                  name={searchActive ? "close" : "search1"}
                  size={18}
                  color="#667eea"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Top Doctors - Horizontal Scrollable */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{t.topDoctors}</Text>
                <Text style={styles.sectionSubtitle}>{t.availableToday}</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => router.push("/explore")}
              >
                <Text style={styles.seeAllText}>{t.seeAll}</Text>
                <AntDesign name="arrowright" size={16} color="#667eea" />
              </TouchableOpacity>
            </View>

            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading doctors...</Text>
              </View>
            ) : (
              <>
                {showNoSpecialistFound && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No specialist found. Showing all doctors.
                    </Text>
                  </View>
                )}
                {filteredDoctors.length > 0 ? (
                  <FlatList
                    data={filteredDoctors}
                    renderItem={({ item }) => renderCircleDoctorProfile(item)}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.doctorsHorizontalContainer}
                    ItemSeparatorComponent={() => <View style={{ width: 6 }} />}
                    decelerationRate="fast"
                    snapToInterval={96}
                    snapToAlignment="start"
                  />
                ) : (
                  <FlatList
                    data={doctorsData}
                    renderItem={({ item }) => renderCircleDoctorProfile(item)}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.doctorsHorizontalContainer}
                    ItemSeparatorComponent={() => <View style={{ width: 6 }} />}
                    decelerationRate="fast"
                    snapToInterval={96}
                    snapToAlignment="start"
                  />
                )}
              </>
            )}
          </View>

          {/* Health Analysis Categories - Horizontal Scrollable with Images */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{t.healthAnalysis}</Text>
                <Text style={styles.sectionSubtitle}>
                  AI-powered health screening
                </Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => setShowAllHealthServices(!showAllHealthServices)}
              >
                <Text style={styles.seeAllText}>
                  {showAllHealthServices ? "Show Less" : t.seeAll}
                </Text>
                <AntDesign
                  name={showAllHealthServices ? "arrowup" : "arrowright"}
                  size={16}
                  color="#667eea"
                />
              </TouchableOpacity>
            </View>

            {/* Health Services - Dynamic Display */}
            {!showAllHealthServices ? (
              // Original Horizontal Scroll
              <FlatList
                data={medicalCategories}
                renderItem={({ item }) => renderHealthServiceCard(item)}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicadtor={false}
                contentContainerStyle={[
                  styles.healthServicesContainer,
                  { paddingLeft: 5, paddingRight: width * 0.06 + 20 },
                ]}
                ItemSeparatorComponent={() => <View style={{ width: 32 }} />}
                decelerationRate="fast"
                snapToInterval={width * 0.88 + 32}
                snapToAlignment="start"
                pagingEnabled={true}
                getItemLayout={(_, index) => ({
                  length: width * 0.88 + 32,
                  offset: (width * 0.88 + 32) * index,
                  index,
                })}
                style={{ width: width }}
              />
            ) : (
              // Grid View for All Services
              <View style={styles.allHealthServicesGrid}>
                {medicalCategories.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.gridHealthCard,
                      {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(item.route)}
                      style={styles.gridCardContent}
                      activeOpacity={0.9}
                    >
                      <View style={styles.gridImageContainer}>
                        <Image
                          source={item.image}
                          style={styles.gridServiceImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
                          style={styles.gridOverlay}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        >
                          <View style={styles.gridMedicalBadge}>
                            <LinearGradient
                              colors={[
                                "rgba(255,255,255,0.95)",
                                "rgba(255,255,255,0.85)",
                              ]}
                              style={styles.gridIconBadge}
                            >
                              <Ionicons
                                name={item.icon}
                                size={24}
                                color={item.color[0]}
                              />
                            </LinearGradient>
                          </View>

                          <View style={styles.gridTextContainer}>
                            <Text style={styles.gridTitle} numberOfLines={3}>
                              {item.title}
                            </Text>
                            <View style={styles.gridActionContainer}>
                              <LinearGradient
                                colors={item.color}
                                style={styles.gridActionButton}
                              >
                                <Ionicons
                                  name="camera"
                                  size={14}
                                  color="white"
                                />
                                <Text style={styles.gridActionText}>
                                  Analyze
                                </Text>
                                <Ionicons
                                  name="arrow-forward"
                                  size={12}
                                  color="white"
                                />
                              </LinearGradient>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{t.quickActions}</Text>
                <Text style={styles.sectionSubtitle}>Essential services</Text>
              </View>
              <AntDesign name="rocket1" size={24} color="#667eea" />
            </View>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((item, index) =>
                renderQuickAction(item, index),
              )}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// Fix the StyleSheet by combining all styles properly
const styles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerGradient: {
    height: 110,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profilePictureHeader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  userProfileImage: {
    width: "100%",
    height: "100%",
  },
  defaultProfileIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  userNameHeader: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    flex: 1,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  userName: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "white",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 44,
    alignItems: "center",
  },
  languageText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  notificationButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "white",
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 16,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
    fontWeight: "500",
  },
  filterButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 125, // Adjusted for new header height
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionContent: {
    padding: 16,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 16,
  },

  // Category Circles
  categoryCircleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginHorizontal: -12,
    paddingVertical: 8,
  },
  categoryCircle: {
    width: (width - 80) / 2,
    marginHorizontal: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  categoryCircleContent: {
    alignItems: "center",
  },
  categoryCircleIcon: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  categoryCircleTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 90,
  },

  // Regular Doctor Cards (fallback)
  doctorCard: {
    // Width is handled dynamically
  },
  doctorCardContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 3,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 5,
    fontWeight: "500",
  },
  doctorRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#1E293B",
    marginLeft: 4,
    fontWeight: "600",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  doctorPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#667eea",
  },
  bookButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  bookButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  bottomSpacing: {
    height: 30,
  },

  // Instagram-style Doctor Profile Styles
  instagramDoctorCard: {
    marginBottom: 16,
  },
  instagramDoctorContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Simple Profile Picture
  profilePictureContainer: {
    position: "relative",
    marginBottom: 8,
  },
  storyRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 1,
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  doctorImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // Simple Badges
  verifiedBadgeSimple: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ratingBadgeSimple: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "#FFD700",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ratingTextSimple: {
    fontSize: 9,
    color: "#1E293B",
    fontWeight: "bold",
  },

  // Simple Doctor Info
  doctorInfoSimple: {
    alignItems: "center",
    width: "100%",
  },
  doctorNameSimple: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 16,
  },

  // Simple Grid Layout
  doctorsInstagramContainer: {
    paddingRight: 20,
  },
  allDoctorsInstagramGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -8,
  },
  doctorInstagramGridItem: {
    width: (width - 56) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },

  // Doctor Circle Profile (like health services style)
  doctorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  doctorsHorizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doctorCircleContainer: {
    width: 90,
    alignItems: "center",
    marginHorizontal: 6,
  },
  doctorCircleContent: {
    alignItems: "center",
    width: "100%",
  },
  profileCircleContainer: {
    position: "relative",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  perfectCircleProfile: {
    width: 75,
    height: 75,
    borderRadius: 37.5, // Perfect circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  verifiedBadgeCircle: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingBadgeCircle: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "#FFD700",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingNumberCircle: {
    fontSize: 9,
    color: "#1F2937",
    fontWeight: "bold",
  },
  doctorNameOnly: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 14,
    maxWidth: 85,
    marginBottom: 2,
  },
  doctorSpecialtySmall: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 12,
    maxWidth: 85,
  },
  doctorCircleImage: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
  },
  onlineBadgeCircle: {
    position: "absolute",
    top: -2,
    left: -2,
    backgroundColor: "#22C55E",
    borderRadius: 8,
    padding: 3,
    borderWidth: 2,
    borderColor: "white",
  },
  onlineDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
  },

  // New styles for Health Service Card
  healthServicesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  naturalHealthCard: {
    width: width * 0.88,
    height: 240,
    marginHorizontal: 0,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  naturalCardContent: {
    width: "100%",
    height: "100%",
  },
  naturalImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  naturalServiceImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  naturalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)", // Minimal overlay
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 24,
  },
  medicalIconBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  iconBadgeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  naturalTextContainer: {
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  naturalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
    lineHeight: 26,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  analyzeIndicator: {
    alignSelf: "flex-start",
  },
  tapToAnalyze: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  tapText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Grid styles for all health services view
  allHealthServicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  gridHealthCard: {
    width: "48%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gridCardContent: {
    width: "100%",
    height: "100%",
  },
  gridImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  gridServiceImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 16,
  },
  gridMedicalBadge: {
    alignSelf: "flex-start",
  },
  gridIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  gridTextContainer: {
    alignSelf: "stretch",
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gridActionContainer: {
    alignSelf: "flex-start",
  },
  gridActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  gridActionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },

  // Online Status Styles
  onlineStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  onlineDotCard: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  onlineTextCard: {
    fontSize: 10,
    color: "#22C55E",
    fontWeight: "600",
  },

  // View Details Button Styles
  viewDetailsButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  viewDetailsButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },

  // Experience Text Style
  experienceText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default HomeScreen;
