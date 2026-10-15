import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import AuthFlow from '../screens/auth/AuthFlow';

/**
 * LoginModal
 * Hosts the comprehensive 8-screen Authentication System:
 * - SplashScreen & WelcomeScreen
 * - LoginScreen with validation & role separation
 * - RegisterScreen for Customers
 * - VerifyAccountScreen (OTP with countdown timer)
 * - ForgotPasswordScreen & ResetPasswordScreen
 * - CompleteProfileScreen
 * 
 * Complies with strict security rules: customers cannot self-promote to OWNER.
 */
export default function LoginModal({
  visible,
  onClose,
  onLoginSuccess,
  initialRole = 'CUSTOMER',
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <AuthFlow
          initialScreen="LOGIN"
          onAuthSuccess={({ role, user }) => {
            if (onLoginSuccess) {
              onLoginSuccess({ role, user });
            }
            onClose();
          }}
          onCancel={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
});
