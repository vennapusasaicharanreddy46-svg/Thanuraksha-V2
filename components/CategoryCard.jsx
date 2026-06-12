import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const CategoryCard = ({ category, onPress, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: `${category.color}15` }, style]} 
      onPress={() => onPress(category)}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <FontAwesome5 name={category.icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.specialistCount}>{category.specialists} specialists</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    width: 120,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  specialistCount: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default CategoryCard;
