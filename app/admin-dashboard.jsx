import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../config/api.config";

const { width } = Dimensions.get("window");

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [adminName, setAdminName] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // New: All doctors including approved
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedTab, setSelectedTab] = useState("pending"); // New: For doctor management tabs

  const tabs = [
    { id: "Dashboard", label: "Dashboard", icon: "grid-outline" },
    { id: "Doctors", label: "All Doctors", icon: "people-outline" },
    { id: "Analytics", label: "Analytics", icon: "analytics-outline" },
    { id: "Settings", label: "Settings", icon: "settings-outline" },
  ];

  useEffect(() => {
    loadAdminData();
    loadDoctors();
    loadAllDoctors(); // New: Load all doctors
    loadVerifiedDoctors();
  }, []);

  const loadAdminData = async () => {
    try {
      const adminData = await AsyncStorage.getItem("adminData");
      if (adminData) {
        const admin = JSON.parse(adminData);
        setAdminName(admin.name || "Admin");
        setAdminPhoto(admin.photo);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
      const data = await response.json();

      if (data) {
        const doctorsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setDoctors(doctorsList);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // New function to load all doctors
  const loadAllDoctors = async () => {
    try {
      console.log("Loading all doctors...");
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/doctors.json",
      );
      const data = await response.json();

      console.log("Raw Firebase data:", data);

      if (data) {
        const allDoctorsList = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => {
            // Sort by registration date, newest first
            return (
              new Date(b.registrationDate || b.createdAt || 0) -
              new Date(a.registrationDate || a.createdAt || 0)
            );
          });

        console.log("Processed all doctors list:", allDoctorsList);
        console.log("Number of doctors loaded:", allDoctorsList.length);

        setAllDoctors(allDoctorsList);
      } else {
        console.log("No doctor data received from Firebase");
        setAllDoctors([]);
      }
    } catch (error) {
      console.error("Error loading all doctors:", error);
      Alert.alert("Error", "Failed to load doctors data");
    }
  };

  const loadVerifiedDoctors = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.FIREBASE.VERIFICATION);
      const data = await response.json();

      if (data) {
        const verifiedDoctorsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setVerifiedDoctors(verifiedDoctorsList);
      }
    } catch (error) {
      console.error("Error loading verified doctors:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    await loadAllDoctors(); // Refresh all doctors too
    await loadVerifiedDoctors();
    setRefreshing(false);
  };

  const updateDoctorStatus = async (doctorId, status) => {
    try {
      await fetch(API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status }),
      });

      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === doctorId
            ? { ...doctor, verificationStatus: status }
            : doctor,
        ),
      );

      // Update all doctors list too
      setAllDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === doctorId
            ? { ...doctor, verificationStatus: status }
            : doctor,
        ),
      );

      Alert.alert("Success", `Doctor ${status} successfully!`);
    } catch (error) {
      console.error("Error updating doctor status:", error);
      Alert.alert("Error", "Failed to update doctor status");
    }
  };

  // New function to delete doctor
  const deleteDoctor = async (doctorId, doctorName) => {
    Alert.alert(
      "Delete Doctor",
      `Are you sure you want to permanently delete Dr. ${doctorName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from doctors database
              await fetch(API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId), {
                method: "DELETE",
              });

              // Also try to delete from verification if exists
              try {
                const verificationResponse = await fetch(
                  API_ENDPOINTS.FIREBASE.VERIFICATION,
                );
                const verificationData = await verificationResponse.json();

                if (verificationData) {
                  const verificationEntry = Object.keys(verificationData).find(
                    (key) => verificationData[key].doctorId === doctorId,
                  );

                  if (verificationEntry) {
                    await fetch(
                      API_ENDPOINTS.FIREBASE.VERIFICATION_BY_ID(
                        verificationEntry,
                      ),
                      { method: "DELETE" },
                    );
                  }
                }
              } catch (verificationError) {
                console.log(
                  "No verification record found or error deleting:",
                  verificationError,
                );
              }

              // Update local state
              setDoctors((prev) =>
                prev.filter((doctor) => doctor.id !== doctorId),
              );
              setAllDoctors((prev) =>
                prev.filter((doctor) => doctor.id !== doctorId),
              );
              setVerifiedDoctors((prev) =>
                prev.filter((doctor) => doctor.doctorId !== doctorId),
              );

              Alert.alert(
                "Success",
                `Dr. ${doctorName} has been deleted successfully.`,
              );
            } catch (error) {
              console.error("Error deleting doctor:", error);
              Alert.alert(
                "Error",
                "Failed to delete doctor. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Simple connectivity test
  const testServerConnectivity = async () => {
    try {
      console.log("Testing server connectivity...");
      const response = await fetch(API_ENDPOINTS.EMAIL.STATUS, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Connectivity test - Status:", response.status);
      const text = await response.text();
      console.log("Connectivity test - Response:", text);

      Alert.alert(
        "Connectivity Test",
        `Server Status: ${response.status}\nResponse: ${text.substring(0, 100)}...`,
      );
    } catch (error) {
      console.error("Connectivity test failed:", error);
      Alert.alert("Connectivity Test Failed", `Error: ${error.message}`);
    }
  };

  const sendVerificationEmail = async (
    doctorEmail,
    doctorName,
    verificationCode,
  ) => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.SEND, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: doctorName,
          email: doctorEmail,
          verification_code: verificationCode,
        }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      if (!response.ok) {
        console.error("HTTP Error:", response.status);
        return false;
      }

      const result = JSON.parse(text);
      return result.success === true;
    } catch (error) {
      console.error("Email error:", error.message);
      return false;
    }
  };

  const approveDoctorAndCreateVerification = async (doctor) => {
    try {
      // Show loading state
      Alert.alert(
        "Processing",
        "Approving doctor and sending verification email...",
        [],
        { cancelable: false },
      );

      const verificationCode = generateVerificationCode();

      // 1. Update doctor status to 'approved' in doctors node (preserve all data)
      const updatedDoctorData = {
        ...doctor,
        verificationStatus: "approved",
        approvedAt: new Date().toISOString(),
        verificationCode: verificationCode,
      };

      const doctorUpdateResponse = await fetch(
        API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctor.id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDoctorData),
        },
      );

      if (!doctorUpdateResponse.ok) {
        throw new Error("Failed to update doctor status");
      }

      // 2. Create verification record for email/verification purposes
      const verificationData = {
        email: doctor.email,
        name: doctor.name,
        verificationCode: verificationCode,
        doctorId: doctor.id,
        createdAt: new Date().toISOString(),
        status: "approved",
        emailSent: false,
        emailSentAt: null,
        // Include essential doctor info for verification reference
        specialty: doctor.specialty,
        phone: doctor.phone,
        licenseNumber: doctor.licenseNumber,
      };

      // Store in verification node
      const verificationResponse = await fetch(
        API_ENDPOINTS.FIREBASE.VERIFICATION,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verificationData),
        },
      );

      if (!verificationResponse.ok) {
        throw new Error("Failed to create verification record");
      }

      // 3. Send verification email
      const emailSent = await sendVerificationEmail(
        doctor.email,
        doctor.name,
        verificationCode,
      );

      // 4. Update verification record with email status
      const verificationResult = await verificationResponse.json();
      const verificationId = verificationResult.name;

      await fetch(API_ENDPOINTS.FIREBASE.VERIFICATION_BY_ID(verificationId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSent: emailSent,
          emailSentAt: emailSent ? new Date().toISOString() : null,
        }),
      });

      // 5. Update local state to reflect the approval
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? {
                ...d,
                verificationStatus: "approved",
                verificationCode: verificationCode,
              }
            : d,
        ),
      );

      // Update allDoctors list too
      setAllDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? {
                ...d,
                verificationStatus: "approved",
                verificationCode: verificationCode,
              }
            : d,
        ),
      );

      // 6. Reload verified doctors to update the verification list
      await loadVerifiedDoctors();

      // Show success message
      Alert.alert(
        "Doctor Approved Successfully!",
        `Dr. ${doctor.name} has been approved and notified!\n\n` +
          `✅ Verification Code: ${verificationCode}\n` +
          `📧 Email Status: ${emailSent ? "Sent Successfully" : "Failed to Send"}\n` +
          `📮 Sent to: ${doctor.email}\n\n` +
          `${
            emailSent
              ? "The doctor will receive an email with their verification code and can now access the doctor verification portal."
              : "Please manually share the verification code with the doctor as the email failed to send."
          }\n\n` +
          `💾 Doctor data has been preserved in the doctors database with approved status.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error approving doctor:", error);
      Alert.alert(
        "Approval Failed",
        `Failed to approve Dr. ${doctor.name}. Please try again.\n\nError: ${error.message}`,
        [{ text: "OK" }],
      );
    }
  };

  // Test Email Function
  const testEmailFunctionality = async () => {
    const emailData = {
      name: "Admin Test",
      email: "99220042003@klu.ac.in",
      verification_code: "TEST",
    };

    try {
      console.log("=== EMAIL TEST STARTED ===");
      console.log("Testing email functionality...");
      console.log(
        "Sending test email with data:",
        JSON.stringify(emailData, null, 2),
      );

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Changed from 30000 to 60000

      const response = await fetch(API_ENDPOINTS.EMAIL.SEND, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(emailData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("=== RESPONSE RECEIVED ===");
      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);
      console.log("Response ok:", response.ok);
      console.log(
        "Response headers:",
        JSON.stringify([...response.headers.entries()]),
      );

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        console.error("=== HTTP ERROR ===");
        console.error("HTTP Error:", response.status, response.statusText);
        console.error("Error text:", errorText);
        Alert.alert(
          "Test Failed",
          `HTTP Error ${response.status}: ${response.statusText}\n\n${errorText}`,
        );
        return false;
      }

      // Get response as text first
      const responseText = await response.text();
      console.log("=== RAW RESPONSE ===");
      console.log("Raw response text:", responseText);
      console.log("Response length:", responseText.length);

      // Check if response is empty
      if (!responseText || responseText.trim() === "") {
        console.error("=== EMPTY RESPONSE ===");
        Alert.alert("Test Failed", "Server returned empty response");
        return false;
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("=== PARSED JSON ===");
        console.log("Parsed result:", JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.error("=== JSON PARSE ERROR ===");
        console.error("JSON Parse Error:", parseError.message);
        console.error("Response was:", responseText);
        Alert.alert(
          "Test Failed",
          `Invalid JSON response from server:\n\n${responseText.substring(0, 200)}...`,
        );
        return false;
      }

      // Check for success in the result
      console.log("=== SUCCESS CHECK ===");
      console.log("result.success type:", typeof result.success);
      console.log("result.success value:", result.success);
      console.log("result.message:", result.message);
      console.log("result.error:", result.error);

      if (result.success === true || result.success === "true") {
        console.log("=== SUCCESS! ===");
        Alert.alert(
          "Success!",
          `Test email sent successfully to 99220042003@klu.ac.in!\n\nMessage: ${result.message || "Email sent"}\n\nServer Response: ${responseText}`,
        );
        return true;
      } else {
        console.error("=== EMAIL FAILED ===");
        const errorMsg = result.error || result.message || "Unknown error";
        console.error("Flask email error:", errorMsg);
        Alert.alert(
          "Test Failed",
          `Email failed: ${errorMsg}\n\nFull Response: ${responseText}`,
        );
        return false;
      }
    } catch (error) {
      console.error("=== CATCH ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      let errorMessage = `Network error: ${error.message}`;

      if (error.name === "AbortError") {
        errorMessage =
          "Request timed out after 30 seconds. Server might be slow or down.";
      } else if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        errorMessage =
          "Network connection failed. Check your internet connection.";
      }

      Alert.alert(
        "Test Failed",
        `${errorMessage}\n\nError Details:\nType: ${error.name}\nMessage: ${error.message}\n\nMake sure you have internet connection and the server is running.`,
      );
      return false;
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("adminData");
          router.replace("/landing");
        },
      },
    ]);
  };

  const renderDoctorCard = ({ item, showActions = true }) => {
    const isExpanded = expandedCards[item.id] || false;

    const toggleExpanded = () => {
      setExpandedCards((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    };

    return (
      <View style={styles.doctorCard}>
        <View style={styles.doctorHeader}>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr. {item.name}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>

            {/* Basic Details - Always Visible */}
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorDetail}>📧 {item.email}</Text>
              <Text style={styles.doctorDetail}>📞 {item.phone}</Text>
              <Text style={styles.doctorDetail}>
                🏥 {item.experience} years exp.
              </Text>
              {/* LICENSE - ALWAYS VISIBLE NOW */}
              <View style={styles.licenseContainer}>
                <Text style={styles.licenseLabel}>🆔 Medical License:</Text>
                <Text style={styles.licenseNumber}>
                  {item.licenseNumber || item.license || "Not provided"}
                </Text>
              </View>
            </View>

            {/* Extended Details - Show More */}
            {isExpanded && (
              <View style={styles.extendedDetails}>
                <Text style={styles.detailSeparator}>• • •</Text>
                <Text style={styles.doctorDetail}>
                  🎓 Qualification: {item.qualification || "Not provided"}
                </Text>
                <Text style={styles.doctorDetail}>
                  🏥 Hospital: {item.hospitalAffiliation || "Not provided"}
                </Text>
                <Text style={styles.doctorDetail}>
                  📍 Address: {item.address || "Not provided"}
                </Text>
                <Text style={styles.doctorDetail}>
                  💰 Consultation Fee: ₹
                  {item.consultationFee || "Not specified"}
                </Text>
                {item.registrationDate && (
                  <Text style={styles.doctorDetail}>
                    📅 Registered:{" "}
                    {new Date(item.registrationDate).toLocaleDateString()}
                  </Text>
                )}
                {item.approvedAt && (
                  <Text style={styles.doctorDetail}>
                    ✅ Approved:{" "}
                    {new Date(item.approvedAt).toLocaleDateString()}
                  </Text>
                )}
                {item.verificationCode && (
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>🔑 Verification Code:</Text>
                    <Text style={styles.codeValue}>
                      {item.verificationCode}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Show More/Less Button */}
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={toggleExpanded}
            >
              <Text style={styles.showMoreText}>
                {isExpanded ? "Show Less" : "Show More"}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="#667eea"
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  (item.verificationStatus || item.status) === "approved"
                    ? "#dcfce7"
                    : (item.verificationStatus || item.status) === "rejected"
                      ? "#fef2f2"
                      : "#fef3c7",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    (item.verificationStatus || item.status) === "approved"
                      ? "#16a34a"
                      : (item.verificationStatus || item.status) === "rejected"
                        ? "#dc2626"
                        : "#d97706",
                },
              ]}
            >
              {(item.verificationStatus || item.status)?.toUpperCase() ||
                "PENDING"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.doctorActions}>
            {/* Pending Status Actions */}
            {((item.verificationStatus || item.status) === "pending" ||
              !(item.verificationStatus || item.status)) && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => approveDoctorAndCreateVerification(item)}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => updateDoctorStatus(item.id, "rejected")}
                >
                  <Ionicons name="close" size={16} color="white" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Status Change Actions for Approved/Rejected */}
            {(item.verificationStatus || item.status) === "approved" && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => updateDoctorStatus(item.id, "rejected")}
              >
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.actionBtnText}>Revoke Approval</Text>
              </TouchableOpacity>
            )}

            {(item.verificationStatus || item.status) === "rejected" && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => approveDoctorAndCreateVerification(item)}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
            )}

            {/* Delete Button - Always Available */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => deleteDoctor(item.id, item.name)}
            >
              <Ionicons name="trash" size={16} color="white" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderDashboard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {[
            {
              title: "Total Doctors",
              value: allDoctors.length.toString(),
              icon: "people",
              color: "#3b82f6",
            },
            {
              title: "Approved",
              value: allDoctors
                .filter((d) => d.verificationStatus === "approved")
                .length.toString(),
              icon: "checkmark-circle",
              color: "#10b981",
            },
            {
              title: "Pending",
              value: allDoctors
                .filter(
                  (d) =>
                    !d.verificationStatus || d.verificationStatus === "pending",
                )
                .length.toString(),
              icon: "time",
              color: "#f59e0b",
            },
            {
              title: "Rejected",
              value: allDoctors
                .filter((d) => d.verificationStatus === "rejected")
                .length.toString(),
              icon: "close-circle",
              color: "#ef4444",
            },
          ].map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statLabel}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            {
              title: "All Doctors",
              icon: "people",
              color: "#8b5cf6",
              action: () => {
                console.log("All Doctors button clicked");
                loadAllDoctors(); // Force reload
                setActiveTab("Doctors");
                setSelectedTab("all");
              },
            },
            {
              title: "Force Reload",
              icon: "refresh-circle",
              color: "#dc2626",
              action: () => {
                console.log("Force reload clicked");
                loadAllDoctors();
                Alert.alert(
                  "Reload",
                  "Attempting to reload all doctors data...",
                );
              },
            },
            {
              title: "Test Connectivity",
              icon: "wifi",
              color: "#84cc16",
              action: testServerConnectivity,
            },
            {
              title: "Test Email",
              icon: "mail",
              color: "#f97316",
              action: testEmailFunctionality,
            },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.action}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Doctor Requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => setActiveTab("Doctors")}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {doctors
          .filter(
            (d) => !d.verificationStatus || d.verificationStatus === "pending",
          )
          .slice(0, 3)
          .map((doctor) => (
            <View key={doctor.id}>
              {renderDoctorCard({ item: doctor, showActions: true })}
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderDoctors = () => {
    console.log("Rendering doctors page, allDoctors state:", allDoctors);
    console.log("Selected tab:", selectedTab);

    const getDoctorsByCategory = () => {
      switch (selectedTab) {
        case "pending":
          const pending = allDoctors.filter(
            (d) => !d.verificationStatus || d.verificationStatus === "pending",
          );
          console.log("Pending doctors:", pending);
          return pending;
        case "approved":
          const approved = allDoctors.filter(
            (d) => d.verificationStatus === "approved",
          );
          console.log("Approved doctors:", approved);
          return approved;
        case "rejected":
          const rejected = allDoctors.filter(
            (d) => d.verificationStatus === "rejected",
          );
          console.log("Rejected doctors:", rejected);
          return rejected;
        case "all":
        default:
          console.log("All doctors:", allDoctors);
          return allDoctors;
      }
    };

    const currentDoctors = getDoctorsByCategory();
    console.log("Current doctors to display:", currentDoctors);

    return (
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Doctor Management</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                console.log("Current doctors state:", {
                  doctors: doctors.length,
                  allDoctors: allDoctors.length,
                  verifiedDoctors: verifiedDoctors.length,
                });
                Alert.alert(
                  "Debug Info",
                  `Doctors: ${doctors.length}\nAll Doctors: ${allDoctors.length}\nVerified: ${verifiedDoctors.length}`,
                );
              }}
              style={{ padding: 5 }}
            >
              <Ionicons name="bug" size={18} color="#dc2626" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor Category Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { id: "all", label: "All", count: allDoctors.length },
            {
              id: "pending",
              label: "Pending",
              count: allDoctors.filter(
                (d) =>
                  !d.verificationStatus || d.verificationStatus === "pending",
              ).length,
            },
            {
              id: "approved",
              label: "Approved",
              count: allDoctors.filter(
                (d) => d.verificationStatus === "approved",
              ).length,
            },
            {
              id: "rejected",
              label: "Rejected",
              count: allDoctors.filter(
                (d) => d.verificationStatus === "rejected",
              ).length,
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                selectedTab === tab.id && styles.activeTabBtn,
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  selectedTab === tab.id && styles.activeCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedTab === tab.id && styles.activeCountText,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {loadingDoctors ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : (
          <FlatList
            data={currentDoctors}
            renderItem={({ item }) =>
              renderDoctorCard({ item, showActions: true })
            }
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>
                  {selectedTab === "pending"
                    ? "No Pending Requests"
                    : selectedTab === "approved"
                      ? "No Approved Doctors"
                      : selectedTab === "rejected"
                        ? "No Rejected Doctors"
                        : "No Doctors Found"}
                </Text>
                <Text style={styles.emptyText}>
                  {selectedTab === "pending"
                    ? "All doctor registration requests have been processed"
                    : selectedTab === "approved"
                      ? "No doctors have been approved yet"
                      : selectedTab === "rejected"
                        ? "No doctors have been rejected"
                        : "No doctors are registered in the system"}
                </Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return renderDashboard();
      case "Doctors":
        return renderDoctors();
      case "Analytics":
        return (
          <View style={styles.comingSoon}>
            <Ionicons name="analytics-outline" size={64} color="#9ca3af" />
            <Text style={styles.comingSoonTitle}>Analytics</Text>
            <Text style={styles.comingSoonText}>
              Advanced analytics coming soon
            </Text>
          </View>
        );
      case "Settings":
        return (
          <View style={styles.comingSoon}>
            <Ionicons name="settings-outline" size={64} color="#9ca3af" />
            <Text style={styles.comingSoonTitle}>Settings</Text>
            <Text style={styles.comingSoonText}>
              System settings coming soon
            </Text>
          </View>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#f8fafc"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <View style={styles.backIconContainer}>
            <Ionicons name="arrow-back" size={22} color="#667eea" />
          </View>
        </TouchableOpacity>

        <View style={styles.adminProfile}>
          <Text style={styles.adminTitle}>{adminName || "Admin"}</Text>
          <View style={styles.profileIcon}>
            {adminPhoto ? (
              <Image
                source={{ uri: adminPhoto }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={20} color="#667eea" />
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>{renderContent()}</View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navBtn, activeTab === tab.id && styles.activeNavBtn]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.navCard}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? "#667eea" : "#9ca3af"}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === tab.id && styles.activeNavText,
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    backgroundColor: "#f7f9fc",
  },
  backButton: {
    padding: 8,
  },
  backIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  adminProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
  },
  viewAll: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2d3748",
  },
  statLabel: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "500",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    padding: 24,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    textAlign: "center",
  },
  doctorCard: {
    padding: 24,
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  doctorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#667eea",
    marginBottom: 12,
    fontWeight: "600",
  },
  doctorDetails: {
    gap: 6,
    marginBottom: 12,
  },
  doctorDetail: {
    fontSize: 13,
    color: "#718096",
  },
  extendedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  detailSeparator: {
    fontSize: 12,
    color: "#cbd5e0",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#f7fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  showMoreText: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "600",
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  doctorActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  approveBtn: {
    backgroundColor: "#48bb78",
  },
  rejectBtn: {
    backgroundColor: "#e53e3e",
  },
  deleteBtn: {
    backgroundColor: "#dc2626",
  },
  actionBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // New styles for license display
  licenseContainer: {
    backgroundColor: "#f0f4ff",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#667eea",
  },
  licenseLabel: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "600",
    marginBottom: 2,
  },
  licenseNumber: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "700",
  },

  // New styles for verification code
  codeContainer: {
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#16a34a",
  },
  codeLabel: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "800",
    letterSpacing: 1,
  },

  // New styles for tabs
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTabBtn: {
    backgroundColor: "#667eea",
  },
  tabText: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  activeTabText: {
    color: "white",
  },
  countBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCountBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  countText: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "700",
  },
  activeCountText: {
    color: "white",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#718096",
  },
  comingSoon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d3748",
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  navCard: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 60,
    gap: 4,
  },
  activeNavBtn: {
    backgroundColor: "transparent",
  },
  navText: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
  activeNavText: {
    color: "#667eea",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AdminDashboard;
