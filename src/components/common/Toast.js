import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../theme/theme';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const getStyle = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle',
          color: COLORS.accentRed,
          bg: COLORS.primaryDark,
        };
      case 'warning':
        return {
          icon: 'warning',
          color: COLORS.accentOrange,
          bg: COLORS.primaryDark,
        };
      case 'success':
      default:
        return {
          icon: 'checkmark-circle',
          color: COLORS.accentGreen,
          bg: COLORS.primaryDark,
        };
    }
  };

  const style = getStyle();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon} size={20} color={style.color} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    ...SHADOWS.lg,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});
