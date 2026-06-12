import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
      style={[style, { backgroundColor: colors?.[0] || "#667eea" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const ProfileScreen = () => {
  const router = useRouter();
  const [userSession, setUserSession] = useState(null);
  const [userDetails, setUserDetails] = useState({
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    emergencyContact: "",
    bloodGroup: "",
    medicalHistory: "",
    allergies: "",
    occupation: "",
    maritalStatus: "",
    weight: "",
    height: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Get user session
      const sessionData = await AsyncStorage.getItem("userSession");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setUserSession(session);

        // Load user details from Firebase
        await loadUserDetails(session.uid);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.FIREBASE.USER_DETAILS_BY_ID(userId),
      );
      const details = await response.json();

      if (details) {
        setUserDetails(details);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const saveUserDetails = async () => {
    if (!userSession) return;

    try {
      setIsLoading(true);

      const detailsToSave = {
        ...userDetails,
        updatedAt: new Date().toISOString(),
        userId: userSession.uid,
        userEmail: userSession.email,
        userName: userSession.name,
        userType: userSession.userType,
      };

      const response = await fetch(
        API_ENDPOINTS.FIREBASE.USER_DETAILS_BY_ID(userSession.uid),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailsToSave),
        },
      );

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
      } else {
        throw new Error("Failed to save details");
      }
    } catch (error) {
      console.error("Error saving user details:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("userSession");
          router.replace("/landing");
        },
      },
    ]);
  };

  if (isLoading && !userSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user session found</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/landing")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {userSession.photoURL ? (
                <Image
                  source={{ uri: userSession.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="white" />
                </View>
              )}
            </View>
            <Text style={styles.userName}>{userSession.name}</Text>
            <Text style={styles.userEmail}>{userSession.email}</Text>
            <Text style={styles.userType}>
              {userSession.userType === "patient" ? "Patient" : "Doctor"}
            </Text>
          </View>
        </LinearGradient>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons
                name={isEditing ? "close" : "pencil"}
                size={20}
                color="#667eea"
              />
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Enter your phone number"
                value={userDetails.phone}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, phone: text })
                }
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Enter your address"
                value={userDetails.address}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, address: text })
                }
                editable={isEditing}
                multiline
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="DD/MM/YYYY"
                value={userDetails.dateOfBirth}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, dateOfBirth: text })
                }
                editable={isEditing}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Male/Female/Other"
                value={userDetails.gender}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, gender: text })
                }
                editable={isEditing}
              />
            </View>
          </View>

          {/* Weight & Height */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="fitness-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  placeholder="70"
                  value={userDetails.weight}
                  onChangeText={(text) =>
                    setUserDetails({ ...userDetails, weight: text })
                  }
                  editable={isEditing}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Height (cm)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="resize-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  placeholder="170"
                  value={userDetails.height}
                  onChangeText={(text) =>
                    setUserDetails({ ...userDetails, height: text })
                  }
                  editable={isEditing}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Emergency contact number"
                value={userDetails.emergencyContact}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, emergencyContact: text })
                }
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Blood Group */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="water-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="A+, B+, O+, etc."
                value={userDetails.bloodGroup}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, bloodGroup: text })
                }
                editable={isEditing}
              />
            </View>
          </View>

          {/* Occupation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Occupation</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Your occupation"
                value={userDetails.occupation}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, occupation: text })
                }
                editable={isEditing}
              />
            </View>
          </View>

          {/* Marital Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marital Status</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Single/Married/Other"
                value={userDetails.maritalStatus}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, maritalStatus: text })
                }
                editable={isEditing}
              />
            </View>
          </View>

          {/* Medical History */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical History</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="medical-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Any medical conditions or history"
                value={userDetails.medicalHistory}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, medicalHistory: text })
                }
                editable={isEditing}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Allergies */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergies</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="warning-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Any known allergies"
                value={userDetails.allergies}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, allergies: text })
                }
                editable={isEditing}
                multiline
              />
            </View>
          </View>

          {/* Save Button */}
          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveUserDetails}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.saveButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 5,
  },
  userType: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsContainer: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#667eea",
  },
  editButtonText: {
    marginLeft: 5,
    color: "#667eea",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    marginLeft: 12,
    color: "#374151",
  },
  inputDisabled: {
    color: "#6B7280",
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    ...Platform.select({
      ios: {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutButtonText: {
    marginLeft: 5,
    color: "#EF4444",
    fontWeight: "500",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 100,
  },
  loginButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: "center",
  },
  loginButtonText: {
    color: "white",
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 100, // Extra space at bottom to ensure logout button is visible
  },
});

export default ProfileScreen;
