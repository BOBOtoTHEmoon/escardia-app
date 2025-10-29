import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: RatingData) => void;
  tripData: {
    carName: string;
    hadDriver: boolean;
  };
}

interface RatingData {
  carCondition: number;
  driverRating: number | null;
  overallExperience: number;
  review: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  tripData,
}) => {
  const [carCondition, setCarCondition] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [overallExperience, setOverallExperience] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (carCondition === 0 || overallExperience === 0) {
      Alert.alert('Missing Ratings', 'Please rate the car condition and overall experience');
      return;
    }

    if (tripData.hadDriver && driverRating === 0) {
      Alert.alert('Missing Rating', 'Please rate your driver');
      return;
    }

    const ratingData: RatingData = {
      carCondition,
      driverRating: tripData.hadDriver ? driverRating : null,
      overallExperience,
      review: review.trim(),
    };

    onSubmit(ratingData);
    resetForm();
  };

  const handleSkip = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCarCondition(0);
    setDriverRating(0);
    setOverallExperience(0);
    setReview('');
  };

  const renderStars = (rating: number, onPress: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onPress(star)}>
            <Image
              source={
                star <= rating
                  ? require('../../assets/images/staricon.png')
                  : require('../../assets/images/staricon.png')
              }
              style={styles.starIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Rate Your Trip</Text>
              <Text style={styles.carName}>{tripData.carName}</Text>
            </View>

            {/* Car Condition Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Car Condition</Text>
              <Text style={styles.ratingDescription}>
                How was the car's cleanliness and condition?
              </Text>
              {renderStars(carCondition, setCarCondition)}
            </View>

            {/* Driver Rating - Only if hadDriver */}
            {tripData.hadDriver && (
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Driver Service</Text>
                <Text style={styles.ratingDescription}>
                  How professional and safe was your driver?
                </Text>
                {renderStars(driverRating, setDriverRating)}
              </View>
            )}

            {/* Overall Experience Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Overall Experience</Text>
              <Text style={styles.ratingDescription}>
                How would you rate your overall experience?
              </Text>
              {renderStars(overallExperience, setOverallExperience)}
            </View>

            {/* Review Input */}
            <View style={styles.reviewSection}>
              <Text style={styles.ratingLabel}>
                Write a Review <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with other users..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                value={review}
                onChangeText={setReview}
                textAlignVertical="top"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  carName: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  ratingSection: {
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  ratingDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starIcon: {
    width: 40,
    height: 20,
  },
  reviewSection: {
    marginBottom: 32,
  },
  optional: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '400',
  },
  reviewInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 120,
    marginTop: 8,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#2F5FED',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RatingModal;