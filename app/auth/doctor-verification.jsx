import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View style={[style, { backgroundColor: colors?.[0] || '#4ECDC4' }]} {...props}>
      {children}
    </View>
  );
}

const DoctorVerificationScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: ''
  });

  // Configure Google Sign-In
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        GoogleSignin.configure({
          webClientId: '435261008381-o3d97a57dehhsb17g3j0ref2q91s1o89.apps.googleusercontent.com',
          offlineAccess: false,
          hostedDomain: '',
          loginHint: '',
          forceCodeForRefreshToken: false,
          accountName: '',
          iosClientId: '',
          googleServicePlistPath: '',
          openIdRealm: '',
          profileImageSize: 120,
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  const handleVerification = async () => {
    try {
      setIsLoading(true);
      
      // Validation
      if (!formData.email || !formData.verificationCode) {
        Alert.alert('Error', 'Please fill in both email and verification code');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      // Check verification code and email in Firebase
      console.log('Checking verification credentials...');
      const verificationResponse = await fetch(
        'https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/verification.json'
      );
      const verificationData = await verificationResponse.json();
      
      if (!verificationData) {
        Alert.alert('Error', 'No verification records found. Please contact admin.');
        return;
      }

      // Find matching verification record
      const verificationRecord = Object.values(verificationData).find(record => 
        record.email.toLowerCase() === formData.email.toLowerCase() && 
        record.verificationCode === formData.verificationCode &&
        record.status === 'approved'
      );

      if (!verificationRecord) {
        Alert.alert('Error', 'Invalid email or verification code. Please check your credentials.');
        return;
      }

      console.log('Verification credentials are correct. Starting Google Sign-In...');

      // Check Google Play Services
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log('Google Play Services available:', hasPlayServices);

      // Sign out any previous user
      try {
        await GoogleSignin.signOut();
        console.log('Previous user signed out');
      } catch (signOutError) {
        console.log('No previous user to sign out');
      }

      // Attempt Google Sign-In
      console.log('Attempting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);

      // Check if userInfo is valid
      if (!userInfo || !userInfo.data || !userInfo.data.user) {
        throw new Error('Google Sign-In did not return user information.');
      }

      const { user } = userInfo.data;

      // Check if the Google account email matches the provided email
      if (!user.email || user.email.toLowerCase() !== formData.email.toLowerCase()) {
        Alert.alert(
          'Email Mismatch', 
          'The Google account email does not match the email you provided. Please sign in with the correct Google account.',
          [
            { text: 'Try Again', onPress: () => GoogleSignin.signOut() }
          ]
        );
        return;
      }

      // Create doctor session data
      const doctorData = {
        email: user.email,
        name: user.name,
        photo: user.photo,
        id: user.id,
        role: 'doctor',
        verified: true,
        loginTime: new Date().toISOString()
      };

      // Store session data
      await AsyncStorage.setItem('doctorSession', JSON.stringify(doctorData));
      console.log('Doctor session stored successfully');

      Alert.alert(
        'Verification Successful!',
        `Welcome Dr. ${user.name}! You have been verified and logged in successfully.`,
        [
          { text: 'Continue', onPress: () => router.replace('/doctor-dashboard') }
        ]
      );

    } catch (error) {
      console.error('Verification error:', error);
      
      if (error.code === 'statusCodes.SIGN_IN_CANCELLED') {
        Alert.alert('Sign-In Cancelled', 'Google Sign-In was cancelled.');
      } else if (error.code === 'statusCodes.IN_PROGRESS') {
        Alert.alert('Sign-In In Progress', 'Google Sign-In is already in progress.');
      } else if (error.code === 'statusCodes.PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Play Services Error', 'Google Play Services is not available or needs updating.');
      } else {
        Alert.alert('Verification Failed', error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.doctorIconContainer}>
              <Ionicons name="shield-checkmark" size={40} color="white" />
            </View>
            <Text style={styles.headerTitle}>Doctor Verification</Text>
            <Text style={styles.headerSubtitle}>
              Enter your verification details
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Verification Badge */}
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.badgeText}>Verified Doctor Login Portal</Text>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Email *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="doctor@hospital.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                />
              </View>
            </View>

            {/* Verification Code Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 4-digit verification code"
                  value={formData.verificationCode}
                  onChangeText={(text) => {
                    // Only allow numbers and limit to 4 digits
                    const numericText = text.replace(/[^0-9]/g, '').substring(0, 4);
                    setFormData({...formData, verificationCode: numericText});
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={false}
                />
              </View>
            </View>

            {/* Info Note */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Enter your verification code (4-digit code provided by admin) and the email address from your registration.
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity 
              style={styles.verifyButton} 
              onPress={handleVerification}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.verifyButtonGradient}
              >
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text style={styles.verifyButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Registration Link */}
            <TouchableOpacity 
              style={styles.backToRegButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToRegText}>
                Need to register? Go back to registration
              </Text>
            </TouchableOpacity>

            {/* Contact Support */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportText}>
                Contact admin support if you haven't received your verification code or need assistance.
              </Text>
              <TouchableOpacity style={styles.supportButton}>
                <Ionicons name="help-circle-outline" size={16} color="#4ECDC4" />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4ECDC4',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  doctorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    marginTop: 40,
    paddingBottom: 40,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    marginLeft: 12,
    color: '#374151',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 25,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  verifyButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  backToRegButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToRegText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  supportContainer: {
    marginTop: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  supportButtonText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default DoctorVerificationScreen;
