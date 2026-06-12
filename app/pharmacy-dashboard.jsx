import { API_ENDPOINTS } from "@/config/api.config";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
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

// ===========================================
// OTP HELPER FUNCTIONS FOR DELIVERY
// ===========================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6 digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP when order is marked as "in_transit" (out for delivery)
 * @param {object} orderData - Order details with patient info
 * @returns {Promise<object>} - Result of OTP generation and sending
 */
const sendOTPForDelivery = async (orderData) => {
  try {
    const otp = generateOTP();

    // Store OTP in Firebase
    const firebaseUrl =
      "https://thanuraksha-v2-default-rtdb.firebaseio.com/delivery-otps.json";
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

    // Send OTP to Flask backend for email delivery
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

    console.log("Sending OTP for out-for-delivery to Flask backend:", payload);

    const response = await fetch(API_ENDPOINTS.DELIVERY.SEND_OTP, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log("OTP email sent to patient:", responseData);
      return {
        success: true,
        message: "OTP generated and sent to patient email",
        data: responseData,
        otp: otp,
      };
    } else {
      console.error("Backend error:", responseData);
      return {
        success: false,
        message: responseData.message || "Failed to send OTP email",
        error: responseData,
      };
    }
  } catch (error) {
    console.error("Error sending OTP for delivery:", error);
    return {
      success: false,
      message: "Network error: " + error.message,
      error,
    };
  }
};

const PharmacyDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedLabType, setSelectedLabType] = useState(null);
  const [selectedLabOrder, setSelectedLabOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [pharmacyCategory, setPharmacyCategory] = useState("orders"); // Default category
  const [pharmacyData, setPharmacyData] = useState(null);

  // Real-time Orders States
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(null);

  // Delivery States
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);

  // OTP & Delivery Verification States
  const [sendingOTP, setSendingOTP] = useState(false);
  const [showDeliveryOTPModal, setShowDeliveryOTPModal] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [otpStatusMessage, setOtpStatusMessage] = useState(null);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [currentDeliveryOrderId, setCurrentDeliveryOrderId] = useState(null);
  const [currentMedicineOrderId, setCurrentMedicineOrderId] = useState(null);

  // Lab Test Orders States
  const [labTestOrders, setLabTestOrders] = useState([]);
  const [filteredLabOrders, setFilteredLabOrders] = useState([]);
  const [labModalVisible, setLabModalVisible] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReportImage, setSelectedReportImage] = useState(null);

  // Load pharmacy session and set category
  useEffect(() => {
    const loadPharmacySession = async () => {
      try {
        const session = await AsyncStorage.getItem("pharmacySession");
        if (session) {
          const data = JSON.parse(session);
          setPharmacyData(data);
          setPharmacyCategory(data.category || "orders");
          setActiveTab(data.category || "orders");
          console.log("Pharmacy category loaded:", data.category);
        }
      } catch (error) {
        console.error("Error loading pharmacy session:", error);
      }
    };
    loadPharmacySession();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("pharmacySession");
      await AsyncStorage.removeItem("userSession");
      router.replace("/landing");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch orders from Firebase
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/medicine-orders.json",
      );
      const data = await response.json();

      if (data) {
        let orders = Object.entries(data)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }))
          .filter(
            (order) =>
              order.orderStatus === "pending" ||
              order.orderStatus === "confirmed",
          )
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        setOrdersData(orders);
      } else {
        setOrdersData([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrdersData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Refresh when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === "orders") {
        loadOrders();
      } else if (activeTab === "delivery") {
        loadDeliveryOrders();
      } else if (activeTab === "labs") {
        loadLabTestOrders();
      }
    }, [activeTab]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const category = pharmacyCategory || activeTab;
      if (category === "orders") {
        await loadOrders();
      } else if (category === "delivery") {
        await loadDeliveryOrders();
      } else if (category === "labs") {
        await loadLabTestOrders();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load Delivery Orders
  const loadDeliveryOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/delivery-orders.json",
      );
      const data = await response.json();

      if (data) {
        let orders = Object.entries(data)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }))
          .filter((order) => order.deliveryStatus !== "delivered")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setDeliveryOrders(orders);
      } else {
        setDeliveryOrders([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading delivery orders:", error);
      setDeliveryOrders([]);
      setLoading(false);
    }
  };

  // Update Delivery Status
  const updateDeliveryStatus = async (deliveryOrderId, newStatus) => {
    try {
      // If marking as "in_transit", generate and send OTP in background
      if (newStatus === "in_transit") {
        // Show loading indicator
        setSendingOTP(true);
        setOtpStatusMessage(null);

        // Find the delivery order to get orderId
        const deliveryOrder = deliveryOrders.find(
          (order) => order.id === deliveryOrderId,
        );

        if (!deliveryOrder) {
          Alert.alert("Error", "Delivery order not found");
          setSendingOTP(false);
          return;
        }

        // Fetch the medicine-order to get patient details (orderId = medicine-order key)
        const medicineOrderResponse = await fetch(
          `https://thanuraksha-v2-default-rtdb.firebaseio.com/medicine-orders/${deliveryOrder.orderId}.json`,
        );

        if (!medicineOrderResponse.ok) {
          Alert.alert("Error", "Failed to fetch order details");
          setSendingOTP(false);
          return;
        }

        const medicineOrder = await medicineOrderResponse.json();

        // Prepare order data for OTP
        const orderDataForOTP = {
          id: deliveryOrder.orderId,
          orderId: medicineOrder.orderId,
          patientEmail: medicineOrder.patientEmail,
          patientName: medicineOrder.patientName,
          medicines: medicineOrder.medicines,
          deliveryAddress: medicineOrder.deliveryAddress,
        };

        // Generate and send OTP in background
        const otpResult = await sendOTPForDelivery(orderDataForOTP);

        // Store the generated OTP for later verification
        if (otpResult.otp) {
          setGeneratedOTP(otpResult.otp);
        }

        setSendingOTP(false);

        // Show appropriate message based on result
        if (otpResult.success) {
          setOtpStatusMessage({
            type: "success",
            text: `✓ OTP sent to ${medicineOrder.patientEmail}`,
          });
          setTimeout(() => setOtpStatusMessage(null), 3000);
        } else {
          setOtpStatusMessage({
            type: "warning",
            text: `⚠ Mail not sent but OTP generated`,
          });
          setTimeout(() => setOtpStatusMessage(null), 3000);
        }
      }

      // If marking as "delivered", require OTP verification first
      if (newStatus === "delivered") {
        // Find the delivery order
        const deliveryOrder = deliveryOrders.find(
          (order) => order.id === deliveryOrderId,
        );

        // Close the delivery detail modal first so OTP modal is visible
        setDeliveryModalVisible(false);

        // Small delay to ensure modal closes before OTP modal opens
        setTimeout(() => {
          // Store both delivery order ID and medicine order ID
          setCurrentDeliveryOrderId(deliveryOrderId);
          if (deliveryOrder) {
            setCurrentMedicineOrderId(deliveryOrder.orderId); // orderId is the medicine-order key
          }
          // Reset OTP input and show modal
          setEnteredOTP("");
          setShowDeliveryOTPModal(true);
        }, 200);

        return; // Don't update status yet, wait for OTP verification
      }

      // Update delivery status in Firebase for other statuses
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/delivery-orders/${deliveryOrderId}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryStatus: newStatus,
            lastUpdated: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        Alert.alert("Success", `Delivery status updated to ${newStatus}!`);
        setDeliveryModalVisible(false);
        await loadDeliveryOrders();
      } else {
        Alert.alert("Error", "Failed to update delivery status");
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      Alert.alert("Error", "Failed to update delivery status.");
      setSendingOTP(false);
    }
  };

  // Handle OTP Verification for Delivered Status
  const handleVerifyDeliveryOTP = async () => {
    if (!enteredOTP.trim()) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }

    setVerifyingOTP(true);

    // Verify the entered OTP against generated OTP
    if (enteredOTP.trim() === generatedOTP) {
      // OTP is correct - fetch patient email from Firebase OTP record and send welcome email
      try {
        let patientEmail = null;

        // Fetch delivery-otps to get patient email from the OTP record
        const otpsResponse = await fetch(
          `https://thanuraksha-v2-default-rtdb.firebaseio.com/delivery-otps.json`,
        );

        if (otpsResponse.ok) {
          const otpsData = await otpsResponse.json();
          if (otpsData) {
            // Find the OTP record for this medicine order
            Object.entries(otpsData).forEach(([key, otpRecord]) => {
              if (otpRecord.orderId === currentMedicineOrderId) {
                patientEmail = otpRecord.patientEmail;
                console.log("Found patient email:", patientEmail);
              }
            });
          }
        }

        // Send welcome email
        if (patientEmail) {
          const welcomePayload = {
            patientEmail: patientEmail,
            timestamp: new Date().toISOString(),
          };

          console.log("Sending welcome email to:", patientEmail);

          const welcomeResponse = await fetch(
            API_ENDPOINTS.DELIVERY.WELCOME_EMAIL,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(welcomePayload),
            },
          );

          if (welcomeResponse.ok) {
            console.log("Welcome email sent successfully to:", patientEmail);
          } else {
            console.log(
              "Welcome email failed - Status:",
              welcomeResponse.status,
            );
          }
        } else {
          console.log(
            "Patient email not found - Medicine Order ID:",
            currentMedicineOrderId,
          );
        }

        // Update delivery order status to "delivered" in Firebase
        if (currentDeliveryOrderId) {
          const updateResponse = await fetch(
            `https://thanuraksha-v2-default-rtdb.firebaseio.com/delivery-orders/${currentDeliveryOrderId}.json`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                deliveryStatus: "delivered",
                lastUpdated: new Date().toISOString(),
              }),
            },
          );

          if (updateResponse.ok) {
            console.log("Order deliveryStatus updated to delivered:", currentDeliveryOrderId);
          } else {
            console.log("Failed to update order deliveryStatus");
          }
        }

        // Also update the medicine order status to "delivered"
        if (currentMedicineOrderId) {
          const medicineUpdateResponse = await fetch(
            `https://thanuraksha-v2-default-rtdb.firebaseio.com/medicine-orders/${currentMedicineOrderId}.json`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderStatus: "delivered",
                deliveredAt: new Date().toISOString(),
              }),
            },
          );

          if (medicineUpdateResponse.ok) {
            console.log("Medicine order status updated to delivered:", currentMedicineOrderId);
          } else {
            console.log("Failed to update medicine order status");
          }
        }

        Alert.alert("Success", "OTP Verified! Welcome email sent.");
        setShowDeliveryOTPModal(false);
        setEnteredOTP("");
        setGeneratedOTP(null);
        setCurrentDeliveryOrderId(null);
        setCurrentMedicineOrderId(null);
        setDeliveryModalVisible(false);
        await loadDeliveryOrders();
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Failed to process request");
      }
    } else {
      // OTP is incorrect
      Alert.alert(
        "Invalid OTP",
        "The OTP you entered is incorrect. Please try again.",
      );
    }

    setVerifyingOTP(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/medicine-orders/${orderId}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderStatus: newStatus,
            pharmacyStatus:
              newStatus === "cancelled" ? "rejected" : "confirmed",
            lastUpdated: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        // If status is processing, also add to delivery orders
        if (newStatus === "processing") {
          await saveToDeliveryOrders(selectedOrder || orderId);
        }
        Alert.alert("Success", `Order status updated to ${newStatus}!`);
        setOrderDetailModalVisible(false);
        await loadOrders();
      } else {
        Alert.alert("Error", "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  const saveToDeliveryOrders = async (order) => {
    try {
      const deliveryData = {
        orderId: order.id,
        patientName: order.patientName,
        phoneNumber: order.phoneNumber,
        deliveryAddress: order.deliveryAddress,
        medicines: order.medicines,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        orderStatus: "processing",
        deliveryStatus: "ready_for_pickup",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/delivery-orders.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deliveryData),
        },
      );

      if (response.ok) {
        console.log("Order saved to delivery section");
      }
    } catch (error) {
      console.error("Error saving to delivery orders:", error);
    }
  };

  // Load Lab Test Orders
  const loadLabTestOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders.json",
      );
      const data = await response.json();

      if (data) {
        let orders = Object.entries(data)
          .map(([key, order]) => ({
            id: key,
            ...order,
          }))
          .filter(
            (order) =>
              order.orderStatus === "pending" ||
              order.orderStatus === "sample-collected",
          )
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        setLabTestOrders(orders);
        setFilteredLabOrders(orders);
      } else {
        setLabTestOrders([]);
        setFilteredLabOrders([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading lab test orders:", error);
      setLabTestOrders([]);
      setFilteredLabOrders([]);
      setLoading(false);
    }
  };

  // Update Lab Test Order
  const updateLabTestOrder = async (labOrderId, updates) => {
    try {
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders/${labOrderId}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...updates,
            lastUpdated: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        Alert.alert("Success", "Lab test order updated!");
        setSelectedLabOrder(null);
        await loadLabTestOrders();
      } else {
        Alert.alert("Error", "Failed to update lab test order");
      }
    } catch (error) {
      console.error("Error updating lab test order:", error);
      Alert.alert("Error", "Failed to update lab test order.");
    }
  };

  const pickReportImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedReportImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const convertImageToBase64 = async (imageUri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  };

  const uploadLabReport = async () => {
    if (!selectedReportImage || !selectedLabOrder) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setUploadingReport(true);
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(selectedReportImage.uri);

      // Create report object
      const reportData = {
        reportImage: base64Image,
        reportFileName: selectedReportImage.filename || "report.jpg",
        reportMimeType: selectedReportImage.mimeType || "image/jpeg",
        reportUploadedDate: new Date().toISOString().split("T")[0],
        reportUploadedTime: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        reportStatus: "uploaded",
        uploadedByPharmacy: true,
        // Patient info
        patientName: selectedLabOrder.patientName,
        patientEmail: selectedLabOrder.patientEmail,
        patientPhone: selectedLabOrder.patientPhone,
        // Doctor info
        doctorName: selectedLabOrder.doctorName,
        doctorEmail: selectedLabOrder.doctorEmail || "doctor@medical.com",
        doctorSpecialty: selectedLabOrder.doctorSpecialty,
        // Lab order info
        labOrderId: selectedLabOrder.id,
        prescriptionId: selectedLabOrder.prescriptionId,
        prescriptionNumber: selectedLabOrder.prescriptionNumber,
        diagnosis: selectedLabOrder.diagnosis,
        testsList:
          selectedLabOrder.requestedTests?.map((t) => t.testName).join(", ") ||
          "Lab Tests",
      };

      // Update lab order with report
      const response = await fetch(
        `https://thanuraksha-v2-default-rtdb.firebaseio.com/lab-test-orders/${selectedLabOrder.id}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportData),
        },
      );

      if (response.ok) {
        Alert.alert("Success", "Lab report uploaded successfully!");
        setSelectedReportImage(null);
        setLabModalVisible(false);
        await loadLabTestOrders();
      } else {
        Alert.alert("Error", "Failed to upload lab report");
      }
    } catch (error) {
      console.error("Error uploading report:", error);
      Alert.alert("Error", "Failed to upload lab report: " + error.message);
    } finally {
      setUploadingReport(false);
    }
  };

  const handleApproveOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailModalVisible(true);
  };

  const handleRejectOrder = (orderId) => {
    Alert.alert("Confirm", "Do you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        onPress: () => updateOrderStatus(orderId, "cancelled"),
      },
    ]);
  };

  const handleApproveFromModal = () => {
    if (selectedOrder) {
      Alert.alert(
        "Approve Order",
        "This order will be sent to delivery for processing. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => updateOrderStatus(selectedOrder.id, "processing"),
          },
        ],
      );
    }
  };

  // Delivery Handlers
  const handleSelectDeliveryOrder = (order) => {
    setSelectedDeliveryOrder(order);
    setDeliveryModalVisible(true);
  };

  const handleAssignToDeliveryBoy = (order) => {
    Alert.alert(
      "Assign Order",
      "Assign this order to delivery boy for pickup?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Assign",
          onPress: () => updateDeliveryStatus(order.id, "assigned"),
        },
      ],
    );
  };

  const handleMarkAsPickedUp = (order) => {
    Alert.alert("Picked Up", "Mark this order as picked up by delivery boy?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => updateDeliveryStatus(order.id, "picked_up"),
      },
    ]);
  };

  const handleMarkAsShipped = (order) => {
    Alert.alert("Mark as In Transit", "Order is now out for delivery?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => updateDeliveryStatus(order.id, "in_transit"),
      },
    ]);
  };

  const handleMarkAsDelivered = (order) => {
    updateDeliveryStatus(order.id, "delivered");
  };

  // Lab Test Types
  const labTestTypes = [
    {
      id: "1",
      name: "Blood Test",
      icon: "water",
      color: "#e74c3c",
      description: "Complete Blood Count & Analysis",
    },
    {
      id: "2",
      name: "Urine Test",
      icon: "beaker",
      color: "#f39c12",
      description: "Urinalysis & Kidney Function",
    },
    {
      id: "3",
      name: "ECG Test",
      icon: "heart",
      color: "#e91e63",
      description: "Electrocardiogram - Heart Analysis",
    },
    {
      id: "4",
      name: "Vision Test",
      icon: "eye",
      color: "#9c27b0",
      description: "Eye Evaluation & Prescription",
    },
    {
      id: "5",
      name: "Stool Test",
      icon: "flask",
      color: "#795548",
      description: "Stool Analysis & Parasites",
    },
  ];

  // Dummy Lab Orders Data - removed test phone numbers, will use real data from Firebase
  const labOrdersData = {};

  const handleAcceptLabOrder = (labOrderId) => {
    Alert.alert(
      "Lab Order Accepted",
      `Lab order ${labOrderId} accepted. Patient will be contacted for test.`,
    );
  };

  const handleRejectLabOrder = (labOrderId) => {
    Alert.alert(
      "Lab Order Rejected",
      `Lab order ${labOrderId} has been rejected.`,
    );
  };

  const handleSendReport = (labOrderId, patientName, doctorName) => {
    Alert.alert(
      "Report Sent",
      `Lab report for ${patientName} has been sent to Dr. ${doctorName}!`,
    );
  };

  // Order Card Component
  const OrderCard = ({ item }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "pending":
          return "#fff3cd";
        case "confirmed":
          return "#d4edda";
        case "processing":
          return "#cfe2ff";
        case "cancelled":
          return "#f8d7da";
        default:
          return "#e2e3e5";
      }
    };

    const getStatusTextColor = (status) => {
      switch (status) {
        case "pending":
          return "#856404";
        case "confirmed":
          return "#155724";
        case "processing":
          return "#084298";
        case "cancelled":
          return "#842029";
        default:
          return "#383d41";
      }
    };

    const formatPrice = (price) => {
      return `₹${parseFloat(price || 0).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString("en-IN");
      } catch {
        return dateString;
      }
    };

    return (
      <TouchableOpacity
        onPress={() => handleApproveOrder(item)}
        style={styles.orderCard}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderIdText}>
              {item.orderId || `ORD-${item.id?.substring(0, 6)}`}
            </Text>
            <Text style={styles.patientNameText}>
              {item.patientName || "Patient"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(item.orderStatus),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: getStatusTextColor(item.orderStatus),
                },
              ]}
            >
              {item.orderStatus?.charAt(0).toUpperCase() +
                item.orderStatus?.slice(1) || "Pending"}
            </Text>
          </View>
        </View>

        <Text style={styles.itemsText} numberOfLines={2}>
          {item.medicines && Array.isArray(item.medicines)
            ? item.medicines.map((m) => `${m.name} (${m.quantity})`).join(", ")
            : item.medicinesList || "Medicines"}
        </Text>
        <Text style={styles.amountText}>
          {formatPrice(item.totalAmount || item.amount)}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color="#666" />
          <Text style={styles.phoneText}>
            {item.phoneNumber || item.phone || "N/A"}
          </Text>
        </View>
        <Text style={styles.dateText}>
          📅 {formatDate(item.orderDate || item.date)}
        </Text>

        {(item.orderStatus === "pending" ||
          item.orderStatus === "confirming") && (
          <TouchableOpacity
            onPress={() => handleRejectOrder(item.id)}
            style={[styles.button, styles.rejectButton]}
          >
            <Ionicons name="close" size={18} color="white" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Delivery Order Card Component
  const DeliveryOrderCard = ({ item }) => {
    const getDeliveryStatusColor = (status) => {
      switch (status) {
        case "ready_for_pickup":
          return "#fff3cd";
        case "assigned":
          return "#cfe2ff";
        case "picked_up":
          return "#d1ecf1";
        case "in_transit":
          return "#d4edda";
        case "delivered":
          return "#28a745"; // Dark green for completed delivery
        default:
          return "#e2e3e5";
      }
    };

    const getDeliveryStatusTextColor = (status) => {
      switch (status) {
        case "ready_for_pickup":
          return "#856404";
        case "assigned":
          return "#084298";
        case "picked_up":
          return "#055160";
        case "in_transit":
          return "#0a3622";
        case "delivered":
          return "#ffffff"; // White text for dark green background
        default:
          return "#383d41";
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case "ready_for_pickup":
          return "Ready for Pickup";
        case "assigned":
          return "Assigned";
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

    const formatPrice = (price) => {
      return `₹${parseFloat(price || 0).toFixed(2)}`;
    };

    return (
      <TouchableOpacity
        onPress={() => handleSelectDeliveryOrder(item)}
        style={styles.deliveryOrderCard}
      >
        <View style={styles.deliveryOrderHeader}>
          <View>
            <Text style={styles.deliveryOrderIdText}>
              {item.orderId || `DEL-${item.id?.substring(0, 6)}`}
            </Text>
            <Text style={styles.deliveryPatientName}>
              {item.patientName || "Patient"}
            </Text>
          </View>
          <View
            style={[
              styles.deliveryStatusBadge,
              { backgroundColor: getDeliveryStatusColor(item.deliveryStatus) },
            ]}
          >
            <Text
              style={[
                styles.deliveryStatusText,
                { color: getDeliveryStatusTextColor(item.deliveryStatus) },
              ]}
            >
              {getStatusLabel(item.deliveryStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryInfoRow}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.deliveryInfoText}>
            {item.deliveryAddress || "N/A"}
          </Text>
        </View>

        <View style={styles.deliveryInfoRow}>
          <Ionicons name="call-outline" size={14} color="#666" />
          <Text style={styles.deliveryInfoText}>
            {item.phoneNumber || "N/A"}
          </Text>
        </View>

        <Text style={styles.deliveryAmountText}>
          {formatPrice(item.totalAmount || 0)}
        </Text>

        <View style={styles.deliveryMedicinesPreview}>
          <Text style={styles.medicinesLabel}>Items:</Text>
          <Text style={styles.medicinesText} numberOfLines={1}>
            {item.medicines && Array.isArray(item.medicines)
              ? item.medicines.map((m) => m.name).join(", ")
              : "Medicines"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Lab Order Card Component
  const LabOrderCard = ({ item }) => (
    <View style={styles.labOrderCard}>
      <View style={styles.labOrderHeader}>
        <View>
          <Text style={styles.labOrderIdText}>{item.id}</Text>
          <Text style={styles.patientNameText}>{item.patientName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "Pending" ? "#fff3cd" : "#d4edda",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === "Pending" ? "#856404" : "#155724",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.labInfoRow}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.labInfoText}>Doctor: {item.doctorName}</Text>
      </View>
      <View style={styles.labInfoRow}>
        <Ionicons name="call-outline" size={16} color="#666" />
        <Text style={styles.labInfoText}>{item.phone}</Text>
      </View>
      <Text style={styles.labDateText}>📅 {item.date}</Text>

      {item.status === "Pending" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleAcceptLabOrder(item.id)}
          >
            <Ionicons name="checkmark" size={18} color="white" />
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleRejectLabOrder(item.id)}
          >
            <Ionicons name="close" size={18} color="white" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === "Completed" && (
        <TouchableOpacity
          style={[styles.button, styles.sendReportButton]}
          onPress={() =>
            handleSendReport(item.id, item.patientName, item.doctorName)
          }
        >
          <Ionicons name="send" size={18} color="white" />
          <Text style={styles.buttonText}>Send Report to Doctor</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Detailed Order Modal Component
  const OrderDetailModal = () => (
    <Modal
      visible={orderDetailModalVisible}
      animationType="slide"
      onRequestClose={() => setOrderDetailModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setOrderDetailModalVisible(false)}>
            <Ionicons name="arrow-back" size={24} color="#f093fb" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedOrder && (
            <>
              {/* Order Header Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Order Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.orderId ||
                      `ORD-${selectedOrder.id?.substring(0, 6)}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrder.orderDate).toLocaleDateString(
                      "en-IN",
                    )}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          selectedOrder.orderStatus === "pending"
                            ? "#ff9800"
                            : selectedOrder.orderStatus === "confirmed"
                              ? "#4caf50"
                              : "#2196f3",
                      },
                    ]}
                  >
                    {selectedOrder.orderStatus?.toUpperCase() || "PENDING"}
                  </Text>
                </View>
              </View>

              {/* Patient Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Patient Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.patientName || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.phoneNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.deliveryAddress || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Medicines/Prescriptions */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Prescribed Medicines
                </Text>
                {selectedOrder.medicines &&
                Array.isArray(selectedOrder.medicines) ? (
                  selectedOrder.medicines.map((medicine, index) => (
                    <View key={index} style={styles.medicineItem}>
                      <View style={styles.medicineNameRow}>
                        <Text style={styles.medicineName}>{medicine.name}</Text>
                        <Text style={styles.medicineQty}>
                          Qty: {medicine.quantity} {medicine.unit || "units"}
                        </Text>
                      </View>
                      {medicine.dosage && (
                        <Text style={styles.medicineDosage}>
                          Dosage: {medicine.dosage}
                        </Text>
                      )}
                      {medicine.frequency && (
                        <Text style={styles.medicineFrequency}>
                          Frequency: {medicine.frequency}
                        </Text>
                      )}
                      {medicine.price && (
                        <Text style={styles.medicinePrice}>
                          ₹{medicine.price}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noData}>No medicines listed</Text>
                )}
              </View>

              {/* Price Summary */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Price Summary</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={[styles.detailValue, styles.totalAmount]}>
                    ₹{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              {(selectedOrder.orderStatus === "pending" ||
                selectedOrder.orderStatus === "confirmed") && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveActionButton]}
                    onPress={handleApproveFromModal}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>
                      Approve & Send to Delivery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectActionButton]}
                    onPress={() => {
                      handleRejectOrder(selectedOrder.id);
                      setOrderDetailModalVisible(false);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Reject Order</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Delivery Detail Modal
  const DeliveryDetailModal = () => {
    const getStatusLabel = (status) => {
      switch (status) {
        case "ready_for_pickup":
          return "Ready for Pickup";
        case "assigned":
          return "Assigned to Delivery Boy";
        case "picked_up":
          return "Picked Up from Pharmacy";
        case "in_transit":
          return "In Transit";
        case "delivered":
          return "Delivered Successfully";
        default:
          return status?.replace(/_/g, " ").toUpperCase();
      }
    };

    return (
      <Modal
        visible={deliveryModalVisible}
        animationType="slide"
        onRequestClose={() => setDeliveryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDeliveryModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#f093fb" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedDeliveryOrder && (
              <>
                {/* Delivery Status */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Delivery Status</Text>
                  <View style={styles.statusProgressContainer}>
                    <View style={styles.statusStep}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              selectedDeliveryOrder.deliveryStatus !==
                              "ready_for_pickup"
                                ? "#27ae60"
                                : "#ccc",
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                      <Text style={styles.statusStepLabel}>Ready</Text>
                    </View>

                    <View style={styles.statusLine} />

                    <View style={styles.statusStep}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              selectedDeliveryOrder.deliveryStatus !==
                                "ready_for_pickup" &&
                              selectedDeliveryOrder.deliveryStatus !==
                                "assigned"
                                ? "#27ae60"
                                : "#ccc",
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                      <Text style={styles.statusStepLabel}>Assigned</Text>
                    </View>

                    <View style={styles.statusLine} />

                    <View style={styles.statusStep}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              selectedDeliveryOrder.deliveryStatus ===
                                "in_transit" ||
                              selectedDeliveryOrder.deliveryStatus ===
                                "delivered"
                                ? "#27ae60"
                                : "#ccc",
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                      <Text style={styles.statusStepLabel}>In Transit</Text>
                    </View>

                    <View style={styles.statusLine} />

                    <View style={styles.statusStep}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              selectedDeliveryOrder.deliveryStatus ===
                              "delivered"
                                ? "#27ae60"
                                : "#ccc",
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                      <Text style={styles.statusStepLabel}>Delivered</Text>
                    </View>
                  </View>
                </View>

                {/* Order Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Order Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeliveryOrder.orderId ||
                        `DEL-${selectedDeliveryOrder.id?.substring(0, 6)}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: "#27ae60" }]}>
                      {getStatusLabel(selectedDeliveryOrder.deliveryStatus)}
                    </Text>
                  </View>
                </View>

                {/* Customer Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Customer Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Patient Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeliveryOrder.patientName || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDeliveryOrder.phoneNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={[styles.detailValue, { flexWrap: "wrap" }]}>
                      {selectedDeliveryOrder.deliveryAddress || "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Items</Text>
                  {selectedDeliveryOrder.medicines &&
                  Array.isArray(selectedDeliveryOrder.medicines) ? (
                    selectedDeliveryOrder.medicines.map((medicine, index) => (
                      <View key={index} style={styles.medicineItem}>
                        <Text style={styles.medicineName}>{medicine.name}</Text>
                        <Text style={styles.medicineQty}>
                          Qty: {medicine.quantity} {medicine.unit || "units"}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noData}>No items listed</Text>
                  )}
                </View>

                {/* Amount */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Amount</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total:</Text>
                    <Text style={[styles.detailValue, styles.totalAmount]}>
                      ₹
                      {parseFloat(
                        selectedDeliveryOrder.totalAmount || 0,
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {selectedDeliveryOrder.deliveryStatus ===
                    "ready_for_pickup" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.assignButton]}
                      onPress={() => {
                        handleAssignToDeliveryBoy(selectedDeliveryOrder);
                      }}
                    >
                      <Ionicons name="person-add" size={20} color="white" />
                      <Text style={styles.actionButtonText}>
                        Assign to Delivery Boy
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedDeliveryOrder.deliveryStatus === "assigned" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.pickupButton]}
                      onPress={() => {
                        handleMarkAsPickedUp(selectedDeliveryOrder);
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.actionButtonText}>
                        Mark as Picked Up
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedDeliveryOrder.deliveryStatus === "picked_up" && (
                    <View>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.transitButton]}
                        onPress={() => {
                          handleMarkAsShipped(selectedDeliveryOrder);
                        }}
                      >
                        <Ionicons name="bicycle" size={20} color="white" />
                        <Text style={styles.actionButtonText}>
                          Out for Delivery
                        </Text>
                        {sendingOTP && (
                          <ActivityIndicator
                            size="small"
                            color="white"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </TouchableOpacity>

                      {otpStatusMessage && (
                        <View
                          style={[
                            styles.otpStatusMessage,
                            {
                              backgroundColor:
                                otpStatusMessage.type === "success"
                                  ? "#d4edda"
                                  : "#fff3cd",
                              borderColor:
                                otpStatusMessage.type === "success"
                                  ? "#28a745"
                                  : "#ffc107",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.otpStatusText,
                              {
                                color:
                                  otpStatusMessage.type === "success"
                                    ? "#155724"
                                    : "#856404",
                              },
                            ]}
                          >
                            {otpStatusMessage.text}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {selectedDeliveryOrder.deliveryStatus === "in_transit" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliveredButton]}
                      onPress={() => {
                        handleMarkAsDelivered(selectedDeliveryOrder);
                      }}
                    >
                      <Ionicons name="home" size={20} color="white" />
                      <Text style={styles.actionButtonText}>
                        Mark as Delivered
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const DeliveryOTPModal = () => {
    return null; // Keep function for backward compatibility
  };

  const LabDetailModal = () => {
    return (
      <Modal
        visible={labModalVisible}
        animationType="slide"
        onRequestClose={() => setLabModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLabModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#f093fb" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Lab Test Order Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLabOrder && (
              <>
                {/* Patient Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Patient Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.patientName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={[styles.detailValue, { fontSize: 12 }]}>
                      {selectedLabOrder.patientEmail}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.patientPhone}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={[styles.detailValue, { flexWrap: "wrap" }]}>
                      {selectedLabOrder.deliveryAddress}
                    </Text>
                  </View>
                </View>

                {/* Doctor Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Doctor Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Doctor:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.doctorName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Specialty:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.doctorSpecialty}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Diagnosis:</Text>
                    <Text style={[styles.detailValue, { flexWrap: "wrap" }]}>
                      {selectedLabOrder.diagnosis}
                    </Text>
                  </View>
                </View>

                {/* Order Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    Order Information
                  </Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.prescriptionNumber ||
                        `LAB-${selectedLabOrder.id?.substring(0, 6)}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order Date:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.orderDate}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLabOrder.orderTime}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: selectedLabOrder.sampleCollected
                            ? "#27ae60"
                            : "#f093fb",
                        },
                      ]}
                    >
                      {selectedLabOrder.sampleCollected
                        ? "Sample Collected"
                        : "Pending"}
                    </Text>
                  </View>
                </View>

                {/* Requested Tests */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Requested Tests</Text>
                  {selectedLabOrder.requestedTests &&
                  selectedLabOrder.requestedTests.length > 0 ? (
                    selectedLabOrder.requestedTests.map((test, index) => (
                      <View key={index} style={styles.medicineItem}>
                        <View style={styles.medicineNameRow}>
                          <Text style={styles.medicineName}>
                            {test.testName}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  test.status === "completed"
                                    ? "#27ae60"
                                    : test.status === "in-progress"
                                      ? "#f39c12"
                                      : "#e74c3c",
                              },
                            ]}
                          >
                            <Text style={styles.statusText}>
                              {test.status || "pending"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.medicineQty}>
                          {test.testDescription}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noData}>No tests listed</Text>
                  )}
                </View>

                {/* Sample Collection Status */}
                {!selectedLabOrder.sampleCollected && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Sample Collection
                    </Text>
                    <Text style={styles.medicineQty}>
                      Sample collection scheduled for home delivery. Please
                      collect and mark as sampled below.
                    </Text>
                  </View>
                )}

                {/* Report Section */}
                {selectedLabOrder.sampleCollected && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Lab Report</Text>

                    {selectedLabOrder.reportStatus === "uploaded" ? (
                      <View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: "#d4edda", marginBottom: 15 },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: "#27ae60" }]}
                          >
                            ✓ Report Uploaded
                          </Text>
                        </View>
                        <Text style={styles.medicineQty}>
                          Report uploaded on{" "}
                          {selectedLabOrder.reportUploadedDate} at{" "}
                          {selectedLabOrder.reportUploadedTime}
                        </Text>
                        <Text
                          style={[
                            styles.medicineQty,
                            {
                              marginTop: 8,
                              color: "#27ae60",
                              fontWeight: "600",
                            },
                          ]}
                        >
                          ✓ Visible to patient and doctor
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.medicineQty}>
                          Select and upload the lab report image. It will be
                          visible to both patient and doctor.
                        </Text>

                        {selectedReportImage && (
                          <View style={styles.imagePreviewContainer}>
                            <Text style={styles.imagePreviewLabel}>
                              Selected Image:
                            </Text>
                            <Text style={styles.imagePreviewName}>
                              {selectedReportImage.filename || "report.jpg"}
                            </Text>
                            <Text style={styles.imagePreviewSize}>
                              (
                              {(
                                selectedReportImage.fileSize /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB)
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {!selectedLabOrder.sampleCollected && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#27ae60" },
                      ]}
                      onPress={async () => {
                        try {
                          await updateLabTestOrder(selectedLabOrder.id, {
                            sampleCollected: true,
                            sampleCollectionTime: new Date().toISOString(),
                          });
                          Alert.alert("Success", "Sample marked as collected");
                          setLabModalVisible(false);
                          loadLabTestOrders();
                        } catch (error) {
                          Alert.alert(
                            "Error",
                            "Failed to update sample status",
                          );
                        }
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.actionButtonText}>
                        Mark Sample as Collected
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedLabOrder.sampleCollected &&
                    selectedLabOrder.reportStatus !== "uploaded" && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor: uploadingReport
                                ? "#ccc"
                                : "#3498db",
                            },
                          ]}
                          onPress={pickReportImage}
                          disabled={uploadingReport}
                        >
                          <Ionicons name="image" size={20} color="white" />
                          <Text style={styles.actionButtonText}>
                            {selectedReportImage
                              ? "Change Image"
                              : "Select Report Image"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor: uploadingReport
                                ? "#ccc"
                                : "#f093fb",
                              marginTop: 10,
                            },
                          ]}
                          onPress={uploadLabReport}
                          disabled={uploadingReport || !selectedReportImage}
                        >
                          {uploadingReport ? (
                            <>
                              <ActivityIndicator size="small" color="white" />
                              <Text style={styles.actionButtonText}>
                                Uploading...
                              </Text>
                            </>
                          ) : (
                            <>
                              <Ionicons
                                name="cloud-upload"
                                size={20}
                                color="white"
                              />
                              <Text style={styles.actionButtonText}>
                                Upload Report
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f093fb" />

      {/* Order Detail Modal */}
      <OrderDetailModal />

      {/* Delivery Detail Modal */}
      <DeliveryDetailModal />

      {/* Lab Detail Modal */}
      <LabDetailModal />

      {/* Header */}
      <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.pharmacyInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="storefront" size={30} color="white" />
            </View>
            <View style={styles.pharmacyDetails}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.pharmacyName}>
                {pharmacyData?.name || "Pharmacy"}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {pharmacyCategory === "orders" && "📦 Medicine Orders"}
                  {pharmacyCategory === "labs" && "🧪 Lab Tests"}
                  {pharmacyCategory === "delivery" && "🚚 Delivery Service"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Navigation - Show only selected category */}
      <View style={styles.tabContainer}>
        {(pharmacyCategory === "orders" || pharmacyCategory === "orders") && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "orders" && styles.activeTab]}
            onPress={() => {
              setActiveTab("orders");
              setSelectedLabType(null);
            }}
          >
            <Ionicons
              name="bag"
              size={20}
              color={activeTab === "orders" ? "#f093fb" : "#999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "orders" && styles.activeTabText,
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>
        )}

        {(pharmacyCategory === "labs" || pharmacyCategory === "labs") && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "labs" && styles.activeTab]}
            onPress={() => {
              setActiveTab("labs");
              setSelectedLabType(null);
            }}
          >
            <Ionicons
              name="flask"
              size={20}
              color={activeTab === "labs" ? "#f093fb" : "#999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "labs" && styles.activeTabText,
              ]}
            >
              Labs
            </Text>
          </TouchableOpacity>
        )}

        {(pharmacyCategory === "delivery" ||
          pharmacyCategory === "delivery") && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "delivery" && styles.activeTab]}
            onPress={() => {
              setActiveTab("delivery");
              setSelectedLabType(null);
            }}
          >
            <Ionicons
              name="bicycle"
              size={20}
              color={activeTab === "delivery" ? "#f093fb" : "#999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "delivery" && styles.activeTabText,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === "orders" ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.sectionTitle}>Medicine Orders</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f093fb" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : ordersData.length > 0 ? (
            ordersData.map((order) => <OrderCard key={order.id} item={order} />)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="inbox-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No pending orders</Text>
            </View>
          )}
        </ScrollView>
      ) : activeTab === "labs" ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadLabTestOrders();
                setRefreshing(false);
              }}
            />
          }
        >
          <Text style={styles.sectionTitle}>Lab Test Orders</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f093fb" />
              <Text style={styles.loadingText}>Loading lab orders...</Text>
            </View>
          ) : filteredLabOrders.length > 0 ? (
            filteredLabOrders.map((labOrder) => (
              <TouchableOpacity
                key={labOrder.id}
                style={styles.labTestRequestCard}
                onPress={() => {
                  setSelectedLabOrder(labOrder);
                  setLabModalVisible(true);
                }}
              >
                <View style={styles.labTestRequestHeader}>
                  <View style={styles.labTestRequestInfo}>
                    <Text style={styles.labTestRequestPatient}>
                      {labOrder.patientName}
                    </Text>
                    <Text style={styles.labTestRequestEmail}>
                      {labOrder.patientEmail}
                    </Text>
                    <Text style={styles.labTestRequestPhone}>
                      {labOrder.patientPhone}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.labTestStatusBadge,
                      labOrder.sampleCollected
                        ? styles.collectedBadge
                        : styles.pendingBadge,
                    ]}
                  >
                    <Text style={styles.labTestStatusText}>
                      {labOrder.sampleCollected ? "Collected" : "Pending"}
                    </Text>
                  </View>
                </View>

                <View style={styles.labTestRequestDetails}>
                  <Text style={styles.labTestCount}>
                    {labOrder.requestedTests?.length || 0} test
                    {labOrder.requestedTests?.length !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.labTestDateInfo}>
                    Ordered: {labOrder.orderDate}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No pending lab test orders</Text>
            </View>
          )}
        </ScrollView>
      ) : activeTab === "delivery" ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDeliveryOrders();
                setRefreshing(false);
              }}
            />
          }
        >
          <Text style={styles.sectionTitle}>Delivery Orders</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f093fb" />
              <Text style={styles.loadingText}>Loading delivery orders...</Text>
            </View>
          ) : deliveryOrders.length > 0 ? (
            deliveryOrders.map((order) => (
              <DeliveryOrderCard key={order.id} item={order} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No pending deliveries</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Select Lab Test Type</Text>
          <View style={styles.labTypeGrid}>
            {labTestTypes.map((testType) => (
              <TouchableOpacity
                key={testType.id}
                style={[
                  styles.labTypeCard,
                  { borderLeftColor: testType.color },
                ]}
                onPress={() => setSelectedLabType(testType.id)}
              >
                <View
                  style={[
                    styles.labTypeIconContainer,
                    { backgroundColor: testType.color },
                  ]}
                >
                  <Ionicons name={testType.icon} size={30} color="white" />
                </View>
                <Text style={styles.labTypeName}>{testType.name}</Text>
                <Text style={styles.labTypeDescription}>
                  {testType.description}
                </Text>
                <Text style={styles.viewOrdersText}>View Orders →</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Conditional OTP Verification Modal - No Modal Component */}
      {showDeliveryOTPModal && (
        <View style={styles.otpOverlayContainer}>
          <View style={styles.otpModalBox}>
            <Text style={styles.otpModalTitleText}>Verify Delivery OTP</Text>
            <Text style={styles.otpModalSubtitleText}>
              Enter the OTP sent to the customer
            </Text>

            <TextInput
              style={styles.otpInputField}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={enteredOTP}
              onChangeText={setEnteredOTP}
              editable={!verifyingOTP}
              autoFocus={true}
              selectionColor="#27ae60"
            />

            <View style={styles.otpActionButtons}>
              <TouchableOpacity
                style={[
                  styles.otpVerifyBtn,
                  verifyingOTP && styles.otpButtonDisabledState,
                ]}
                onPress={handleVerifyDeliveryOTP}
                disabled={verifyingOTP}
              >
                {verifyingOTP ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.otpVerifyBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.otpCancelBtn}
                onPress={() => {
                  setShowDeliveryOTPModal(false);
                  setEnteredOTP("");
                  setCurrentMedicineOrderId(null);
                  setCurrentDeliveryOrderId(null);
                }}
                disabled={verifyingOTP}
              >
                <Text style={styles.otpCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pharmacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  pharmacyDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  pharmacyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  logoutButton: {
    padding: 10,
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "white",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#f093fb",
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  activeTabText: {
    color: "#f093fb",
  },
  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginVertical: 15,
    textAlign: "center",
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#f093fb",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  patientNameText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemsText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f093fb",
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  // Lab Order Card Styles
  labOrderCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#e91e63",
  },
  labOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  labOrderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  labInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labInfoText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 8,
  },
  labDateText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: "#27ae60",
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
  },
  sendReportButton: {
    backgroundColor: "#f093fb",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Lab Types Grid
  labTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  labTypeCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 2,
  },
  labTypeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  labTypeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  labTypeDescription: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  viewOrdersText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f093fb",
  },
  // Back Button
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 15,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#f093fb",
  },
  // Empty State
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 30,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f093fb",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    textAlign: "right",
  },
  medicineItem: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#f093fb",
  },
  medicineNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  medicineQty: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f093fb",
  },
  medicineDosage: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  medicineFrequency: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  medicinePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27ae60",
    marginTop: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f093fb",
  },
  noData: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  approveActionButton: {
    backgroundColor: "#27ae60",
  },
  rejectActionButton: {
    backgroundColor: "#e74c3c",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  // Delivery Order Styles
  deliveryOrderCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#27ae60",
  },
  deliveryOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deliveryOrderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  deliveryPatientName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  deliveryStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deliveryStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryInfoText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 8,
    flex: 1,
  },
  deliveryAmountText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f093fb",
    marginBottom: 10,
  },
  deliveryMedicinesPreview: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  medicinesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  medicinesText: {
    fontSize: 12,
    color: "#666",
  },
  // Status Progress Styles
  statusProgressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  statusStep: {
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statusStepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  statusLine: {
    flex: 0.6,
    height: 2,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
    marginTop: 8,
  },
  // Delivery Action Buttons
  assignButton: {
    backgroundColor: "#3498db",
  },
  pickupButton: {
    backgroundColor: "#9b59b6",
  },
  transitButton: {
    backgroundColor: "#e67e22",
  },
  deliveredButton: {
    backgroundColor: "#27ae60",
  },
  // OTP Modal Conditional Rendering Styles
  otpOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  otpModalBox: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  otpModalTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  otpModalSubtitleText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  otpInputField: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 3,
    color: "#1f2937",
    marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
  otpActionButtons: {
    gap: 12,
  },
  otpVerifyBtn: {
    backgroundColor: "#27ae60",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  otpVerifyBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  otpCancelBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  otpCancelBtnText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
  otpButtonDisabledState: {
    opacity: 0.6,
  },
  // OTP Status Message Styles
  otpStatusMessage: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  otpStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  // Lab Test Card Styles
  labTestRequestCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#e91e63",
    elevation: 2,
  },
  labTestRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  labTestRequestInfo: {
    flex: 1,
    marginRight: 10,
  },
  labTestRequestPatient: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  labTestRequestEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  labTestRequestPhone: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  labTestStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: "#fff3cd",
  },
  collectedBadge: {
    backgroundColor: "#d4edda",
  },
  labTestStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  labTestRequestDetails: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  labTestCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  labTestDateInfo: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  // Image Upload Styles
  imagePreviewContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
  },
  imagePreviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
  },
  imagePreviewName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  imagePreviewSize: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
});

export default PharmacyDashboard;
