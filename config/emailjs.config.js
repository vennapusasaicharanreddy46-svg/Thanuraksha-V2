// EmailJS Configuration
// You need to replace these values with your actual EmailJS credentials

export const EMAILJS_CONFIG = {
  // Your EmailJS Public Key (from your EmailJS dashboard)
  PUBLIC_KEY: 'ljvQ6l8lS46vMjgeK',
  
  // Your EmailJS Service ID (from your EmailJS dashboard)
  SERVICE_ID: 'service_hax0m2s',
  
  // Your EmailJS Template ID for doctor verification emails
  TEMPLATE_ID: 'template_5ivx2qk',
};

// EmailJS Template Variables (SIMPLIFIED - Only 3 fields needed):
// - email: Doctor's email address
// - passcode: 4-digit verification code  
// - time: Current timestamp when approved

/* 
SIMPLE EMAIL TEMPLATE SETUP:

Create your EmailJS template with these 3 variables only:

Subject: Doctor Verification Code

Body:
Email: {{email}}
Passcode: {{passcode}}
Time: {{time}}

That's it! Simple and clean.
*/
