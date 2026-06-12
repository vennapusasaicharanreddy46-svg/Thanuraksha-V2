import { API_ENDPOINTS } from "@/config/api.config";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
    TouchableOpacity,
    View,
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

const { width } = Dimensions.get("window");

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6 digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP trigger to Flask backend for delivery validation
 * @param {object} orderData - Order details
 * @returns {Promise<object>} - Response from backend
 */
const sendOTPToBackend = async (orderData) => {
  try {
    const otp = generateOTP();

    // Store OTP in Firebase from frontend
    const firebaseUrl =
      "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/delivery-otps.json";
    const otpStoreResponse = await fetch(firebaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: orderData.id,
        orderIdDisplay: orderData.orderId,
        patientEmail: orderData.patientEmail,
        otp: otp,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours expiry
        verified: false,
      }),
    });

    if (!otpStoreResponse.ok) {
      return {
        success: false,
        message: "Failed to store OTP in database",
      };
    }

    // Send payload to Flask backend (backend will call email service)
    const payload = {
      orderId: orderData.id,
      orderIdDisplay: orderData.orderId,
      patientEmail: orderData.patientEmail,
      patientName: orderData.patientName,
      medicines:
        orderData.medicines?.map((m) => ({
          name: m.name,
          type: m.type,
          dosage: m.dosage,
          quantity: m.quantity || 1,
        })) || [],
      totalItems: orderData.medicines?.length || 0,
      deliveryAddress: orderData.deliveryAddress,
      otp: otp,
      timestamp: new Date().toISOString(),
    };

    console.log("Sending OTP payload to Flask backend:", payload);

    const response = await fetch(API_ENDPOINTS.DELIVERY.SEND_OTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log("Email sent successfully by backend:", responseData);
      return {
        success: true,
        message: "OTP generated & stored. Email being sent to patient",
        data: responseData,
        otp: otp, // Return OTP for testing
      };
    } else {
      console.error("Backend error:", responseData);
      return {
        success: false,
        message: responseData.message || "Failed to send email",
        error: responseData,
      };
    }
  } catch (error) {
    console.error("Error sending OTP to backend:", error);
    return {
      success: false,
      message: "Network error: " + error.message,
      error,
    };
  }
};

const PharmacyOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, processing, shipped

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/medicine-orders.json",
      );
      const data = await response.json();

      if (data) {
        let ordersList = Object.entries(data)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }))
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        // Filter by status if not 'all'
        if (statusFilter !== "all") {
          ordersList = ordersList.filter(
            (order) => order.orderStatus === statusFilter,
          );
        }

        setOrders(ordersList);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
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
      default:
        return "info";
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/medicine-orders/${orderId}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderStatus: newStatus,
            pharmacyStatus: newStatus === "cancelled" ? "rejected" : "assigned",
            lastUpdated: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        // Update local state
        const updatedOrders = orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                pharmacyStatus:
                  newStatus === "cancelled" ? "rejected" : "assigned",
              }
            : order,
        );

        setOrders(updatedOrders);

        // Update selected order if it's open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => ({
            ...prev,
            orderStatus: newStatus,
            pharmacyStatus: newStatus === "cancelled" ? "rejected" : "assigned",
          }));
        }

        Alert.alert("Success", `Order status updated to ${newStatus}!`);
      } else {
        Alert.alert("Error", "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleAcceptOrder = () => {
    Alert.alert(
      "Accept Order",
      "Do you want to accept this order and start processing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => updateOrderStatus(selectedOrder.id, "processing"),
        },
      ],
    );
  };

  const handleMarkAsShipped = async () => {
    Alert.alert(
      "Mark as Shipped",
      "This will generate an OTP and send it to patient email. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ship",
          onPress: async () => {
            // Send OTP to backend first
            const otpResult = await sendOTPToBackend(selectedOrder);

            if (otpResult.success) {
              // If OTP sent successfully, update order status
              await updateOrderStatus(selectedOrder.id, "shipped");
              Alert.alert(
                "Success",
                "OTP has been generated and sent to patient email. Delivery boy can now proceed with delivery verification.",
              );
            } else {
              Alert.alert(
                "Error",
                otpResult.message +
                  "\n\nMake sure Flask backend is running on the configured port.",
              );
            }
          },
        },
      ],
    );
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        onPress: () => updateOrderStatus(selectedOrder.id, "cancelled"),
        style: "destructive",
      },
    ]);
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewOrder(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdSection}>
          <Text style={styles.orderId}>{item.orderId}</Text>
          <Text style={styles.patientName}>{item.patientName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.orderStatus)}20` },
          ]}
        >
          <MaterialIcons
            name={getStatusIcon(item.orderStatus)}
            size={16}
            color={getStatusColor(item.orderStatus)}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.orderStatus) },
            ]}
          >
            {item.orderStatus?.charAt(0).toUpperCase() +
              item.orderStatus?.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="calendar-today" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.orderDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="local-pharmacy" size={14} color="#6b7280" />
          <Text style={styles.detailText}>
            {item.medicines?.length || 0} medicines
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={14} color="#6b7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.deliveryAddress}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.orderStatus === "pending"
              ? styles.acceptButton
              : styles.disabledButton,
          ]}
          onPress={() => updateOrderStatus(item.id, "processing")}
          disabled={item.orderStatus !== "pending"}
        >
          <Text style={styles.actionButtonText}>
            {item.orderStatus === "pending" ? "Accept" : "Accepted"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
      <StatusBar barStyle="light-content" backgroundColor="#f093fb" />

      {/* Header */}
      <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Medicine Orders</Text>
          <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
        </View>
        <View style={styles.headerButton} />
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {["all", "pending", "processing", "shipped"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              statusFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              tintColor="#f093fb"
            />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="box" size={60} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Orders</Text>
          <Text style={styles.emptyStateText}>
            No {statusFilter !== "all" ? statusFilter : ""} orders found
          </Text>
        </View>
      )}

      {/* Order Details Modal */}
      {showOrderDetail && selectedOrder && (
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
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

              {/* Patient Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Patient Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.patientName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.patientEmail}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery Address:</Text>
                  <Text style={styles.infoValue}>
                    {selectedOrder.deliveryAddress}
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
                      <Text style={styles.medicineMetaText}>
                        <Text style={{ fontWeight: "600" }}>Dosage:</Text>{" "}
                        {medicine.dosage}
                      </Text>
                      <Text style={styles.medicineMetaText}>
                        <Text style={{ fontWeight: "600" }}>Frequency:</Text>{" "}
                        {medicine.frequency}
                      </Text>
                      <Text style={styles.medicineMetaText}>
                        <Text style={{ fontWeight: "600" }}>Duration:</Text>{" "}
                        {medicine.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              {selectedOrder.orderStatus === "pending" ? (
                <TouchableOpacity
                  style={styles.acceptOrderButton}
                  onPress={handleAcceptOrder}
                >
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={styles.acceptOrderButtonText}>Accept Order</Text>
                </TouchableOpacity>
              ) : selectedOrder.orderStatus === "processing" ? (
                <TouchableOpacity
                  style={styles.shipButton}
                  onPress={handleMarkAsShipped}
                >
                  <MaterialIcons
                    name="local-shipping"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.shipButtonText}>Mark as Shipped</Text>
                </TouchableOpacity>
              ) : null}

              {selectedOrder.orderStatus !== "shipped" &&
                selectedOrder.orderStatus !== "delivered" &&
                selectedOrder.orderStatus !== "cancelled" && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelOrder}
                  >
                    <MaterialIcons name="cancel" size={20} color="white" />
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  filterTabActive: {
    backgroundColor: "#f093fb",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTabTextActive: {
    color: "white",
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
  patientName: {
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
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
    borderLeftColor: "#f093fb",
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
    backgroundColor: "#fce7f3",
    color: "#ec4899",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  medicineMeta: {
    gap: 2,
  },
  medicineMetaText: {
    fontSize: 12,
    color: "#6B7280",
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
  acceptOrderButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptOrderButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  shipButton: {
    backgroundColor: "#06b6d4",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shipButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  closeModalButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default PharmacyOrders;
