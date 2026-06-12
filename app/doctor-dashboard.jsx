import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
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

const DoctorDashboard = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [doctorName, setDoctorName] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [doctorPhoto, setDoctorPhoto] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("09:00");
  const [selectedEndTime, setSelectedEndTime] = useState("17:00");
  const [doctorTimings, setDoctorTimings] = useState({});
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
  });
  const [processingAppointment, setProcessingAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [uniquePatientsToday, setUniquePatientsToday] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Prescription detail modal states
  const [showPrescriptionDetail, setShowPrescriptionDetail] = useState(false);
  const [selectedPrescriptionDetail, setSelectedPrescriptionDetail] =
    useState(null);

  // Lab test order states
  const [labTestOrders, setLabTestOrders] = useState([]);
  const [reportViewVisible, setReportViewVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load doctor session data from Google and Firebase
    const loadDoctorData = async () => {
      try {
        const doctorSession = await AsyncStorage.getItem("doctorSession");
        console.log("Raw doctor session:", doctorSession);

        if (doctorSession) {
          const sessionData = JSON.parse(doctorSession);
          console.log("Parsed session data:", sessionData);

          // Set Google data first
          setDoctorName(sessionData.name || "");
          setDoctorPhoto(sessionData.photo || null);

          // Get doctor's unique ID from session
          const sessionDoctorId = sessionData.doctorId;
          const doctorEmail = sessionData.email;

          console.log("Session data:", { sessionDoctorId, doctorEmail });

          if (sessionDoctorId) {
            console.log("Using doctor ID from session:", sessionDoctorId);
            // Set doctor ID immediately
            setDoctorId(sessionDoctorId);

            // Fetch specific doctor data using the unique ID
            const response = await fetch(
              API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(sessionDoctorId),
            );
            const doctorData = await response.json();

            if (doctorData) {
              console.log("Found doctor data by ID:", doctorData);
              // Use the data from Firebase
              setDoctorName(doctorData.name || sessionData.name || "Doctor");
              setDoctorSpecialty(
                doctorData.specialty ||
                  doctorData.specialization ||
                  "Medical Professional",
              );
              setDoctorTimings(doctorData.timings || {}); // Load existing timings
              setConsultationFee(parseInt(doctorData.consultationFee) || 0); // Load consultation fee
              console.log("Doctor data loaded:", {
                id: sessionDoctorId,
                name: doctorData.name,
                specialty: doctorData.specialty,
                specialization: doctorData.specialization,
                email: doctorData.email,
                consultationFee: doctorData.consultationFee,
                timings: doctorData.timings,
              });
            } else {
              console.log("No doctor data found for ID:", sessionDoctorId);
              setDoctorSpecialty("Medical Professional");
            }
          } else {
            console.log(
              "No doctor ID in session, falling back to email search",
            );
            // Fallback to old method if no doctorId in session
            if (doctorEmail) {
              const response = await fetch(API_ENDPOINTS.FIREBASE.DOCTORS);
              const doctorsData = await response.json();

              if (doctorsData) {
                const doctorEntries = Object.entries(doctorsData);
                const doctorEntry = doctorEntries.find(
                  ([key, doctor]) => doctor.email === doctorEmail,
                );

                if (doctorEntry) {
                  const [foundDoctorId, doctorRecord] = doctorEntry;
                  console.log(
                    "Found doctor by email:",
                    foundDoctorId,
                    doctorRecord,
                  );

                  // Set the found doctor ID
                  setDoctorId(foundDoctorId);
                  setDoctorName(
                    doctorRecord.name || sessionData.name || "Doctor",
                  );
                  setDoctorSpecialty(
                    doctorRecord.specialty ||
                      doctorRecord.specialization ||
                      "Medical Professional",
                  );
                  setDoctorTimings(doctorRecord.timings || {}); // Load existing timings
                }
              }
            }
          }
        } else {
          console.log("No doctor session found");
        }
      } catch (error) {
        console.error("Error loading doctor data:", error);
        // Set fallback values
        setDoctorName("Doctor");
        setDoctorSpecialty("Medical Professional");
      }
    };

    loadDoctorData();
  }, []);

  // Load appointments and patients when doctorId is available
  useEffect(() => {
    if (doctorId) {
      loadAppointmentsData();
      loadPrescriptionsData();
      loadLabTestOrdersData();

      // Set up daily cleanup at 11:57 PM
      const setupDailyCleanup = () => {
        const now = new Date();
        const tonight = new Date();
        tonight.setHours(23, 57, 0, 0); // 11:57 PM

        // If it's already past 11:57 PM today, schedule for tomorrow
        if (now > tonight) {
          tonight.setDate(tonight.getDate() + 1);
        }

        const timeUntilCleanup = tonight.getTime() - now.getTime();

        setTimeout(() => {
          cleanupExpiredAppointments();

          // Set up recurring daily cleanup
          const dailyInterval = setInterval(
            () => {
              cleanupExpiredAppointments();
            },
            24 * 60 * 60 * 1000,
          ); // Every 24 hours

          return () => clearInterval(dailyInterval);
        }, timeUntilCleanup);
      };

      setupDailyCleanup();

      // Run cleanup once on startup (optional)
      setTimeout(() => {
        cleanupExpiredAppointments();
      }, 2000);
    }
  }, [
    doctorId,
    loadAppointmentsData,
    loadPrescriptionsData,
    loadLabTestOrdersData,
  ]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload all data based on active tab
      if (activeTab === "Appointments" || activeTab === "Dashboard") {
        await loadAppointmentsData();
      }
      if (activeTab === "Prescriptions" || activeTab === "Dashboard") {
        await loadPrescriptionsData();
      }
      if (activeTab === "Patients" || activeTab === "Dashboard") {
        await loadAppointmentsData(); // Needed to calculate unique patients
      }
      if (activeTab === "Dashboard") {
        await loadLabTestOrdersData();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    activeTab,
    loadAppointmentsData,
    loadPrescriptionsData,
    loadLabTestOrdersData,
  ]);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userSession");
      router.replace("/landing");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Schedule Management Functions
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeSlots = [
    "09:00",
    "09:15",
    "09:30",
    "09:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "11:15",
    "11:30",
    "11:45",
    "12:00",
    "12:15",
    "12:30",
    "12:45",
    "13:00",
    "13:15",
    "13:30",
    "13:45",
    "14:00",
    "14:15",
    "14:30",
    "14:45",
    "15:00",
    "15:15",
    "15:30",
    "15:45",
    "16:00",
    "16:15",
    "16:30",
    "16:45",
    "17:00",
    "17:15",
    "17:30",
    "17:45",
    "18:00",
    "18:15",
    "18:30",
    "18:45",
    "19:00",
    "19:15",
    "19:30",
    "19:45",
    "20:00",
    "20:15",
    "20:30",
    "20:45",
    "21:00",
    "21:15",
    "21:30",
    "21:45",
    "22:00",
    "22:15",
    "22:30",
    "22:45",
    "23:00",
    "23:15",
    "23:30",
    "23:45",
    "00:00",
  ];

  const saveSchedule = async () => {
    console.log("=== SAVE SCHEDULE DEBUG ===");
    console.log("Selected day:", selectedDay);
    console.log("Doctor ID:", doctorId);
    console.log("Selected start time:", selectedStartTime);
    console.log("Selected end time:", selectedEndTime);

    if (!selectedDay) {
      console.log("ERROR: No day selected");
      Alert.alert("Error", "Please select a day");
      return;
    }

    if (!doctorId) {
      console.log("ERROR: No doctor ID found");
      Alert.alert(
        "Error",
        "Doctor not logged in properly. Please logout and login again.",
      );
      return;
    }

    try {
      console.log("Saving schedule for doctor:", doctorId);
      console.log("Selected day:", selectedDay);
      console.log("Start time:", selectedStartTime);
      console.log("End time:", selectedEndTime);

      const timing = {
        day: selectedDay,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      };

      // Update the local state first
      const updatedTimings = {
        ...doctorTimings,
        [selectedDay]: timing,
      };

      console.log("Updated timings object:", updatedTimings);

      // Save to Firebase using PATCH to update only the timings field
      const firebaseUrl = API_ENDPOINTS.FIREBASE.DOCTOR_BY_ID(doctorId);
      console.log("Firebase URL:", firebaseUrl);

      const response = await fetch(firebaseUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ timings: updatedTimings }),
      });

      console.log("Firebase response status:", response.status);
      console.log("Firebase response ok:", response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Firebase response data:", responseData);

        // Update local state after successful save
        setDoctorTimings(updatedTimings);

        Alert.alert(
          "Success",
          `Schedule for ${selectedDay} has been ${editingSchedule ? "updated" : "saved"} successfully!`,
        );
        setShowScheduleModal(false);
        resetScheduleForm();
      } else {
        const errorText = await response.text();
        console.error("Firebase error response:", errorText);
        throw new Error(`Firebase error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", `Failed to save schedule: ${error.message}`);
    }
  };

  const resetScheduleForm = () => {
    setSelectedDay("");
    setSelectedStartTime("09:00");
    setSelectedEndTime("17:00");
    setEditingSchedule(null);
    setShowAddForm(false);
  };

  const editSchedule = (day, timing) => {
    setSelectedDay(day);
    setSelectedStartTime(timing.startTime);
    setSelectedEndTime(timing.endTime);
    setEditingSchedule(day);
    setShowAddForm(true);
  };

  const deleteSchedule = async (day) => {
    try {
      console.log("Deleting schedule for day:", day);
      console.log("Doctor ID:", doctorId);

      const updatedTimings = { ...doctorTimings };
      delete updatedTimings[day];

      console.log("Updated timings after deletion:", updatedTimings);

      // Save to Firebase using PATCH
      const firebaseUrl = `https://thanuraksha-v2-default-rtdb.firebaseio.com/doctors/${doctorId}.json`;

      const response = await fetch(firebaseUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ timings: updatedTimings }),
      });

      console.log("Delete response status:", response.status);

      if (response.ok) {
        // Update local state after successful deletion
        setDoctorTimings(updatedTimings);
        Alert.alert(
          "Success",
          `Schedule for ${day} has been deleted successfully!`,
        );
      } else {
        const errorText = await response.text();
        console.error("Firebase delete error:", errorText);
        throw new Error(`Failed to delete schedule: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Alert.alert("Error", `Failed to delete schedule: ${error.message}`);
    }
  };

  const confirmDelete = (day) => {
    Alert.alert(
      "Delete Schedule",
      `Are you sure you want to delete the schedule for ${day}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSchedule(day),
        },
      ],
    );
  };

  // Simple video call - no time validations
  const isVideoCallEnabled = (appointment) => {
    // Simply check if appointment is confirmed and has roomId
    return appointment.status === "confirmed" && appointment.roomId;
  };

  // Auto-delete appointments after the day ends
  const cleanupExpiredAppointments = async () => {
    try {
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/appointments.json",
      );
      const data = await response.json();

      if (data) {
        const now = new Date();
        const appointmentsToDelete = Object.entries(data).filter(
          ([key, appointment]) => {
            const appointmentDate = new Date(appointment.selectedDate);
            // Delete if appointment date is before today
            return appointmentDate.toDateString() < now.toDateString();
          },
        );

        for (const [appointmentId] of appointmentsToDelete) {
          await fetch(API_ENDPOINTS.FIREBASE.APPOINTMENT_BY_ID(appointmentId), {
            method: "DELETE",
          });
        }

        if (appointmentsToDelete.length > 0) {
          console.log(
            `[${new Date().toLocaleString()}] Cleaned up ${appointmentsToDelete.length} expired appointments`,
          );
          loadAppointmentsData(); // Reload to reflect changes
        }
      }
    } catch (error) {
      console.error("Error cleaning up expired appointments:", error);
    }
  };

  const loadAppointmentsData = useCallback(async () => {
    if (!doctorId) {
      console.log("No doctor ID available, skipping appointment load");
      return;
    }

    try {
      console.log("Loading appointments for doctor:", doctorId);
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/appointments.json",
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Fetched appointments data:",
        data ? Object.keys(data).length : 0,
        "appointments",
      );

      if (data) {
        // Filter appointments for this doctor
        const doctorAppointments = Object.entries(data)
          .filter(([key, appointment]) => {
            const match = appointment.doctorId === doctorId;
            if (!match) {
              console.log(
                "Appointment",
                key,
                "doctor ID",
                appointment.doctorId,
                "does not match",
                doctorId,
              );
            }
            return match;
          })
          .map(([key, appointment]) => ({ id: key, ...appointment }));

        console.log(
          "Found",
          doctorAppointments.length,
          "appointments for doctor",
        );
        console.log(
          "RAW DOCTOR APPOINTMENTS DATA:",
          JSON.stringify(doctorAppointments, null, 2),
        );
        setAppointments(doctorAppointments);

        // Calculate stats
        const stats = {
          total: doctorAppointments.length,
          confirmed: doctorAppointments.filter(
            (app) => app.status === "confirmed",
          ).length,
          pending: doctorAppointments.filter((app) => app.status === "pending")
            .length,
        };
        console.log("Appointment stats:", stats);
        setAppointmentStats(stats);

        // Extract unique patients
        const uniquePatients = doctorAppointments.reduce((acc, appointment) => {
          const patientKey = appointment.patientEmail || appointment.userEmail;
          if (!acc.find((p) => p.email === patientKey)) {
            acc.push({
              email: patientKey,
              name: appointment.patientName || appointment.userName,
              appointments: doctorAppointments.filter(
                (a) => (a.patientEmail || a.userEmail) === patientKey,
              ).length,
            });
          }
          return acc;
        }, []);

        console.log("Unique patients:", uniquePatients.length);
        setPatients(uniquePatients);

        // Calculate today's stats
        if (doctorAppointments.length > 0) {
          const todayDate = new Date().toISOString().split("T")[0];
          console.log("===== TODAY'S STATS CALCULATION =====");
          console.log("Today's date:", todayDate);
          console.log("Total appointments:", doctorAppointments.length);
          console.log("Consultation fee from state:", consultationFee);
          console.log(
            "All appointments:",
            JSON.stringify(doctorAppointments.slice(0, 3), null, 2),
          );

          const todayAppointmentsList = doctorAppointments.filter((apt) => {
            const aptDate = apt.selectedDate
              ? apt.selectedDate.split("T")[0]
              : apt.selectedDate;
            const isToday = aptDate === todayDate;
            const isConfirmed = apt.status === "confirmed";
            console.log(
              `APT: selectedDate='${apt.selectedDate}' → parsed='${aptDate}', todayDate='${todayDate}', isToday=${isToday}, status='${apt.status}' (type: ${typeof apt.status}), isConfirmed=${isConfirmed}, MATCHES=${isToday && isConfirmed}`,
            );
            return isToday && isConfirmed;
          });

          console.log(
            "Today's CONFIRMED appointments:",
            todayAppointmentsList.length,
          );

          const uniquePatientsTodaySet = new Set(
            todayAppointmentsList.map(
              (apt) => apt.patientEmail || apt.userEmail,
            ),
          );

          const calculatedRevenue =
            todayAppointmentsList.length * (parseInt(consultationFee) || 0);

          console.log("Calculated stats:", {
            todayAppointmentsCount: todayAppointmentsList.length,
            uniquePatientsCount: uniquePatientsTodaySet.size,
            fee: parseInt(consultationFee) || 0,
            revenue: calculatedRevenue,
          });

          setTodayAppointments(todayAppointmentsList.length);
          setUniquePatientsToday(uniquePatientsTodaySet.size);
          setTodayRevenue(calculatedRevenue);
        } else {
          // No appointments today, reset to 0
          setTodayAppointments(0);
          setUniquePatientsToday(0);
          setTodayRevenue(0);
        }
      } else {
        console.log("No appointments data found");
        setAppointments([]);
        setAppointmentStats({ total: 0, confirmed: 0, pending: 0 });
        setPatients([]);
        setTodayAppointments(0);
        setUniquePatientsToday(0);
        setTodayRevenue(0);
      }
    } catch (error) {
      console.error("Error loading appointments data:", error);
      Alert.alert(
        "Error",
        "Failed to load appointments. Please check your internet connection and try again.",
      );
    }
  }, [doctorId, consultationFee]);

  const loadPrescriptionsData = useCallback(async () => {
    if (!doctorId) {
      console.log("No doctor ID available, skipping prescriptions load");
      return;
    }

    try {
      setPrescriptionsLoading(true);
      console.log("Loading prescriptions for doctor:", doctorId);
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/prescriptions.json",
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Fetched prescriptions data:",
        data ? Object.keys(data).length : 0,
        "prescriptions",
      );

      if (data) {
        // Filter prescriptions for this doctor
        const doctorPrescriptions = Object.entries(data)
          .filter(([key, prescription]) => prescription.doctorId === doctorId)
          .map(([key, prescription]) => ({ id: key, ...prescription }));

        console.log(
          "Found",
          doctorPrescriptions.length,
          "prescriptions for doctor",
        );
        setPrescriptions(doctorPrescriptions);
      } else {
        console.log("No prescriptions data found");
        setPrescriptions([]);
      }
    } catch (error) {
      console.error("Error loading prescriptions data:", error);
    } finally {
      setPrescriptionsLoading(false);
    }
  }, [doctorId]);

  const loadLabTestOrdersData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders.json",
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        const allLabOrders = Object.entries(data).map(([key, order]) => ({
          id: key,
          ...order,
        }));

        console.log("DEBUG: Loaded lab orders:", allLabOrders.length, "orders");
        setLabTestOrders(allLabOrders);
      } else {
        setLabTestOrders([]);
      }
    } catch (error) {
      console.error("Error loading lab test orders:", error);
      setLabTestOrders([]);
    }
  }, []);

  const getLabReportForPrescription = (prescriptionId) => {
    if (!prescriptionId) {
      console.warn("DEBUG: prescriptionId is null or undefined");
      return null;
    }

    const report = labTestOrders.find((order) => {
      return (
        order.prescriptionId === prescriptionId &&
        order.reportStatus === "uploaded"
      );
    });

    if (!report) {
      console.log(
        "DEBUG: No report found for prescriptionId:",
        prescriptionId,
        "Available orders:",
        labTestOrders.map((o) => ({
          id: o.id,
          prescriptionId: o.prescriptionId,
          reportStatus: o.reportStatus,
        })),
      );
    }

    return report;
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportViewVisible(true);
  };

  // Generate 5-digit room ID with digits and capital letters
  const generateRoomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let roomId = "";
    for (let i = 0; i < 5; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString().slice(-3);
    return roomId + timestamp.slice(-1); // Make it 6 characters total
  };

  // Send meeting invite email
  const sendMeetingInvite = async (patientEmail, doctorEmail, roomId) => {
    try {
      console.log("Sending meeting invite to:", patientEmail);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(API_ENDPOINTS.EMAIL.SEND_MEETING_INVITE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_email: patientEmail,
          doctor_email: doctorEmail,
          room_id: roomId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Email service error: ${response.status}`);
      }

      console.log("Meeting invite sent successfully");
      return true;
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Email request timed out");
      } else {
        console.error("Error sending meeting invite:", error);
      }
      return false;
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    console.log("=== APPOINTMENT ACTION DEBUG ===");
    console.log("Appointment ID:", appointmentId);
    console.log("Action:", action);
    console.log("Doctor ID:", doctorId);

    if (!appointmentId) {
      console.error("ERROR: No appointment ID provided");
      Alert.alert("Error", "Invalid appointment ID");
      return;
    }

    // Prevent multiple simultaneous processing
    if (processingAppointment === appointmentId) {
      console.log(
        "Already processing this appointment, ignoring duplicate call",
      );
      return;
    }

    // Show immediate confirmation dialog
    Alert.alert(
      action === "confirmed" ? "Approve Appointment" : "Reject Appointment",
      action === "confirmed"
        ? "Are you sure you want to approve this appointment? A room ID will be generated and email will be sent to patient."
        : "Are you sure you want to reject this appointment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: action === "confirmed" ? "Approve" : "Reject",
          style: action === "confirmed" ? "default" : "destructive",
          onPress: async () => {
            // Set processing state to prevent duplicate calls
            setProcessingAppointment(appointmentId);

            try {
              let roomId = null;
              let emailSent = false;

              // If approving appointment, generate room ID and send email
              if (action === "confirmed") {
                console.log("Generating room ID...");
                roomId = generateRoomId();
                console.log("Generated Room ID:", roomId);

                // Get appointment details for email
                const appointment = appointments.find(
                  (app) => app.id === appointmentId,
                );
                console.log("Found appointment:", appointment);

                if (appointment) {
                  const patientEmail =
                    appointment.patientEmail || appointment.userEmail;

                  // Get doctor email from AsyncStorage
                  try {
                    console.log("Getting doctor session...");
                    const doctorSession =
                      await AsyncStorage.getItem("doctorSession");
                    const sessionData = doctorSession
                      ? JSON.parse(doctorSession)
                      : null;
                    const doctorEmail = sessionData?.email;

                    console.log("Email details:", {
                      patientEmail,
                      doctorEmail,
                    });

                    if (patientEmail && doctorEmail) {
                      console.log("Sending meeting invite...");
                      emailSent = await sendMeetingInvite(
                        patientEmail,
                        doctorEmail,
                        roomId,
                      );
                      console.log("Email sent status:", emailSent);
                    } else {
                      console.log("Missing email addresses:", {
                        patientEmail,
                        doctorEmail,
                      });
                    }
                  } catch (sessionError) {
                    console.error(
                      "Error getting doctor session:",
                      sessionError,
                    );
                  }
                } else {
                  console.error("Appointment not found in local state");
                }
              }

              // Update appointment in Firebase
              const updateData = {
                status: action,
                updatedAt: new Date().toISOString(),
                updatedBy: doctorId || "unknown",
              };

              // Add room ID if appointment is approved
              if (action === "confirmed" && roomId) {
                updateData.roomId = roomId;
                updateData.meetingInviteSent = emailSent;
              }

              console.log("Update data:", updateData);

              const firebaseUrl = `https://thanuraksha-v2-default-rtdb.firebaseio.com/appointments/${appointmentId}.json`;
              console.log("Firebase URL:", firebaseUrl);

              const response = await fetch(firebaseUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(updateData),
              });

              console.log("Firebase response status:", response.status);
              console.log("Firebase response ok:", response.ok);

              if (response.ok) {
                const responseData = await response.json();
                console.log("Firebase response data:", responseData);

                // Reload appointments data first
                console.log("Reloading appointments...");
                await loadAppointmentsData();

                let successMessage = `Appointment ${action === "confirmed" ? "approved" : "rejected"} successfully!`;
                if (action === "confirmed" && roomId) {
                  successMessage += `\n\nRoom ID: ${roomId}`;
                  if (emailSent) {
                    successMessage +=
                      "\n✅ Meeting invite sent to patient email.";
                  } else {
                    successMessage +=
                      "\n⚠️ Could not send meeting invite email.";
                  }
                }

                // Clear processing state before showing success
                setProcessingAppointment(null);

                // Show success alert
                Alert.alert("Success", successMessage);
              } else {
                const errorText = await response.text();
                console.error("Firebase error response:", errorText);
                throw new Error(
                  `Firebase error: ${response.status} - ${errorText}`,
                );
              }
            } catch (error) {
              console.error(`Error ${action} appointment:`, error);
              setProcessingAppointment(null); // Clear processing state on error
              Alert.alert(
                "Error",
                `Failed to ${action === "confirmed" ? "approve" : "reject"} appointment: ${error.message}`,
              );
            }
          },
        },
      ],
    );
  };

  const handleQuickActionPress = (action) => {
    if (action.action) {
      action.action();
    } else if (action.route) {
      router.push(action.route);
    }
  };

  // Circular Quick Actions
  const quickActions = [
    {
      id: 1,
      title: "Patients",
      icon: "people",
      iconType: "ionicons",
      colors: ["#4ECDC4", "#44A08D"],
      action: () => setActiveTab("Patients"),
    },
    {
      id: 2,
      title: "Appointments",
      icon: "calendar",
      iconType: "ionicons",
      colors: ["#667eea", "#764ba2"],
      action: () => setActiveTab("Appointments"),
    },
    {
      id: 3,
      title: "Schedule",
      icon: "time",
      iconType: "ionicons",
      colors: ["#4facfe", "#00f2fe"],
      action: () => setShowScheduleModal(true),
    },
  ];

  const menuItems = [
    {
      id: 1,
      title: "Lab Reports",
      icon: "flask",
      iconType: "ionicons",
      color: "#667eea",
    },
    {
      id: 2,
      title: "Prescriptions",
      icon: "medical",
      iconType: "ionicons",
      color: "#f093fb",
    },
    {
      id: 3,
      title: "Analytics",
      icon: "analytics",
      iconType: "ionicons",
      color: "#4facfe",
    },
    {
      id: 4,
      title: "Emergency",
      icon: "warning",
      iconType: "ionicons",
      color: "#ff6b6b",
    },
  ];

  // Compact stats - Updated with calculated values
  const todayStats = [
    {
      label: "Patients",
      value: uniquePatientsToday.toString(),
      icon: "people",
      color: "#4ECDC4",
    },
    {
      label: "Appointments",
      value: todayAppointments.toString(),
      icon: "calendar",
      color: "#667eea",
    },
    {
      label: "Revenue",
      value: `₹${todayRevenue}`,
      icon: "wallet",
      color: "#f093fb",
    },
    { label: "Rating", value: "4.9", icon: "star", color: "#fbbf24" },
  ];

  // Upcoming appointments - Filter for future appointments (after today)
  const upcomingAppointments = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.selectedDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate > today && apt.status === "confirmed"; // Only future confirmed appointments
      })
      .sort((a, b) => new Date(a.selectedDate) - new Date(b.selectedDate))
      .slice(0, 5) // Show top 5 upcoming
      .map((apt) => ({
        id: apt.id,
        name: apt.patientName || apt.userName || "Patient",
        time: apt.selectedTime || apt.appointmentTime || "N/A",
        type: apt.appointmentType || "Consultation",
        avatar:
          (apt.patientName || apt.userName || "P")[0]?.toUpperCase() || "P",
      }));
  })();

  // Bottom navigation tabs
  const bottomTabs = [
    { id: "Dashboard", icon: "grid", label: "Dashboard" },
    { id: "Appointments", icon: "calendar", label: "Appointments" },
    { id: "Patients", icon: "people", label: "Patients" },
    { id: "Prescriptions", icon: "document", label: "Prescriptions" },
  ];

  const renderIcon = (iconName, iconType, size = 24, color = "white") => {
    switch (iconType) {
      case "material":
        return (
          <MaterialCommunityIcons name={iconName} size={size} color={color} />
        );
      case "fontawesome":
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      default:
        return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#4ECDC4"
        translucent={false}
      />
      {/* Professional Header - Solid Green */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.doctorInfo}>
            <View style={styles.avatarContainer}>
              {doctorPhoto ? (
                <Image
                  source={{ uri: doctorPhoto }}
                  style={styles.doctorProfileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <FontAwesome5 name="user-md" size={20} color="white" />
                </View>
              )}
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{doctorName || "Doctor"}</Text>
              <Text style={styles.specialization}>
                {doctorSpecialty || "Medical Professional"}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={20} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === "Dashboard" && styles.activeNavTab,
          ]}
          onPress={() => setActiveTab("Dashboard")}
        >
          <Ionicons
            name={activeTab === "Dashboard" ? "home" : "home-outline"}
            size={20}
            color={activeTab === "Dashboard" ? "#4ECDC4" : "#666"}
          />
          <Text
            style={[
              styles.navTabText,
              activeTab === "Dashboard" && styles.activeNavTabText,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === "Appointments" && styles.activeNavTab,
          ]}
          onPress={() => setActiveTab("Appointments")}
        >
          <Ionicons
            name={
              activeTab === "Appointments" ? "calendar" : "calendar-outline"
            }
            size={20}
            color={activeTab === "Appointments" ? "#4ECDC4" : "#666"}
          />
          <Text
            style={[
              styles.navTabText,
              activeTab === "Appointments" && styles.activeNavTabText,
            ]}
          >
            Appointments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navTab,
            activeTab === "Patients" && styles.activeNavTab,
          ]}
          onPress={() => setActiveTab("Patients")}
        >
          <Ionicons
            name={activeTab === "Patients" ? "people" : "people-outline"}
            size={20}
            color={activeTab === "Patients" ? "#4ECDC4" : "#666"}
          />
          <Text
            style={[
              styles.navTabText,
              activeTab === "Patients" && styles.activeNavTabText,
            ]}
          >
            Patients
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === "Dashboard" && (
            <>
              {/* Circular Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.circularActionsGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.circularActionContainer}
                      onPress={() => handleQuickActionPress(action)}
                    >
                      <LinearGradient
                        colors={action.colors}
                        style={styles.circularAction}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name={action.icon} size={24} color="white" />
                      </LinearGradient>
                      <Text style={styles.circularActionText}>
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Compact Statistics Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Overview</Text>
                <View style={styles.compactStatsGrid}>
                  {todayStats.map((stat, index) => (
                    <View key={index} style={styles.compactStatCard}>
                      <View
                        style={[
                          styles.statIcon,
                          { backgroundColor: `${stat.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={stat.icon}
                          size={16}
                          color={stat.color}
                        />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Upcoming Appointments */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.appointmentsContainer}>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <TouchableOpacity
                        key={appointment.id}
                        style={styles.appointmentCard}
                      >
                        <View style={styles.appointmentInfo}>
                          <View style={styles.patientAvatar}>
                            <Text style={styles.avatarText}>
                              {appointment.avatar}
                            </Text>
                          </View>
                          <View style={styles.appointmentDetails}>
                            <Text style={styles.patientName}>
                              {appointment.name}
                            </Text>
                            <Text style={styles.appointmentType}>
                              {appointment.type}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.appointmentTime}>
                          <Text style={styles.timeText}>
                            {appointment.time}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#94a3b8"
                          />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noAppointmentsText}>
                      No upcoming appointments
                    </Text>
                  )}
                </View>
              </View>

              {/* Medical Tools Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medical Tools</Text>
                <View style={styles.toolsGrid}>
                  {menuItems.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.toolCard}>
                      <View
                        style={[
                          styles.toolIcon,
                          { backgroundColor: `${item.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <Text style={styles.toolTitle}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {activeTab === "Appointments" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appointment Requests</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {appointmentStats.total}
                  </Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {appointmentStats.confirmed}
                  </Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {appointmentStats.pending}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              {appointments.length > 0 ? (
                <View style={styles.appointmentsGrid}>
                  {appointments.map((appointment) => (
                    <View
                      key={appointment.id}
                      style={styles.appointmentGridCard}
                    >
                      {/* Header with patient info */}
                      <View style={styles.appointmentCardHeader}>
                        <View style={styles.patientInfoRow}>
                          <View style={styles.patientAvatar}>
                            <Text style={styles.avatarText}>
                              {(
                                appointment.patientName ||
                                appointment.userName ||
                                "P"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.patientInfoText}>
                            <Text style={styles.patientName}>
                              {appointment.patientName ||
                                appointment.userName ||
                                "Patient"}
                            </Text>
                            <Text style={styles.patientEmail}>
                              {appointment.patientEmail ||
                                appointment.userEmail}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.statusIndicator,
                            appointment.status === "confirmed"
                              ? styles.confirmedIndicator
                              : appointment.status === "rejected"
                                ? styles.rejectedIndicator
                                : styles.pendingIndicator,
                          ]}
                        >
                          <Text style={styles.statusIndicatorText}>
                            {appointment.status === "confirmed"
                              ? "APPROVED"
                              : appointment.status === "rejected"
                                ? "REJECTED"
                                : "PENDING"}
                          </Text>
                        </View>
                      </View>

                      {/* Appointment details */}
                      <View style={styles.appointmentDetailsGrid}>
                        <View style={styles.dateTimeRow}>
                          <View style={styles.dateTimeCard}>
                            <Ionicons
                              name="calendar"
                              size={18}
                              color="#4ECDC4"
                            />
                            <View style={styles.dateTimeInfo}>
                              <Text style={styles.dateTimeLabel}>Date</Text>
                              <Text style={styles.dateTimeValue}>
                                {appointment.selectedDate &&
                                appointment.selectedDay
                                  ? `${appointment.selectedDate} (${appointment.selectedDay})`
                                  : appointment.selectedDate
                                    ? appointment.selectedDate
                                    : appointment.selectedDay}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.dateTimeCard}>
                            <Ionicons name="time" size={18} color="#4ECDC4" />
                            <View style={styles.dateTimeInfo}>
                              <Text style={styles.dateTimeLabel}>Time</Text>
                              <Text style={styles.dateTimeValue}>
                                {appointment.selectedTime}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.detailItem}>
                          <Ionicons
                            name="mail-outline"
                            size={16}
                            color="#4ECDC4"
                          />
                          <Text style={styles.detailText}>
                            {appointment.patientEmail || appointment.userEmail}
                          </Text>
                        </View>

                        {appointment.roomId && (
                          <View style={styles.detailItem}>
                            <Ionicons
                              name="videocam-outline"
                              size={16}
                              color="#4ECDC4"
                            />
                            <Text style={styles.detailText}>
                              Room ID: {appointment.roomId}
                            </Text>
                          </View>
                        )}

                        {appointment.notes && (
                          <View style={styles.notesSection}>
                            <View style={styles.detailItem}>
                              <Ionicons
                                name="document-text-outline"
                                size={16}
                                color="#4ECDC4"
                              />
                              <Text style={styles.notesLabel}>
                                Patient Notes:
                              </Text>
                            </View>
                            <Text style={styles.notesText}>
                              {appointment.notes}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action buttons - only show for pending appointments */}
                      {appointment.status === "pending" && (
                        <View style={styles.actionButtonsRow}>
                          <TouchableOpacity
                            style={[
                              styles.rejectButton,
                              processingAppointment === appointment.id &&
                                styles.disabledButton,
                            ]}
                            onPress={() =>
                              handleAppointmentAction(
                                appointment.id,
                                "rejected",
                              )
                            }
                            disabled={processingAppointment === appointment.id}
                          >
                            <Ionicons name="close" size={16} color="white" />
                            <Text style={styles.rejectButtonText}>
                              {processingAppointment === appointment.id
                                ? "Processing..."
                                : "Reject"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.approveButton,
                              processingAppointment === appointment.id &&
                                styles.disabledButton,
                            ]}
                            onPress={() =>
                              handleAppointmentAction(
                                appointment.id,
                                "confirmed",
                              )
                            }
                            disabled={processingAppointment === appointment.id}
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                            <Text style={styles.approveButtonText}>
                              {processingAppointment === appointment.id
                                ? "Processing..."
                                : "Approve"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Already processed appointments - show status */}
                      {appointment.status !== "pending" && (
                        <View style={styles.processedStatus}>
                          <Text style={styles.processedStatusText}>
                            {appointment.status === "confirmed"
                              ? "✓ Appointment Approved"
                              : "✗ Appointment Rejected"}
                          </Text>
                          {appointment.status === "confirmed" &&
                            appointment.roomId && (
                              <View style={styles.roomIdWithAction}>
                                <View style={styles.roomIdContainer}>
                                  <Ionicons
                                    name="videocam"
                                    size={16}
                                    color="#4ECDC4"
                                  />
                                  <Text style={styles.roomIdText}>
                                    Meeting Room: {appointment.roomId}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.joinCallButton}
                                  onPress={() => {
                                    // Simple video call - join immediately if roomId exists
                                    if (appointment.roomId) {
                                      console.log(
                                        "=== DOCTOR STARTING VIDEO CALL ===",
                                      );
                                      console.log(
                                        "Room ID:",
                                        appointment.roomId,
                                      );
                                      console.log(
                                        "Doctor Name:",
                                        doctorName || "Doctor",
                                      );
                                      console.log(
                                        "Doctor User ID:",
                                        `doctor_${appointment.id}_${appointment.doctorId || doctorId}`,
                                      );

                                      // Join the call immediately
                                      router.push({
                                        pathname: "/video-call",
                                        params: {
                                          roomId: appointment.roomId,
                                          userName: doctorName || "Doctor",
                                          userId: `doctor_${appointment.id}_${appointment.doctorId || doctorId}`,
                                        },
                                      });
                                    } else {
                                      Alert.alert(
                                        "Error",
                                        "No meeting room available",
                                      );
                                    }
                                  }}
                                >
                                  <Ionicons
                                    name="videocam"
                                    size={16}
                                    color="white"
                                  />
                                  <Text style={styles.joinCallButtonText}>
                                    Join Video Call
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No appointment requests yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "Patients" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Patients</Text>
              {patients.length > 0 ? (
                patients.map((patient, index) => (
                  <View key={patient.email || index} style={styles.patientCard}>
                    <View style={styles.patientInfo}>
                      <View style={styles.patientAvatar}>
                        <Ionicons name="person" size={20} color="#4ECDC4" />
                      </View>
                      <View style={styles.patientDetails}>
                        <Text style={styles.patientName}>
                          {patient.name || "Patient"}
                        </Text>
                        <Text style={styles.patientEmail}>{patient.email}</Text>
                      </View>
                    </View>
                    <View style={styles.patientStats}>
                      <Text style={styles.appointmentCount}>
                        {patient.appointments} appointment
                        {patient.appointments !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyStateText}>No patients yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "Prescriptions" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Prescriptions</Text>
                <TouchableOpacity
                  style={styles.addPrescriptionButton}
                  onPress={() => router.push("/add-prescription")}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addPrescriptionButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {prescriptionsLoading ? (
                <View style={styles.centerContainer}>
                  <Text>Loading prescriptions...</Text>
                </View>
              ) : prescriptions.length > 0 ? (
                <View style={styles.prescriptionsList}>
                  {prescriptions.map((prescription) => (
                    <TouchableOpacity
                      key={prescription.id}
                      style={styles.prescriptionCard}
                      onPress={() => {
                        setSelectedPrescriptionDetail(prescription);
                        setShowPrescriptionDetail(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.prescriptionCardHeader}>
                        <View style={styles.prescriptionInfo}>
                          <Text style={styles.prescriptionPatient}>
                            {prescription.patientName}
                          </Text>
                          <Text style={styles.prescriptionEmail}>
                            {prescription.patientEmail}
                          </Text>
                          <Text style={styles.prescriptionDiagnosis}>
                            {prescription.diagnosis}
                          </Text>
                        </View>
                        <Text style={styles.prescriptionDate}>
                          {prescription.prescriptionDate}
                        </Text>
                      </View>

                      <View style={styles.prescriptionMedicines}>
                        <Text style={styles.medicinesCount}>
                          {prescription.medicines?.length || 0} medicine
                          {prescription.medicines?.length !== 1 ? "s" : ""}
                        </Text>
                      </View>

                      <View style={styles.prescriptionFooter}>
                        <View style={styles.prescriptionNumber}>
                          <Text style={styles.prescriptionNumberText}>
                            #{prescription.prescriptionNumber}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            prescription.status === "active"
                              ? styles.activeBadge
                              : styles.inactiveBadge,
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {prescription.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.prescriptionCardFooter}>
                        <Text style={styles.tapToViewText}>
                          Tap to view details
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#4ECDC4"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.prescriptionPlaceholder}>
                  <Ionicons name="document" size={50} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No prescriptions yet
                  </Text>
                  <TouchableOpacity
                    style={styles.addPrescriptionButtonSecondary}
                    onPress={() => router.push("/add-prescription")}
                  >
                    <Text style={styles.addPrescriptionButtonSecondaryText}>
                      Create New Prescription
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.bottomNavItem,
              activeTab === tab.id && styles.activeNavItem,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? "#4ECDC4" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.bottomNavText,
                activeTab === tab.id && styles.activeNavText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prescription Detail Modal */}
      <Modal
        visible={showPrescriptionDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPrescriptionDetail(false)}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

          {/* Modal Header */}
          <LinearGradient
            colors={["#4ECDC4", "#44A08D"]}
            style={styles.prescriptionHeader}
          >
            <TouchableOpacity
              onPress={() => setShowPrescriptionDetail(false)}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.prescriptionHeaderTitle}>
              Prescription Details
            </Text>
            <View style={styles.headerButton} />
          </LinearGradient>

          {selectedPrescriptionDetail && (
            <ScrollView
              style={styles.prescriptionDocumentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Document Header */}
              <View style={styles.prescriptionDocumentHeader}>
                <Text style={styles.prescriptionDocumentTitle}>
                  MEDICAL PRESCRIPTION
                </Text>
                <View style={styles.prescriptionDividerLine} />

                <View style={styles.prescriptionInfoRow}>
                  <View style={styles.prescriptionInfoLeft}>
                    <Text style={styles.prescriptionLabel}>
                      Prescription No:
                    </Text>
                    <Text style={styles.prescriptionValue}>
                      {selectedPrescriptionDetail.prescriptionNumber}
                    </Text>
                  </View>
                  <View style={styles.prescriptionInfoRight}>
                    <Text style={styles.prescriptionLabel}>Date:</Text>
                    <Text style={styles.prescriptionValue}>
                      {selectedPrescriptionDetail.prescriptionDate}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Document Body */}
              <View style={styles.prescriptionDocumentBody}>
                {/* Patient Info Section */}
                <View style={styles.prescriptionSection}>
                  <Text style={styles.prescriptionSectionTitle}>
                    PATIENT INFORMATION
                  </Text>
                  <View style={styles.prescriptionInformationBox}>
                    <View style={styles.prescriptionInfoField}>
                      <Text style={styles.prescriptionFieldLabel}>Name:</Text>
                      <Text style={styles.prescriptionFieldValue}>
                        {selectedPrescriptionDetail.patientName}
                      </Text>
                    </View>
                    <View style={styles.prescriptionInfoField}>
                      <Text style={styles.prescriptionFieldLabel}>Email:</Text>
                      <Text style={styles.prescriptionFieldValue}>
                        {selectedPrescriptionDetail.patientEmail}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Diagnosis Section */}
                <View style={styles.prescriptionSection}>
                  <Text style={styles.prescriptionSectionTitle}>DIAGNOSIS</Text>
                  <View style={styles.prescriptionDocument}>
                    <Text style={styles.prescriptionFieldValue}>
                      {selectedPrescriptionDetail.diagnosis}
                    </Text>
                  </View>
                </View>

                {/* Symptoms Section */}
                {selectedPrescriptionDetail.symptoms &&
                  selectedPrescriptionDetail.symptoms.length > 0 && (
                    <View style={styles.prescriptionSection}>
                      <Text style={styles.prescriptionSectionTitle}>
                        SYMPTOMS
                      </Text>
                      <View style={styles.prescriptionDocument}>
                        <Text style={styles.prescriptionFieldValue}>
                          {Array.isArray(selectedPrescriptionDetail.symptoms)
                            ? selectedPrescriptionDetail.symptoms.join(", ")
                            : selectedPrescriptionDetail.symptoms}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Medicines Section */}
                <View style={styles.prescriptionSection}>
                  <Text style={styles.prescriptionSectionTitle}>
                    PRESCRIBED MEDICINES
                  </Text>

                  <View style={styles.prescriptionTableHeader}>
                    <Text
                      style={[styles.prescriptionTableHeaderText, { flex: 2 }]}
                    >
                      Medicine
                    </Text>
                    <Text
                      style={[styles.prescriptionTableHeaderText, { flex: 1 }]}
                    >
                      Dosage
                    </Text>
                    <Text
                      style={[
                        styles.prescriptionTableHeaderText,
                        { flex: 1.5 },
                      ]}
                    >
                      Frequency
                    </Text>
                    <Text
                      style={[styles.prescriptionTableHeaderText, { flex: 1 }]}
                    >
                      Duration
                    </Text>
                  </View>

                  {selectedPrescriptionDetail.medicines &&
                    selectedPrescriptionDetail.medicines.map(
                      (medicine, index) => (
                        <View key={index} style={styles.prescriptionTableRow}>
                          <View
                            style={[styles.prescriptionTableCell, { flex: 2 }]}
                          >
                            <Text style={styles.prescriptionTableCellText}>
                              {medicine.name}
                            </Text>
                          </View>
                          <View
                            style={[styles.prescriptionTableCell, { flex: 1 }]}
                          >
                            <Text style={styles.prescriptionTableCellText}>
                              {medicine.dosage}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.prescriptionTableCell,
                              { flex: 1.5 },
                            ]}
                          >
                            <Text style={styles.prescriptionTableCellText}>
                              {medicine.frequency}
                            </Text>
                          </View>
                          <View
                            style={[styles.prescriptionTableCell, { flex: 1 }]}
                          >
                            <Text style={styles.prescriptionTableCellText}>
                              {medicine.duration}
                            </Text>
                          </View>
                        </View>
                      ),
                    )}
                </View>

                {/* Doctor's Advice Section */}
                {selectedPrescriptionDetail.advice &&
                  selectedPrescriptionDetail.advice.length > 0 && (
                    <View style={styles.prescriptionSection}>
                      <Text style={styles.prescriptionSectionTitle}>
                        DOCTOR'S ADVICE
                      </Text>
                      {Array.isArray(selectedPrescriptionDetail.advice) ? (
                        selectedPrescriptionDetail.advice.map(
                          (advice, index) => (
                            <View
                              key={index}
                              style={styles.prescriptionAdviceRow}
                            >
                              <Text style={styles.prescriptionAdviceNumber}>
                                •{" "}
                              </Text>
                              <Text style={styles.prescriptionAdviceText}>
                                {advice}
                              </Text>
                            </View>
                          ),
                        )
                      ) : (
                        <Text style={styles.prescriptionFieldValue}>
                          {selectedPrescriptionDetail.advice}
                        </Text>
                      )}
                    </View>
                  )}

                {/* Next Visit Section */}
                {selectedPrescriptionDetail.nextVisit && (
                  <View style={styles.prescriptionSection}>
                    <Text style={styles.prescriptionSectionTitle}>
                      NEXT VISIT
                    </Text>
                    <View style={styles.prescriptionDocument}>
                      <Text style={styles.prescriptionFieldLabel}>
                        Scheduled Date:
                      </Text>
                      <Text style={styles.prescriptionFieldValue}>
                        {selectedPrescriptionDetail.nextVisit}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Lab Tests Section */}
                {selectedPrescriptionDetail.requestedLabTests &&
                  selectedPrescriptionDetail.requestedLabTests.length > 0 && (
                    <View style={styles.prescriptionSection}>
                      <View style={styles.prescriptionLabTestHeader}>
                        <MaterialCommunityIcons
                          name="flask"
                          size={22}
                          color="#4ECDC4"
                        />
                        <Text style={styles.prescriptionSectionTitle}>
                          REQUESTED LAB TESTS
                        </Text>
                      </View>

                      {selectedPrescriptionDetail.requestedLabTests.map(
                        (test, index) => {
                          const hasReport = getLabReportForPrescription(
                            selectedPrescriptionDetail.id,
                          )
                            ? true
                            : false;
                          const displayStatus = hasReport
                            ? "completed"
                            : test.status;

                          return (
                            <View
                              key={index}
                              style={styles.prescriptionLabTestCard}
                            >
                              <View
                                style={styles.prescriptionLabTestCardHeader}
                              >
                                <View style={styles.prescriptionLabTestNumber}>
                                  <Text
                                    style={styles.prescriptionLabTestNumberText}
                                  >
                                    {index + 1}
                                  </Text>
                                </View>
                                <View style={styles.prescriptionLabTestInfo}>
                                  <Text style={styles.prescriptionLabTestName}>
                                    {test.testName}
                                  </Text>
                                  <Text
                                    style={
                                      styles.prescriptionLabTestDescription
                                    }
                                  >
                                    {test.testDescription}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    styles.prescriptionLabTestStatus,
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
                                      styles.prescriptionLabTestStatusText,
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
                              <View style={styles.prescriptionLabTestDateInfo}>
                                <Ionicons
                                  name="calendar"
                                  size={14}
                                  color="#999"
                                />
                                <Text style={styles.prescriptionLabTestDate}>
                                  Requested: {test.requestedDate}
                                </Text>
                              </View>
                            </View>
                          );
                        },
                      )}

                      {/* Lab Report Section */}
                      {getLabReportForPrescription(
                        selectedPrescriptionDetail.id,
                      ) && (
                        <View
                          style={[
                            styles.prescriptionSection,
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
                                styles.prescriptionSectionTitle,
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
                                  selectedPrescriptionDetail.id,
                                ).reportUploadedDate
                              }
                            </Text>
                            <Text style={styles.reportInfoText}>
                              Time:{" "}
                              {
                                getLabReportForPrescription(
                                  selectedPrescriptionDetail.id,
                                ).reportUploadedTime
                              }
                            </Text>
                            <Text style={styles.reportInfoText}>
                              Patient:{" "}
                              {
                                getLabReportForPrescription(
                                  selectedPrescriptionDetail.id,
                                ).patientName
                              }
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.viewReportButton}
                            onPress={() =>
                              handleViewReport(
                                getLabReportForPrescription(
                                  selectedPrescriptionDetail.id,
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
              </View>

              <View style={styles.prescriptionDocumentPadding} />
            </ScrollView>
          )}
        </SafeAreaView>
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

                {/* Patient Info */}
                <View style={styles.reportDetailSection}>
                  <Text style={styles.reportDetailLabel}>
                    Patient Information
                  </Text>
                  <Text style={styles.reportDetailValue}>
                    {selectedReport.patientName}
                  </Text>
                  <Text
                    style={[
                      styles.reportDetailValue,
                      { fontSize: 12, color: "#6B7280", marginTop: 4 },
                    ]}
                  >
                    {selectedReport.patientEmail}
                  </Text>
                  <Text
                    style={[
                      styles.reportDetailValue,
                      { fontSize: 12, color: "#6B7280", marginTop: 2 },
                    ]}
                  >
                    {selectedReport.patientPhone}
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

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Schedule</Text>
              <TouchableOpacity
                onPress={() => setShowScheduleModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Current Schedules List */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Current Schedules</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddForm(!showAddForm)}
                  >
                    <Ionicons
                      name={showAddForm ? "remove" : "add"}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.addButtonText}>
                      {showAddForm ? "Cancel" : "Add New"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {Object.keys(doctorTimings).length > 0 ? (
                  <View style={styles.schedulesList}>
                    {Object.entries(doctorTimings).map(([day, timing]) => (
                      <View key={day} style={styles.scheduleCard}>
                        <View style={styles.scheduleCardLeft}>
                          <View style={styles.dayBadge}>
                            <Text style={styles.dayBadgeText}>
                              {day.substring(0, 3)}
                            </Text>
                          </View>
                          <View style={styles.scheduleDetails}>
                            <Text style={styles.scheduleDayName}>{day}</Text>
                            <Text style={styles.scheduleTimeRange}>
                              {timing.startTime} - {timing.endTime}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.scheduleActions}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => editSchedule(day, timing)}
                          >
                            <Ionicons name="pencil" size={16} color="#4ECDC4" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => confirmDelete(day)}
                          >
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color="#9CA3B4"
                    />
                    <Text style={styles.emptyStateText}>
                      No schedules set yet
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Tap "Add New" to create your first schedule
                    </Text>
                  </View>
                )}
              </View>

              {/* Add/Edit Form */}
              {showAddForm && (
                <>
                  <View style={styles.formDivider} />
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionLabel}>
                      {editingSchedule
                        ? `Edit ${editingSchedule} Schedule`
                        : "Add New Schedule"}
                    </Text>

                    {/* Day Selection */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>Select Day</Text>
                      <View style={styles.daysGrid}>
                        {daysOfWeek.map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayButton,
                              selectedDay === day && styles.selectedDayButton,
                              doctorTimings[day] &&
                                selectedDay !== day &&
                                styles.disabledDayButton,
                            ]}
                            onPress={() => setSelectedDay(day)}
                            disabled={doctorTimings[day] && selectedDay !== day}
                          >
                            <Text
                              style={[
                                styles.dayButtonText,
                                selectedDay === day &&
                                  styles.selectedDayButtonText,
                                doctorTimings[day] &&
                                  selectedDay !== day &&
                                  styles.disabledDayButtonText,
                              ]}
                            >
                              {day.substring(0, 3)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Time Selection */}
                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>Start Time</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeScrollView}
                      >
                        <View style={styles.timeGrid}>
                          {timeSlots.map((time) => (
                            <TouchableOpacity
                              key={`start-${time}`}
                              style={[
                                styles.timeButton,
                                selectedStartTime === time &&
                                  styles.selectedTimeButton,
                              ]}
                              onPress={() => setSelectedStartTime(time)}
                            >
                              <Text
                                style={[
                                  styles.timeButtonText,
                                  selectedStartTime === time &&
                                    styles.selectedTimeButtonText,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    <View style={styles.formSection}>
                      <Text style={styles.formLabel}>End Time</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeScrollView}
                      >
                        <View style={styles.timeGrid}>
                          {timeSlots.map((time) => (
                            <TouchableOpacity
                              key={`end-${time}`}
                              style={[
                                styles.timeButton,
                                selectedEndTime === time &&
                                  styles.selectedTimeButton,
                              ]}
                              onPress={() => setSelectedEndTime(time)}
                            >
                              <Text
                                style={[
                                  styles.timeButtonText,
                                  selectedEndTime === time &&
                                    styles.selectedTimeButtonText,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            {showAddForm && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    resetScheduleForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveSchedule}
                >
                  <Text style={styles.saveButtonText}>
                    {editingSchedule ? "Update Schedule" : "Save Schedule"}
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#4ECDC4", // Header color for status bar area
  },

  // Updated Header - Solid Green
  header: {
    backgroundColor: "#4ECDC4", // Solid green color instead of gradient
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  doctorProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  specialization: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff4757",
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },

  // Content Wrapper
  contentWrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "600",
  },

  // Circular Quick Actions
  circularActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  circularActionContainer: {
    alignItems: "center",
    width: 70,
  },
  circularAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  circularActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },

  // Compact Statistics
  compactStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compactStatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: (width - 48) / 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
  },

  // Appointments
  appointmentsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  appointmentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  appointmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: "#64748b",
  },
  appointmentTime: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4ECDC4",
  },
  noAppointmentsText: {
    fontSize: 14,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },

  // Tools Grid
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  toolCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: (width - 48) / 2,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  activeNavItem: {
    // No additional styling needed
  },
  bottomNavText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#4ECDC4",
    fontWeight: "600",
  },

  bottomSpacing: {
    height: 20,
  },

  // Schedule Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    height: "85%",
    display: "flex",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  schedulesList: {
    gap: 8,
  },
  scheduleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  scheduleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayBadge: {
    backgroundColor: "#4ECDC4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  dayBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleDayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  scheduleTimeRange: {
    fontSize: 12,
    color: "#64748b",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f0fdfa",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#4ECDC4",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  formDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  disabledDayButton: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    opacity: 0.5,
  },
  disabledDayButtonText: {
    color: "#9CA3AF",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: "13%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedDayButton: {
    backgroundColor: "#4ECDC4",
    borderColor: "#4ECDC4",
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  selectedDayButtonText: {
    color: "white",
    fontWeight: "600",
  },
  timeScrollView: {
    maxHeight: 60,
  },
  timeGrid: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 70,
    alignItems: "center",
  },
  selectedTimeButton: {
    backgroundColor: "#4ECDC4",
    borderColor: "#4ECDC4",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  selectedTimeButtonText: {
    color: "white",
    fontWeight: "600",
  },
  currentScheduleScrollView: {
    maxHeight: 150, // Reduced height for better fit
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  currentSchedule: {
    padding: 16,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "white",
  },
  scheduleItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scheduleDay: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 8,
  },
  scheduleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginLeft: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4ECDC4",
    overflow: "hidden",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Bottom Navigation Styles
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: 8,
    paddingTop: 8,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeNavTab: {
    backgroundColor: "#f0fffe",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navTabText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  activeNavTabText: {
    color: "#4ECDC4",
    fontWeight: "600",
  },
  // Appointments Tab Styles
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ECDC4",
    marginBottom: 4,
  },
  // New Appointment Grid Styles
  appointmentsGrid: {
    gap: 16,
  },
  appointmentGridCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  appointmentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  patientInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  confirmedIndicator: {
    backgroundColor: "#dcfce7",
  },
  rejectedIndicator: {
    backgroundColor: "#fee2e2",
  },
  pendingIndicator: {
    backgroundColor: "#fef3c7",
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#059669",
  },
  appointmentDetailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4ECDC4",
    gap: 8,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "700",
  },
  notesSection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  notesLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: "#64748b",
    fontStyle: "italic",
    lineHeight: 18,
    marginLeft: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  rejectButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  approveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: "#94a3b8",
  },
  processedStatus: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginTop: 8,
  },
  processedStatusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  // Legacy styles (keeping for compatibility)
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confirmedBadge: {
    backgroundColor: "#dcfce7",
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#059669",
  },
  appointmentDetail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  // Patients Tab Styles
  patientCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientDetails: {
    marginLeft: 12,
    flex: 1,
  },
  patientEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  patientStats: {
    alignItems: "flex-end",
  },
  appointmentCount: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  // Room ID Styles
  roomIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  roomIdText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 6,
  },
  // Video Call Button Styles
  roomIdWithAction: {
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  joinCallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    elevation: 2,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinCallButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledCallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  disabledCallButtonText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  // Empty State Styles
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 12,
  },
  // Prescription styles
  prescriptionPlaceholder: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  addPrescriptionButton: {
    backgroundColor: "#4ECDC4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addPrescriptionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  addPrescriptionButtonSecondary: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addPrescriptionButtonSecondaryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // Prescription List Styles
  prescriptionsList: {
    gap: 12,
  },
  prescriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionPatient: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  prescriptionEmail: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  prescriptionDiagnosis: {
    fontSize: 13,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  prescriptionDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  prescriptionMedicines: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 8,
  },
  medicinesCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  prescriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prescriptionNumber: {
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4ECDC4",
  },
  prescriptionNumberText: {
    fontSize: 11,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    textTransform: "capitalize",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  // Prescription Detail Modal Styles
  prescriptionHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prescriptionHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  prescriptionDocumentContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  prescriptionDocumentHeader: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  prescriptionDocumentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  prescriptionDividerLine: {
    height: 2,
    backgroundColor: "#4ECDC4",
    marginBottom: 16,
  },
  prescriptionInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  prescriptionInfoLeft: {
    flex: 1,
  },
  prescriptionInfoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  prescriptionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  prescriptionValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  prescriptionDocumentBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  prescriptionSection: {
    marginBottom: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
  },
  prescriptionSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prescriptionInformationBox: {
    backgroundColor: "#f0fffe",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  prescriptionInfoField: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  prescriptionFieldLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  prescriptionFieldValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  prescriptionDocument: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  prescriptionTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#4ECDC4",
  },
  prescriptionTableHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  prescriptionTableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  prescriptionTableCell: {
    justifyContent: "center",
  },
  prescriptionTableCellText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  prescriptionAdviceRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  prescriptionAdviceNumber: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
    marginRight: 8,
  },
  prescriptionAdviceText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  prescriptionLabTestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  prescriptionLabTestCard: {
    backgroundColor: "#f0fffe",
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  prescriptionLabTestCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  prescriptionLabTestNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
  },
  prescriptionLabTestNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  prescriptionLabTestInfo: {
    flex: 1,
  },
  prescriptionLabTestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 3,
  },
  prescriptionLabTestDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  prescriptionLabTestStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  prescriptionLabTestStatusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  prescriptionLabTestDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 44,
  },
  prescriptionLabTestDate: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  prescriptionDocumentPadding: {
    height: 30,
  },
  prescriptionCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
  tapToViewText: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  // Report Styles
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

export default DoctorDashboard;
