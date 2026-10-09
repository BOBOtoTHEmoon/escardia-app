import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OnboardingScreen } from './src/screens/onboardingscreen';
import { SignUpScreen } from './src/screens/signupscreen';
import { SignInScreen } from './src/screens/signinscreen';
import { VerifyCodeScreen } from './src/screens/verifycodescreen';
import { HomeScreen } from './src/screens/homescreen';
import { ProfileScreen } from './src/screens/profilescreen';
import { CarDetailsScreen } from './src/screens/cardetailsscreen';
import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from './src/config/supabase';
import { getUserProfile } from './src/services/authservice';
import { TripDetailScreen } from './src/screens/tripdetailsscreen';
import { RideModeScreen } from './src/screens/ridemodescreen';
import PaymentDetailsScreen from './src/screens/paymentdetailsscreen';
import { BookingConfirmationScreen } from './src/screens/bookingconfirmationscreen';
import { CarsScreen } from './src/screens/carsscreen';
import { TripsScreen } from './src/screens/tripsscreen';
import { FavoriteCarsScreen } from './src/screens/favouritecarsscreen';
import { createBooking } from './src/services/bookingService';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/welcomescreen';
import { SupportScreen } from './src/screens/supportscreen';
import { ContactUsScreen } from './src/screens/contactusscreen';
import { FAQScreen } from './src/screens/faqscreen';
import { PoliciesScreen } from './src/screens/policiesscreen';
import { SecurityLoginSafetyScreen } from './src/screens/securityloginsafetyscreen';
import { SafetyTipsScreen } from './src/screens/safetytipsscreen';
import { ChangePasswordScreen } from './src/screens/changepasswordscreen';
import { ChatWithUsScreen } from './src/screens/chatwithusscreen';
import { WalletScreen } from './src/screens/walletscreen';
import { TransactionsScreen } from './src/screens/transactionsscreen';
import { TripBookingScreen } from './src/screens/tripbookingscreen';
import { EditTripScreen } from './src/screens/edittripscreen';
import CardPaymentScreen from './src/screens/cardpaymentscreen';
import BankTransferScreen from './src/screens/banktransferscreen';
import { VendorOnboardingScreen } from './src/screens/vendoronboardingscreen';
import { VendorAccountCreationScreen } from './src/screens/vendoraccountcreationscreen';
import { VendorPhoneVerificationScreen } from './src/screens/vendorphoneverificationscreen';
import { VendorBusinessRegistrationScreen } from './src/screens/vendorbusinessregistrationscreen';
import { VendorIDVerificationScreen } from './src/screens/vendorIDverificationscreen';
import { VendorSignInScreen } from './src/screens/vendorsigninscreen';
import { VendorDashboardScreen } from './src/screens/vendordashboard';
import { AddCarScreen } from './src/screens/addcarscreen';
import { MyFleetScreen } from './src/screens/myfleetscreen';
import { VendorBookingsScreen } from './src/screens/vendorbookingscreen';
import { VendorProfileScreen } from './src/screens/vendorprofilescreen';
import { VendorBookingDetailScreen } from './src/screens/vendorbookingdetailscreeen';
import { VendorCarDetailScreen } from './src/screens/vendorcardetailscreen';
import { VendorEarningsScreen } from './src/screens/vendorearningsscreen';
import { ManageDriversScreen } from './src/screens/managedriversscreen';
import { NotificationsScreen } from './src/screens/notificationsscreen';
import { WithdrawFundsScreen } from './src/screens/withdrawfundsscreen';
import type { VendorAccountData } from './src/screens/vendoraccountcreationscreen';
import { EditCarScreen } from './src/screens/editcarscreen';
import { VendorSettingsScreen } from './src/screens/vendorsettingsscreen';
import { VendorBankDetailsScreen } from './src/screens/vendorbankdetailsscreen';
import { VendorDocumentsScreen } from './src/screens/vendordocumentsscreen';
import { VendorAnalyticsScreen } from './src/screens/vendoranalyticsscreen';
import { VendorNotificationPreferencesScreen } from './src/screens/vendornotificationsscreen';
import { VendorTermsAndPrivacyScreen } from './src/screens/vendortermsandprivacyscreen';
import { VendorHelpAndSupportScreen } from './src/screens/vendorhelpandsupportscreen';
import { AddMoneyScreen } from './src/screens/addmoneyscreen';
import { WalletPaymentScreen } from './src/screens/WalletPaymentScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState <
   'splash' |'welcome' |'onboarding'| 'vendorOnboarding' | 'vendorAccountCreation' | 'myFleet' |'vendorSignIn'|'vendorPhoneVerification'| 'vendorBusinessRegistration'|'vendorIDVerification'|'vendorBookings'|'vendorBookingDetail'| 'vendorCarDetail'|'vendorDashboard'|'vendorProfile'| 'vendorEarnings'|'addCar'| 'manageDrivers'| 'withdrawFunds'|'editCar' |'signup' | 'notifications' | 'signin' | 'verify' | 'home' | 'profile' | 'carDetails' | 'tripDetails' | 'rideMode'| 'payment' | 'confirmation' | 'cars' | 'trips'| 'search' | 'favorites' | 'support' | 'contactUs' | 'faq' | 'policies'|'securityLoginSafety' | 'safetyTips' | 'changePassword'| 'chatWithUs'| 'wallet' | 'transactions'| 'tripDetail' | 'editTrip' | 'tripBooking' | 'editTrip' |'cardPayment' | 'bankTransfer'| 'vendorSettings' | 'vendorBankDetails' | 'vendorDocuments' | 'vendorAnalytics' | 'vendorNotificationPreferences' | 'vendorTermsAndPrivacy' | 'vendorHelpAndSupport'| 'addMoney' | 'walletPayment' 
  >('splash');
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tripData, setTripData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [vendorData, setVendorData] = useState<any>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [vendorAccountData, setVendorAccountData] = useState<VendorAccountData | null>(null);
  const [bookingFormData, setBookingFormData] = useState<any>({
  // Trip booking data
  pickupMethod: 'vendor',
  rateType: 'day',
  deliveryAddress: '',
  startDate: null,
  endDate: null,
  startTime: null,
  stopTime: null,
  // Security data
  escortCounts: { legion: 0, private: 0 },
  manualHiluxCount: 0,
});

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileResult = await getUserProfile(firebaseUser.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleOnboardingComplete = () => {
    setCurrentScreen('signup');
  };

  const handleSignUpSuccess = (email: string, needsVerification: boolean) => {
    if (!needsVerification) {
      // Email confirmation is switched off in Supabase: the user is already signed in.
      handleVerifySuccess();
      return;
    }
    setPendingEmail(email);
    setCurrentScreen('verify');
  };

  const handleSignInSuccess = async () => {
  try {
    const { savePushToken } = await import('./src/services/notificationService');
    const user = auth.currentUser;
    if (user) {
      await savePushToken(user.uid, 'user');
    }
  } catch (error) {
    console.log('Push token error:', error);
  }
  setCurrentScreen('home');
};

  const handleNavigateToSignIn = () => {
    setCurrentScreen('signin');
  };

  const handleNavigateToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleForgotPassword = () => {
    console.log('Navigate to Forgot Password');
  };

  const handleVerifySuccess = async () => {
    try {
      const { savePushToken } = await import('./src/services/notificationService');
      const u = auth.currentUser;
      if (u) await savePushToken(u.uid, 'user');
    } catch (error) {
      console.log('Push token error:', error);
    }
    setCurrentScreen('home');
  };

  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleNavigateBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleNavigateToCarDetails = (carId: string) => {
    console.log('Viewing car:', carId);
    setSelectedCarId(carId);
    setCurrentScreen('carDetails');
  };

  const handleNavigateToTripDetails = () => {
    setCurrentScreen('tripDetails');
  };

  const handleContinueToRideMode = (tripData: any) => {
    console.log('Trip data:', tripData);
    setBookingData({ tripData: tripData, escortData: null });
    setCurrentScreen('rideMode');
  };

  const handleNavigateToVendorBookingDetail = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCurrentScreen('vendorBookingDetail');
  };

  const handleNavigateBackToVendorBookings = () => {
    setCurrentScreen('vendorBookings');
  };

  const handleNavigateToVendorCarDetail = (carId: string) => {
    setSelectedCarId(carId);
    setCurrentScreen('vendorCarDetail');
  };

  const handleNavigateBackToFleet = () => {
    setCurrentScreen('myFleet');
  };

  const handleEditCar = (carId: string) => {
    setSelectedCarId(carId);
    setCurrentScreen('editCar');
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      const { deleteCar } = await import('./src/services/carservice');
      const result = await deleteCar(carId);
      if (!result.success) {
        alert(result.error || 'Failed to delete car');
        return;
      }

      alert('Car deleted successfully!');
      setSelectedCarId(null);
      setCurrentScreen('myFleet');
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car');
    }
  };

  const handleMakePayment = async () => {
    try {
      console.log('=== PAYMENT STARTED ===');

      if (!user || !bookingData) {
        console.log('EARLY EXIT - missing user or booking data');
        return;
      }

      const parseDate = (dateStr: string) => {
        const parts = dateStr.trim().split(' ');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const monthStr = parts[1];
          const year = parseInt(parts[2]);

          const months: { [key: string]: number } = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11,
          };

          const month = months[monthStr];
          if (month !== undefined) {
            const date = new Date(year, month, day);
            console.log(`Parsed: "${dateStr}" -> ${date.toISOString()}`);
            return date;
          }
        }
        console.log(`Failed to parse: "${dateStr}"`);
        return new Date();
      };

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const startDate = parseDate(bookingData.tripData.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = parseDate(bookingData.tripData.endDate);
      endDate.setHours(0, 0, 0, 0);

      let status = 'upcoming';
      if (now >= startDate && now <= endDate) {
        status = 'ongoing';
      } else if (now > endDate) {
        status = 'past';
      }

      const booking = {
        userId: user.uid,
        customerName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Guest',
        customerPhone: userProfile?.phoneNumber || 'N/A',
        customerEmail: userProfile?.email || user.email || 'N/A',
        carId: bookingData.tripData.car.id,
        carBrand: bookingData.tripData.car.brand,
        carModel: bookingData.tripData.car.model,
        carYear: bookingData.tripData.car.year,
        car: {
          id: bookingData.tripData.car.id,
          brand: bookingData.tripData.car.brand,
          model: bookingData.tripData.car.model,
          year: bookingData.tripData.car.year,
          pricePerDay: bookingData.tripData.car.pricePerDay,
          pricePerHour: bookingData.tripData.car.pricePerHour,
          photos: bookingData.tripData.car.photos || [],
          seats: bookingData.tripData.car.seats,
          doors: bookingData.tripData.car.doors,
          transmission: bookingData.tripData.car.transmission,
          location: bookingData.tripData.car.location,
          vendorId: bookingData.tripData.car.vendorId,
        },
         vendorId: bookingData.tripData.car.vendorId,
        pickupLocation: bookingData.tripData.pickupLocation,
        pickupMethod: bookingData.tripData.pickupMethod,
        startDate: bookingData.tripData.startDate,
        endDate: bookingData.tripData.endDate,
        startTime: bookingData.tripData.startTime,
        stopTime: bookingData.tripData.stopTime,
        rideMode: bookingData.tripData.rideMode,
        escort: bookingData.escortData?.escorts || null,
         hiluxCount: bookingData.escortData?.hiluxCount || 0, 
  hiluxCost: bookingData.escortData?.hiluxCost || 0, 
        totalPrice: paymentAmount,
        status: status,
        paymentMethod: selectedPaymentMethod,
        durationType: bookingData.tripData.durationType,
        duration: bookingData.tripData.duration,
      };

      const result = await createBooking(booking);

      if (result.success) {
        setBookingData((prev: any) => ({
          ...prev,
          bookingId: result.id,
        }));
        setCurrentScreen('confirmation');

  setBookingFormData({
        pickupMethod: 'vendor',
        rateType: 'day',
        deliveryAddress: '',
        startDate: null,
        endDate: null,
        startTime: null,
        stopTime: null,
        escortCounts: { legion: 0, private: 0 },
        manualHiluxCount: 0,
      });

      } else {
        alert('Booking failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error);
    }
  };

  const handleNavigateToCars = () => {
    setCurrentScreen('cars');
  };

  const handleNavigateToTrips = () => {
    setCurrentScreen('trips');
  };

  const handleNavigateToSearch = () => {
    setCurrentScreen('search');
  };

  const handleNavigateToFavorites = () => {
    setCurrentScreen('favorites');
  };

  const handleSearchCar = (query: string) => {
    console.log('Searching for:', query);
    setCurrentScreen('cars');
  };

const handleContinueToPayment = (rideModeData: any) => {
  setBookingData((prev: any) => ({
    ...prev,
    escortData: {
      escorts: rideModeData.escorts || null,
      hiluxCount: rideModeData.hiluxCount || 0,
      hiluxCost: rideModeData.hiluxCost || 0,
      totalSecurityCost: rideModeData.totalSecurityCost || 0,
    },
  }));
  setCurrentScreen('payment');
};

const handleVendorAccountCreation = async (data: VendorAccountData) => {
  // Creates the vendor login and emails a 6-digit code.
  const { startVendorSignUp } = await import('./src/services/vendorauthservice');
  const result = await startVendorSignUp(data);
  if (!result.success) {
    alert(result.error || 'Could not create your account');
    return;
  }
  setVendorData(data);
  // Skip the code screen while email confirmation is switched off in Supabase.
  setCurrentScreen(result.needsVerification ? 'vendorPhoneVerification' : 'vendorBusinessRegistration');
};

  return (
    <>
      <StatusBar style="auto" />
      {currentScreen === 'splash' && <SplashScreen onFinish={() => setCurrentScreen('welcome')} />}
      {currentScreen === 'welcome' && <WelcomeScreen onGetStarted={() => setCurrentScreen('onboarding')} />}
      {currentScreen === 'onboarding' && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToVendorOnboarding={() => setCurrentScreen('vendorOnboarding')}
        />
      )}
      {currentScreen === 'signup' && (
        <SignUpScreen
          onSignUpSuccess={handleSignUpSuccess}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateBack={() => setCurrentScreen('onboarding')}
        />
      )}
      {currentScreen === 'signin' && (
        <SignInScreen
          onSignInSuccess={handleSignInSuccess}
          onNeedsVerification={(email: string) => {
            setPendingEmail(email);
            setCurrentScreen('verify');
          }}
          onNavigateToSignUp={handleNavigateToSignUp}
          onForgotPassword={handleForgotPassword}
          onNavigateBack={() => setCurrentScreen('signup')}
        />
      )}
      {currentScreen === 'verify' && <VerifyCodeScreen email={pendingEmail} onVerifySuccess={handleVerifySuccess} />}
      {currentScreen === 'home' && (
        <HomeScreen
          userName={userProfile?.firstName || 'Guest'}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToCarDetails={(carId) => {
            setSelectedCarId(carId);
            setCurrentScreen('carDetails');
          }}
          onNavigateToCars={handleNavigateToCars}
          onNavigateToTrips={handleNavigateToTrips}
          onNavigateToSearch={handleNavigateToSearch}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen
          onNavigateBack={handleNavigateBackToHome}
          userName={
            userProfile?.firstName && userProfile?.lastName
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : 'Guest User'
          }
          userEmail={userProfile?.email || user?.email || ''}
          onNavigateToHome={handleNavigateBackToHome}
          onNavigateToCars={handleNavigateToCars}
          onNavigateToTrips={handleNavigateToTrips}
          onNavigateToFavorites={handleNavigateToFavorites}
          onNavigateToSupport={() => setCurrentScreen('support')}
          onNavigateToSecurityLoginSafety={() => setCurrentScreen('securityLoginSafety')}
          onNavigateToWallet={() => setCurrentScreen('wallet')}
          onNavigateToVendorOnboarding={() => setCurrentScreen('vendorOnboarding')}
          onNavigateToWelcome={() => setCurrentScreen('welcome')}
        />
      )}
      {currentScreen === 'carDetails' && selectedCarId && (
        <CarDetailsScreen
          carId={selectedCarId}
          onNavigateBack={handleNavigateBackToHome}
          onNavigateToTripDetails={(carData) => {
            setSelectedCar({
              id: selectedCarId,
              ...carData,
            });
            setCurrentScreen('tripBooking');
          }}
        />
      )}
     {currentScreen === 'rideMode' && (
  <RideModeScreen
    onNavigateBack={() => setCurrentScreen('tripBooking')}
    onContinue={handleContinueToPayment}
    tripData={bookingData}
    savedFormData={bookingFormData}
    onFormDataChange={(data: any) => setBookingFormData((prev: any) => ({ ...prev, ...data }))}
  />
)}
      {currentScreen === 'payment' && (
        <PaymentDetailsScreen
          onNavigateBack={() => setCurrentScreen('rideMode')}
          onNavigateToCardPayment={(amount) => {
            setPaymentAmount(amount);
            setSelectedPaymentMethod('card');
            setCurrentScreen('cardPayment');
          }}
          onNavigateToBankTransfer={(amount) => {
            setPaymentAmount(amount);
            setSelectedPaymentMethod('bank');
            setCurrentScreen('bankTransfer');
          }}
        onNavigateToWalletPayment={(amount: number) => {
      setPaymentAmount(amount);
      setCurrentScreen('walletPayment');
    }}
    bookingData={bookingData}
        />
      )}
      {currentScreen === 'confirmation' && (
        <BookingConfirmationScreen
          onBackToHome={() => setCurrentScreen('home')}
          bookingData={bookingData}
          totalAmount={paymentAmount}
          paymentMethod={selectedPaymentMethod}
        />
      )}
      {currentScreen === 'cars' && (
        <CarsScreen
          onNavigateToCarDetails={handleNavigateToCarDetails}
          onNavigateToHome={handleNavigateBackToHome}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToTrips={handleNavigateToTrips}
        />
      )}
      {currentScreen === 'trips' && (
        <TripsScreen
          onNavigateToHome={handleNavigateBackToHome}
          onNavigateToCars={handleNavigateToCars}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToTripDetail={(firebaseBooking) => {
            const calculateDuration = (startDate: string, endDate: string) => {
              const parts1 = startDate.split(' ');
              const parts2 = endDate.split(' ');

              const months: { [key: string]: number } = {
                Jan: 0,
                Feb: 1,
                Mar: 2,
                Apr: 3,
                May: 4,
                Jun: 5,
                Jul: 6,
                Aug: 7,
                Sep: 8,
                Oct: 9,
                Nov: 10,
                Dec: 11,
              };

              const start = new Date(parseInt(parts1[2]), months[parts1[1]], parseInt(parts1[0]));
              const end = new Date(parseInt(parts2[2]), months[parts2[1]], parseInt(parts2[0]));

              const diffTime = Math.abs(end.getTime() - start.getTime());
              return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };

            const durationDays = calculateDuration(firebaseBooking.startDate, firebaseBooking.endDate);

            const transformedData = {
              id: firebaseBooking.id,
              vendorId: firebaseBooking.vendorId,
              status: firebaseBooking.status,
              rideMode: firebaseBooking.rideMode,
              durationType: firebaseBooking.durationType || 'day',
              durationValue: durationDays,
              pickupLocation: firebaseBooking.pickupLocation,
              car: {
                model: firebaseBooking.car?.model || 'Unknown',
                year: firebaseBooking.car?.year || '2024',
                price: (firebaseBooking.car?.pricePerDay || firebaseBooking.car?.price || 0).toString(),
                image: require('./assets/images/car-placeholder.png'),
                photos: firebaseBooking.car?.photos || [],
                seats: firebaseBooking.car?.seats || 4,
                doors: firebaseBooking.car?.doors || 4,
                ac: '6+',
                transmission: firebaseBooking.car?.transmission || 'Automatic',
                 vendorId: firebaseBooking.car?.vendorId || firebaseBooking.vendorId,
              },
              startDate: firebaseBooking.startDate,
              startTime: firebaseBooking.startTime,
              endDate: firebaseBooking.endDate,
              endTime: firebaseBooking.stopTime,
              escort: firebaseBooking.escort, 
              escortCount: Array.isArray(firebaseBooking.escort)
                ? firebaseBooking.escort.reduce((sum: number, e: any) => sum + e.count, 0)
                : firebaseBooking.escort?.count || 0,
              paymentMethod: firebaseBooking.paymentMethod || 'Escardia wallet',
              totalCost: (firebaseBooking.totalPrice || 0).toString(),
              driver: {
                name: 'Uche Igwe',
                phone: '08000000000',
                photo: require('./assets/images/driver-placeholder.png'),
              },
              vendor: {
                name: 'Uche Igwe',
                phone: '08000000000',
                photo: require('./assets/images/vendor-placeholder.png'),
              },
            };

            setSelectedTrip(transformedData);
            setCurrentScreen('tripDetail');
          }}
        />
      )}

      {currentScreen === 'favorites' && (
        <FavoriteCarsScreen
          onNavigateBack={() => setCurrentScreen('profile')}
          onNavigateToCarDetails={handleNavigateToCarDetails}
        />
      )}
      {currentScreen === 'support' && (
        <SupportScreen
          onNavigateBack={() => setCurrentScreen('profile')}
          onNavigateToFAQ={() => setCurrentScreen('faq')}
          onNavigateToPolicies={() => setCurrentScreen('policies')}
          onNavigateToContactUs={() => setCurrentScreen('contactUs')}
        />
      )}

      {currentScreen === 'chatWithUs' && <ChatWithUsScreen onNavigateBack={() => setCurrentScreen('contactUs')} />}

      {currentScreen === 'faq' && <FAQScreen onNavigateBack={() => setCurrentScreen('support')} />}

      {currentScreen === 'policies' && <PoliciesScreen onNavigateBack={() => setCurrentScreen('support')} />}
      {currentScreen === 'securityLoginSafety' && (
        <SecurityLoginSafetyScreen
          onNavigateBack={() => setCurrentScreen('profile')}
          onNavigateToChangePassword={() => setCurrentScreen('changePassword')}
          onNavigateToSafetyTips={() => setCurrentScreen('safetyTips')}
        />
      )}

      {currentScreen === 'safetyTips' && (
        <SafetyTipsScreen onNavigateBack={() => setCurrentScreen('securityLoginSafety')} />
      )}

      {currentScreen === 'changePassword' && (
        <ChangePasswordScreen
          onNavigateBack={() => setCurrentScreen('securityLoginSafety')}
          onPasswordChanged={() => setCurrentScreen('securityLoginSafety')}
        />
      )}
      {currentScreen === 'contactUs' && (
        <ContactUsScreen
          onNavigateBack={() => setCurrentScreen('support')}
          onNavigateToChatWithUs={() => setCurrentScreen('chatWithUs')}
        />
      )}
      {currentScreen === 'wallet' && (
  <WalletScreen
    onNavigateBack={() => setCurrentScreen('profile')}
    onNavigateToTransactions={() => setCurrentScreen('transactions')}
    onNavigateToAddMoney={() => setCurrentScreen('addMoney')}
  />
)}

      {currentScreen === 'transactions' && <TransactionsScreen onNavigateBack={() => setCurrentScreen('wallet')} />}
      {currentScreen === 'tripDetail' && selectedTrip && (
        <TripDetailScreen
          tripData={selectedTrip}
          onNavigateBack={() => setCurrentScreen('trips')}
        />
      )}
    {currentScreen === 'tripBooking' && selectedCar && (
  <TripBookingScreen
    carData={selectedCar}
    onNavigateBack={() => setCurrentScreen('carDetails')}
    onContinue={handleContinueToRideMode}
    savedFormData={bookingFormData}
    onFormDataChange={(data: any) => setBookingFormData((prev: any) => ({ ...prev, ...data }))}
  />
)}
      {currentScreen === 'editTrip' && selectedTrip && (
        <EditTripScreen
          tripData={selectedTrip}
          onNavigateBack={() => setCurrentScreen('tripDetail')}
          onSaveChanges={async (updatedData) => {
            const { updateBooking } = await import('./src/services/bookingService');
            const result = await updateBooking(updatedData.id, updatedData);

            if (result.success) {
              alert('Trip updated successfully');
              setCurrentScreen('tripDetail');
            } else {
              alert('Failed to update trip: ' + result.error);
            }
          }}
        />
      )}
{currentScreen === 'cardPayment' && (
  <CardPaymentScreen
    onNavigateBack={() => setCurrentScreen('payment')}
    onPaymentComplete={(method: string) => {
      setBookingFormData({
        pickupMethod: 'vendor',
        rateType: 'day',
        deliveryAddress: '',
        startDate: null,
        endDate: null,
        startTime: null,
        stopTime: null,
        escortCounts: { legion: 0, private: 0 },
        manualHiluxCount: 0,
      });
      setCurrentScreen('confirmation');
    }}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
 {currentScreen === 'bankTransfer' && (
  <BankTransferScreen
    onNavigateBack={() => setCurrentScreen('payment')}
    onPaymentComplete={(method: string) => {
      setBookingFormData({
        pickupMethod: 'vendor',
        rateType: 'day',
        deliveryAddress: '',
        startDate: null,
        endDate: null,
        startTime: null,
        stopTime: null,
        escortCounts: { legion: 0, private: 0 },
        manualHiluxCount: 0,
      });
      setCurrentScreen('confirmation');
    }}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
      {currentScreen === 'vendorOnboarding' && (
        <VendorOnboardingScreen
          onComplete={() => setCurrentScreen('vendorAccountCreation')}
          onNavigateToVendorSignIn={() => setCurrentScreen('vendorSignIn')}
          onNavigateBack={() => {
            if (user) {
              setCurrentScreen('profile');
            } else {
              setCurrentScreen('onboarding');
            }
          }}
        />
      )}
      {currentScreen === 'vendorAccountCreation' && (
        <VendorAccountCreationScreen
          onContinue={handleVendorAccountCreation}
          onNavigateBack={() => setCurrentScreen('vendorOnboarding')}
          onNavigateToVendorSignIn={() => setCurrentScreen('vendorSignIn')}
        />
      )}
      {currentScreen === 'vendorPhoneVerification' && vendorData && (
        // Vendors confirm their email with a 6-digit code before uploading documents.
        <VerifyCodeScreen
          email={vendorData.email}
          onVerifySuccess={() => setCurrentScreen('vendorBusinessRegistration')}
        />
      )}
      {currentScreen === 'vendorBusinessRegistration' && (
        <VendorBusinessRegistrationScreen
          onNavigateBack={() => setCurrentScreen('vendorPhoneVerification')}
          onContinue={(businessData) => {
            setVendorData((prev: any) => ({ ...prev, ...businessData }));
            setCurrentScreen('vendorIDVerification');
          }}
        />
      )}
      {currentScreen === 'vendorIDVerification' && (
        <VendorIDVerificationScreen
          onNavigateBack={() => setCurrentScreen('vendorBusinessRegistration')}
          onComplete={async (idData) => {
            const completeVendorData = { ...vendorData, ...idData };
            setVendorData(completeVendorData);

            console.log('🔵 Starting vendor registration...');

            const { registerVendor } = await import('./src/services/vendorauthservice');

            const result = await registerVendor(completeVendorData);

            if (result.success) {
              console.log('✅ Vendor registered! ID:', result.vendorId);

              const { getVendorProfile } = await import('./src/services/vendorauthservice');
              const profileResult = await getVendorProfile(result.vendorId!);

              if (profileResult.success && profileResult.data) {
                setVendorProfile(profileResult.data);
              }

              alert('Registration successful! Welcome to Escardia Vendor!');
              setCurrentScreen('vendorDashboard');
            } else {
              console.error('❌ Registration failed:', result.error);
              alert('Registration failed: ' + result.error);
            }
          }}
        />
      )}
{currentScreen === 'vendorSignIn' && (
  <VendorSignInScreen
    onSignInSuccess={async () => {
      const { getVendorProfile } = await import('./src/services/vendorauthservice');
      const { savePushToken } = await import('./src/services/notificationService');  // ← ADD THIS
      const user = auth.currentUser;

      if (user) {
        // Save push token ← ADD THIS
        try {
          await savePushToken(user.uid, 'vendor');
        } catch (error) {
          console.log('Push token error:', error);
        }

        console.log('🔵 Loading vendor profile...');
        const result = await getVendorProfile(user.uid);

        if (result.success && result.data) {
          setVendorProfile(result.data);
          console.log('✅ Vendor profile loaded:', result.data);
        }
      }

      setCurrentScreen('vendorDashboard');
    }}
    onNavigateToSignUp={() => setCurrentScreen('vendorAccountCreation')}
    onForgotPassword={() => {
      alert('Password reset coming soon!');
    }}
    onNavigateBack={() => setCurrentScreen('vendorAccountCreation')}
  />
)}
      {currentScreen === 'vendorDashboard' && (
        <VendorDashboardScreen
          vendorName={vendorProfile?.businessName || vendorProfile?.firstName || 'Vendor'}
          onNavigateToFleet={() => setCurrentScreen('myFleet')}
          onNavigateToBookings={() => setCurrentScreen('vendorBookings')}
          onNavigateToBookingDetails={(bookingId) => {
            setSelectedBookingId(bookingId);
            setCurrentScreen('vendorBookingDetail');
          }}
          onNavigateToEarnings={() => setCurrentScreen('vendorEarnings')}
          onNavigateToDrivers={() => setCurrentScreen('manageDrivers')}
          onNavigateToProfile={() => setCurrentScreen('vendorProfile')}
          onNavigateToNotifications={() => setCurrentScreen('notifications')}
          onNavigateToWithdrawFunds={() => setCurrentScreen('withdrawFunds')}
          onAddCar={() => setCurrentScreen('addCar')}
          hasUnreadNotifications={false}
        />
      )}
      {currentScreen === 'addCar' && (
        <AddCarScreen
          onNavigateBack={() => setCurrentScreen('vendorDashboard')}
          onCarAdded={() => {
            setCurrentScreen('vendorDashboard');
          }}
        />
      )}
      {currentScreen === 'myFleet' && (
        <MyFleetScreen
          onNavigateBack={handleNavigateBackToHome}
          onNavigateToDashboard={() => setCurrentScreen('vendorDashboard')}
          onNavigateToBookings={() => setCurrentScreen('vendorBookings')}
          onNavigateToEarnings={() => setCurrentScreen('vendorEarnings')}
          onNavigateToProfile={() => setCurrentScreen('vendorProfile')}
          onAddCar={() => setCurrentScreen('addCar')}
          onViewCarDetails={handleNavigateToVendorCarDetail}
        />
      )}
      {currentScreen === 'vendorBookings' && (
        <VendorBookingsScreen
          onNavigateToDashboard={() => setCurrentScreen('vendorDashboard')}
          onNavigateToFleet={() => setCurrentScreen('myFleet')}
          onNavigateToProfile={() => setCurrentScreen('vendorProfile')}
          onViewBookingDetails={handleNavigateToVendorBookingDetail}
        />
      )}
  {currentScreen === 'vendorProfile' && (
  <VendorProfileScreen
    vendorName={vendorProfile?.firstName + ' ' + vendorProfile?.lastName || 'Vendor'}
    vendorEmail={vendorProfile?.email || ''}
    businessName={vendorProfile?.businessName || 'Business'}
    onNavigateToDashboard={() => setCurrentScreen('vendorDashboard')}
    onNavigateToFleet={() => setCurrentScreen('myFleet')}
    onNavigateToBookings={() => setCurrentScreen('vendorBookings')}
    onNavigateToEarnings={() => setCurrentScreen('vendorEarnings')}
    onNavigateToSettings={() => setCurrentScreen('vendorSettings')}
    onNavigateToSupport={() => setCurrentScreen('vendorHelpAndSupport')}
    onNavigateToNotificationPreferences={() => setCurrentScreen('vendorNotificationPreferences')}
    onNavigateToDocuments={() => setCurrentScreen('vendorDocuments')}
    onNavigateToBankDetails={() => setCurrentScreen('vendorBankDetails')}
    onNavigateToAnalytics={() => setCurrentScreen('vendorAnalytics')}
    onNavigateToTermsAndPrivacy={() => setCurrentScreen('vendorTermsAndPrivacy')}
    onLogout={async () => {
      const { signOutVendor } = await import('./src/services/vendorauthservice');
      await signOutVendor();
      setVendorProfile(null);
      alert('Logged out successfully!');
      setCurrentScreen('welcome');
    }}
  />
)}
      {currentScreen === 'vendorBookingDetail' && selectedBookingId && (
        <VendorBookingDetailScreen onNavigateBack={handleNavigateBackToVendorBookings} bookingId={selectedBookingId} />
      )}
      {currentScreen === 'vendorCarDetail' && selectedCarId && (
        <VendorCarDetailScreen
          onNavigateBack={handleNavigateBackToFleet}
          carId={selectedCarId}
          onEditCar={handleEditCar}
          onDeleteCar={handleDeleteCar}
        />
      )}
      {currentScreen === 'vendorEarnings' && (
        <VendorEarningsScreen
          onNavigateToDashboard={() => setCurrentScreen('vendorDashboard')}
          onNavigateToFleet={() => setCurrentScreen('myFleet')}
          onNavigateToBookings={() => setCurrentScreen('vendorBookings')}
          onNavigateToProfile={() => setCurrentScreen('vendorProfile')}
        />
      )}
      {currentScreen === 'manageDrivers' && (
        <ManageDriversScreen
          onNavigateBack={() => setCurrentScreen('vendorDashboard')}
          onNavigateToDashboard={() => setCurrentScreen('vendorDashboard')}
          onNavigateToFleet={() => setCurrentScreen('myFleet')}
          onNavigateToBookings={() => setCurrentScreen('vendorBookings')}
          onNavigateToProfile={() => setCurrentScreen('vendorProfile')}
        />
      )}
      {currentScreen === 'notifications' && (
        <NotificationsScreen onNavigateBack={() => setCurrentScreen('vendorDashboard')} />
      )}
      {currentScreen === 'withdrawFunds' && (
        <WithdrawFundsScreen onNavigateBack={() => setCurrentScreen('vendorDashboard')} />
      )}
      {currentScreen === 'editCar' && selectedCarId && (
        <EditCarScreen
          carId={selectedCarId}
          onNavigateBack={() => {
            setCurrentScreen('vendorCarDetail');
          }}
          onSaveSuccess={() => {
            setCurrentScreen('vendorCarDetail');
          }}
        />
      )}
      {currentScreen === 'vendorSettings' && (
        <VendorSettingsScreen
          onNavigateBack={() => setCurrentScreen('vendorProfile')}
          vendorProfile={vendorProfile}
        />
      )}
      {currentScreen === 'vendorBankDetails' && (
        <VendorBankDetailsScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'vendorDocuments' && (
        <VendorDocumentsScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'vendorAnalytics' && (
        <VendorAnalyticsScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'vendorNotificationPreferences' && (
        <VendorNotificationPreferencesScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'vendorTermsAndPrivacy' && (
        <VendorTermsAndPrivacyScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'vendorHelpAndSupport' && (
        <VendorHelpAndSupportScreen onNavigateBack={() => setCurrentScreen('vendorProfile')} />
      )}
      {currentScreen === 'addMoney' && (
  <AddMoneyScreen
    onNavigateBack={() => setCurrentScreen('wallet')}
    onSuccess={() => setCurrentScreen('wallet')}
  />
)}
{currentScreen === 'walletPayment' && (
  <WalletPaymentScreen
    onNavigateBack={() => setCurrentScreen('payment')}
    onPaymentComplete={(method: string) => {
      setBookingFormData({
        pickupMethod: 'vendor',
        rateType: 'day',
        deliveryAddress: '',
        startDate: null,
        endDate: null,
        startTime: null,
        stopTime: null,
        escortCounts: { legion: 0, private: 0 },
        manualHiluxCount: 0,
      });
      setCurrentScreen('confirmation');
    }}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
    </>
  );
}

