// ============================================
// ESCARDIA - PAYSTACK WEBVIEW COMPONENT
// File: src/components/PaystackWebView.tsx
// ============================================
//
// This component handles the Paystack payment flow using WebView
// It's the recommended approach for React Native / Expo
//
// Install: npx expo install react-native-webview
//
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../ui';
import { color, font, space, themed } from '../theme';
import { PAYSTACK_CONFIG } from '../services/paystackService';

interface PaystackWebViewProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
}

export const PaystackWebView: React.FC<PaystackWebViewProps> = ({
  visible,
  authorizationUrl,
  reference,
  onSuccess,
  onCancel,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Handle navigation state change to detect success/failure
  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Check if redirected to callback URL (payment completed)
    if (url.includes('callback') || url.includes('paystack.co/close')) {
      // Check for success indicators in URL
      if (url.includes('trxref=') || url.includes('reference=')) {
        onSuccess(reference);
      } else {
        onCancel();
      }
    }

    // Check for cancel
    if (url.includes('cancel') || url.includes('close')) {
      onCancel();
    }
  };

  // Handle messages from Paystack
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.event === 'successful' || data.event === 'success') {
        onSuccess(reference);
      } else if (data.event === 'cancelled' || data.event === 'close') {
        onCancel();
      }
    } catch (e) {
      // Not a JSON message, ignore
    }
  };

  // Inject JavaScript to listen for Paystack events
  const injectedJavaScript = `
    (function() {
      // Listen for Paystack close event
      window.addEventListener('message', function(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      });
      
      // Override close function
      if (window.PaystackPop) {
        var originalClose = window.PaystackPop.close;
        window.PaystackPop.close = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'close' }));
          if (originalClose) originalClose();
        };
      }
    })();
    true;
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Feather name="x" size={18} color={color.ink} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <AppText variant="subheading">Secure payment</AppText>
            <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
              Powered by Paystack
            </AppText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={color.primary} />
            <AppText variant="body" color={color.muted} style={{ marginTop: 12 }}>
              Loading the payment page…
            </AppText>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: authorizationUrl }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            if (onError) {
              onError(nativeEvent.description || 'Payment page failed to load');
            }
          }}
        />

        {/* Security Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="lock" size={12} color={color.success} />
            <AppText variant="small" color={color.muted}>
              Your details go straight to Paystack, never to Escardia
            </AppText>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = themed(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    backgroundColor: color.surface,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.sunken,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: color.ink,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: font.semibold,
    color: color.ink,
  },
  headerSpacer: {
    width: 36,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: space.md,
    fontSize: 15,
    color: color.muted,
  },
  footer: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderTopWidth: 1,
    borderTopColor: color.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: color.muted,
  },
}));

export default PaystackWebView;