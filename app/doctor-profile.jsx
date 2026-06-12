import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

// Conditional import for LinearGradient with fallback
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

const DoctorProfile = () => {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Generate colors based on doctor ID
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
    const index = (id?.length || 0) % colorSets.length;
    return colorSets[index];
  };

  // Get available dates for a selected day
  const getAvailableDatesForDay = (dayName) => {
    const dates = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Create a proper comparison date (start of today)
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const targetDay = dayMap[dayName];
    if (targetDay === undefined) return [];

    // Find all dates in current month that match the selected day
    for (let date = 1; date <= 31; date++) {
      const testDate = new Date(currentYear, currentMonth, date);

      // Stop if we've gone to next month
      if (testDate.getMonth() !== currentMonth) break;

      // Check if this date matches our target day and is not in the past
      if (testDate.getDay() === targetDay && testDate >= todayStart) {
        // Format date without timezone conversion issues
        const year = testDate.getFullYear();
        const month = String(testDate.getMonth() + 1).padStart(2, "0");
        const day = String(testDate.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;

        dates.push({
          date: localDateString, // Format: YYYY-MM-DD (local timezone)
          displayDate: testDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }), // Format: "Aug 11"
        });
      }
    }

    return dates;
  };

  const loadDoctorData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch doctor data
      const doctorResponse = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/doctors/${doctorId}.json`,
      );
      const doctorData = await doctorResponse.json();

      if (doctorData) {
        const doctorWithExtras = {
          id: doctorId,
          ...doctorData,
          colors: generateDoctorColors(doctorId),
          rating: (Math.random() * 1 + 4).toFixed(1), // Random rating 4.0-5.0
          reviews: Math.floor(Math.random() * 300) + 50, // Random reviews 50-350
          responseTime: `${Math.floor(Math.random() * 15) + 3} mins`,
          patients: `${(Math.random() * 3 + 1).toFixed(1)}K+`,
          isOnline: Math.random() > 0.3,
          isVerified: true,
          nextAvailable: getNextAvailableTime(),
        };

        setDoctor(doctorWithExtras);

        // Generate mock appointments based on doctor's schedule
        if (doctorData.timings) {
          const mockAppointments = generateMockAppointments(doctorData.timings);
          setAppointments(mockAppointments);
        }
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
      Alert.alert("Error", "Failed to load doctor information");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      loadDoctorData();
    }
  }, [doctorId, loadDoctorData]);

  // Generate 15-minute time slots between start and end time (excluding end time)
  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];

    // Parse start time
    const [startHour, startMin] = startTime.split(":").map(Number);
    let currentHour = startHour;
    let currentMin = startMin;

    // Parse end time
    const [endHour, endMin] = endTime.split(":").map(Number);
    const endTotalMinutes = endHour * 60 + endMin;

    // Generate slots with 15-minute intervals
    while (true) {
      const currentTotalMinutes = currentHour * 60 + currentMin;

      // Stop if we've reached or passed the end time
      if (currentTotalMinutes >= endTotalMinutes) {
        break;
      }

      // Format and add the time slot
      const formattedTime = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push(formattedTime);

      // Add 15 minutes
      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
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

  const generateMockAppointments = (timings) => {
    const appointments = [];
    const patientNames = [
      "Sarah Johnson",
      "Michael Chen",
      "Emily Rodriguez",
      "James Wilson",
      "Lisa Wang",
      "Robert Taylor",
      "Maria Garcia",
      "David Lee",
    ];

    Object.entries(timings).forEach(([day, timing], index) => {
      if (index < 4) {
        // Limit to 4 appointments for display
        const time = timing.startTime;
        const name =
          patientNames[Math.floor(Math.random() * patientNames.length)];
        const types = ["Consultation", "Follow-up", "Check-up", "Emergency"];
        const type = types[Math.floor(Math.random() * types.length)];

        appointments.push({
          id: `${day}-${index}`,
          patientName: name,
          day: day,
          time: time,
          type: type,
          avatar: name.charAt(0),
          status: Math.random() > 0.5 ? "confirmed" : "pending",
        });
      }
    });

    return appointments;
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDoctorData();
    } catch (error) {
      console.error("Error refreshing doctor data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDoctorData]);

  const bookAppointment = () => {
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedDay || !selectedTime || !selectedDate) {
      Alert.alert(
        "Error",
        "Please select day, date and time for your appointment.",
      );
      return;
    }

    try {
      setBookingLoading(true);

      // Get patient email from AsyncStorage
      const userSession = await AsyncStorage.getItem("userSession");
      let patientEmail = "patient@example.com"; // Default fallback

      if (userSession) {
        const userData = JSON.parse(userSession);
        patientEmail = userData.email || patientEmail;
      }

      // Create appointment data
      const appointmentId = `appointment_${Date.now()}`;
      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty:
          doctor.specialty || doctor.specialization || "General Medicine",
        patientEmail: patientEmail,
        selectedDay: selectedDay,
        selectedDate: selectedDate, // Include specific date
        selectedTime: selectedTime,
        status: "pending",
        bookedAt: new Date().toISOString(),
        appointmentDate: selectedDate, // Use specific date instead of day
      };

      // Save to Firebase
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/appointments/${appointmentId}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentData),
        },
      );

      if (response.ok) {
        // Get the selected date display format
        const dateObj = availableDates[selectedDay]?.find(
          (d) => d.date === selectedDate,
        );
        const displayDate = dateObj ? dateObj.displayDate : selectedDate;

        Alert.alert(
          "Success!",
          `Appointment booked successfully!\n\nDoctor: ${doctor.name}\nDate: ${displayDate}\nTime: ${selectedTime}\n\nYou will receive a confirmation shortly.`,
        );

        // Reset modal state
        setShowBookingModal(false);
        setSelectedDay("");
        setSelectedDate("");
        setSelectedTime("");
        setAvailableDates({});
      } else {
        throw new Error("Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      Alert.alert("Error", "Failed to book appointment. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const callDoctor = () => {
    Alert.alert("Call Doctor", `Would you like to call ${doctor?.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call Now",
        onPress: () => {
          Alert.alert("Calling", `Calling ${doctor?.name}...`);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading doctor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      {/* Header */}
      <LinearGradient
        colors={doctor.colors}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Doctor Profile</Text>

          <TouchableOpacity style={styles.moreIcon}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Doctor Info Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <LinearGradient
              colors={doctor.colors}
              style={styles.doctorAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {doctor.photo ? (
                <Image
                  source={{ uri: doctor.photo }}
                  style={styles.doctorImage}
                  resizeMode="cover"
                />
              ) : (
                <FontAwesome5 name="user-md" size={40} color="white" />
              )}
            </LinearGradient>

            <View style={styles.doctorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                {doctor.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                )}
              </View>

              <Text style={styles.doctorSpecialty}>
                {doctor.specialty ||
                  doctor.specialization ||
                  "Medical Specialist"}
              </Text>

              <View style={styles.doctorStats}>
                <View style={styles.statItem}>
                  <AntDesign name="star" size={14} color="#FFD700" />
                  <Text style={styles.statText}>{doctor.rating}</Text>
                  <Text style={styles.statSubtext}>
                    ({doctor.reviews} reviews)
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Ionicons name="time" size={14} color="#64748B" />
                  <Text style={styles.statText}>
                    {doctor.experience || "5+ years"}
                  </Text>
                </View>
              </View>

              {/* Online Status */}
              {doctor.isOnline && (
                <View style={styles.onlineStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Available Now</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{doctor.patients}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{doctor.responseTime}</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{doctor.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutItem}>
              <Ionicons name="school" size={20} color="#4ECDC4" />
              <View style={styles.aboutText}>
                <Text style={styles.aboutLabel}>Qualification</Text>
                <Text style={styles.aboutValue}>
                  {doctor.qualification || "MBBS, MD"}
                </Text>
              </View>
            </View>

            <View style={styles.aboutItem}>
              <Ionicons name="briefcase" size={20} color="#4ECDC4" />
              <View style={styles.aboutText}>
                <Text style={styles.aboutLabel}>Experience</Text>
                <Text style={styles.aboutValue}>
                  {doctor.experience || "5+ years"}
                </Text>
              </View>
            </View>

            <View style={styles.aboutItem}>
              <Ionicons name="medical" size={20} color="#4ECDC4" />
              <View style={styles.aboutText}>
                <Text style={styles.aboutLabel}>Specialty</Text>
                <Text style={styles.aboutValue}>
                  {doctor.specialty ||
                    doctor.specialization ||
                    "General Medicine"}
                </Text>
              </View>
            </View>

            {doctor.email && (
              <View style={styles.aboutItem}>
                <Ionicons name="mail" size={20} color="#4ECDC4" />
                <View style={styles.aboutText}>
                  <Text style={styles.aboutLabel}>Email</Text>
                  <Text style={styles.aboutValue}>{doctor.email}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Schedule Section */}
        {doctor.timings && Object.keys(doctor.timings).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Schedule</Text>
            <View style={styles.scheduleCard}>
              {Object.entries(doctor.timings).map(([day, timing]) => (
                <View key={day} style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>{day}</Text>
                  <Text style={styles.scheduleTime}>
                    {timing.startTime} - {timing.endTime}
                  </Text>
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>Available</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Appointments Section */}
        {appointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <View style={styles.appointmentsCard}>
              {appointments.map((appointment) => (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentAvatar}>
                    <Text style={styles.appointmentAvatarText}>
                      {appointment.avatar}
                    </Text>
                  </View>

                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentName}>
                      {appointment.patientName}
                    </Text>
                    <Text style={styles.appointmentDetails}>
                      {appointment.day} • {appointment.time}
                    </Text>
                    <Text style={styles.appointmentType}>
                      {appointment.type}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.appointmentStatus,
                      {
                        backgroundColor:
                          appointment.status === "confirmed"
                            ? "#22C55E"
                            : "#F59E0B",
                      },
                    ]}
                  >
                    <Text style={styles.appointmentStatusText}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Appointment Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Fixed Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity
                onPress={() => setShowBookingModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              bounces={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#4ECDC4"
                  title="Pull to refresh doctor availability"
                />
              }
            >
              <View style={styles.modalBody}>
                <View style={styles.doctorModalInfo}>
                  <LinearGradient
                    colors={doctor?.colors || ["#4ECDC4", "#44D8A8"]}
                    style={styles.modalDoctorAvatar}
                  >
                    <FontAwesome5 name="user-md" size={24} color="white" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.modalDoctorName}>{doctor?.name}</Text>
                    <Text style={styles.modalDoctorSpecialty}>
                      {doctor?.specialty ||
                        doctor?.specialization ||
                        "Medical Specialist"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Select Day</Text>
                <View style={styles.daysContainer}>
                  {doctor?.timings &&
                    Object.entries(doctor.timings).map(([day, timing]) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selectedDay === day && styles.selectedDayButton,
                        ]}
                        onPress={() => {
                          setSelectedDay(day);
                          setSelectedTime(""); // Reset time when day changes
                          setSelectedDate(""); // Reset date when day changes

                          // Get available dates for this day
                          const dates = getAvailableDatesForDay(day);
                          setAvailableDates({
                            ...availableDates,
                            [day]: dates,
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            selectedDay === day && styles.selectedDayButtonText,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Date Selection - Show when day is selected */}
                {selectedDay &&
                  availableDates[selectedDay] &&
                  availableDates[selectedDay].length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Select Date</Text>
                      <View style={styles.datesContainer}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.datesScrollContainer}
                        >
                          {availableDates[selectedDay].map((dateObj, index) => (
                            <TouchableOpacity
                              key={dateObj.date}
                              style={[
                                styles.dateButton,
                                selectedDate === dateObj.date &&
                                  styles.selectedDateButton,
                              ]}
                              onPress={() => {
                                setSelectedDate(dateObj.date);
                                setSelectedTime(""); // Reset time when date changes
                              }}
                            >
                              <Text
                                style={[
                                  styles.dateButtonText,
                                  selectedDate === dateObj.date &&
                                    styles.selectedDateButtonText,
                                ]}
                              >
                                {dateObj.displayDate}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </>
                  )}

                {selectedDay &&
                  selectedDate &&
                  doctor?.timings &&
                  doctor.timings[selectedDay] && (
                    <>
                      <Text style={styles.sectionLabel}>Select Time</Text>
                      <View style={styles.timesContainer}>
                        {generateTimeSlots(
                          doctor.timings[selectedDay].startTime,
                          doctor.timings[selectedDay].endTime,
                        ).map((timeSlot, index) => (
                          <TouchableOpacity
                            key={timeSlot}
                            style={[
                              styles.timeButton,
                              selectedTime === timeSlot &&
                                styles.selectedTimeButton,
                            ]}
                            onPress={() => setSelectedTime(timeSlot)}
                          >
                            <Text
                              style={[
                                styles.timeButtonText,
                                selectedTime === timeSlot &&
                                  styles.selectedTimeButtonText,
                              ]}
                            >
                              {timeSlot}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
              </View>
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedDay ||
                    !selectedDate ||
                    !selectedTime ||
                    bookingLoading) &&
                    styles.disabledButton,
                ]}
                onPress={confirmBooking}
                disabled={
                  !selectedDay ||
                  !selectedDate ||
                  !selectedTime ||
                  bookingLoading
                }
              >
                <LinearGradient
                  colors={doctor?.colors || ["#4ECDC4", "#44D8A8"]}
                  style={styles.confirmButtonGradient}
                >
                  {bookingLoading ? (
                    <Text style={styles.confirmButtonText}>Booking...</Text>
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Confirm Booking
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.callButton} onPress={callDoctor}>
          <Ionicons name="call" size={20} color="#4ECDC4" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookButton} onPress={bookAppointment}>
          <LinearGradient
            colors={doctor.colors}
            style={styles.bookButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  moreIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Doctor Card
  doctorCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  doctorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginRight: 8,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  doctorStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },

  // Quick Stats
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },

  // About Card
  aboutCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  aboutItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aboutText: {
    marginLeft: 12,
    flex: 1,
  },
  aboutLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },

  // Schedule Card
  scheduleCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  scheduleTime: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
    textAlign: "center",
  },
  availableBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availableText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },

  // Appointments Card
  appointmentsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  appointmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  appointmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  appointmentAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  appointmentDetails: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: "#64748B",
  },
  appointmentStatus: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  appointmentStatusText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#4ECDC4",
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4ECDC4",
  },
  bookButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  bookButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: "#64748B",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  bottomSpacing: {
    height: 20,
  },

  // Booking Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.6,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    flex: 1,
  },
  modalScrollView: {
    maxHeight: height * 0.5, // Reduce to give more space to header and actions
  },
  modalScrollContent: {
    paddingBottom: 10,
    paddingTop: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
  },
  doctorModalInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  modalDoctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalDoctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalDoctorSpecialty: {
    fontSize: 14,
    color: "#64748B",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedDayButton: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  selectedDayButtonText: {
    color: "white",
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  timeButton: {
    minWidth: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedTimeButton: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  selectedTimeButtonText: {
    color: "white",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    gap: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Date Selection Styles
  datesContainer: {
    marginBottom: 20,
  },
  datesScrollContainer: {
    paddingHorizontal: 5,
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedDateButton: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  dateButtonText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  selectedDateButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default DoctorProfile;
