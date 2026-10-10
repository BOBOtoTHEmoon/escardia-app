import React, { useRef } from 'react';
import { BackHandler } from 'react-native';
import { BackSwipe } from './src/ui/BackSwipe';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setActiveScheme, color } from './src/theme';
import { ThemeModeContext, ThemeMode, THEME_MODE_KEY } from './src/ui/Appearance';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ForgotPasswordScreen } from './src/screens/forgotpasswordscreen';
import { OnboardingScreen } from './src/screens/onboardingscreen';
import { SignUpScreen } from './src/screens/signupscreen';
import { SignInScreen } from './src/screens/signinscreen';
import { VerifyCodeScreen } from './src/screens/verifycodescreen';
import { HomeScreen } from './src/screens/homescreen';
import { ProfileScreen } from './src/screens/profilescreen';
import { CarDetailsScreen } from './src/screens/cardetailsscreen';
import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, supabase } from './src/config/supabase';
import { getUserProfile } from './src/services/authservice';
import { TripDetailScreen } from './src/screens/tripdetailsscreen';
import { RideModeScreen } from './src/screens/ridemodescreen';
import PaymentDetailsScreen from './src/screens/paymentdetailsscreen';
import { BookingConfirmationScreen } from './src/screens/bookingconfirmationscreen';
import { CarsScreen } from './src/screens/carsscreen';
import { TripsScreen } from './src/screens/tripsscreen';
import { FavoriteCarsScreen } from './src/screens/favouritecarsscreen';
import { createBooking } from './src/services/bookingService';
import { WelcomeScreen } from './src/screens/welcomescreen';
import { SupportScreen } from './src/screens/supportscreen';
import { ContactUsScreen } from './src/screens/contactusscreen';
import { FAQScreen } from './src/screens/faqscreen';
import { PoliciesScreen } from './src/screens/policiesscreen';
import { SecurityLoginSafetyScreen } from './src/screens/securityloginsafetyscreen';
import { SafetyTipsScreen } from './src/screens/safetytipsscreen';
import { ChangePasswordScreen } from './src/screens/changepasswordscreen';
import { WalletScreen } from './src/screens/walletscreen';
import { TransactionsScreen } from './src/screens/transactionsscreen';
import { TripBookingScreen } from './src/screens/tripbookingscreen';
import CardPaymentScreen from './src/screens/cardpaymentscreen';
import BankTransferScreen from './src/screens/banktransferscreen';
import { VendorOnboardingScreen } from './src/screens/vendoronboardingscreen';
import { VendorAccountCreationScreen } from './src/screens/vendoraccountcreationscreen';
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
import type { VendorTab } from './src/ui/TabBar';
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
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  // ---- Light / dark mode ----
  // Follows the phone unless the user picked Light or Dark in Appearance (saved on the phone).
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [themeLoaded, setThemeLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setThemeModeState(v);
      })
      .catch(() => {})
      .finally(() => setThemeLoaded(true));
  }, []);
  const setThemeMode = (m: ThemeMode) => {
    setThemeModeState(m);
    AsyncStorage.setItem(THEME_MODE_KEY, m).catch(() => {});
  };
  const scheme = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  setActiveScheme(scheme); // colours for everything drawn below
  type Screen = 'splash' |'welcome' |'onboarding'| 'forgotPassword' | 'vendorOnboarding' | 'vendorAccountCreation' | 'myFleet' |'vendorSignIn'|'vendorPhoneVerification'| 'vendorBusinessRegistration'|'vendorIDVerification'|'vendorBookings'|'vendorBookingDetail'| 'vendorCarDetail'|'vendorDashboard'|'vendorProfile'| 'vendorEarnings'|'addCar'| 'manageDrivers'| 'withdrawFunds'|'editCar' |'signup' | 'notifications' | 'signin' | 'verify' | 'home' | 'profile' | 'carDetails' | 'tripDetails' | 'rideMode'| 'payment' | 'confirmation' | 'cars' | 'trips'| 'search' | 'favorites' | 'support' | 'contactUs' | 'faq' | 'policies'|'securityLoginSafety' | 'safetyTips' | 'changePassword'| 'chatWithUs'| 'wallet' | 'transactions'| 'tripDetail' | 'editTrip' | 'tripBooking' | 'editTrip' |'cardPayment' | 'bankTransfer'| 'vendorSettings' | 'vendorBankDetails' | 'vendorDocuments' | 'vendorAnalytics' | 'vendorNotificationPreferences' | 'vendorTermsAndPrivacy' | 'vendorHelpAndSupport'| 'addMoney' | 'walletPayment';
  const [currentScreen, setScreenState] = useState<Screen>('splash');

  // ---- Back history (swipe from the left edge, Android back) ----
  // Tab screens start a fresh history. Some screens are never returned to (splash, code
  // screens, payment screens) so you can't swipe back into a payment you already made.
  const screenRef = useRef<Screen>('splash');
  const historyRef = useRef<Screen[]>([]);
  const ROOTS: Screen[] = ['welcome', 'home', 'cars', 'trips', 'profile', 'vendorDashboard', 'myFleet', 'vendorBookings', 'vendorEarnings', 'vendorProfile'];
  const NEVER_RETURN: Screen[] = ['splash', 'verify', 'vendorPhoneVerification', 'cardPayment', 'walletPayment', 'bankTransfer'];
  const NO_SWIPE: Screen[] = ['splash', 'confirmation'];

  const setCurrentScreen = (to: Screen) => {
    const prev = screenRef.current;
    if (to === prev) return;
    const h = historyRef.current;
    if (ROOTS.includes(to)) historyRef.current = [];
    else if (h[h.length - 1] === to) h.pop(); // a Back button that goes to the previous screen
    else if (!NEVER_RETURN.includes(prev)) h.push(prev);
    screenRef.current = to;
    setScreenState(to);
  };

  const canSwipeBack = historyRef.current.length > 0 && !NO_SWIPE.includes(currentScreen);
  const goBackInHistory = () => {
    const to = historyRef.current.pop();
    if (!to) return false;
    screenRef.current = to;
    setScreenState(to);
    return true;
  };
  
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
  const [notificationsFrom, setNotificationsFrom] = useState<'home' | 'profile' | 'vendorDashboard' | 'vendorProfile'>('vendorDashboard');
  const [carsFocus, setCarsFocus] = useState<'search' | 'filters' | null>(null);
  const [carDetailsFrom, setCarDetailsFrom] = useState<'home' | 'cars' | 'favorites'>('home');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Remembers where each screen was opened from, so Back returns there.
  const [backTo, setBackTo] = useState<Partial<Record<string, typeof currentScreen>>>({});
  const openFrom = (to: typeof currentScreen) => {
    setBackTo((m) => ({ ...m, [to]: currentScreen }));
    setCurrentScreen(to);
  };
  const goBack = (from: typeof currentScreen, fallback: typeof currentScreen) => setCurrentScreen(backTo[from] ?? fallback);

  const VENDOR_TABS: Record<VendorTab, typeof currentScreen> = {
    dashboard: 'vendorDashboard',
    fleet: 'myFleet',
    bookings: 'vendorBookings',
    earnings: 'vendorEarnings',
    profile: 'vendorProfile',
  };
  const goVendorTab = (tab: VendorTab) => setCurrentScreen(VENDOR_TABS[tab]);

  const openVendorBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    openFrom('vendorBookingDetail');
  };
  const openVendorCar = (carId: string) => {
    setSelectedCarId(carId);
    openFrom('vendorCarDetail');
  };

  const loadVendorProfile = async () => {
    const u = auth.currentUser;
    if (!u) return null;
    const { getVendorProfile } = await import('./src/services/vendorauthservice');
    const r = await getVendorProfile(u.uid);
    if (r.success && r.data) setVendorProfile(r.data);
    return r.success ? r.data ?? null : null;
  };

  /** After a vendor signs in (or reopens the app): finish sign up if needed, else the dashboard. */
  const handleVendorSignedIn = async () => {
    const u = auth.currentUser;
    if (u) {
      import('./src/services/notificationService').then(({ savePushToken }) => savePushToken(u.uid, 'vendor')).catch(() => {});
    }
    const p = await loadVendorProfile();
    if (p && !p.businessName) {
      setVendorData({ firstName: p.firstName, lastName: p.lastName, email: p.email, phoneNumber: p.phoneNumber });
      setCurrentScreen('vendorBusinessRegistration');
      return;
    }
    setCurrentScreen('vendorDashboard');
  };

  /** On launch: go straight in if already signed in, otherwise the welcome screen. */
  const handleSplashDone = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (uid) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
        if (p?.role === 'vendor') return handleVendorSignedIn();
        if (p?.role === 'customer') return handleSignInSuccess();
      }
    } catch {
      // Offline or signed out: fall through to the welcome screen.
    }
    setCurrentScreen('welcome');
  };
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

  // Android back button / back gesture.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const cur = screenRef.current;
      if (NO_SWIPE.includes(cur)) return true;
      if (goBackInHistory()) return true;
      // On a tab, Back goes to the first tab before leaving the app.
      if (['cars', 'trips', 'profile'].includes(cur)) return setCurrentScreen('home'), true;
      if (['myFleet', 'vendorBookings', 'vendorEarnings', 'vendorProfile'].includes(cur)) return setCurrentScreen('vendorDashboard'), true;
      return false;
    });
    return () => sub.remove();
  }, []);

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

  const refreshUserProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const result = await getUserProfile(uid);
    if (result.success) setUserProfile(result.data);
  };

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
    openFrom('forgotPassword');
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
    setSelectedCarId(carId);
    setCarDetailsFrom(currentScreen === 'favorites' ? 'favorites' : currentScreen === 'cars' ? 'cars' : 'home');
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

  const handleNavigateToCars = (focus?: 'search' | 'filters') => {
    setCarsFocus(focus === 'search' || focus === 'filters' ? focus : null);
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

  /** After any successful payment: keep the real trip ID and amount, clear the form, show the receipt. */
  const handleBookingPaid = (method: string, result?: { id: string | null; code: string | null; total: number }) => {
    setSelectedPaymentMethod(method);
    if (result?.total) setPaymentAmount(result.total);
    setBookingData((prev: any) => ({ ...prev, bookingId: result?.id ?? prev?.bookingId, bookingCode: result?.code ?? prev?.bookingCode }));
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

  // No animated splash for now: once fonts are ready, go straight to the right first screen.
  useEffect(() => {
    if (fontsLoaded && themeLoaded && screenRef.current === 'splash') handleSplashDone();
  }, [fontsLoaded, themeLoaded]);

  // Wait for Poppins so screens never flash in the system font.
  if (!fontsLoaded || !themeLoaded) return <View style={{ flex: 1, backgroundColor: '#0D1A3F' }} />;

  return (
    <SafeAreaProvider>
      <ThemeModeContext.Provider value={{ mode: themeMode, setMode: setThemeMode }}>
      {/* Keyed by theme so every screen redraws in the new colours when it changes. */}
      <View key={scheme} style={{ flex: 1, backgroundColor: color.bg }}>
      <BackSwipe enabled={canSwipeBack} onBack={goBackInHistory}>
      <StatusBar style="auto" />
      {/* Plain brand colour for the split second while we check if someone is signed in. */}
      {currentScreen === 'splash' && <View style={{ flex: 1, backgroundColor: '#0D1A3F' }} />}
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
          onNavigateBack={() => setCurrentScreen('onboarding')}
        />
      )}
      {currentScreen === 'forgotPassword' && (
        <ForgotPasswordScreen
          onNavigateBack={() => goBack('forgotPassword', 'signin')}
          onDone={backTo.forgotPassword === 'vendorSignIn' ? handleVendorSignedIn : handleSignInSuccess}
        />
      )}
      {currentScreen === 'verify' && (
        <VerifyCodeScreen email={pendingEmail} onVerifySuccess={handleVerifySuccess} onNavigateBack={() => setCurrentScreen('signup')} />
      )}
      {currentScreen === 'home' && (
        <HomeScreen
          userName={userProfile?.firstName || 'Guest'}
          avatarUrl={userProfile?.avatarUrl}
          onNavigateToProfile={handleNavigateToProfile}
          onNavigateToCarDetails={handleNavigateToCarDetails}
          onNavigateToCars={handleNavigateToCars}
          onNavigateToTrips={handleNavigateToTrips}
          onNavigateToSearch={handleNavigateToSearch}
          onNavigateToNotifications={() => {
            setNotificationsFrom('home');
            setCurrentScreen('notifications');
          }}
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
          onNavigateToNotifications={() => {
            setNotificationsFrom('profile');
            setCurrentScreen('notifications');
          }}
          onProfileChanged={refreshUserProfile}
        />
      )}
      {currentScreen === 'carDetails' && selectedCarId && (
        <CarDetailsScreen
          carId={selectedCarId}
          onNavigateBack={() => setCurrentScreen(carDetailsFrom)}
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
          onViewTrips={() => setCurrentScreen('trips')}
          bookingData={bookingData}
          totalAmount={paymentAmount}
          paymentMethod={selectedPaymentMethod}
        />
      )}
      {currentScreen === 'cars' && (
        <CarsScreen
          initialFocus={carsFocus}
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
          onNavigateToTripDetail={(booking) => {
            setSelectedTrip(booking);
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


      {currentScreen === 'faq' && <FAQScreen onNavigateBack={() => setCurrentScreen('support')} />}

      {currentScreen === 'policies' && <PoliciesScreen onNavigateBack={() => setCurrentScreen('support')} />}
      {currentScreen === 'securityLoginSafety' && (
        <SecurityLoginSafetyScreen
          onNavigateBack={() => setCurrentScreen('profile')}
          onNavigateToChangePassword={() => openFrom('changePassword')}
          onNavigateToSafetyTips={() => setCurrentScreen('safetyTips')}
        />
      )}

      {currentScreen === 'safetyTips' && (
        <SafetyTipsScreen onNavigateBack={() => setCurrentScreen('securityLoginSafety')} />
      )}

      {currentScreen === 'changePassword' && (
        <ChangePasswordScreen
          onNavigateBack={() => goBack('changePassword', 'securityLoginSafety')}
          onPasswordChanged={() => goBack('changePassword', 'securityLoginSafety')}
        />
      )}
      {currentScreen === 'contactUs' && (
        <ContactUsScreen
          onNavigateBack={() => setCurrentScreen('support')}
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
{currentScreen === 'cardPayment' && (
  <CardPaymentScreen
    onNavigateBack={() => setCurrentScreen('payment')}
    onPaymentComplete={handleBookingPaid}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
 {currentScreen === 'bankTransfer' && (
  <BankTransferScreen
    onNavigateBack={() => setCurrentScreen('payment')}
    onPaymentComplete={handleBookingPaid}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
      {/* ---------------- Vendor sign up and sign in ---------------- */}
      {currentScreen === 'vendorOnboarding' && (
        <VendorOnboardingScreen
          onComplete={() => setCurrentScreen('vendorAccountCreation')}
          onNavigateToVendorSignIn={() => setCurrentScreen('vendorSignIn')}
          onNavigateBack={() => setCurrentScreen(user ? 'profile' : 'onboarding')}
        />
      )}
      {currentScreen === 'vendorAccountCreation' && (
        <VendorAccountCreationScreen
          onAccountCreated={(data, needsVerification) => {
            setVendorData(data);
            // Skip the code screen while email confirmation is switched off in Supabase.
            setCurrentScreen(needsVerification ? 'vendorPhoneVerification' : 'vendorBusinessRegistration');
          }}
          onNavigateBack={() => setCurrentScreen('vendorOnboarding')}
          onNavigateToVendorSignIn={() => setCurrentScreen('vendorSignIn')}
        />
      )}
      {currentScreen === 'vendorPhoneVerification' && vendorData && (
        // Vendors confirm their email with a 6-digit code before their business details.
        <VerifyCodeScreen
          email={vendorData.email}
          onVerifySuccess={() => setCurrentScreen('vendorBusinessRegistration')}
          onNavigateBack={() => setCurrentScreen('vendorAccountCreation')}
        />
      )}
      {currentScreen === 'vendorBusinessRegistration' && (
        <VendorBusinessRegistrationScreen
          initial={vendorData ?? undefined}
          onNavigateBack={() => setCurrentScreen(vendorProfile ? 'vendorSignIn' : 'vendorAccountCreation')}
          onContinue={(businessData) => {
            setVendorData((prev: any) => ({ ...prev, ...businessData }));
            setCurrentScreen('vendorIDVerification');
          }}
        />
      )}
      {currentScreen === 'vendorIDVerification' && vendorData && (
        <VendorIDVerificationScreen
          vendorData={vendorData}
          onNavigateBack={() => setCurrentScreen('vendorBusinessRegistration')}
          onComplete={async () => {
            await loadVendorProfile();
            const u = auth.currentUser;
            if (u) import('./src/services/notificationService').then(({ savePushToken }) => savePushToken(u.uid, 'vendor')).catch(() => {});
            setVendorData(null);
            setCurrentScreen('vendorDashboard');
          }}
        />
      )}
      {currentScreen === 'vendorSignIn' && (
        <VendorSignInScreen
          onSignInSuccess={handleVendorSignedIn}
          onNeedsVerification={(email) => {
            setVendorData({ email });
            setCurrentScreen('vendorPhoneVerification');
          }}
          onNavigateToSignUp={() => setCurrentScreen('vendorOnboarding')}
          onForgotPassword={() => openFrom('forgotPassword')}
          onNavigateBack={() => setCurrentScreen(user ? 'profile' : 'vendorOnboarding')}
        />
      )}

      {/* ---------------- Vendor tabs ---------------- */}
      {currentScreen === 'vendorDashboard' && (
        <VendorDashboardScreen
          vendorName={vendorProfile?.businessName || vendorProfile?.firstName || 'Your business'}
          logoUrl={vendorProfile?.logoUrl}
          onTab={goVendorTab}
          onNavigateToBookingDetails={openVendorBooking}
          onNavigateToCarDetail={openVendorCar}
          onNavigateToDrivers={() => openFrom('manageDrivers')}
          onNavigateToNotifications={() => {
            setNotificationsFrom('vendorDashboard');
            setCurrentScreen('notifications');
          }}
          onNavigateToWithdrawFunds={() => openFrom('withdrawFunds')}
          onNavigateToBankDetails={() => openFrom('vendorBankDetails')}
          onAddCar={() => openFrom('addCar')}
        />
      )}
      {currentScreen === 'myFleet' && <MyFleetScreen onTab={goVendorTab} onAddCar={() => openFrom('addCar')} onViewCarDetails={openVendorCar} />}
      {currentScreen === 'vendorBookings' && <VendorBookingsScreen onTab={goVendorTab} onViewBookingDetails={openVendorBooking} />}
      {currentScreen === 'vendorEarnings' && (
        <VendorEarningsScreen onTab={goVendorTab} onWithdraw={() => openFrom('withdrawFunds')} onOpenBooking={openVendorBooking} />
      )}
      {currentScreen === 'vendorProfile' && (
        <VendorProfileScreen
          onTab={goVendorTab}
          onNavigateToSettings={() => openFrom('vendorSettings')}
          onNavigateToSupport={() => openFrom('vendorHelpAndSupport')}
          onNavigateToNotifications={() => {
            setNotificationsFrom('vendorProfile');
            setCurrentScreen('notifications');
          }}
          onNavigateToNotificationPreferences={() => openFrom('vendorNotificationPreferences')}
          onNavigateToDocuments={() => openFrom('vendorDocuments')}
          onNavigateToBankDetails={() => openFrom('vendorBankDetails')}
          onNavigateToDrivers={() => openFrom('manageDrivers')}
          onNavigateToAnalytics={() => openFrom('vendorAnalytics')}
          onNavigateToTermsAndPrivacy={() => openFrom('vendorTermsAndPrivacy')}
          onProfileChanged={loadVendorProfile}
          onLogout={async () => {
            const { signOutVendor } = await import('./src/services/vendorauthservice');
            await signOutVendor();
            setVendorProfile(null);
            setCurrentScreen('welcome');
          }}
        />
      )}

      {/* ---------------- Vendor details ---------------- */}
      {currentScreen === 'vendorBookingDetail' && selectedBookingId && (
        <VendorBookingDetailScreen
          key={selectedBookingId}
          bookingId={selectedBookingId}
          onNavigateBack={() => goBack('vendorBookingDetail', 'vendorBookings')}
          onManageDrivers={() => openFrom('manageDrivers')}
        />
      )}
      {currentScreen === 'vendorCarDetail' && selectedCarId && (
        <VendorCarDetailScreen
          key={selectedCarId}
          carId={selectedCarId}
          onNavigateBack={() => goBack('vendorCarDetail', 'myFleet')}
          onEditCar={(carId) => {
            setSelectedCarId(carId);
            setCurrentScreen('editCar');
          }}
          onDeleted={() => {
            setSelectedCarId(null);
            setCurrentScreen('myFleet');
          }}
          onOpenBooking={openVendorBooking}
        />
      )}
      {currentScreen === 'addCar' && (
        <AddCarScreen onNavigateBack={() => goBack('addCar', 'myFleet')} onCarAdded={() => setCurrentScreen('myFleet')} />
      )}
      {currentScreen === 'editCar' && selectedCarId && (
        <EditCarScreen carId={selectedCarId} onNavigateBack={() => setCurrentScreen('vendorCarDetail')} onSaveSuccess={() => setCurrentScreen('vendorCarDetail')} />
      )}
      {currentScreen === 'manageDrivers' && <ManageDriversScreen onNavigateBack={() => goBack('manageDrivers', 'vendorProfile')} />}
      {currentScreen === 'withdrawFunds' && (
        <WithdrawFundsScreen onNavigateBack={() => goBack('withdrawFunds', 'vendorEarnings')} onNavigateToBankDetails={() => openFrom('vendorBankDetails')} />
      )}
      {currentScreen === 'vendorBankDetails' && <VendorBankDetailsScreen onNavigateBack={() => goBack('vendorBankDetails', 'vendorProfile')} />}
      {currentScreen === 'vendorSettings' && (
        <VendorSettingsScreen
          onNavigateBack={() => goBack('vendorSettings', 'vendorProfile')}
          onChangePassword={() => openFrom('changePassword')}
          onSaved={loadVendorProfile}
        />
      )}
      {currentScreen === 'vendorDocuments' && <VendorDocumentsScreen onNavigateBack={() => goBack('vendorDocuments', 'vendorProfile')} />}
      {currentScreen === 'vendorAnalytics' && <VendorAnalyticsScreen onNavigateBack={() => goBack('vendorAnalytics', 'vendorProfile')} />}
      {currentScreen === 'vendorNotificationPreferences' && (
        <VendorNotificationPreferencesScreen onNavigateBack={() => goBack('vendorNotificationPreferences', 'vendorProfile')} />
      )}
      {currentScreen === 'vendorTermsAndPrivacy' && <VendorTermsAndPrivacyScreen onNavigateBack={() => goBack('vendorTermsAndPrivacy', 'vendorProfile')} />}
      {currentScreen === 'vendorHelpAndSupport' && <VendorHelpAndSupportScreen onNavigateBack={() => goBack('vendorHelpAndSupport', 'vendorProfile')} />}

      {currentScreen === 'notifications' && (
        <NotificationsScreen
          onNavigateBack={() => setCurrentScreen(notificationsFrom)}
          onOpenBooking={notificationsFrom === 'vendorDashboard' || notificationsFrom === 'vendorProfile' ? openVendorBooking : undefined}
        />
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
    onPaymentComplete={handleBookingPaid}
    totalAmount={paymentAmount}
    bookingData={bookingData}
  />
)}
      </BackSwipe>
      </View>
      </ThemeModeContext.Provider>
    </SafeAreaProvider>
  );
}
