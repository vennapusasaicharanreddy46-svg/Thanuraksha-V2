import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View style={[style, { backgroundColor: colors?.[0] || '#4F46E5' }]} {...props}>
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleUserTypeSelect = (route) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Fixed Single Color Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/imglogo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.appName}>Thanu-Raksha</Text>
              <Text style={styles.tagline}>Healthcare Platform</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => handleUserTypeSelect('/auth/admin-login')}
            >
              <Ionicons name="menu-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Patient Section - Image Left, Content Right */}
        <View style={styles.section}>
          <View style={styles.sectionContainer}>
            {/* Left - Image */}
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <View style={[styles.bgCircle, styles.circle1, { backgroundColor: 'rgba(0, 212, 255, 0.1)' }]} />
                <View style={[styles.bgCircle, styles.circle2, { backgroundColor: 'rgba(0, 212, 255, 0.06)' }]} />
                
                <View style={[styles.mainAvatar, { backgroundColor: '#00d4ff' }]}>
                  <MaterialCommunityIcons name="account-heart" size={36} color="white" />
                </View>
                
                <View style={[styles.floatingIcon, styles.icon1]}>
                  <MaterialCommunityIcons name="heart-pulse" size={12} color="#00d4ff" />
                </View>
                <View style={[styles.floatingIcon, styles.icon2]}>
                  <MaterialCommunityIcons name="stethoscope" size={10} color="#00d4ff" />
                </View>
              </View>
              
              {/* Larger Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: '#00d4ff' }]}
                onPress={() => handleUserTypeSelect('/auth/patient-login')}
              >
                <Text style={styles.loginButtonText}>Patient Login</Text>
              </TouchableOpacity>
            </View>

            {/* Right - Content */}
            <View style={styles.contentSection}>
              <View style={styles.categoryBadge}>
                <Text style={styles.badgeText}>PATIENTS</Text>
              </View>
              <Text style={styles.sectionTitle}>
                Meet The Best{'\n'}
                <Text style={[styles.highlightText, { color: '#00d4ff' }]}>Doctors</Text>
              </Text>
              <Text style={styles.sectionDescription}>
                AI-powered health insights and expert consultations.
              </Text>
            </View>
          </View>
        </View>

        {/* Doctor Section - Content Left, Image Right (OPPOSITE) */}
        <View style={[styles.section, styles.doctorSection]}>
          <View style={styles.sectionContainer}>
            {/* Left - Content */}
            <View style={styles.contentSection}>
              <View style={styles.categoryBadge}>
                <Text style={styles.badgeText}>DOCTORS</Text>
              </View>
              <Text style={styles.sectionTitle}>
                <Text style={[styles.highlightText, { color: '#4ECDC4' }]}>Professional</Text>{'\n'}
                Dashboard
              </Text>
              <Text style={styles.sectionDescription}>
                Advanced patient management and telemedicine tools.
              </Text>
            </View>

            {/* Right - Image */}
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <View style={[styles.bgCircle, styles.circle1, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]} />
                <View style={[styles.bgCircle, styles.circle2, { backgroundColor: 'rgba(78, 205, 196, 0.06)' }]} />
                
                <View style={[styles.mainAvatar, { backgroundColor: '#4ECDC4' }]}>
                  <FontAwesome5 name="user-md" size={34} color="white" />
                  <View style={styles.doctorMask}>
                    <MaterialCommunityIcons name="stethoscope" size={12} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>
                
                <View style={[styles.floatingIcon, styles.icon1, { backgroundColor: '#4ECDC4' }]}>
                  <MaterialCommunityIcons name="clipboard-pulse-outline" size={12} color="white" />
                </View>
                <View style={[styles.floatingIcon, styles.icon2, { backgroundColor: '#4ECDC4' }]}>
                  <MaterialCommunityIcons name="thermometer-lines" size={10} color="white" />
                </View>
              </View>
              
              {/* Larger Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => handleUserTypeSelect('/auth/doctor-login')}
              >
                <Text style={styles.loginButtonText}>Doctor Registration</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pharmacy Section - Image Left, Content Right (SAME AS FIRST) */}
        <View style={[styles.section, styles.pharmacySection]}>
          <View style={styles.sectionContainer}>
            {/* Left - Image */}
            <View style={styles.imageSection}>
              <View style={styles.imageWrapper}>
                <View style={[styles.bgCircle, styles.circle1, { backgroundColor: 'rgba(240, 147, 251, 0.1)' }]} />
                <View style={[styles.bgCircle, styles.circle2, { backgroundColor: 'rgba(240, 147, 251, 0.06)' }]} />
                
                <View style={[styles.mainAvatar, { backgroundColor: '#f093fb' }]}>
                  <MaterialCommunityIcons name="store" size={36} color="white" />
                </View>
                
                <View style={[styles.floatingIcon, styles.icon1, { backgroundColor: '#f093fb' }]}>
                  <MaterialCommunityIcons name="pill" size={12} color="white" />
                </View>
                <View style={[styles.floatingIcon, styles.icon2, { backgroundColor: '#f093fb' }]}>
                  <MaterialCommunityIcons name="receipt" size={10} color="white" />
                </View>
              </View>
              
              {/* Larger Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: '#f093fb' }]}
                onPress={() => handleUserTypeSelect('/auth/pharmacy-login')}
              >
                <Text style={styles.loginButtonText}>Pharmacy Login</Text>
              </TouchableOpacity>
            </View>

            {/* Right - Content */}
            <View style={styles.contentSection}>
              <View style={styles.categoryBadge}>
                <Text style={styles.badgeText}>PHARMACIES</Text>
              </View>
              <Text style={styles.sectionTitle}>
                Smart Pharmacy{'\n'}
                <Text style={[styles.highlightText, { color: '#f093fb' }]}>Management</Text>
              </Text>
              <Text style={styles.sectionDescription}>
                Streamlined inventory and prescription processing.
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Trusted by Healthcare Professionals</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5K+</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Thanu-Raksha. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Fixed Header - No Overlap
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: Platform.OS === 'ios' ? 44 : 32, // Increased for status bar
    paddingBottom: 28, // Increased for larger header
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64, // Increased height for more space
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: width * 0.68, // Reduced to prevent overflow
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  brandInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 10, // Reduced from 11
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerButton: {
    width: 32, // Reduced from 36
    height: 32, // Reduced from 36
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Sections
  section: {
    paddingVertical: 30, // Reduced from 35
    paddingHorizontal: 16,
  },
  doctorSection: {
    backgroundColor: '#f0fffe',
  },
  pharmacySection: {
    backgroundColor: '#fef7ff',
  },
  
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'flex-start' to center both sections
    gap: 16,
    width: '100%',
    minHeight: 200, // Added minimum height for consistent alignment
  },
  reversedContainer: {
    flexDirection: 'row-reverse',
  },
  
  // Image Section - 45% width
  imageSection: {
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
    height: 140, // Reduced from 160
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // Reduced margin
  },
  
  // Background circles
  bgCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 90, // Reduced from 100
    height: 90,
    top: 10,
    right: 10,
  },
  circle2: {
    width: 60, // Reduced from 70
    height: 60,
    bottom: 10,
    left: 10,
  },
  
  // Main avatar
  mainAvatar: {
    width: 70, // Reduced from 80
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  // Doctor mask
  doctorMask: {
    position: 'absolute',
    bottom: 10,
    width: 25,
    height: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Floating icons
  floatingIcon: {
    position: 'absolute',
    width: 22, // Reduced from 24
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  icon1: {
    top: 20,
    left: 15,
  },
  icon2: {
    bottom: 25,
    right: 15,
  },

  // Content Section - 55% width
  contentSection: {
    width: '55%',
    flex: 1,
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20, // Reduced from 24
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 10,
  },
  highlightText: {
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 12, // Reduced from 13
    color: '#475569',
    lineHeight: 16,
    marginBottom: 16, // Reduced margin
  },
  
  // EQUAL SIZE BUTTONS
  loginButton: {
    width: '100%',
    height: 44, // Fixed height for consistency
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonText: {
    fontSize: 13, // Consistent text size
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Secondary Buttons - SAME SIZE AS LOGIN BUTTONS
  secondaryButton: {
    width: '100%', // Same width as login button
    height: 44, // Same height as login button
    borderWidth: 1.5,
    borderRadius: 22, // Same radius as login button
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  secondaryButtonText: {
    fontSize: 13, // Same text size as login button
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Stats Section
  statsSection: {
    paddingVertical: 25,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },

  // Footer
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
  },
});

export default LandingScreen;