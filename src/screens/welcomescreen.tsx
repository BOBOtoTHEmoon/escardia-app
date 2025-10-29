import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <LinearGradient
      colors={['#191D24', '#5F6E88']}
      style={styles.container}
    >
       <View style={styles.content}>
       {/* Text at top */}
<View style={styles.textContainer}>
  <View style={styles.textInner}>
    <Text style={styles.title}>Premium{'\n'}car services</Text>
    <Text style={styles.subtitle}>
      Professional Drivers, Seamless Bookings{'\n'}and Vip treatment.
    </Text>
  </View>
</View>
        
        <View style={styles.carContainer}>
          <Image 
            source={require('../../assets/images/welcomecar.png')}
            style={styles.carImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Image 
            source={require('../../assets/images/botton.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  textContainer: {
    paddingTop: 60,
    marginBottom: 40,
    alignSelf: 'stretch',
   width: 245,
  },
    textInner: {
  paddingHorizontal: 5,
  alignSelf: 'stretch',
   width: 245,  // This makes the text extend 8px on each side
  },
  title: {
    fontSize: 43.89,
    fontWeight: 'medium',
    color: '#FFFFFF',
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginTop: 12,
    lineHeight: 20,
  },
  carContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //marginVertical: 40,
  },
  carImage: {
    width: '110%',
    height: '100%',
    maxHeight: 400,
    //left: 48
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 12,
  },
  arrowIcon: {
    width: 20,
    height: 10,
    left: 70
  },
});