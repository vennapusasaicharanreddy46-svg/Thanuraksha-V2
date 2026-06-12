import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../config/api.config";

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

const AddPrescription = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAppointmentList, setShowAppointmentList] = useState(true);
  const [loading, setLoading] = useState(false);

  // Prescription form states
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [advice, setAdvice] = useState("");
  const [nextVisit, setNextVisit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Lab test states
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showNeedsLabModal, setShowNeedsLabModal] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [prescriptionToSubmit, setPrescriptionToSubmit] = useState(null);

  // Lab Test Types
  const labTestTypes = [
    {
      id: '1',
      name: 'Blood Test',
      icon: 'water',
      color: '#e74c3c',
      description: 'Complete Blood Count & Analysis',
    },
    {
      id: '2',
      name: 'Urine Test',
      icon: 'beaker',
      color: '#f39c12',
      description: 'Urinalysis & Kidney Function',
    },
    {
      id: '3',
      name: 'ECG Test',
      icon: 'heart',
      color: '#e91e63',
      description: 'Electrocardiogram - Heart Analysis',
    },
    {
      id: '4',
      name: 'Vision Test',
      icon: 'eye',
      color: '#9c27b0',
      description: 'Eye Evaluation & Prescription',
    },
    {
      id: '5',
      name: 'Stool Test',
      icon: 'flask',
      color: '#795548',
      description: 'Stool Analysis & Parasites',
    },
  ];

  useEffect(() => {
    loadDoctorData();
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    }
  }, [doctorId]);

  useEffect(() => {
    // Filter appointments based on search query
    const filtered = appointments.filter(
      (apt) =>
        apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  const loadDoctorData = async () => {
    try {
      const doctorSession = await AsyncStorage.getItem("doctorSession");
      if (doctorSession) {
        const sessionData = JSON.parse(doctorSession);
        setDoctorId(sessionData.doctorId);
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
      Alert.alert("Error", "Failed to load doctor information");
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.FIREBASE.APPOINTMENTS);
      const data = await response.json();

      if (data) {
        const doctorAppointments = Object.entries(data)
          .filter(([key, appointment]) => appointment.doctorId === doctorId)
          .map(([key, appointment]) => ({
            id: key,
            ...appointment,
          }));

        setAppointments(doctorAppointments);
        setFilteredAppointments(doctorAppointments);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const addMedicineField = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeMedicineField = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index][field] = value;
    setMedicines(updatedMedicines);
  };

  const validateForm = () => {
    if (!selectedAppointment) {
      Alert.alert("Error", "Please select an appointment");
      return false;
    }
    if (!diagnosis.trim()) {
      Alert.alert("Error", "Please enter diagnosis");
      return false;
    }
    if (medicines.filter((m) => m.name.trim()).length === 0) {
      Alert.alert("Error", "Please add at least one medicine");
      return false;
    }
    return true;
  };

  const savePrescription = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Filter out empty medicines
      const filteredMedicines = medicines
        .filter((m) => m.name.trim())
        .map((m, index) => ({
          id: index + 1,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
        }));

      // Create prescription object
      const prescription = {
        appointmentId: selectedAppointment.id,
        patientEmail: selectedAppointment.patientEmail,
        patientName: selectedAppointment.patientName,
        patientPhone: selectedAppointment.patientPhone || "",
        doctorId: doctorId,
        doctorName: selectedAppointment.doctorName || "Doctor",
        hospitalName: selectedAppointment.hospitalName || "Hospital",
        prescriptionDate: new Date().toISOString().split("T")[0],
        diagnosis: diagnosis,
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        medicines: filteredMedicines,
        advice: advice
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a),
        nextVisit: nextVisit || null,
        prescriptionNumber: `RX-${Date.now()}`,
        status: "active",
      };

      // Store prescription and show lab test modal
      setPrescriptionToSubmit(prescription);
      setSelectedLabTests([]);
      setShowNeedsLabModal(true);
      setSubmitting(false);
    } catch (error) {
      console.error("Error preparing prescription:", error);
      Alert.alert("Error", `Error: ${error.message}`);
      setSubmitting(false);
    }
  };

  const toggleLabTest = (testId) => {
    setSelectedLabTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const submitPrescriptionWithLabs = async () => {
    if (!prescriptionToSubmit) return;

    try {
      setSubmitting(true);

      // Add lab tests to prescription if any selected
      const finalPrescription = {
        ...prescriptionToSubmit,
        requestedLabTests: selectedLabTests
          .map((testId) => {
            const test = labTestTypes.find((t) => t.id === testId);
            return {
              testId: test.id,
              testName: test.name,
              testDescription: test.description,
              requestedDate: new Date().toISOString().split("T")[0],
              status: "pending",
            };
          })
          .filter((t) => t),
      };

      // Save to Firebase
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/prescriptions.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalPrescription),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save prescription: ${response.status}`);
      }

      const result = await response.json();
      console.log("Prescription saved with ID:", result.name);

      // Send prescription email to patient
      await sendPrescriptionEmail(finalPrescription);

      Alert.alert(
        "Success",
        `Prescription added successfully!${selectedLabTests.length > 0 ? " Lab tests requested." : ""}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setSelectedAppointment(null);
              setDiagnosis("");
              setSymptoms("");
              setMedicines([
                {
                  name: "",
                  dosage: "",
                  frequency: "",
                  duration: "",
                  instructions: "",
                },
              ]);
              setAdvice("");
              setNextVisit("");
              setShowAppointmentList(true);
              setShowNeedsLabModal(false);
              setShowLabTestModal(false);
              setPrescriptionToSubmit(null);
              setSelectedLabTests([]);
              loadAppointments(); // Reload appointments
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error saving prescription:", error);
      Alert.alert("Error", `Failed to save prescription: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const sendPrescriptionEmail = async (prescription) => {
    try {
      const emailResponse = await fetch(API_ENDPOINTS.EMAIL.SEND, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_email: prescription.patientEmail,
          prescription_number: prescription.prescriptionNumber,
          patient_name: prescription.patientName,
          doctor_name: prescription.doctorName,
          diagnosis: prescription.diagnosis,
          date: prescription.prescriptionDate,
        }),
      });

      if (!emailResponse.ok) {
        console.warn("Failed to send email notification");
      }
    } catch (error) {
      console.warn("Error sending prescription email:", error);
      // Don't fail the whole operation if email fails
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        setSelectedAppointment(item);
        setShowAppointmentList(false);
      }}
    >
      <View style={styles.appointmentHeader}>
        <View>
          <Text style={styles.appointmentPatientName}>{item.patientName}</Text>
          <Text style={styles.appointmentEmail}>{item.patientEmail}</Text>
        </View>
        <View style={styles.appointmentDate}>
          <Text style={styles.appointmentDateText}>{item.selectedDate}</Text>
          <Text style={styles.appointmentTime}>{item.selectedTime}</Text>
        </View>
      </View>
      <View style={styles.appointmentFooter}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "confirmed" ? "#4ECDC4" : "#FFA500",
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (showAppointmentList) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={["#4ECDC4", "#44A08D"]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Prescription</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name or email"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text>Loading appointments...</Text>
          </View>
        ) : filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.centerContainer}>
            <MaterialIcons name="event-busy" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Prescription form
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#4ECDC4", "#44A08D"]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowAppointmentList(true)}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Prescription</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{selectedAppointment.patientName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {selectedAppointment.patientEmail}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {selectedAppointment.selectedDate}
            </Text>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter diagnosis"
            placeholderTextColor="#999"
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms (comma-separated)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Fever, Cough, Sore Throat"
            placeholderTextColor="#999"
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Medicines */}
        <View style={styles.section}>
          <View style={styles.medicineHeader}>
            <Text style={styles.sectionTitle}>Medicines</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={addMedicineField}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((medicine, index) => (
            <View key={index} style={styles.medicineCard}>
              <View style={styles.medicineField}>
                <Text style={styles.fieldLabel}>Medicine Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Azithromycin"
                  placeholderTextColor="#999"
                  value={medicine.name}
                  onChangeText={(value) =>
                    updateMedicine(index, "name", value)
                  }
                />
              </View>

              <View style={styles.medicineFieldRow}>
                <View style={[styles.medicineField, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Dosage</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 500mg"
                    placeholderTextColor="#999"
                    value={medicine.dosage}
                    onChangeText={(value) =>
                      updateMedicine(index, "dosage", value)
                    }
                  />
                </View>
                <View style={[styles.medicineField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Frequency</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Twice daily"
                    placeholderTextColor="#999"
                    value={medicine.frequency}
                    onChangeText={(value) =>
                      updateMedicine(index, "frequency", value)
                    }
                  />
                </View>
              </View>

              <View style={styles.medicineFieldRow}>
                <View style={[styles.medicineField, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Duration</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5 days"
                    placeholderTextColor="#999"
                    value={medicine.duration}
                    onChangeText={(value) =>
                      updateMedicine(index, "duration", value)
                    }
                  />
                </View>
                {medicines.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedicineField(index)}
                  >
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.medicineField}>
                <Text style={styles.fieldLabel}>Instructions</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Take after meals"
                  placeholderTextColor="#999"
                  value={medicine.instructions}
                  onChangeText={(value) =>
                    updateMedicine(index, "instructions", value)
                  }
                />
              </View>
            </View>
          ))}
        </View>

        {/* Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advice (comma-separated)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Take rest, Drink water, Avoid cold foods"
            placeholderTextColor="#999"
            value={advice}
            onChangeText={setAdvice}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Next Visit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Visit Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={nextVisit}
            onChangeText={setNextVisit}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={savePrescription}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Saving..." : "Save Prescription"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Lab Test Need Modal */}
      <Modal
        visible={showNeedsLabModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowNeedsLabModal(false);
          setPrescriptionToSubmit(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labModalContainer}>
            <View style={styles.labModalHeader}>
              <Text style={styles.labModalTitle}>Lab Tests Required?</Text>
              <Text style={styles.labModalSubtitle}>
                Does this patient need any lab tests?
              </Text>
            </View>

            <View style={styles.labModalContent}>
              <Ionicons name="flask" size={60} color="#4ECDC4" style={styles.labIcon} />
              <Text style={styles.labModalQuestion}>
                Do you want to request any lab tests for this patient?
              </Text>
            </View>

            <View style={styles.labModalButtons}>
              <TouchableOpacity
                style={[styles.labModalButton, styles.skipButton]}
                onPress={() => {
                  setShowNeedsLabModal(false);
                  submitPrescriptionWithLabs();
                }}
                disabled={submitting}
              >
                <Text style={styles.skipButtonText}>No, Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labModalButton, styles.addLabButton]}
                onPress={() => {
                  setShowNeedsLabModal(false);
                  setShowLabTestModal(true);
                }}
                disabled={submitting}
              >
                <Text style={styles.addLabButtonText}>Yes, Add Tests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lab Test Selection Modal */}
      <Modal
        visible={showLabTestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLabTestModal(false)}
      >
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={["#4ECDC4", "#44A08D"]}
            style={styles.labHeader}
          >
            <TouchableOpacity
              style={styles.labBackButton}
              onPress={() => {
                setShowLabTestModal(false);
                setShowNeedsLabModal(true);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.labHeaderTitle}>Select Lab Tests</Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView
            style={styles.labTestsContainer}
            contentContainerStyle={styles.labTestsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.labTestsInfo}>
              Choose the lab tests required for this patient
            </Text>

            <View style={styles.labTestsGrid}>
              {labTestTypes.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={[
                    styles.labTestCard,
                    selectedLabTests.includes(test.id) && styles.labTestCardSelected,
                    { borderLeftColor: test.color },
                  ]}
                  onPress={() => toggleLabTest(test.id)}
                >
                  <View style={styles.labTestCardHeader}>
                    <View
                      style={[
                        styles.labTestIcon,
                        { backgroundColor: test.color },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={test.icon}
                        size={24}
                        color="white"
                      />
                    </View>
                    <View style={styles.labTestCheckbox}>
                      {selectedLabTests.includes(test.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={test.color}
                        />
                      )}
                    </View>
                  </View>

                  <Text style={styles.labTestName}>{test.name}</Text>
                  <Text style={styles.labTestDescription}>{test.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.labTestsFooter}>
              <Text style={styles.selectedLabsCount}>
                {selectedLabTests.length} test{selectedLabTests.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          </ScrollView>

          <View style={styles.labActionButtons}>
            <TouchableOpacity
              style={[styles.labActionButton, styles.labCancelButton]}
              onPress={() => {
                setShowLabTestModal(false);
                setShowNeedsLabModal(true);
              }}
              disabled={submitting}
            >
              <Text style={styles.labCancelButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.labActionButton, styles.labConfirmButton]}
              onPress={() => {
                setShowLabTestModal(false);
                submitPrescriptionWithLabs();
              }}
              disabled={submitting}
            >
              <Text style={styles.labConfirmButtonText}>
                {submitting ? "Saving..." : "Confirm & Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  appointmentCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  appointmentEmail: {
    fontSize: 12,
    color: "#666",
  },
  appointmentDate: {
    alignItems: "flex-end",
  },
  appointmentDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4ECDC4",
  },
  appointmentTime: {
    fontSize: 12,
    color: "#666",
  },
  appointmentFooter: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
    textTransform: "capitalize",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginTop: 2,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    textAlignVertical: "top",
  },
  medicineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#4ECDC4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 12,
  },
  medicineCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  medicineField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  medicineFieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  removeButton: {
    backgroundColor: "#FF6B6B",
    padding: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Lab Test Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  labModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "85%",
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  labModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  labModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  labModalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  labModalContent: {
    alignItems: "center",
    marginBottom: 30,
  },
  labIcon: {
    marginBottom: 16,
  },
  labModalQuestion: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },
  labModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  labModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  addLabButton: {
    backgroundColor: "#4ECDC4",
  },
  addLabButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Lab Test Selection Modal
  labHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  labHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  labTestsContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  labTestsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  labTestsInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  labTestsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  labTestCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  labTestCardSelected: {
    backgroundColor: "#f0fffe",
    borderLeftWidth: 4,
  },
  labTestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  labTestIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  labTestCheckbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  labTestName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  labTestDescription: {
    fontSize: 12,
    color: "#999",
    lineHeight: 16,
  },
  labTestsFooter: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  selectedLabsCount: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  labActionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  labActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labCancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  labCancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  labConfirmButton: {
    backgroundColor: "#4ECDC4",
  },
  labConfirmButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AddPrescription;
