# Firebase Setup for Thanu-Raksha App

## Configuration Files

I've created template configuration files for Firebase. You need to replace the placeholder values with your actual Firebase project details:

### Android Configuration
**File Location:** `android/app/google-services.json`

Replace these placeholder values with your actual Firebase project data:
- `YOUR_PROJECT_NUMBER` - Your Firebase project number
- `YOUR_PROJECT_ID` - Your Firebase project ID  
- `YOUR_MOBILE_SDK_APP_ID` - Your Android app's Mobile SDK App ID
- `YOUR_API_KEY` - Your Android API key

### iOS Configuration  
**File Location:** `ios/GoogleService-Info.plist`

Replace these placeholder values with your actual Firebase project data:
- `YOUR_IOS_API_KEY` - Your iOS API key
- `YOUR_PROJECT_NUMBER` - Your Firebase project number
- `YOUR_PROJECT_ID` - Your Firebase project ID
- `YOUR_GOOGLE_APP_ID` - Your iOS app's Google App ID

## Steps to Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. For Android: Click "Add app" → Android → Download `google-services.json`
6. For iOS: Click "Add app" → iOS → Download `GoogleService-Info.plist`

## Package Name / Bundle ID

Make sure your Firebase apps are configured with the correct package name:
- Android: `com.yourcompany.thanurakshaapp`
- iOS: `com.yourcompany.thanurakshaapp`

(You can update this in your app.json/app.config.js)

## Firebase Dependencies

You'll need to install these packages:
```bash
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/auth
npx expo install @react-native-google-signin/google-signin
```

## Next Steps

1. Replace the placeholder values in the configuration files with your actual Firebase data
2. Install the Firebase dependencies
3. Configure Firebase Authentication with Google Sign-In in your Firebase console
4. Build and test the app

## Current Status

✅ Login page cleaned up (removed expo-auth-session code)
✅ Template configuration files created
✅ Dashboard prepared to display Google user data
🔄 Ready for Firebase configuration files
🔄 Ready for Firebase dependency installation
