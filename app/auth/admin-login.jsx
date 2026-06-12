
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
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
    TouchableOpacity,
    View
} from 'react-native';

const AdminLogin = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);

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
          profileImageSize: 120,
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsSigningIn(true);
      console.log('Starting Google Sign-In...');
      
      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log('Google Play Services available:', hasPlayServices);

      try {
        await GoogleSignin.signOut();
        console.log('Previous user signed out');
      } catch (signOutError) {
        console.log('No previous user to sign out');
      }

      console.log('Attempting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);

      // Defensive check for userInfo and userInfo.data.user
      if (!userInfo || !userInfo.data || !userInfo.data.user) {
        throw new Error('Google Sign-In did not return user information.');
      }

      const { user } = userInfo.data;

      // Defensive check for email
      if (!user.email) {
        throw new Error('Google Sign-In did not return an email address.');
      }
      
      // Check if it's an admin email - only allow authorized admin
      const adminEmails = ['vennapusasaicharanreddy46@gmail.com'];
      
      if (adminEmails.includes(user.email)) {
        // Store admin info
        const adminData = {
          name: user.name || `${user.givenName || ''} ${user.familyName || ''}`.trim() || 'Admin User',
          email: user.email,
          photo: user.photo || null,
          id: user.id,
          loginTime: new Date().toISOString(),
          loginMethod: 'google'
        };
        
        await AsyncStorage.setItem('adminData', JSON.stringify(adminData));
        console.log('Admin session stored successfully');
        
        Alert.alert('Success', 'Admin login successful!', [
          { text: 'OK', onPress: () => router.replace('/admin-dashboard') }
        ]);
      } else {
        await GoogleSignin.signOut();
        Alert.alert('Access Denied', 'You are not authorized as an admin.');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', `Failed to sign in: ${error.message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Access</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.loginSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={64} color="#3b82f6" />
              </View>
              
              <Text style={styles.title}>Administrator Portal</Text>
              <Text style={styles.subtitle}>
                Admin access restricted to authorized Google account only
              </Text>

              {/* Google Login */}
              <View style={styles.googleSection}>
                <Text style={styles.googleTitle}>Google Authentication Required</Text>
                
                <GoogleSigninButton
                  style={styles.googleButton}
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Light}
                  onPress={signInWithGoogle}
                  disabled={isSigningIn}
                />
                
                <Text style={styles.securityNote}>
                  🔒 Only authorized accounts can access admin panel
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Admin Features:</Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="people" size={16} color="#6b7280" />
                    <Text style={styles.featureText}>Doctor Management</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="analytics" size={16} color="#6b7280" />
                    <Text style={styles.featureText}>Platform Analytics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="settings" size={16} color="#6b7280" />
                    <Text style={styles.featureText}>System Configuration</Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  loginSection: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  credentialsSection: {
    width: '100%',
    marginBottom: 30,
  },
  credentialsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  googleSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  googleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  googleButton: {
    width: 280,
    height: 56,
    marginBottom: 16,
  },
  securityNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default AdminLogin;
