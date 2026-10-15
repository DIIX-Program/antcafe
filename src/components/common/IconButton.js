import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, TOUCH_TARGET } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System IconButton
 * Minimum 44x44px touch target compliant with mobile accessibility standards.
 */
export default function IconButton({
  icon,
  size = 20,
  color = COLORS.textPrimary,
  bg = COLORS.surface,
  onPress,
  disabled = false,
  badge = null,
  style,
  elevation = true,
  accessibilityLabel,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
      style={[
        styles.btn,
        { backgroundColor: bg },
        elevation && SHADOWS.sm,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge !== null && badge !== undefined && badge !== 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeInner} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: TOUCH_TARGET.minWidth,
    height: TOUCH_TARGET.minHeight,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  disabled: {
    opacity: 0.45,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentOrange,
  },
});
