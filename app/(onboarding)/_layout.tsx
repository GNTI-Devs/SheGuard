import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="language-select" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="auth-demo" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
