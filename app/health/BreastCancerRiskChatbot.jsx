import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS, API_KEYS } from "../../config/api.config";

// Conditional import for LinearGradient with fallback
let LinearGradient;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View
      style={[style, { backgroundColor: colors?.[0] || "#20713bff" }]}
      {...props}
    >
      {children}
    </View>
  );
}

const BreastCancerRiskChatbot = () => {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🩺 Hello! I'm your Breast Cancer AI Assistant by Medxbay. I can help answer questions about breast cancer, symptoms, prevention, treatment options, and more. What would you like to know?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = [
    "What is breast cancer, and what are its common symptoms?",
    "What are the different types of breast cancer?",
    "How does breast cancer develop, and what are its risk factors?",
    "What are the survival rates for different stages of breast cancer?",
    "What lifestyle changes can help reduce my risk of breast cancer?",
    "Are there specific diets or foods that can lower my breast cancer risk?",
  ];

  useEffect(() => {
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  }, [messages]);

  const getGeminiResponse = async (question) => {
    console.log("=== GEMINI API CALL START ===");
    console.log("Question:", question);
    console.log("API Endpoint:", API_ENDPOINTS.GEMINI.GENERATE_FLASH);
    console.log("API Key exists:", !!API_KEYS.GOOGLE_GEMINI);

    try {
      const response = await fetch(API_ENDPOINTS.GEMINI.GENERATE_FLASH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a medical AI assistant specializing in breast cancer information developed by Medxbay. Provide a clean, professional, and easy-to-read response about breast cancer. 

IMPORTANT FORMATTING RULES:
- DO NOT use asterisks (*) anywhere in your response
- Use minimal emojis only when necessary (max 2-3 per response)
- Use clear headings without asterisks
- Use simple bullet points (•) without emojis for most content
- Make the response clean and professional
- Keep medical terms simple and explained
- Always end with a reminder to consult healthcare professionals

Question: ${question}

Please provide your response in this clean format:

[Main Topic Heading]

Key Information:
• [Point 1]
• [Point 2] 
• [Point 3]

Important Details:
• [Detail 1]
• [Detail 2]

⚠️ Medical Advice:
Always consult with healthcare professionals for personalized medical advice and proper diagnosis.

Keep it informative, supportive, and professional with minimal emoji use.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response received:", JSON.stringify(data, null, 2));
      console.log("API Response received:", JSON.stringify(data, null, 2));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const responseText = data.candidates[0].content.parts[0].text;
        console.log(
          "✅ Successfully extracted response text (length):",
          responseText.length,
        );
        console.log("=== GEMINI API CALL END ===");
        return responseText;
      } else {
        console.error("❌ Invalid API response structure:", data);
        throw new Error("No valid response from API");
      }
    } catch (error) {
      console.error("❌ Error calling Gemini API:");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.log("=== GEMINI API CALL END (WITH ERROR) ===");
      return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or consider consulting with a healthcare professional for immediate assistance.";
    }
  };

  const sendMessage = async (messageText = inputText) => {
    console.log("\n🔵 === SEND MESSAGE BUTTON CLICKED ===");
    console.log("Input text:", messageText);
    console.log("Input text length:", messageText.length);
    console.log("Is loading:", isLoading);

    if (!messageText.trim()) {
      console.log("❌ Message is empty, showing alert");
      Alert.alert(
        "Empty Message",
        "Please enter a question before submitting.",
      );
      return;
    }

    console.log("Checking API Key...");
    console.log("API_KEYS object:", API_KEYS);
    console.log("GOOGLE_GEMINI key exists:", !!API_KEYS.GOOGLE_GEMINI);
    console.log(
      "GOOGLE_GEMINI key value:",
      API_KEYS.GOOGLE_GEMINI ? "[KEY PRESENT]" : "[KEY MISSING]",
    );

    if (!API_KEYS.GOOGLE_GEMINI) {
      console.log("❌ API Key is missing!");
      Alert.alert(
        "Configuration Error",
        "API Key for Google Gemini LLM is missing. Please configure it properly.",
      );
      return;
    }

    console.log("✅ All validations passed, creating user message");

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    console.log("Adding user message to chat:", userMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    console.log("Loading state set to true");

    // Scroll to bottom after adding user message
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );

    try {
      console.log("Calling Gemini API...");
      const response = await getGeminiResponse(messageText);
      console.log("Response received from Gemini API");

      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      console.log("Adding bot message to chat");
      setMessages((prev) => [...prev, botMessage]);
      console.log("✅ Message sent successfully!");
    } catch (error) {
      console.error("❌ Error in sendMessage catch block:");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, but I encountered an error while processing your question. Please try again or consult with a healthcare professional.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log("Loading state set to false");
      console.log("=== SEND MESSAGE COMPLETE ===\n");
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "🩺 Hello! I'm your Breast Cancer AI Assistant by Medxbay. I can help answer questions about breast cancer, symptoms, prevention, treatment options, and more. What would you like to know?",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const renderMessage = (message) => {
    const isBot = message.isBot;
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          {isBot && (
            <View style={styles.botIcon}>
              <Ionicons name="medical" size={18} color="white" />
            </View>
          )}
          <View style={styles.messageContent}>
            <Text
              style={[
                styles.messageText,
                isBot ? styles.botText : styles.userText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isBot ? styles.botTimestamp : styles.userTimestamp,
              ]}
            >
              {message.timestamp}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient colors={["#2681eaff", "#2a52d5ff"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Breast Cancer AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Medxbay</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.chatContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <View style={[styles.messageBubble, styles.botBubble]}>
                <View style={styles.botIcon}>
                  <Ionicons name="medical" size={18} color="white" />
                </View>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2a52d5ff" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              </View>
            </View>
          )}

          {/* Sample Questions */}
          {messages.length === 1 && (
            <View style={styles.sampleQuestionsContainer}>
              <Text style={styles.sampleQuestionsTitle}>
                📋 Sample Questions on Breast Cancer
              </Text>
              {sampleQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sampleQuestionButton}
                  onPress={() => sendMessage(question)}
                  disabled={isLoading}
                >
                  <View style={styles.sampleQuestionContent}>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#2a52d5ff"
                    />
                    <Text style={styles.sampleQuestionText}>{question}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="🧐 Enter your question about breast cancer..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
              onFocus={() => {
                setTimeout(
                  () => scrollViewRef.current?.scrollToEnd({ animated: true }),
                  300,
                );
              }}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (inputText.trim() && !isLoading) {
                  sendMessage();
                }
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: !inputText.trim() || isLoading ? 0.5 : 1 },
              ]}
              onPress={() => {
                console.log("🔘 Send button pressed!");
                console.log("Current input text:", inputText);
                console.log(
                  "Button disabled state:",
                  !inputText.trim() || isLoading,
                );
                sendMessage();
              }}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={["#11e68aff", "#11e68aff"]}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This AI provides general information only. Always consult
              healthcare professionals for medical advice.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️ by Medxbay</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  clearButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatContent: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  botMessage: {
    alignItems: "flex-start",
  },
  userMessage: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  userBubble: {
    backgroundColor: "#315defff",
    borderBottomRightRadius: 6,
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0be34cff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: "#1F2937",
  },
  userText: {
    color: "white",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  botTimestamp: {
    color: "#9CA3AF",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: "#6B7280",
    fontStyle: "italic",
  },
  sampleQuestionsContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sampleQuestionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  sampleQuestionButton: {
    backgroundColor: "#FFF7ED",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  sampleQuestionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sampleQuestionText: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
    flex: 1,
  },
  inputSection: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#F8FAFC",
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  disclaimer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default BreastCancerRiskChatbot;
