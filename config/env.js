// Environment configuration
// Create a .env file in your project root with:
// GOOGLE_API_KEY=your_actual_api_key_here

export const config = {
  // For development - replace with your actual Google Gemini API key
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "AIzaSyDjNYlTXoTmy4pjQvhdIxwVM90eYr7SkVs",
  
  // API endpoint
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
};

// Instructions for getting Google Gemini API key:
// 1. Go to https://makersuite.google.com/app/apikey
// 2. Create a new API key
// 3. Copy the key and replace YOUR_GOOGLE_API_KEY_HERE above
// 4. For production, store this in a secure environment variable
