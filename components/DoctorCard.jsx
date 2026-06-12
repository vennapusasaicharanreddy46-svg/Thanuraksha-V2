import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DoctorCard = ({ doctor, style, variant = 'default' }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/doctor-profile?id=${doctor.id}`);
  };

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={[styles.featuredCard, style]} onPress={handlePress}>
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeader}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{doctor.rating}</Text>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.doctorImageContainer}>
            <Image source={{ uri: doctor.image }} style={styles.featuredDoctorImage} />
          </View>
          
          <Text style={styles.featuredDoctorName}>{doctor.name}</Text>
          <Text style={styles.featuredSpecialty}>{doctor.specialty}</Text>
          <Text style={styles.featuredPrice}>${doctor.price}/session</Text>
          
          <View style={styles.availabilitySection}>
            <Text style={styles.availabilityLabel}>Availability</Text>
            <View style={styles.timeSlots}>
              {doctor.availableSlots?.slice(0, 3).map((slot, index) => (
                <View key={index} style={styles.timeSlot}>
                  <Text style={styles.timeSlotText}>{slot}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.doctorCard, style]} onPress={handlePress}>
      <View style={styles.doctorImageContainer}>
        <Image source={{ uri: doctor.image }} style={styles.doctorImage} />
        <View style={styles.statusIndicator} />
      </View>
      
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <Text style={styles.experience}>{doctor.experience} experience</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{doctor.rating}</Text>
          <Text style={styles.patients}>({doctor.patients}+ patients)</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${doctor.price}</Text>
          <Text style={styles.priceLabel}>/session</Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={18} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.videoButton}>
          <Ionicons name="videocam" size={18} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={18} color="#10B981" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  specialty: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  experience: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 2,
  },
  patients: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Featured card styles
  featuredCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 20,
    width: 280,
    marginRight: 16,
  },
  featuredContent: {
    alignItems: 'center',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredDoctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  featuredDoctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredSpecialty: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  availabilitySection: {
    width: '100%',
  },
  availabilityLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeSlots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeSlotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default DoctorCard;
