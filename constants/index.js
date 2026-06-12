// Health App Constants

export const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#357ABD',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  textDark: '#1A1A1A',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  border: '#E1E8ED',
};

export const GRADIENTS = {
  primary: ['#4A90E2', '#357ABD'],
  medical: ['#667eea', '#764ba2'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
};

// Medical Categories for the consultation app
export const MEDICAL_CATEGORIES = [
  { id: 1, name: 'Neurologist', icon: 'brain', color: '#4F46E5', specialists: 45 },
  { id: 2, name: 'Cardiologist', icon: 'heartbeat', color: '#EF4444', specialists: 32 },
  { id: 3, name: 'Orthopedist', icon: 'bone', color: '#10B981', specialists: 28 },
  { id: 4, name: 'Pulmonologist', icon: 'lungs', color: '#F59E0B', specialists: 25 },
  { id: 5, name: 'Nephrologist', icon: 'procedures', color: '#8B5CF6', specialists: 18 },
  { id: 6, name: 'Gastroenterologist', icon: 'pills', color: '#06B6D4', specialists: 22 }
];

export const DOCTORS_DATA = [
  {
    id: 1,
    name: 'Dr. William James',
    specialty: 'Neurologist',
    experience: '5 years',
    rating: 4.8,
    patients: '2,500',
    price: 95,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'New York Medical Center',
    education: 'Harvard Medical School',
    description: 'Dr. William James is a board-certified neurologist specializing in movement disorders, epilepsy, and neurocritical care. He has extensive experience in treating complex neurological conditions.',
    availableSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    consultationTypes: ['Video Call', 'Voice Call', 'Chat'],
    languages: ['English', 'Spanish'],
    certifications: ['Board Certified Neurologist', 'FAAN', 'Epilepsy Specialist']
  },
  {
    id: 2,
    name: 'Dr. Thomas Michael',
    specialty: 'Cardiologist',
    experience: '12 years',
    rating: 4.9,
    patients: '3,200',
    price: 84,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'General Hospital',
    education: 'Johns Hopkins Medical School',
    description: 'Dr. Thomas Michael is a renowned cardiologist with expertise in interventional cardiology, heart failure management, and preventive cardiology.',
    availableSlots: ['10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
    consultationTypes: ['Video Call', 'Voice Call', 'In-Person'],
    languages: ['English', 'French'],
    certifications: ['Board Certified Cardiologist', 'FACC', 'FESC']
  },
  {
    id: 3,
    name: 'Dr. Sarah Wilson',
    specialty: 'Orthopedist',
    experience: '8 years',
    rating: 4.7,
    patients: '1,800',
    price: 75,
    image: 'https://images.unsplash.com/photo-1594824226066-8e4b21b95ac7?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'Orthopedic Institute',
    education: 'Stanford Medical School',
    description: 'Dr. Sarah Wilson specializes in sports medicine, joint replacement, and trauma surgery with a focus on minimally invasive techniques.',
    availableSlots: ['8:00 AM', '12:00 PM', '3:30 PM', '6:00 PM'],
    consultationTypes: ['Video Call', 'In-Person'],
    languages: ['English'],
    certifications: ['Board Certified Orthopedic Surgeon', 'Sports Medicine Specialist']
  },
  {
    id: 4,
    name: 'Dr. Nick Tyler',
    specialty: 'Cardiologist',
    experience: '15 years',
    rating: 4.8,
    patients: '4,100',
    price: 110,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'Heart Center',
    education: 'Mayo Clinic Medical School',
    description: 'Dr. Nick Tyler is a leading cardiologist specializing in advanced heart procedures, cardiac imaging, and heart transplantation.',
    availableSlots: ['9:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'],
    consultationTypes: ['Video Call', 'Voice Call', 'In-Person'],
    languages: ['English', 'German'],
    certifications: ['Board Certified Cardiologist', 'FACC', 'Heart Transplant Specialist']
  },
  {
    id: 5,
    name: 'Dr. Emily Chen',
    specialty: 'Pulmonologist',
    experience: '10 years',
    rating: 4.6,
    patients: '2,100',
    price: 88,
    image: 'https://images.unsplash.com/photo-1584467735871-8b67629e48bb?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'Respiratory Care Center',
    education: 'University of California Medical School',
    description: 'Dr. Emily Chen is a pulmonologist with expertise in asthma, COPD, lung cancer screening, and critical care medicine.',
    availableSlots: ['10:30 AM', '1:30 PM', '3:30 PM', '5:30 PM'],
    consultationTypes: ['Video Call', 'Voice Call'],
    languages: ['English', 'Mandarin'],
    certifications: ['Board Certified Pulmonologist', 'Critical Care Medicine']
  },
  {
    id: 6,
    name: 'Dr. Michael Rodriguez',
    specialty: 'Nephrologist',
    experience: '7 years',
    rating: 4.5,
    patients: '1,500',
    price: 92,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    available: true,
    location: 'Kidney Care Clinic',
    education: 'University of Texas Medical School',
    description: 'Dr. Michael Rodriguez specializes in kidney diseases, dialysis management, and transplant nephrology.',
    availableSlots: ['8:30 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    consultationTypes: ['Video Call', 'In-Person'],
    languages: ['English', 'Spanish'],
    certifications: ['Board Certified Nephrologist', 'Transplant Nephrology']
  }
];

// Popular searches and categories
export const TOP_SEARCHES = [
  'Neurosurgeon', 'Heart Failure', 'Gene Therapy', 'Diabetes Care',
  'Cancer Treatment', 'Mental Health', 'Pediatrics', 'Emergency Care'
];

export const CONSULTATION_TYPES = [
  {
    id: 1,
    name: 'Video Consultation',
    icon: 'videocam',
    color: '#4F46E5',
    description: 'Face-to-face consultation via video call',
    duration: '30-45 minutes'
  },
  {
    id: 2,
    name: 'Voice Call',
    icon: 'call',
    color: '#10B981',
    description: 'Audio consultation with the doctor',
    duration: '20-30 minutes'
  },
  {
    id: 3,
    name: 'Chat Consultation',
    icon: 'chatbubble',
    color: '#EF4444',
    description: 'Text-based consultation',
    duration: 'Instant responses'
  },
  {
    id: 4,
    name: 'In-Person Visit',
    icon: 'person',
    color: '#F59E0B',
    description: 'Visit doctor at clinic',
    duration: '45-60 minutes'
  }
];

export const HEALTH_STATS = [
  {
    id: 1,
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    icon: 'heart',
    color: '#E74C3C',
    status: 'normal',
  },
  {
    id: 2,
    label: 'Steps',
    value: '8,247',
    unit: 'steps',
    icon: 'walk',
    color: '#27AE60',
    status: 'good',
  },
  {
    id: 3,
    label: 'Sleep',
    value: '7.5',
    unit: 'hours',
    icon: 'moon',
    color: '#3498DB',
    status: 'optimal',
  },
];

export const QUICK_ACTIONS = [
  {
    id: 1,
    title: 'Book Appointment',
    icon: 'calendar',
    route: '/book-appointment',
    color: '#3498DB',
  },
  {
    id: 2,
    title: 'Symptom Check',
    icon: 'medical',
    route: '/screens/ml-modules/FeverFluSymptomChecker',
    color: '#E74C3C',
  },
  {
    id: 3,
    title: 'Reports',
    icon: 'document-text',
    route: '/reports',
    color: '#F39C12',
  },
  {
    id: 4,
    title: 'Chat Support',
    icon: 'chatbubbles',
    route: '/chat-support',
    color: '#9B59B6',
  },
];

export const PLATFORM_STYLES = {
  shadow: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  },
  largeShadow: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  },
};
