

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EditTripScreenProps {
  tripData: {
    id: string;
    pickupLocation: string;
    startDate: string;
    endDate: string;
    startTime: string;
    stopTime: string;
    escortCount: number;
  };
  onNavigateBack: () => void;
  onSaveChanges: (updatedData: any) => void;
}

export const EditTripScreen: React.FC<EditTripScreenProps> = ({
  tripData,
  onNavigateBack,
  onSaveChanges,
}) => {
  const [pickupLocation, setPickupLocation] = useState(tripData.pickupLocation);
  
  // Parse existing dates
  const parseExistingDate = (dateStr: string) => {
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const months: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
    }
    return new Date();
  };

  const parseExistingTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const isPM = match[3].toUpperCase() === 'PM';
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    return new Date();
  };

  const [startDate, setStartDate] = useState(parseExistingDate(tripData.startDate));
  const [endDate, setEndDate] = useState(parseExistingDate(tripData.endDate));
  const [startTime, setStartTime] = useState(parseExistingTime(tripData.startTime));
  const [stopTime, setStopTime] = useState(
  tripData.stopTime ? parseExistingTime(tripData.stopTime) : new Date()
);
  const [escortCount, setEscortCount] = useState(tripData.escortCount);
  
  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showStopTimePicker, setShowStopTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const calculateDuration = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSave = () => {
    const updatedData = {
      id: tripData.id,
      pickupLocation,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      startTime: formatTime(startTime),
      stopTime: formatTime(stopTime),
      escortCount,
      duration: calculateDuration(),
    };
    onSaveChanges(updatedData);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Trip</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pick-up Location</Text>
          <View style={styles.locationInput}>
            <Image
              source={require('../../assets/images/location.png')}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="Enter pickup location"
            />
          </View>
        </View>

        {/* Date and Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date and Time</Text>

          {/* Start Date */}
          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          {/* End Date */}
          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          {/* Start Time */}
          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(false);
                if (selectedTime) setStartTime(selectedTime);
              }}
            />
          )}

          {/* Stop Time */}
          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Stop Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStopTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(stopTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStopTimePicker && (
            <DateTimePicker
              value={stopTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStopTimePicker(false);
                if (selectedTime) setStopTime(selectedTime);
              }}
            />
          )}

          {/* Duration Display */}
          <View style={styles.durationContainer}>
            <Image
              source={require('../../assets/images/clock.png')}
              style={styles.clockIcon}
              resizeMode="contain"
            />
            <Text style={styles.durationText}>
              Total duration for trip is {calculateDuration()} days
            </Text>
          </View>
        </View>

        {/* Escort Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Number of Escorts</Text>
          <View style={styles.escortControls}>
            <TouchableOpacity
              style={styles.escortButton}
              onPress={() => setEscortCount(Math.max(0, escortCount - 1))}
            >
              <Text style={styles.escortButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.escortCount}>{escortCount}</Text>
            <TouchableOpacity
              style={styles.escortButton}
              onPress={() => setEscortCount(escortCount + 1)}
            >
              <Text style={styles.escortButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#E8EAF6',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  dateTimeRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#000',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  clockIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  durationText: {
    fontSize: 13,
    color: '#065F46',
  },
  escortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  escortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escortButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  escortCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 30,
  },
  footer: {
    padding: 20,
    backgroundColor: '#E8EAF6',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});