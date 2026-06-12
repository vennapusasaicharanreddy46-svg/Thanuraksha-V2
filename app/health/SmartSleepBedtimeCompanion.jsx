import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Conditional import for LinearGradient with fallback
let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View style={[style, { backgroundColor: colors?.[0] || '#6366F1' }]} {...props}>
      {children}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const SmartSleepBedtimeCompanion = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    profession: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showSchedules, setShowSchedules] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (showSchedules) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [showSchedules]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.age || !formData.profession) {
      Alert.alert('Missing Information', 'Please fill in both age and profession');
      return false;
    }
    if (isNaN(formData.age) || formData.age < 1 || formData.age > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 100');
      return false;
    }
    return true;
  };

  const generateSchedules = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    try {
      // Simulate Gemini AI call with mock data for now
      // In a real implementation, you would integrate with Gemini AI directly
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      const mockSchedules = [
        {
          name: "🌅 Early Bird",
          wake_up: "6:00 AM",
          sleep: "10:00 PM",
          face_wash: "6:15 AM",
          milk: "6:30 AM",
          water_times: ["6:00 AM", "10:00 AM", "2:00 PM"],
          description: "Perfect for maximizing productivity",
          icon: "sunny"
        },
        {
          name: "😴 Relaxed Morning",
          wake_up: "8:00 AM",
          sleep: "11:00 PM",
          face_wash: "8:15 AM",
          milk: "8:30 AM",
          water_times: ["8:00 AM", "11:00 AM", "4:00 PM"],
          description: "Balanced routine for better sleep",
          icon: "bed"
        },
        {
          name: "📚 Study Focused",
          wake_up: "7:00 AM",
          sleep: "12:00 AM",
          face_wash: "7:15 AM",
          milk: "7:30 AM",
          water_times: ["7:00 AM", "11:00 AM", "5:00 PM"],
          description: "Optimized for study sessions",
          icon: "book"
        },
        {
          name: "⚖️ Balanced Day",
          wake_up: "7:30 AM",
          sleep: "11:30 PM",
          face_wash: "7:45 AM",
          milk: "8:00 AM",
          water_times: ["7:30 AM", "12:00 PM", "6:00 PM"],
          description: "Well-rounded daily routine",
          icon: "heart"
        },
        {
          name: "🛋️ Weekend Vibes",
          wake_up: "9:00 AM",
          sleep: "1:00 AM",
          face_wash: "9:30 AM",
          milk: "10:00 AM",
          water_times: ["9:00 AM", "1:00 PM", "7:00 PM"],
          description: "Relaxed schedule for rest days",
          icon: "game-controller"
        }
      ];

      setSchedules(mockSchedules);
      setShowSchedules(true);
      setCurrentStep(2);
      scaleAnim.setValue(0);
    } catch (error) {
      Alert.alert('Generation Error', 'Failed to generate sleep schedules. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setCurrentStep(3);
    Alert.alert(
      '🎉 Schedule Selected!',
      `"${schedule.name}" routine has been selected. Sweet dreams!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({ age: '', profession: '' });
    setSchedules([]);
    setSelectedSchedule(null);
    setShowSchedules(false);
    scaleAnim.setValue(0);
  };

  const getTimeIcon = (activity) => {
    switch (activity) {
      case 'wake_up': return 'sunny';
      case 'sleep': return 'moon';
      case 'face_wash': return 'water';
      case 'milk': return 'nutrition';
      case 'water': return 'water-outline';
      default: return 'time';
    }
  };

  const professionSuggestions = [
    '👨‍💼 Business Professional',
    '👩‍🎓 Student', 
    '👨‍⚕️ Healthcare Worker',
    '👩‍💻 Software Developer',
    '👨‍🏫 Teacher',
    '👩‍🎨 Creative Artist',
    '👨‍🔬 Researcher',
    '👩‍🍳 Chef',
    '👨‍✈️ Pilot',
    '👩‍⚖️ Lawyer'
  ];

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.loadingGradient}>
          <View style={styles.loadingContent}>
            <Animated.View style={[
              styles.loadingSpinner,
              {
                transform: [
                  { scale: pulseAnim },
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}>
              <Ionicons name="moon" size={60} color="white" />
            </Animated.View>
            <Text style={styles.loadingText}>✨ Creating Your Perfect Sleep Schedule</Text>
            <Text style={styles.loadingSubtext}>AI is analyzing your lifestyle...</Text>
            
            <View style={styles.loadingSteps}>
              <View style={styles.loadingStep}>
                <Ionicons name="analytics" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.loadingStepText}>Analyzing your age & profession</Text>
              </View>
              <View style={styles.loadingStep}>
                <Ionicons name="bulb" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.loadingStepText}>Generating personalized routines</Text>
              </View>
              <View style={styles.loadingStep}>
                <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.loadingStepText}>Optimizing for your lifestyle</Text>
              </View>
            </View>

            <View style={styles.loadingProgress}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { opacity: pulseAnim }]} />
              </View>
              <Text style={styles.progressText}>Please wait...</Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>😴 Sleep Companion</Text>
          <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {currentStep === 1 && (
            <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              {/* Welcome Card */}
              <View style={styles.welcomeCard}>
                <LinearGradient colors={['#6366F1', '#8B5CF6', '#A855F7']} style={styles.welcomeGradient}>
                  <Animated.View style={[styles.welcomeIcon, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.welcomeEmoji}>🌙</Text>
                  </Animated.View>
                  <Text style={styles.welcomeTitle}>Smart Sleep Bedtime Companion</Text>
                  <Text style={styles.welcomeText}>
                    Get AI-powered personalized sleep schedules tailored to your age and profession for better rest and productivity
                  </Text>
                </LinearGradient>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>🎯 Tell Us About Yourself</Text>
                <Text style={styles.formSubtitle}>We'll create the perfect sleep routine just for you</Text>
                
                {/* Age Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputHeader}>
                    <Ionicons name="calendar" size={20} color="#6366F1" />
                    <Text style={styles.inputLabel}>Your Age</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your age (e.g., 25)"
                    placeholderTextColor="#A0AEC0"
                    value={formData.age}
                    onChangeText={(value) => handleInputChange('age', value)}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

                {/* Profession Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputHeader}>
                    <Ionicons name="briefcase" size={20} color="#6366F1" />
                    <Text style={styles.inputLabel}>Your Profession</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your profession (e.g., Student)"
                    placeholderTextColor="#A0AEC0"
                    value={formData.profession}
                    onChangeText={(value) => handleInputChange('profession', value)}
                    returnKeyType="done"
                  />
                </View>

                {/* Profession Suggestions */}
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>💡 Popular Professions:</Text>
                  <View style={styles.suggestionsGrid}>
                    {professionSuggestions.slice(0, 6).map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => handleInputChange('profession', suggestion.split(' ').slice(1).join(' '))}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Generate Button */}
                <TouchableOpacity style={styles.generateButton} onPress={generateSchedules}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.generateGradient}>
                    <Ionicons name="sparkles" size={24} color="white" />
                    <Text style={styles.generateText}>Generate Sleep Schedules</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {currentStep === 2 && showSchedules && (
            <Animated.View style={[styles.schedulesSection, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.schedulesHeader}>
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.schedulesHeaderGradient}>
                  <Text style={styles.schedulesHeaderIcon}>🎨</Text>
                  <Text style={styles.schedulesHeaderTitle}>Your Personalized Sleep Schedules</Text>
                  <Text style={styles.schedulesHeaderSubtitle}>
                    Choose the routine that fits your lifestyle best
                  </Text>
                </LinearGradient>
              </View>

              {schedules.map((schedule, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.scheduleCard,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 + (index * 20)]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity onPress={() => selectSchedule(schedule)}>
                    <LinearGradient 
                      colors={index % 2 === 0 ? ['#F3F4F6', '#FFFFFF'] : ['#EEF2FF', '#F8FAFC']} 
                      style={styles.scheduleCardGradient}
                    >
                      <View style={styles.scheduleHeader}>
                        <View style={styles.scheduleIconContainer}>
                          <Ionicons name={schedule.icon} size={24} color="#6366F1" />
                        </View>
                        <View style={styles.scheduleHeaderText}>
                          <Text style={styles.scheduleName}>{schedule.name}</Text>
                          <Text style={styles.scheduleDescription}>{schedule.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                      </View>

                      <View style={styles.scheduleDetails}>
                        <View style={styles.scheduleTime}>
                          <Ionicons name="sunny" size={16} color="#F59E0B" />
                          <Text style={styles.scheduleTimeText}>Wake: {schedule.wake_up}</Text>
                        </View>
                        <View style={styles.scheduleTime}>
                          <Ionicons name="moon" size={16} color="#6366F1" />
                          <Text style={styles.scheduleTimeText}>Sleep: {schedule.sleep}</Text>
                        </View>
                      </View>

                      <View style={styles.routineActivities}>
                        <View style={styles.activity}>
                          <Ionicons name="water" size={14} color="#06B6D4" />
                          <Text style={styles.activityText}>Face wash: {schedule.face_wash}</Text>
                        </View>
                        <View style={styles.activity}>
                          <Ionicons name="nutrition" size={14} color="#8B5CF6" />
                          <Text style={styles.activityText}>Milk: {schedule.milk}</Text>
                        </View>
                      </View>

                      <View style={styles.waterReminders}>
                        <Text style={styles.waterTitle}>💧 Water Reminders:</Text>
                        <View style={styles.waterTimes}>
                          {schedule.water_times.map((time, i) => (
                            <View key={i} style={styles.waterTimeChip}>
                              <Text style={styles.waterTimeText}>{time}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {currentStep === 3 && selectedSchedule && (
            <Animated.View style={[styles.selectedSection, { opacity: fadeAnim }]}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.successCard}>
                <Animated.View style={[styles.successIcon, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name="checkmark-circle" size={60} color="white" />
                </Animated.View>
                <Text style={styles.successTitle}>🎉 Schedule Activated!</Text>
                <Text style={styles.successSubtitle}>"{selectedSchedule.name}" routine is now your active sleep schedule</Text>
                
                <View style={styles.selectedScheduleDetails}>
                  <Text style={styles.selectedScheduleTitle}>📋 Your Daily Routine:</Text>
                  
                  <View style={styles.selectedActivity}>
                    <Ionicons name="sunny" size={20} color="#F59E0B" />
                    <Text style={styles.selectedActivityText}>Wake up at {selectedSchedule.wake_up}</Text>
                  </View>
                  
                  <View style={styles.selectedActivity}>
                    <Ionicons name="water" size={20} color="#06B6D4" />
                    <Text style={styles.selectedActivityText}>Face wash at {selectedSchedule.face_wash}</Text>
                  </View>
                  
                  <View style={styles.selectedActivity}>
                    <Ionicons name="nutrition" size={20} color="#8B5CF6" />
                    <Text style={styles.selectedActivityText}>Drink milk at {selectedSchedule.milk}</Text>
                  </View>
                  
                  <View style={styles.selectedActivity}>
                    <Ionicons name="moon" size={20} color="#6366F1" />
                    <Text style={styles.selectedActivityText}>Sleep at {selectedSchedule.sleep}</Text>
                  </View>
                  
                  <View style={styles.waterRemindersSelected}>
                    <Text style={styles.waterReminderTitle}>💧 Water reminders:</Text>
                    <Text style={styles.waterReminderTimes}>
                      {selectedSchedule.water_times.join(' • ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.successActions}>
                  <TouchableOpacity style={styles.newScheduleButton} onPress={resetForm}>
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.newScheduleGradient}>
                      <Ionicons name="add" size={20} color="white" />
                      <Text style={styles.newScheduleText}>Create New Schedule</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
    width: '100%',
  },
  loadingSpinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingSteps: {
    marginBottom: 32,
    width: '100%',
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  loadingStepText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
  },
  loadingProgress: {
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginTop: 20,
  },
  welcomeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  generateText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  schedulesSection: {
    marginTop: 20,
  },
  schedulesHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  schedulesHeaderGradient: {
    padding: 24,
    alignItems: 'center',
  },
  schedulesHeaderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  schedulesHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  schedulesHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scheduleCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleCardGradient: {
    padding: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleHeaderText: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  routineActivities: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  activityText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  waterReminders: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  waterTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  waterTimeChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  waterTimeText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  selectedSection: {
    marginTop: 20,
  },
  successCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  selectedScheduleDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  selectedScheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  selectedActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedActivityText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    fontWeight: '500',
  },
  waterRemindersSelected: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  waterReminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  waterReminderTimes: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  successActions: {
    width: '100%',
  },
  newScheduleButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newScheduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  newScheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SmartSleepBedtimeCompanion;
