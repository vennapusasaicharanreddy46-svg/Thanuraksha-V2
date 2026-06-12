import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="SkinDiseaseDetector" />
      <Stack.Screen name="EyeConditionAnalyzer" />
      <Stack.Screen name="PlateCalorieChecker" />
      <Stack.Screen name="BreastCancerRiskChatbot" />
      <Stack.Screen name="FeverFluSymptomChecker" />
      <Stack.Screen name="DailyDietNutritionPlanner" />
      <Stack.Screen name="SmartSleepBedtimeCompanion" />
      <Stack.Screen name="DiabetesGlucoseRiskMonitor" />
    </Stack>
  );
}
