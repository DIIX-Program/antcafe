import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme/theme';

export default function AppModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
  position = 'center', // 'center' | 'bottom'
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.backdrop,
            position === 'bottom' ? styles.backdropBottom : styles.backdropCenter,
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={position === 'bottom' ? styles.sheetWrapper : styles.cardWrapper}
            >
              {children}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 20, 0.62)',
  },
  backdropCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropBottom: {
    justifyContent: 'flex-end',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  sheetWrapper: {
    width: '100%',
  },
});
