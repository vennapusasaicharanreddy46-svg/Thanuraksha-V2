import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

let LinearGradient;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View
      style={[style, { backgroundColor: colors?.[0] || "#f093fb" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const PharmacyCategorySelect = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: "orders",
      title: "Medicine Orders",
      description: "Manage prescription orders from patients",
      icon: "cube-outline",
      color: "#f093fb",
      gradient: ["#f093fb", "#f5576c"],
      route: "/auth/pharmacy-login-orders",
    },
    {
      id: "labs",
      title: "Lab Tests",
      description: "Manage lab test orders and reports",
      icon: "flask-outline",
      color: "#00d4ff",
      gradient: ["#00d4ff", "#0099ff"],
      route: "/auth/pharmacy-login-labs",
    },
    {
      id: "delivery",
      title: "Delivery Service",
      description: "Manage medicine delivery operations",
      icon: "car-outline",
      color: "#1dd1a1",
      gradient: ["#1dd1a1", "#10ac84"],
      route: "/auth/pharmacy-login-delivery",
    },
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    // Navigate to the appropriate login screen with category parameter
    setTimeout(() => {
      router.push({
        pathname: category.route,
        params: { category: category.id },
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f093fb" />

      {/* Header */}
      <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="storefront" size={40} color="white" />
          <Text style={styles.headerTitle}>Pharmacy Services</Text>
          <Text style={styles.headerSubtitle}>
            Choose your service category
          </Text>
        </View>
      </LinearGradient>

      {/* Category Cards */}
      <View style={styles.content}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.selectedCard,
            ]}
            onPress={() => handleCategorySelect(category)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={category.gradient}
              style={styles.categoryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons name={category.icon} size={40} color="white" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons
                  name={
                    selectedCategory === category.id
                      ? "checkmark-circle"
                      : "chevron-forward"
                  }
                  size={24}
                  color="white"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#f093fb" />
        <Text style={styles.infoText}>
          Each category requires separate verification and login credentials
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 15,
    zIndex: 10,
    padding: 8,
  },
  headerContent: {
    alignItems: "center",
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "center",
    gap: 20,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  selectedCard: {
    elevation: 8,
    shadowOpacity: 0.25,
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
  },
  categoryIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  arrowContainer: {
    marginLeft: 8,
  },
  bottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9F0",
    borderTopWidth: 1,
    borderTopColor: "#FFE5CC",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    lineHeight: 18,
  },
});

export default PharmacyCategorySelect;
