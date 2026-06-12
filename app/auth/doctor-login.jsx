// Create file: app/auth/doctor-login.jsx
import { Ionicons } from '@expo/vector-icons';
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

const DoctorRegistrationScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('register'); // 'register' or 'login'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license: '',
    specialization: '',
    experience: '',
    hospital: '',
    qualification: '',
    address: '',
    consultationFee: ''
  });

  // Configure Google Sign-In
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: '435261008381-o3d97a57dehhsb17g3j0ref2q91s1o89.apps.googleusercontent.com',
          offlineAccess: false,
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      
      // Check Google Play Services
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      
      if (!hasPlayServices) {
        Alert.alert('Error', 'Google Play Services is not available or needs updating.');
        return;
      }

      // Sign out any previous user
      try {
        await GoogleSignin.signOut();
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

      // Check if the doctor exists in the approved doctors database
      const doctorsResponse = await fetch(
        'https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app/doctors.json'
      );
      const doctorsData = await doctorsResponse.json();
      
      let approvedDoctor = null;
      let doctorId = null;
      if (doctorsData) {
        // Find doctor and capture both the data and the ID
        for (const [key, doctor] of Object.entries(doctorsData)) {
          if (doctor.email?.toLowerCase() === user.email?.toLowerCase() && 
              doctor.verificationStatus === 'approved') {
            approvedDoctor = doctor;
            doctorId = key; // This is the unique doctor ID like "doc_1754154176785"
            break;
          }
        }
      }

      if (!approvedDoctor) {
        // Doctor not found in approved list, prompt for registration
        Alert.alert(
          'Registration Required',
          `Dr. ${user.name}, your email (${user.email}) is not found in our approved doctors database. Please register first and wait for admin approval.`,
          [
            { 
              text: 'Register Now', 
              onPress: () => {
                setLoginMode('register');
                setFormData({
                  ...formData,
                  name: user.name || '',
                  email: user.email || ''
                });
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Store doctor session data with unique doctor ID
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const doctorData = {
        email: user.email,
        name: user.name,
        photo: user.photo,
        id: user.id,
        role: 'doctor',
        verified: true,
        doctorId: doctorId, // Store the unique doctor ID from Firebase
        doctorDetails: approvedDoctor,
        loginTime: new Date().toISOString()
      };

      await AsyncStorage.default.setItem('doctorSession', JSON.stringify(doctorData));
      console.log('Doctor session stored with ID:', doctorId);

      Alert.alert(
        'Login Successful!',
        `Welcome back Dr. ${user.name}! You have been logged in successfully.`,
        [
          { text: 'Continue', onPress: () => router.replace('/doctor-dashboard') }
        ]
      );

    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.code === 'statusCodes.SIGN_IN_CANCELLED') {
        Alert.alert('Sign-In Cancelled', 'Google Sign-In was cancelled.');
      } else if (error.code === 'statusCodes.IN_PROGRESS') {
        Alert.alert('Sign-In In Progress', 'Google Sign-In is already in progress.');
      } else if (error.code === 'statusCodes.PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Play Services Error', 'Google Play Services is not available or needs updating.');
      } else {
        Alert.alert('Login Failed', error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistrationRequest = async () => {
    try {
      setIsLoading(true);
      
      // Validation
      const requiredFields = ['name', 'email', 'phone', 'license', 'specialization', 'experience', 'hospital', 'qualification'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      // Phone validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }

      // Submit to Firebase as pending request
      const firebaseUrl = 'https://fresh-a29f6-default-rtdb.asia-southeast1.firebasedatabase.app';
      
      const doctorData = {
        ...formData,
        verificationStatus: 'pending',
        requestedAt: new Date().toISOString(),
        id: `doc_${Date.now()}`,
        specialty: formData.specialization // Add alias for compatibility
      };

      await fetch(`${firebaseUrl}/doctors/${doctorData.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });

      Alert.alert(
        'Registration Submitted!',
        'Your registration request has been submitted successfully. You will be notified once your credentials are verified by our admin team.',
        [
          { text: 'OK', onPress: () => router.replace('/landing') }
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to submit registration. Please try again.');
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
              <Ionicons name="medical" size={40} color="white" />
            </View>
            <Text style={styles.headerTitle}>
              {loginMode === 'register' ? 'Doctor Registration' : 'Doctor Login'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {loginMode === 'register' ? 'Join our medical network' : 'Welcome back, Doctor'}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Mode Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleWrapper}>
                <TouchableOpacity
                  style={[styles.toggleButton, loginMode === 'login' && styles.activeToggle]}
                  onPress={() => setLoginMode('login')}
                >
                  <Ionicons 
                    name="log-in-outline" 
                    size={16} 
                    color={loginMode === 'login' ? 'white' : '#4ECDC4'} 
                  />
                  <Text style={[styles.toggleText, loginMode === 'login' && styles.activeToggleText]}>
                    Existing Doctor
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.toggleButton, loginMode === 'register' && styles.activeToggle]}
                  onPress={() => setLoginMode('register')}
                >
                  <Ionicons 
                    name="person-add-outline" 
                    size={16} 
                    color={loginMode === 'register' ? 'white' : '#4ECDC4'} 
                  />
                  <Text style={[styles.toggleText, loginMode === 'register' && styles.activeToggleText]}>
                    New Registration
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {loginMode === 'login' ? (
              // Login Mode - Google Sign-In
              <View style={styles.loginContainer}>
                <View style={styles.professionalBadge}>
                  <Ionicons name="shield-checkmark" size={20} color="#4ECDC4" />
                  <Text style={styles.badgeText}>Verified Doctor Login Portal</Text>
                </View>

                <Text style={styles.loginDescription}>
                  Sign in with your Google account to access your doctor dashboard. 
                  Your email must be registered and approved by our admin team.
                </Text>

                <TouchableOpacity 
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <View style={styles.googleButtonContent}>
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text style={styles.googleButtonText}>
                      {isLoading ? 'Signing in...' : 'Sign in with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.loginHelpContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.loginHelpText}>
                    Not approved yet? Contact admin or register below if you're a new doctor.
                  </Text>
                </View>
              </View>
            ) : (
              // Registration Mode - Form
              <View>
            {/* Professional Badge */}
            <View style={styles.professionalBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#4ECDC4" />
              <Text style={styles.badgeText}>Verified Medical Professional Portal</Text>
            </View>

            {/* Registration Form - All fields required */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Dr. John Smith"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              </View>
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Professional contact number"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical License Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your medical license number"
                  value={formData.license}
                  onChangeText={(text) => setFormData({...formData, license: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialization *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Cardiologist, Neurologist"
                  value={formData.specialization}
                  onChangeText={(text) => setFormData({...formData, specialization: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Years of experience"
                  keyboardType="numeric"
                  value={formData.experience}
                  onChangeText={(text) => setFormData({...formData, experience: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital/Clinic *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Your primary workplace"
                  value={formData.hospital}
                  onChangeText={(text) => setFormData({...formData, hospital: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Qualification *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="school-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., MBBS, MD, MS"
                  value={formData.qualification}
                  onChangeText={(text) => setFormData({...formData, qualification: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic/Hospital Address *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Complete address"
                  multiline={true}
                  numberOfLines={2}
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Consultation Fee (₹)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Consultation fee per session"
                  keyboardType="numeric"
                  value={formData.consultationFee}
                  onChangeText={(text) => setFormData({...formData, consultationFee: text})}
                />
              </View>
            </View>
            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.disclaimerText}>
                Your medical credentials will be verified by our medical board before account activation.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={submitRegistrationRequest}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.authButtonGradient}
              >
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Submitting...' : 'Request Registration'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Already Verified Link */}
            <TouchableOpacity 
              style={styles.verifiedButton}
              onPress={() => router.push('/auth/doctor-verification')}
            >
              <Text style={styles.verifiedText}>
                Already Verified? Login Here
              </Text>
            </TouchableOpacity>

            {/* Features for Doctors */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Doctor Dashboard Features</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Patient Management System</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="calendar" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Appointment Scheduling</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="document-text" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Digital Prescription Pad</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="videocam" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Telemedicine Consultations</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="analytics" size={16} color="#4ECDC4" />
                  <Text style={styles.featureText}>Medical Records & Analytics</Text>
                </View>
              </View>
            </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4ECDC4', // Changed to match header green
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Keep form area light
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
    marginTop: 20,
    paddingBottom: 40,
  },
  toggleContainer: {
    marginBottom: 25,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeToggle: {
    backgroundColor: '#4ECDC4',
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  activeToggleText: {
    color: 'white',
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  loginHelpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    maxWidth: '100%',
  },
  loginHelpText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  professionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 25,
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
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  authButton: {
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
  authButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  verifiedButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  verifiedText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  featuresContainer: {
    marginTop: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    fontWeight: '500',
  },
  googleButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
});

export default DoctorRegistrationScreen;