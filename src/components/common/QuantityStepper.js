import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System QuantityStepper
 */
export default function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  size = 'md', // 'sm' | 'md'
  disabled = false,
  style,
}) {
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, isSm && styles.containerSm, style]}>
      <TouchableOpacity
        onPress={onDecrement}
        disabled={disabled || value <= min}
        activeOpacity={0.7}
        style={[
          styles.btn,
          isSm && styles.btnSm,
          (disabled || value <= min) && styles.btnDisabled,
        ]}
      >
        <Ionicons
          name="remove"
          size={isSm ? 14 : 18}
          color={value <= min ? COLORS.textMuted : COLORS.textPrimary}
        />
      </TouchableOpacity>

      <Text style={[styles.text, isSm && styles.textSm]}>{value}</Text>

      <TouchableOpacity
        onPress={onIncrement}
        disabled={disabled || value >= max}
        activeOpacity={0.7}
        style={[
          styles.btn,
          isSm && styles.btnSm,
          (disabled || value >= max) && styles.btnDisabled,
        ]}
      >
        <Ionicons
          name="add"
          size={isSm ? 14 : 18}
          color={value >= max ? COLORS.textMuted : COLORS.accentOrange}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  containerSm: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
    minWidth: 18,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  textSm: {
    fontSize: 12,
    marginHorizontal: 4,
    minWidth: 14,
  },
});
