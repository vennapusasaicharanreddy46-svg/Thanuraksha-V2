import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

const PharmacyLoginOrders = () => {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  // Configure Google Sign-In
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        GoogleSignin.configure({
          webClientId:
            "425084232868-6d6muuik0hddgq228i96d9aiav7e4jke.apps.googleusercontent.com",
          offlineAccess: false,
        });
        console.log("Google Sign-In configured successfully");
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
      }
    };

    configureGoogleSignIn();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log("Starting Google Sign-In for Pharmacy Orders...");

      // Check Google Play Services
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log("Google Play Services available:", hasPlayServices);

      // Sign out any previous user
      try {
        await GoogleSignin.signOut();
        console.log("Previous user signed out");
      } catch (signOutError) {
        console.log("No previous user to sign out");
      }

      // Attempt Google Sign-In
      console.log("Attempting Google Sign-In...");
      const userInfo = await GoogleSignin.signIn();
      console.log("Google Sign-In successful:", userInfo);

      // Check if userInfo is valid
      if (!userInfo || !userInfo.data || !userInfo.data.user) {
        throw new Error("Google Sign-In did not return user information.");
      }

      const { user } = userInfo.data;

      // Save pharmacy session data
      const pharmacySession = {
        email: user.email,
        name:
          user.name ||
          `${user.givenName || ""} ${user.familyName || ""}`.trim() ||
          "Pharmacy User",
        photo: user.photo || null,
        pharmacyId: `pharmacy_${user.id}`,
        uid: user.id,
        category: "orders",
        loginType: "pharmacy-orders",
        verificationStatus: "pending",
        loginTime: new Date().toISOString(),
        loginMethod: "google",
      };

      // Store in AsyncStorage
      await AsyncStorage.setItem(
        "pharmacySession",
        JSON.stringify(pharmacySession),
      );
      console.log("Pharmacy session stored successfully");

      // Navigate to pharmacy dashboard - orders only
      Alert.alert("Success", `Welcome ${pharmacySession.name}!`, [
        { text: "OK", onPress: () => router.replace("/pharmacy-dashboard") },
      ]);
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      Alert.alert("Error", error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EC4899" />

      {/* Header */}
      <LinearGradient colors={["#EC4899", "#BE185D"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="bag" size={40} color="white" />
          <Text style={styles.headerTitle}>Medicine Orders</Text>
          <Text style={styles.headerSubtitle}>Manage prescription orders</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.loginContainer}>
          {/* Login/Signup Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {isLogin ? "Login" : "Register"}
            </Text>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your pharmacy name"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.authButton} disabled={loading}>
              <LinearGradient
                colors={["#EC4899", "#BE185D"]}
                style={styles.authButtonGradient}
              >
                <Text style={styles.authButtonText}>
                  {isLogin ? "Login" : "Register"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setFormData({ email: "", password: "", name: "", phone: "" });
              }}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Register"
                  : "Already have an account? Login"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#EC4899", "#BE185D"]}
              style={styles.googleButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="white" size="large" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={24} color="white" />
                  <Text style={styles.googleButtonText}>
                    Sign in with Google
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.loginNote}>
            Sign in with your pharmacy account to manage orders
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
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
  },
  loginContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#1F2937",
  },
  authButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 12,
  },
  authButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  switchButton: {
    paddingVertical: 10,
  },
  switchText: {
    fontSize: 13,
    color: "#EC4899",
    textAlign: "center",
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  googleButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  googleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  loginNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default PharmacyLoginOrders;
