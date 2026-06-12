import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
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

const { width } = Dimensions.get("window");

// ===========================================
// HELPER FUNCTIONS FOR OTP VERIFICATION
// ===========================================

/**
 * Verify OTP by fetching from Firebase and comparing
 * @param {string} orderId - Order ID to fetch OTP for
 * @param {string} userOTP - User entered OTP
 * @returns {Promise<object>} - Result with success flag
 */
const verifyOTPFromFirebase = async (orderId, userOTP) => {
  try {
    const response = await fetch(
      `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/delivery-otps.json`,
    );
    const data = await response.json();

    if (!data) {
      return { success: false, message: "No OTP records found" };
    }

    // Find OTP for this order - need to search through all records
    let foundOTP = null;
    let otpKey = null;

    Object.entries(data).forEach(([key, otpRecord]) => {
      if (otpRecord.orderId === orderId) {
        foundOTP = otpRecord;
        otpKey = key;
      }
    });

    if (!foundOTP) {
      return { success: false, message: "No OTP found for this order" };
    }

    // Check if OTP is expired
    const expiresAt = new Date(foundOTP.expiresAt);
    if (new Date() > expiresAt) {
      return { success: false, message: "OTP has expired. Request a new one." };
    }

    // Check if already verified
    if (foundOTP.verified) {
      return { success: false, message: "This OTP has already been used" };
    }

    // Verify OTP
    if (foundOTP.otp !== userOTP.trim()) {
      return { success: false, message: "Invalid OTP. Please try again." };
    }

    // Mark OTP as verified in Firebase
    await fetch(
      `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/delivery-otps/${otpKey}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified: true,
          verifiedAt: new Date().toISOString(),
        }),
      },
    );

    return { success: true, message: "OTP verified successfully!" };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Error verifying OTP: " + error.message };
  }
};

/**
 * Update order status to delivered
 */
const updateOrderToDelivered = async (orderId) => {
  try {
    const response = await fetch(
      `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/medicine-orders/${orderId}.json`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: "delivered",
          deliveryStatus: "delivered",
          lastUpdated: new Date().toISOString(),
        }),
      },
    );

    return response.ok;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};

const OrderStatus = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [deliveryOrders, setDeliveryOrders] = useState({});
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  // Refresh when page is focused
  useFocusEffect(
    useCallback(() => {
      loadOrders();
      loadDeliveryOrders();
    }, []),
  );

  // Load delivery orders and sync with medicine orders
  const loadDeliveryOrders = async () => {
    try {
      const response = await fetch(
        "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/delivery-orders.json",
      );
      const data = await response.json();

      if (data) {
        // Create a map of delivery orders by the medicine order ID (orderId field)
        // This orderId is the database key of the medicine-order
        const deliveryMap = {};
        Object.entries(data).forEach(([key, order]) => {
          // Map by orderId which is the medicine-order's database key
          if (order.orderId) {
            deliveryMap[order.orderId] = {
              id: key,
              ...order,
            };
          }
        });
        setDeliveryOrders(deliveryMap);
        console.log("Delivery orders loaded:", deliveryMap);
      }
    } catch (error) {
      console.error("Error loading delivery orders:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Get patient email from session
      const userSession = await AsyncStorage.getItem("userSession");
      if (!userSession) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const sessionData = JSON.parse(userSession);
      const patientEmail = sessionData.email;

      // Fetch medicine orders from Firebase
      const response = await fetch(
        "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/medicine-orders.json",
      );
      const data = await response.json();

      if (data) {
        // Filter orders for this patient
        const patientOrders = Object.entries(data)
          .filter(([key, order]) => order.patientEmail === patientEmail)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }))
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        setOrders(patientOrders);
      } else {
        setOrders([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "confirmed":
        return "#3b82f6";
      case "processing":
        return "#8b5cf6";
      case "shipped":
        return "#06b6d4";
      case "delivered":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      // Delivery Statuses
      case "ready_for_pickup":
        return "#f59e0b";
      case "assigned":
        return "#3b82f6";
      case "picked_up":
        return "#8b5cf6";
      case "in_transit":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "pending-actions";
      case "confirmed":
        return "check-circle";
      case "processing":
        return "hourglass-empty";
      case "shipped":
        return "bag";
      case "delivered":
        return "task-alt";
      case "cancelled":
        return "cancel";
      // Delivery Statuses
      case "ready_for_pickup":
        return "pending-actions";
      case "assigned":
        return "person";
      case "picked_up":
        return "directions-run";
      case "in_transit":
        return "delivery-dining";
      default:
        return "info";
    }
  };

  const getDeliveryStatusLabel = (status) => {
    switch (status) {
      case "ready_for_pickup":
        return "Ready for Pickup";
      case "assigned":
        return "Assigned to Delivery";
      case "picked_up":
        return "Picked Up";
      case "in_transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      default:
        return status?.replace(/_/g, " ").toUpperCase();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    await loadDeliveryOrders();
    setRefreshing(false);
  };

  const handleMarkAsDelivered = () => {
    // Check if order status is shipped (ready for delivery)
    if (selectedOrder.orderStatus !== "shipped") {
      Alert.alert(
        "Error",
        'Order must be in "shipped" status to mark as delivered',
      );
      return;
    }

    // Open OTP verification modal
    setOtpInput("");
    setShowOTPModal(true);
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    setVerifyingOTP(true);
    const result = await verifyOTPFromFirebase(selectedOrder.id, otpInput);
    setVerifyingOTP(false);

    if (result.success) {
      // OTP verified, now update order status
      const updateSuccess = await updateOrderToDelivered(selectedOrder.id);

      if (updateSuccess) {
        Alert.alert("Success", "Order marked as delivered!");
        setShowOTPModal(false);
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: "delivered",
        }));
        // Reload orders
        loadOrders();
      } else {
        Alert.alert("Error", "Failed to update order status");
      }
    } else {
      Alert.alert("OTP Verification Failed", result.message);
    }
  };

  const handleViewOrder = (order) => {
    // Get the delivery status for this order if available
    // Use order.id (database key) as it matches the orderId saved in delivery-orders
    const deliveryOrder = deliveryOrders[order.id];
    const orderWithDelivery = {
      ...order,
      deliveryStatus: deliveryOrder?.deliveryStatus,
      deliveryOrder: deliveryOrder,
    };
    setSelectedOrder(orderWithDelivery);
    setShowOrderDetail(true);
  };

  const renderOrderCard = ({ item }) => {
    // Use item.id (database key) to match with delivery order
    const deliveryOrder = deliveryOrders[item.id];
    const currentStatus = deliveryOrder?.deliveryStatus || item.orderStatus;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewOrder(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdSection}>
            <Text style={styles.orderId}>{item.orderId}</Text>
            <Text style={styles.prescriptionId}>{item.prescriptionNumber}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(currentStatus)}20` },
            ]}
          >
            <MaterialIcons
              name={getStatusIcon(currentStatus)}
              size={16}
              color={getStatusColor(currentStatus)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(currentStatus) },
              ]}
            >
              {currentStatus === "in_transit" ||
              currentStatus === "ready_for_pickup" ||
              currentStatus === "assigned" ||
              currentStatus === "picked_up"
                ? getDeliveryStatusLabel(currentStatus)
                : item.orderStatus?.charAt(0).toUpperCase() +
                  item.orderStatus?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.orderDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="local-pharmacy" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.medicines?.length || 0} medicines
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color="#6b7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>Tap to view details</Text>
          <Ionicons name="chevron-forward" size={18} color="#4ECDC4" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
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
          <Text style={styles.headerTitle}>Medicine Orders</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} order{orders.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </LinearGradient>

      {/* Orders List */}
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4ECDC4"
            />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="package" size={60} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Orders Yet</Text>
          <Text style={styles.emptyStateText}>
            You haven't ordered any medicines yet. Go to your prescriptions to
            place an order.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/prescription-view")}
          >
            <Text style={styles.browseButtonText}>Browse Prescriptions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Details Modal */}
      {showOrderDetail && selectedOrder && (
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <LinearGradient
              colors={["#4ECDC4", "#44A08D"]}
              style={styles.modalHeader}
            >
              <TouchableOpacity
                onPress={() => setShowOrderDetail(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Order Details</Text>
              <View style={styles.closeButton} />
            </LinearGradient>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Section */}
              <View style={styles.statusSection}>
                {selectedOrder.deliveryStatus ? (
                  <>
                    <View
                      style={[
                        styles.largeStatusBadge,
                        {
                          backgroundColor: `${getStatusColor(selectedOrder.deliveryStatus)}10`,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={getStatusIcon(selectedOrder.deliveryStatus)}
                        size={40}
                        color={getStatusColor(selectedOrder.deliveryStatus)}
                      />
                      <Text
                        style={[
                          styles.largeStatusText,
                          {
                            color: getStatusColor(selectedOrder.deliveryStatus),
                          },
                        ]}
                      >
                        {getDeliveryStatusLabel(selectedOrder.deliveryStatus)}
                      </Text>
                    </View>
                    <Text style={styles.deliveryTrackingText}>
                      📦 Delivery Tracking Active
                    </Text>
                  </>
                ) : (
                  <View
                    style={[
                      styles.largeStatusBadge,
                      {
                        backgroundColor: `${getStatusColor(selectedOrder.orderStatus)}10`,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={getStatusIcon(selectedOrder.orderStatus)}
                      size={40}
                      color={getStatusColor(selectedOrder.orderStatus)}
                    />
                    <Text
                      style={[
                        styles.largeStatusText,
                        { color: getStatusColor(selectedOrder.orderStatus) },
                      ]}
                    >
                      {selectedOrder.orderStatus?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Order Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Order Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order ID:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.orderId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order Date:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.orderDate}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order Time:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.orderTime}
                  </Text>
                </View>
              </View>

              {/* Prescription Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Prescription Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Prescription No:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.prescriptionNumber}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Doctor:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.doctorName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Specialty:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.doctorSpecialty}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Diagnosis:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.diagnosis}
                  </Text>
                </View>
              </View>

              {/* Delivery Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Delivery Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery Address:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.deliveryAddress}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pharmacy Status:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.pharmacyStatus === "not-assigned"
                      ? "Not Assigned Yet"
                      : selectedOrder.pharmacyStatus}
                  </Text>
                </View>
                {selectedOrder.deliveryStatus && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Delivery Status:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          {
                            color: getStatusColor(selectedOrder.deliveryStatus),
                          },
                        ]}
                      >
                        {getDeliveryStatusLabel(selectedOrder.deliveryStatus)}
                      </Text>
                    </View>
                    {selectedOrder.deliveryOrder?.lastUpdated && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Last Updated:</Text>
                        <Text style={styles.infoValue}>
                          {new Date(
                            selectedOrder.deliveryOrder.lastUpdated,
                          ).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Medicines List */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>
                  Medicines ({selectedOrder.medicines?.length || 0})
                </Text>
                {selectedOrder.medicines?.map((medicine, index) => (
                  <View key={index} style={styles.medicineItem}>
                    <View style={styles.medicineHeader}>
                      <Text style={styles.medicineName}>{medicine.name}</Text>
                      <Text style={styles.medicineType}>{medicine.type}</Text>
                    </View>
                    <View style={styles.medicineMeta}>
                      <Text style={styles.medicineMeta}>
                        <Text style={{ fontWeight: "600" }}>Dosage:</Text>{" "}
                        {medicine.dosage} |{" "}
                        <Text style={{ fontWeight: "600" }}>Frequency:</Text>{" "}
                        {medicine.frequency}
                      </Text>
                      <Text style={styles.medicineMeta}>
                        <Text style={{ fontWeight: "600" }}>Duration:</Text>{" "}
                        {medicine.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              {selectedOrder.orderStatus === "shipped" && (
                <TouchableOpacity
                  style={styles.deliverButton}
                  onPress={handleMarkAsDelivered}
                >
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.deliverButtonText}>
                    Mark as Delivered
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowOrderDetail(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && selectedOrder && (
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.otpModalContainer}>
            <LinearGradient
              colors={["#4ECDC4", "#44A08D"]}
              style={styles.otpModalHeader}
            >
              <Text style={styles.otpModalTitle}>OTP Verification</Text>
              <Text style={styles.otpModalSubtitle}>
                Enter the OTP sent to patient email
              </Text>
            </LinearGradient>

            <View style={styles.otpModalContent}>
              <View style={styles.otpInfoSection}>
                <MaterialIcons name="info" size={24} color="#4ECDC4" />
                <Text style={styles.otpInfoText}>
                  Patient: {selectedOrder.patientName}
                </Text>
              </View>

              <View style={styles.otpInputSection}>
                <Text style={styles.otpLabel}>Enter 6-digit OTP:</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  editable={!verifyingOTP}
                />
              </View>

              <View style={styles.otpButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.otpVerifyButton,
                    verifyingOTP && styles.otpButtonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={verifyingOTP}
                >
                  <Text style={styles.otpVerifyButtonText}>
                    {verifyingOTP ? "Verifying..." : "Verify OTP"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.otpCancelButton}
                  onPress={() => {
                    setShowOTPModal(false);
                    setOtpInput("");
                  }}
                  disabled={verifyingOTP}
                >
                  <Text style={styles.otpCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
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
  ordersList: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  ordersListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderIdSection: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  prescriptionId: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  viewDetails: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusSection: {
    alignItems: "center",
    marginVertical: 24,
    paddingVertical: 20,
    backgroundColor: "white",
    borderRadius: 12,
  },
  largeStatusBadge: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  largeStatusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textTransform: "uppercase",
  },
  deliveryTrackingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4ECDC4",
    textAlign: "center",
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
    paddingBottomWidth: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    flex: 0.4,
  },
  infoValue: {
    fontSize: 13,
    color: "#1f2937",
    flex: 0.6,
    textAlign: "right",
  },
  medicineItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4ECDC4",
  },
  medicineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  medicineType: {
    fontSize: 11,
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  medicineMeta: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  bottomPadding: {
    height: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
    gap: 10,
  },
  deliverButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deliverButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  closeModalButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  // OTP Modal Styles
  otpModalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: "50%",
    marginBottom: "50%",
  },
  otpModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  otpModalSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
  },
  otpModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  otpInfoSection: {
    backgroundColor: "#E0F7F4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  otpInfoText: {
    fontSize: 14,
    color: "#0D665F",
    fontWeight: "600",
    flex: 1,
  },
  otpInputSection: {
    marginBottom: 24,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: "#4ECDC4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 8,
    backgroundColor: "white",
  },
  otpButtonsContainer: {
    gap: 12,
    marginTop: "auto",
  },
  otpVerifyButton: {
    backgroundColor: "#4ECDC4",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  otpVerifyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  otpButtonDisabled: {
    opacity: 0.6,
  },
  otpCancelButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  otpCancelButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default OrderStatus;
