import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
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

const ExploreScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorsData, setDoctorsData] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [showNoSpecialistFound, setShowNoSpecialistFound] = useState(false);

  console.log("🏥 ExploreScreen Component Loaded");
  console.log("Current Search Query:", searchQuery);
  console.log("Search Active:", searchActive);
  console.log("Doctors Data Count:", doctorsData.length);
  console.log("Filtered Doctors Count:", filteredDoctors.length);

  // Fetch doctors from Firebase on mount
  useEffect(() => {
    const loadDoctorsData = async () => {
      try {
        setLoadingDoctors(true);
        const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
        const doctorsResponse = await response.json();
        if (doctorsResponse) {
          const doctorsArray = Object.keys(doctorsResponse).map((key) => ({
            id: key,
            ...doctorsResponse[key],
            specialty: (
              doctorsResponse[key].specialization ||
              doctorsResponse[key].specialty ||
              "General Medicine"
            ).trim(),
          }));
          // Only approved doctors
          const approvedDoctors = doctorsArray.filter(
            (doctor) => doctor.approvedAt && doctor.approvedAt !== null,
          );
          setDoctorsData(approvedDoctors);
        } else {
          setDoctorsData([]);
        }
      } catch (error) {
        setDoctorsData([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctorsData();
  }, []);

  // Search logic (same as home)
  const handleSearchSubmit = async () => {
    console.log("🔘 SEARCH BUTTON CLICKED!");
    console.log("Current search query value:", searchQuery);
    Alert.alert("Search Clicked", `Searching for: ${searchQuery}`);

    // If search is empty, reset to show all doctors
    if (!searchQuery.trim()) {
      console.log("❌ Search query is empty - showing all doctors");
      setFilteredDoctors([]);
      setSearchActive(false);
      setShowNoSpecialistFound(false);
      return;
    }

    console.log("🔍 Starting search for symptoms:", searchQuery);
    console.log(
      "📡 Calling Disease Prediction API:",
      API_ENDPOINTS.ML.DISEASE_PREDICTION,
    );

    try {
      // Call the ML API with symptoms
      const response = await fetch(API_ENDPOINTS.ML.DISEASE_PREDICTION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: searchQuery }),
      });

      console.log("✅ API Response Status:", response.status);

      const data = await response.json();
      console.log("📦 API Response Data:", JSON.stringify(data, null, 2));

      // Check if we got a specialist recommendation
      if (data.doctor_specialist) {
        const recommendedSpecialist = data.doctor_specialist.trim();
        console.log("🎯 Recommended Specialist:", recommendedSpecialist);

        setLoadingDoctors(true);

        // Fetch all doctors from Firebase
        console.log("📡 Fetching doctors from Firebase...");
        const doctorsResponse = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
        const doctorsJson = await doctorsResponse.json();

        if (doctorsJson) {
          // Convert to array and normalize specialty field
          const doctorsArray = Object.keys(doctorsJson).map((key) => ({
            id: key,
            ...doctorsJson[key],
            specialty: (
              doctorsJson[key].specialization ||
              doctorsJson[key].specialty ||
              "General Medicine"
            ).trim(),
          }));

          console.log("👨‍⚕️ Total doctors fetched:", doctorsArray.length);

          // Filter by specialist and approved status
          const specialist = recommendedSpecialist.toLowerCase();
          const filtered = doctorsArray.filter(
            (doc) =>
              doc.specialty &&
              doc.specialty.trim().toLowerCase() === specialist &&
              doc.approvedAt &&
              doc.approvedAt !== null,
          );

          console.log("✅ Matching doctors found:", filtered.length);
          console.log(
            "📋 Filtered doctors:",
            filtered.map((d) => `${d.name} (${d.specialty})`),
          );

          setFilteredDoctors(filtered);
          setSearchActive(true);

          // If no matching specialist found, show message but display all doctors
          if (filtered.length === 0) {
            console.log(
              "⚠️ No specialist found matching:",
              recommendedSpecialist,
            );
            setShowNoSpecialistFound(true);
          } else {
            setShowNoSpecialistFound(false);
          }
        } else {
          console.log("❌ No doctors data from Firebase");
          setFilteredDoctors([]);
          setShowNoSpecialistFound(true);
        }
        setLoadingDoctors(false);
      } else {
        console.log("❌ No doctor_specialist in API response");
        setFilteredDoctors([]);
        setShowNoSpecialistFound(true);
        setSearchActive(true);
      }
    } catch (error) {
      console.error("❌ Error during search:", error);
      console.error("Error details:", error.message);
      setFilteredDoctors([]);
      setShowNoSpecialistFound(true);
      setSearchActive(true);
    }
  };

  const handleClearSearch = () => {
    console.log("🔄 Clearing search - resetting to all doctors");
    setSearchQuery("");
    setFilteredDoctors([]);
    setShowNoSpecialistFound(false);
    setSearchActive(false);
  };

  const renderDoctorCard = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorInfo}>
        <View style={styles.avatar}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={32} color="#667eea" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.detailsBtn}>
        <Text style={styles.detailsBtnText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Services</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.searchBarSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors by symptoms..."
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

      <Text style={styles.sectionTitle}>Popular Doctors</Text>
      {loadingDoctors ? (
        <ActivityIndicator
          size="large"
          color="#667eea"
          style={{ marginTop: 30 }}
        />
      ) : (
        <>
          {showNoSpecialistFound && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No specialist found. Showing all doctors.
              </Text>
            </View>
          )}
          <FlatList
            data={filteredDoctors.length > 0 ? filteredDoctors : doctorsData}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.doctorsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No doctors available</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 44,
    paddingBottom: 16,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: 40,
  },
  searchBarSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    margin: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  doctorsList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginHorizontal: 0,
  },
  doctorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.08)",
    padding: 16,
    marginBottom: 16,
    width: "48%",
    flexDirection: "column",
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
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  doctorSpecialty: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  detailsBtn: {
    alignSelf: "flex-end",
    marginTop: 6,
    backgroundColor: "#667eea",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  detailsBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
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
});

export default ExploreScreen;
