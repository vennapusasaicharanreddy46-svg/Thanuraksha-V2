import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

const { width } = Dimensions.get("window");

const EyeResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const condition = params.condition || "Unknown";
  const confidence = parseInt(params.confidence) || 0;
  const imageUri = params.imageUri;
  const details = params.details ? JSON.parse(params.details) : [];
  const recommendations = params.recommendations
    ? JSON.parse(params.recommendations)
    : {};
  const riskLevel = params.riskLevel || "Low";
  const consultDoctor = params.consultDoctor === "true";

  const getRiskColor = () => {
    if (riskLevel === "High") return "#EF4444";
    if (riskLevel === "Moderate") return "#F59E0B";
    return "#10B981";
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analysis Results</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
            </View>
          )}

          {/* Result Info - Simple Text */}
          <View style={styles.simpleResult}>
            <View style={styles.resultLeftSection}>
              <Text style={styles.simpleCondition}>{condition}</Text>
              <Text style={styles.simpleConfidence}>
                Confidence: {confidence}%
              </Text>
            </View>
            <View
              style={[styles.riskCard, { backgroundColor: getRiskColor() }]}
            >
              <Text style={styles.riskCardText}>{riskLevel}</Text>
            </View>
          </View>

          {/* Details */}
          {details.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Details</Text>
              {details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {recommendations.precautions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Precautions</Text>
              {recommendations.precautions.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.detailText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {recommendations.treatments && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Treatments</Text>
              {recommendations.treatments.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.detailText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Doctor Consultation Warning */}
          {consultDoctor && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={30} color="#EF4444" />
              <Text style={styles.warningText}>
                Please consult an eye specialist for proper diagnosis and
                treatment.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/health")}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Find Eye Specialists</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>
              Analyze Another Image
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
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
  content: {
    flex: 1,
  },
  imageContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  simpleResult: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resultLeftSection: {
    flex: 1,
    marginRight: 16,
  },
  simpleCondition: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  simpleConfidence: {
    fontSize: 18,
    color: "#475569",
    fontWeight: "500",
    lineHeight: 24,
  },
  riskCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  riskCardText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#667eea",
    marginRight: 8,
    fontWeight: "bold",
  },
  detailText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
    lineHeight: 22,
  },
  warningCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#991B1B",
    fontWeight: "600",
  },
  actionButton: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  secondaryButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#667eea",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "bold",
  },
  spacer: {
    height: 20,
  },
});

export default EyeResultsScreen;
