import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
      style={[style, { backgroundColor: colors?.[0] || "#4ECDC4" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const PrescriptionView = () => {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showFullPrescription, setShowFullPrescription] = useState(false);

  // Lab Test Order States
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showLabConfirmModal, setShowLabConfirmModal] = useState(false);
  const [selectedLabTestsToOrder, setSelectedLabTestsToOrder] = useState([]);
  const [medicineOrderData, setMedicineOrderData] = useState(null);
  const [labTestOrders, setLabTestOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [reportViewVisible, setReportViewVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Sample prescriptions data with different doctors
  const samplePrescriptions = [
    {
      id: "P001",
      patientName: "John Doe",
      patientAge: "35",
      patientGender: "Male",
      doctorName: "Dr. Sarah Wilson",
      doctorSpecialty: "General Physician",
      doctorQualification: "MBBS, MD",
      doctorExperience: "12 years",
      hospitalName: "City Medical Center",
      hospitalAddress: "123 Main Street, Downtown",
      date: "2025-09-10",
      diagnosis: "Upper Respiratory Tract Infection",
      symptoms: ["Cough", "Fever", "Sore Throat", "Body Ache"],
      medicines: [
        {
          id: 1,
          name: "Azithromycin",
          type: "Tablet",
          dosage: "500mg",
          frequency: "Once daily",
          duration: "5 days",
          instructions: "Take after meals",
        },
        {
          id: 2,
          name: "Paracetamol",
          type: "Tablet",
          dosage: "650mg",
          frequency: "Twice daily",
          duration: "3 days",
          instructions: "Take when fever occurs",
        },
      ],
      advice: [
        "Take plenty of rest",
        "Drink warm water",
        "Avoid cold foods",
        "Return if symptoms persist after 5 days",
      ],
      nextVisit: "2025-09-18",
      prescriptionNumber: "RX-2025-001234",
    },
    {
      id: "P002",
      patientName: "John Doe",
      patientAge: "35",
      patientGender: "Male",
      doctorName: "Dr. Michael Chen",
      doctorSpecialty: "Cardiologist",
      doctorQualification: "MBBS, MD, DM Cardiology",
      doctorExperience: "15 years",
      hospitalName: "Heart Care Institute",
      hospitalAddress: "456 Health Avenue, Medical District",
      date: "2025-09-05",
      diagnosis: "Hypertension",
      symptoms: ["High Blood Pressure", "Headache", "Dizziness"],
      medicines: [
        {
          id: 1,
          name: "Amlodipine",
          type: "Tablet",
          dosage: "5mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take in the morning",
        },
        {
          id: 2,
          name: "Metoprolol",
          type: "Tablet",
          dosage: "25mg",
          frequency: "Twice daily",
          duration: "30 days",
          instructions: "Take with food",
        },
      ],
      advice: [
        "Monitor blood pressure daily",
        "Reduce salt intake",
        "Regular exercise",
        "Avoid stress",
      ],
      nextVisit: "2025-10-05",
      prescriptionNumber: "RX-2025-001235",
    },
    {
      id: "P003",
      patientName: "John Doe",
      patientAge: "35",
      patientGender: "Male",
      doctorName: "Dr. Priya Sharma",
      doctorSpecialty: "Dermatologist",
      doctorQualification: "MBBS, MD Dermatology",
      doctorExperience: "8 years",
      hospitalName: "Skin Care Clinic",
      hospitalAddress: "789 Beauty Lane, Wellness Center",
      date: "2025-08-28",
      diagnosis: "Eczema",
      symptoms: ["Dry Skin", "Itching", "Redness", "Inflammation"],
      medicines: [
        {
          id: 1,
          name: "Hydrocortisone Cream",
          type: "Cream",
          dosage: "1%",
          frequency: "Twice daily",
          duration: "14 days",
          instructions: "Apply thin layer on affected area",
        },
        {
          id: 2,
          name: "Cetirizine",
          type: "Tablet",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "10 days",
          instructions: "Take at bedtime",
        },
      ],
      advice: [
        "Keep skin moisturized",
        "Avoid harsh soaps",
        "Use cotton clothing",
        "Avoid scratching",
      ],
      nextVisit: "2025-09-15",
      prescriptionNumber: "RX-2025-001236",
    },
  ];

  useEffect(() => {
    loadPrescriptionsData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptionsData();
    setRefreshing(false);
  };

  const loadPrescriptionsData = async () => {
    try {
      setLoading(true);

      // Get patient email from session
      const userSession = await AsyncStorage.getItem("userSession");
      if (!userSession) {
        setPrescriptions([]);
        setLoading(false);
        return;
      }

      const sessionData = JSON.parse(userSession);
      const patientEmail = sessionData.email;
      setUserEmail(patientEmail);

      // Fetch prescriptions from Firebase
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/prescriptions.json",
      );
      const data = await response.json();

      if (data) {
        // Filter prescriptions for this patient
        const patientPrescriptions = Object.entries(data)
          .filter(
            ([key, prescription]) => prescription.patientEmail === patientEmail,
          )
          .map(([key, prescription]) => ({
            id: key,
            ...prescription,
          }));

        setPrescriptions(patientPrescriptions);
      } else {
        setPrescriptions([]);
      }

      // Load lab test orders
      await loadLabTestOrdersData(patientEmail);

      setLoading(false);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
      setPrescriptions([]);
      setLoading(false);
    }
  };

  const loadLabTestOrdersData = async (patientEmail) => {
    try {
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders.json",
      );
      const data = await response.json();

      if (data) {
        // Filter lab test orders for this patient
        const patientLabOrders = Object.entries(data)
          .filter(([key, order]) => order.patientEmail === patientEmail)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }));

        setLabTestOrders(patientLabOrders);
      } else {
        setLabTestOrders([]);
      }
    } catch (error) {
      console.error("Error loading lab test orders:", error);
      setLabTestOrders([]);
    }
  };

  const getLabReportForPrescription = (prescriptionId) => {
    return labTestOrders.find(
      (order) =>
        order.prescriptionId === prescriptionId &&
        order.reportStatus === "uploaded",
    );
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportViewVisible(true);
  };

  const handleOpenPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowFullPrescription(true);
  };

  const handleClosePrescription = () => {
    setShowFullPrescription(false);
    setSelectedPrescription(null);
  };

  const handleOrderMedicine = async (prescription) => {
    try {
      // Fetch user session to get email
      const userSession = await AsyncStorage.getItem("userSession");
      if (!userSession) {
        Alert.alert("Error", "User session not found. Please log in again.");
        return;
      }

      const sessionData = JSON.parse(userSession);
      const userEmail = sessionData.email;
      const userName = sessionData.name || "User";

      // Fetch user address from user-details
      const userDetailsResponse = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/user-details.json`,
      );
      const userDetailsData = await userDetailsResponse.json();

      let userAddress = "Address not found";
      if (userDetailsData) {
        // Find user details by email
        const userDetailsEntry = Object.entries(userDetailsData).find(
          ([key, details]) =>
            details.email === userEmail || details.userEmail === userEmail,
        );
        if (userDetailsEntry) {
          const [, details] = userDetailsEntry;
          userAddress =
            details.address || details.location || "Address not provided";
        }
      }

      // Check if there are lab tests
      if (
        prescription.requestedLabTests &&
        prescription.requestedLabTests.length > 0
      ) {
        // Store order data and show lab test modal
        setMedicineOrderData({
          prescription,
          userEmail,
          userName,
          userAddress,
        });
        setSelectedLabTestsToOrder(
          prescription.requestedLabTests.map((test, idx) => ({
            ...test,
            selected: true,
            index: idx,
          })),
        );
        setShowLabOrderModal(true);
      } else {
        // No lab tests, proceed with medicine order only
        showConfirmAndOrder(
          prescription,
          userEmail,
          userName,
          userAddress,
          null,
        );
      }
    } catch (error) {
      console.error("Error processing order:", error);
      Alert.alert("Error", "Failed to process order. Please try again.");
    }
  };

  const showConfirmAndOrder = (
    prescription,
    userEmail,
    userName,
    userAddress,
    labTests,
  ) => {
    const labTestsText =
      labTests && labTests.length > 0
        ? `\n\nLab Tests: ${labTests
            .filter((t) => t.selected)
            .map((t) => t.testName)
            .join(", ")}`
        : "";

    Alert.alert(
      "Confirm Order",
      `Are you sure you want to place this order?\n\nDelivery Address: ${userAddress}${labTestsText}`,
      [
        {
          text: "Cancel",
          onPress: () => {
            setShowLabOrderModal(false);
            console.log("Order cancelled");
          },
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            await saveMedicineOrder(
              prescription,
              userEmail,
              userName,
              userAddress,
            );
            if (labTests && labTests.length > 0) {
              const selectedTests = labTests.filter((t) => t.selected);
              if (selectedTests.length > 0) {
                await saveLabTestOrder(
                  prescription,
                  userEmail,
                  userName,
                  userAddress,
                  selectedTests,
                );
              }
            }
            setShowLabOrderModal(false);
            setShowLabConfirmModal(false);
          },
          style: "default",
        },
      ],
      { cancelable: false },
    );
  };

  const saveMedicineOrder = async (
    prescription,
    userEmail,
    userName,
    userAddress,
  ) => {
    try {
      const medicineOrder = {
        orderId: `MO-${Date.now()}`,
        prescriptionId: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        patientEmail: userEmail,
        patientName: userName,
        deliveryAddress: userAddress,
        doctorName: prescription.doctorName,
        doctorSpecialty: prescription.doctorSpecialty,
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines,
        orderDate: new Date().toISOString().split("T")[0],
        orderTime: new Date().toLocaleTimeString(),
        orderStatus: "pending",
        pharmacyStatus: "not-assigned",
      };

      // Save to medicine-orders node
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/medicine-orders.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(medicineOrder),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        Alert.alert(
          "Success",
          "Medicine order placed successfully! Your pharmacy will process it soon.",
          [
            {
              text: "OK",
              onPress: () => {
                handleClosePrescription();
              },
            },
          ],
        );
        console.log("Medicine order saved:", responseData);
      } else {
        Alert.alert(
          "Error",
          "Failed to save medicine order. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error saving medicine order:", error);
      Alert.alert("Error", "Failed to save medicine order. Please try again.");
    }
  };

  const saveLabTestOrder = async (
    prescription,
    userEmail,
    userName,
    userAddress,
    selectedTests,
  ) => {
    try {
      const labTestOrder = {
        labTestOrderId: `LTO-${Date.now()}`,
        prescriptionId: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        patientEmail: userEmail,
        patientName: userName,
        patientPhone: prescription.patientPhone || "",
        deliveryAddress: userAddress,
        doctorName: prescription.doctorName,
        doctorSpecialty: prescription.doctorSpecialty,
        diagnosis: prescription.diagnosis,
        requestedTests: selectedTests.map((test) => ({
          testId: test.testId,
          testName: test.testName,
          testDescription: test.testDescription,
          status: "pending",
        })),
        orderDate: new Date().toISOString().split("T")[0],
        orderTime: new Date().toLocaleTimeString(),
        orderStatus: "pending",
        sampleCollected: false,
      };

      // Save to lab-test-orders node
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(labTestOrder),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("Lab test order saved:", responseData);
      } else {
        Alert.alert(
          "Error",
          "Failed to save lab test order. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error saving lab test order:", error);
      Alert.alert("Error", "Failed to save lab test order. Please try again.");
    }
  };

  const renderPrescriptionListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.prescriptionCard}
      onPress={() => handleOpenPrescription(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.specialty}>{item.doctorSpecialty}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewText}>Tap to view prescription</Text>
        <Ionicons name="chevron-forward" size={20} color="#4ECDC4" />
      </View>
    </TouchableOpacity>
  );

  const renderMedicineCard = (medicine) => (
    <View key={medicine.id} style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <Text style={styles.medicineName}>{medicine.name}</Text>
        <Text style={styles.medicineType}>{medicine.type}</Text>
      </View>

      <View style={styles.medicineDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="medical-services" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Dosage: {medicine.dosage}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Frequency: {medicine.frequency}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Duration: {medicine.duration}</Text>
        </View>
        {medicine.instructions && (
          <View style={styles.detailRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.detailText}>
              Instructions: {medicine.instructions}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      {/* Header */}
      <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Prescriptions</Text>
          <Text style={styles.headerSubtitle}>
            {prescriptions.length} prescription
            {prescriptions.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </LinearGradient>

      {/* Prescription List */}
      <FlatList
        data={prescriptions}
        renderItem={renderPrescriptionListItem}
        keyExtractor={(item) => item.id}
        style={styles.prescriptionList}
        contentContainerStyle={styles.prescriptionListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4ECDC4"
          />
        }
      />

      {/* Full Prescription Modal */}
      <Modal
        visible={showFullPrescription}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

          {/* Modal Header */}
          <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
            <TouchableOpacity
              onPress={handleClosePrescription}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Prescription Details</Text>
            <View style={styles.headerButton} />
          </LinearGradient>

          {selectedPrescription && (
            <ScrollView
              style={styles.documentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Document Header */}
              <View style={styles.documentHeader}>
                <View style={styles.documentTitleSection}>
                  <Text style={styles.documentTitle}>MEDICAL PRESCRIPTION</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.prescriptionInfoRow}>
                  <View style={styles.prescriptionInfoLeft}>
                    <Text style={styles.prescriptionLabel}>
                      Prescription No:
                    </Text>
                    <Text style={styles.prescriptionValue}>
                      {selectedPrescription.prescriptionNumber}
                    </Text>
                  </View>
                  <View style={styles.prescriptionInfoRight}>
                    <Text style={styles.prescriptionLabel}>Date:</Text>
                    <Text style={styles.prescriptionValue}>
                      {selectedPrescription.date}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Document Body */}
              <View style={styles.documentBody}>
                {/* Diagnosis Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>DIAGNOSIS</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formFieldValue}>
                      {selectedPrescription.diagnosis}
                    </Text>
                  </View>
                </View>

                {/* Symptoms Section */}
                {selectedPrescription.symptoms &&
                  selectedPrescription.symptoms.length > 0 && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>SYMPTOMS</Text>
                      <View style={styles.formField}>
                        <Text style={styles.formFieldValue}>
                          {selectedPrescription.symptoms.join(", ")}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Prescription Table */}
                {selectedPrescription.medicines &&
                  selectedPrescription.medicines.length > 0 && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>
                        PRESCRIBED MEDICINES
                      </Text>

                      {/* Table Header */}
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                          Medicine
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                          Dosage
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                          Frequency
                        </Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                          Duration
                        </Text>
                      </View>

                      {/* Table Rows */}
                      {selectedPrescription.medicines.map((medicine, index) => (
                        <View key={medicine.id} style={styles.tableRow}>
                          <View style={[styles.tableCell, { flex: 2 }]}>
                            <Text style={styles.tableCellText}>
                              {medicine.name}
                            </Text>
                            <Text style={styles.tableCellSubText}>
                              ({medicine.type})
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { flex: 1 }]}>
                            <Text style={styles.tableCellText}>
                              {medicine.dosage}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { flex: 1.5 }]}>
                            <Text style={styles.tableCellText}>
                              {medicine.frequency}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { flex: 1 }]}>
                            <Text style={styles.tableCellText}>
                              {medicine.duration}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Instructions Section */}
                {selectedPrescription.medicines &&
                  selectedPrescription.medicines.length > 0 && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>INSTRUCTIONS</Text>
                      {selectedPrescription.medicines.map(
                        (medicine, index) =>
                          medicine.instructions && (
                            <View key={index} style={styles.instructionRow}>
                              <Text style={styles.instructionNumber}>
                                {index + 1}.
                              </Text>
                              <Text style={styles.instructionText}>
                                {medicine.name}: {medicine.instructions}
                              </Text>
                            </View>
                          ),
                      )}
                    </View>
                  )}

                {/* Doctor's Advice Section */}
                {selectedPrescription.advice &&
                  selectedPrescription.advice.length > 0 && (
                    <View style={styles.formSection}>
                      <Text style={styles.formSectionTitle}>
                        DOCTOR'S ADVICE
                      </Text>
                      {selectedPrescription.advice.map((advice, index) => (
                        <View key={index} style={styles.adviceRow}>
                          <Text style={styles.adviceNumber}>• </Text>
                          <Text style={styles.adviceText}>{advice}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Next Visit Section */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>NEXT VISIT</Text>
                  <View style={styles.formField}>
                    <Text style={styles.formFieldLabel}>Scheduled Date:</Text>
                    <Text style={styles.formFieldValue}>
                      {selectedPrescription.nextVisit}
                    </Text>
                  </View>
                </View>

                {/* Lab Tests Section */}
                {selectedPrescription.requestedLabTests &&
                  selectedPrescription.requestedLabTests.length > 0 && (
                    <View style={styles.formSection}>
                      <View style={styles.labTestSectionHeader}>
                        <MaterialIcons
                          name="science"
                          size={22}
                          color="#4ECDC4"
                        />
                        <Text style={styles.formSectionTitle}>
                          REQUESTED LAB TESTS
                        </Text>
                      </View>

                      {selectedPrescription.requestedLabTests.map(
                        (test, index) => {
                          const hasReport = getLabReportForPrescription(
                            selectedPrescription.id,
                          )
                            ? true
                            : false;
                          const displayStatus = hasReport
                            ? "completed"
                            : test.status;

                          return (
                            <View key={index} style={styles.labTestCard}>
                              <View style={styles.labTestCardHeader}>
                                <View style={styles.labTestNumber}>
                                  <Text style={styles.labTestNumberText}>
                                    {index + 1}
                                  </Text>
                                </View>
                                <View style={styles.labTestInfo}>
                                  <Text style={styles.labTestName}>
                                    {test.testName}
                                  </Text>
                                  <Text style={styles.labTestDescription}>
                                    {test.testDescription}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.labTestStatus,
                                    {
                                      backgroundColor:
                                        displayStatus === "pending"
                                          ? "#fef3c7"
                                          : "#d1fae5",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.labTestStatusText,
                                      {
                                        color:
                                          displayStatus === "pending"
                                            ? "#b45309"
                                            : "#047857",
                                      },
                                    ]}
                                  >
                                    {displayStatus === "pending"
                                      ? "Pending"
                                      : "Completed"}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.labTestDateInfo}>
                                <Ionicons
                                  name="calendar"
                                  size={14}
                                  color="#999"
                                />
                                <Text style={styles.labTestDate}>
                                  Requested: {test.requestedDate}
                                </Text>
                              </View>
                            </View>
                          );
                        },
                      )}

                      {/* Lab Report Section */}
                      {getLabReportForPrescription(selectedPrescription.id) && (
                        <View
                          style={[
                            styles.formSection,
                            {
                              marginTop: 20,
                              backgroundColor: "#e8f5e9",
                              borderLeftWidth: 4,
                              borderLeftColor: "#4CAF50",
                            },
                          ]}
                        >
                          <View style={styles.reportHeader}>
                            <Ionicons
                              name="document"
                              size={24}
                              color="#4CAF50"
                            />
                            <Text
                              style={[
                                styles.formSectionTitle,
                                { color: "#4CAF50", marginLeft: 10 },
                              ]}
                            >
                              LAB REPORT
                            </Text>
                          </View>
                          <View style={styles.reportInfo}>
                            <Text style={styles.reportInfoText}>
                              ✓ Report uploaded on{" "}
                              {
                                getLabReportForPrescription(
                                  selectedPrescription.id,
                                ).reportUploadedDate
                              }
                            </Text>
                            <Text style={styles.reportInfoText}>
                              Time:{" "}
                              {
                                getLabReportForPrescription(
                                  selectedPrescription.id,
                                ).reportUploadedTime
                              }
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.viewReportButton}
                            onPress={() =>
                              handleViewReport(
                                getLabReportForPrescription(
                                  selectedPrescription.id,
                                ),
                              )
                            }
                          >
                            <Ionicons name="image" size={18} color="white" />
                            <Text style={styles.viewReportButtonText}>
                              View Report Image
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                {/* Document Footer */}
                <View style={styles.documentFooter}>
                  <View style={styles.signatureSection}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>
                      Doctor's Signature
                    </Text>
                  </View>
                  <View style={styles.stampSection}>
                    <View style={styles.stampBox}>
                      <Text style={styles.stampText}>HOSPITAL STAMP</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.documentPadding} />

              {/* Order Medicine Button */}
              <View style={styles.orderButtonContainer}>
                <TouchableOpacity
                  style={styles.orderMedicineButton}
                  onPress={() => handleOrderMedicine(selectedPrescription)}
                >
                  <MaterialIcons
                    name="local-pharmacy"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.orderButtonText}>Order Medicine</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Lab Test Order Modal */}
      <Modal
        visible={showLabOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLabOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labOrderModalContainer}>
            <View style={styles.labOrderModalHeader}>
              <Text style={styles.labOrderModalTitle}>Lab Tests Available</Text>
              <Text style={styles.labOrderModalSubtitle}>
                Your doctor has suggested these lab tests
              </Text>
            </View>

            <ScrollView
              style={styles.labTestsScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {selectedLabTestsToOrder.length > 0 && (
                <View style={styles.labTestsList}>
                  {selectedLabTestsToOrder.map((test, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.labTestSelectionCard}
                      onPress={() => {
                        const updated = [...selectedLabTestsToOrder];
                        updated[index].selected = !updated[index].selected;
                        setSelectedLabTestsToOrder(updated);
                      }}
                    >
                      <View style={styles.labTestSelectionHeader}>
                        <View style={styles.labTestCheckbox}>
                          {test.selected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#4ECDC4"
                            />
                          )}
                          {!test.selected && (
                            <View style={styles.labTestUncheckedBox} />
                          )}
                        </View>
                        <View style={styles.labTestSelectionInfo}>
                          <Text style={styles.labTestSelectionName}>
                            {test.testName}
                          </Text>
                          <Text style={styles.labTestSelectionDescription}>
                            {test.testDescription}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.labOrderModalButtons}>
              <TouchableOpacity
                style={[styles.labOrderButton, styles.cancelButton]}
                onPress={() => {
                  setShowLabOrderModal(false);
                  showConfirmAndOrder(
                    medicineOrderData.prescription,
                    medicineOrderData.userEmail,
                    medicineOrderData.userName,
                    medicineOrderData.userAddress,
                    null,
                  );
                }}
              >
                <Text style={styles.cancelButtonText}>Medicine Only</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labOrderButton, styles.labOnlyButton]}
                onPress={() => {
                  const selected = selectedLabTestsToOrder.filter(
                    (t) => t.selected,
                  );
                  if (selected.length === 0) {
                    Alert.alert("Error", "Please select at least one lab test");
                    return;
                  }
                  setShowLabConfirmModal(true);
                }}
              >
                <Text style={styles.labOnlyButtonText}>Lab Tests Only</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labOrderButton, styles.bothButton]}
                onPress={() => {
                  const selected = selectedLabTestsToOrder.filter(
                    (t) => t.selected,
                  );
                  if (selected.length === 0) {
                    Alert.alert("Error", "Please select at least one lab test");
                    return;
                  }
                  setShowLabConfirmModal(true);
                }}
              >
                <Text style={styles.bothButtonText}>Both</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lab Home Collection Confirmation Modal */}
      <Modal
        visible={showLabConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLabConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalContent}>
              <Ionicons
                name="home"
                size={60}
                color="#4ECDC4"
                style={styles.confirmIcon}
              />

              <Text style={styles.confirmTitle}>Lab Sample Collection</Text>

              <Text style={styles.confirmMessage}>
                Our pharmacy team will visit your home to collect samples for
                the requested lab tests at your convenience.
              </Text>

              <View style={styles.confirmDetails}>
                <View style={styles.confirmDetailRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.confirmDetailText}>
                    Home sample collection
                  </Text>
                </View>
                <View style={styles.confirmDetailRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.confirmDetailText}>
                    Hygienic & hassle-free
                  </Text>
                </View>
                <View style={styles.confirmDetailRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.confirmDetailText}>
                    Quick results & updates
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.confirmButtonsSection}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.declineButton]}
                onPress={() => {
                  setShowLabConfirmModal(false);
                  setShowLabOrderModal(false);
                  showConfirmAndOrder(
                    medicineOrderData.prescription,
                    medicineOrderData.userEmail,
                    medicineOrderData.userName,
                    medicineOrderData.userAddress,
                    null,
                  );
                }}
              >
                <Text style={styles.declineButtonText}>Skip Tests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.acceptButton]}
                onPress={() => {
                  const selected = selectedLabTestsToOrder.filter(
                    (t) => t.selected,
                  );
                  showConfirmAndOrder(
                    medicineOrderData.prescription,
                    medicineOrderData.userEmail,
                    medicineOrderData.userName,
                    medicineOrderData.userAddress,
                    selected,
                  );
                }}
              >
                <Text style={styles.acceptButtonText}>Order Tests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report View Modal */}
      <Modal
        visible={reportViewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReportViewVisible(false)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContainer}>
            <View style={styles.reportModalHeader}>
              <TouchableOpacity onPress={() => setReportViewVisible(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.reportModalTitle}>Lab Report</Text>
              <View style={{ width: 28 }} />
            </View>

            {selectedReport && (
              <ScrollView style={styles.reportModalContent}>
                {/* Report Info */}
                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Test Report</Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.testsList}
                  </Text>

                  <Text style={[styles.reportDetailLabel, { marginTop: 12 }]}>
                    Uploaded Date
                  </Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.reportUploadedDate}
                  </Text>

                  <Text style={[styles.reportDetailLabel, { marginTop: 12 }]}>
                    Uploaded Time
                  </Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.reportUploadedTime}
                  </Text>
                </View>

                {/* Report Image */}
                {selectedReport.reportImage && (
                  <View style={styles.reportImageContainer}>
                    <Text style={styles.reportImageLabel}>Report Image</Text>
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${selectedReport.reportImage}`,
                      }}
                      style={styles.reportImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Doctor Info */}
                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>
                    Doctor Information
                  </Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.doctorName}
                  </Text>
                  <Text
                    style={[
                      styles.reportDetailValue,
                      { fontSize: 12, color: "#6B7280", marginTop: 4 },
                    ]}
                  >
                    {selectedReport.doctorSpecialty}
                  </Text>
                </View>

                {/* Diagnosis */}
                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>Diagnosis</Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.diagnosis}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
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
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  prescriptionList: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  prescriptionListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  prescriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  dateContainer: {
    backgroundColor: "#F0F8F8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: "#2D3748",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  viewText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },

  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ECDC4",
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  hospitalName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  diagnosisSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  diagnosisLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  diagnosisText: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
  },
  medicineCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicineCountText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  prescriptionHeader: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrescriptionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  modalPrescriptionDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  diagnosisTextFull: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    marginBottom: 16,
  },
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  symptomText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
  },
  medicineCard: {
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
  medicineHeader: {
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  medicineType: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  medicineDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  adviceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
  // Document/Form Styles
  documentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  documentHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  documentTitleSection: {
    alignItems: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 1,
  },
  dividerLine: {
    width: 80,
    height: 2,
    backgroundColor: "#4ECDC4",
    marginTop: 4,
  },
  prescriptionInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prescriptionInfoLeft: {
    flex: 1,
  },
  prescriptionInfoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  prescriptionLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  prescriptionValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "bold",
    marginTop: 2,
  },
  documentBody: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
  },
  formSection: {
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  formField: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formFieldLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 2,
  },
  formFieldValue: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: "#4ECDC4",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  tableCell: {
    justifyContent: "center",
  },
  tableCellText: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "500",
  },
  tableCellSubText: {
    fontSize: 10,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 1,
  },
  instructionRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 6,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#4ECDC4",
  },
  instructionNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4ECDC4",
    marginRight: 8,
    minWidth: 16,
  },
  instructionText: {
    fontSize: 12,
    color: "#374151",
    flex: 1,
    lineHeight: 16,
  },
  adviceRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  adviceNumber: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#22C55E",
    marginRight: 6,
    minWidth: 16,
  },
  documentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  signatureSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: "#374151",
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  stampSection: {
    alignItems: "flex-end",
  },
  stampBox: {
    width: 100,
    height: 60,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  stampText: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: "bold",
    textAlign: "center",
  },
  documentPadding: {
    height: 20,
  },
  orderButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  orderMedicineButton: {
    backgroundColor: "#4ECDC4",
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  // Lab Test Styles
  labTestSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  labTestCard: {
    backgroundColor: "#f0fffe",
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  labTestCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  labTestNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
  },
  labTestNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  labTestInfo: {
    flex: 1,
  },
  labTestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  labTestDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  labTestStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  labTestStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  labTestDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 44,
  },
  labTestDate: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  // Lab Order Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  labOrderModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "90%",
  },
  labOrderModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  labOrderModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  labOrderModalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  labTestsScrollContainer: {
    maxHeight: 350,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  labTestsList: {
    gap: 12,
  },
  labTestSelectionCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  labTestSelectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  labTestCheckbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  labTestUncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "white",
  },
  labTestSelectionInfo: {
    flex: 1,
  },
  labTestSelectionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  labTestSelectionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  labOrderModalButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  labOrderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  labOnlyButton: {
    backgroundColor: "#FEF3C7",
  },
  labOnlyButtonText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "600",
  },
  bothButton: {
    backgroundColor: "#4ECDC4",
  },
  bothButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  // Confirmation Modal Styles
  confirmModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  confirmModalContent: {
    alignItems: "center",
    marginBottom: 24,
  },
  confirmIcon: {
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmDetails: {
    gap: 12,
    backgroundColor: "#f0fffe",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
  },
  confirmDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmDetailText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  confirmButtonsSection: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  declineButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    backgroundColor: "#4ECDC4",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Report View Modal Styles
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reportInfo: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reportInfoText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
    marginBottom: 6,
  },
  viewReportButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  viewReportButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  reportModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    maxHeight: "90%",
    width: "100%",
    overflow: "hidden",
  },
  reportModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  reportModalContent: {
    padding: 16,
  },
  reportDetailSection: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  reportDetailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reportDetailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 22,
  },
  reportImageContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reportImageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  reportImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
    backgroundColor: "white",
  },
});

export default PrescriptionView;
