// Create app/auth/_layout.jsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="patient-login" />
      <Stack.Screen name="doctor-login" />
      <Stack.Screen name="pharmacy-login" />
      <Stack.Screen name="admin-login" />
    </Stack>
  );
}