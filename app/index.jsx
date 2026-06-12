// Create or update: app/index.jsx
import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Wait a bit for the navigation to be ready
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isNavigationReady) {
      checkUserSession();
    }
  }, [isNavigationReady]);

  const checkUserSession = async () => {
    try {
      // For now, always redirect to landing
      // You can add AsyncStorage check here later
      router.replace('/landing');
      
      // Future implementation:
      // const userSession = await AsyncStorage.getItem('userSession');
      // if (userSession) {
      //   const userData = JSON.parse(userSession);
      //   switch(userData.userType) {
      //     case 'patient':
      //       router.replace('/(tabs)');
      //       break;
      //     case 'doctor':
      //       router.replace('/doctor-dashboard');
      //       break;
      //     case 'pharmacy':
      //       router.replace('/pharmacy-dashboard');
      //       break;
      //     default:
      //       router.replace('/landing');
      //   }
      // } else {
      //   router.replace('/landing');
      // }
    } catch (error) {
      console.error('Error checking user session:', error);
      router.replace('/landing');
    }
  };

  // Show a blank screen while navigation is setting up
  return <View style={{ flex: 1, backgroundColor: '#F8FAFC' }} />;
}