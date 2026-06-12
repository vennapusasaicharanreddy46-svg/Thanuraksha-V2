import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Conditional import for LinearGradient with fallback
let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = ({ children, colors, style, ...props }) => (
    <View style={[style, { backgroundColor: colors?.[0] || '#667eea' }]} {...props}>
      {children}
    </View>
  );
}

export default function HealthTab() {
  const router = useRouter();

  const healthModules = [
    {
      id: 1,
      title: 'Skin Disease Detector',
      subtitle: 'AI-powered skin analysis',
      icon: 'scan',
      gradient: ['#667eea', '#764ba2'],
      route: '/screens/cnn-modules/SkinDiseaseDetector'
    },
    {
      id: 2,
      title: 'Eye Condition Analyzer',
      subtitle: 'Eye health assessment',
      icon: 'eye',
      gradient: ['#f093fb', '#f5576c'],
      route: '/screens/cnn-modules/EyeConditionAnalyzer'
    },
    {
      id: 3,
      title: 'Plate Calorie Checker',
      subtitle: 'Food nutrition analysis',
      icon: 'restaurant',
      gradient: ['#4facfe', '#00f2fe'],
      route: '/screens/cnn-modules/PlateCalorieChecker'
    },
    {
      id: 4,
      title: 'Breast Cancer Risk',
      subtitle: 'Risk assessment chatbot',
      icon: 'chatbubbles',
      gradient: ['#43e97b', '#38f9d7'],
      route: '/screens/ml-modules/BreastCancerRiskChatbot'
    },
    {
      id: 5,
      title: 'Fever & Flu Checker',
      subtitle: 'Symptom analysis',
      icon: 'thermometer',
      gradient: ['#fa709a', '#fee140'],
      route: '/screens/ml-modules/FeverFluSymptomChecker'
    },
    {
      id: 6,
      title: 'Diet Planner',
      subtitle: 'Personalized nutrition',
      icon: 'nutrition',
      gradient: ['#a8edea', '#fed6e3'],
      route: '/screens/ml-modules/DailyDietNutritionPlanner'
    },
    {
      id: 7,
      title: 'Sleep Companion',
      subtitle: 'Smart sleep optimization',
      icon: 'moon',
      gradient: ['#d299c2', '#fef9d7'],
      route: '/screens/ml-modules/SmartSleepBedtimeCompanion'
    },
    {
      id: 8,
      title: 'Diabetes Monitor',
      subtitle: 'Glucose risk assessment',
      icon: 'pulse',
      gradient: ['#89f7fe', '#66a6ff'],
      route: '/screens/ml-modules/DiabetesGlucoseRiskMonitor'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Analysis</Text>
          <Text style={styles.subtitle}>AI-powered health monitoring tools</Text>
        </View>

        {/* Health Modules Grid */}
        <View style={styles.modulesGrid}>
          {healthModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => router.push(module.route)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={module.gradient}
                style={styles.moduleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.moduleIcon}>
                  <Ionicons name={module.icon} size={28} color="white" />
                </View>
                <View style={styles.moduleContent}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  modulesGrid: {
    paddingBottom: 100,
  },
  moduleCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  moduleGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
  },
  moduleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
});
