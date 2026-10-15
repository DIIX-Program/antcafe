import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, TOUCH_TARGET } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System Button
 * Mobile-first button component with accessible touch target (>= 44px),
 * loading spinner, icon support, and WCAG AA contrast.
 */
export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'orange'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return {
          btn: styles.btnOrange,
          text: styles.btnOrangeText,
          spinnerColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          btn: styles.btnSecondary,
          text: styles.btnSecondaryText,
          spinnerColor: COLORS.primaryDark,
          iconColor: COLORS.primaryDark,
        };
      case 'outline':
        return {
          btn: styles.btnOutline,
          text: styles.btnOutlineText,
          spinnerColor: COLORS.primary,
          iconColor: COLORS.primary,
        };
      case 'ghost':
        return {
          btn: styles.btnGhost,
          text: styles.btnGhostText,
          spinnerColor: COLORS.textPrimary,
          iconColor: COLORS.textPrimary,
        };
      case 'danger':
        return {
          btn: styles.btnDanger,
          text: styles.btnDangerText,
          spinnerColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          btn: styles.btnPrimary,
          text: styles.btnPrimaryText,
          spinnerColor: '#FFFFFF',
          iconColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          btn: styles.sizeSm,
          text: styles.textSm,
          iconSize: 16,
        };
      case 'lg':
        return {
          btn: styles.sizeLg,
          text: styles.textLg,
          iconSize: 22,
        };
      case 'md':
      default:
        return {
          btn: styles.sizeMd,
          text: styles.textMd,
          iconSize: 18,
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        vStyles.btn,
        sStyles.btn,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyles.spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sStyles.iconSize}
              color={vStyles.iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sStyles.iconSize}
              color={vStyles.iconColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET.minHeight,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },

  // Sizes
  sizeSm: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  textSm: {
    fontSize: 12,
  },
  sizeMd: {
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
  },
  textMd: {
    fontSize: 14,
  },
  sizeLg: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
  },
  textLg: {
    fontSize: 16,
  },

  // Variants
  btnPrimary: {
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.sm,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
  },
  btnOrange: {
    backgroundColor: COLORS.accentOrange,
    ...SHADOWS.sm,
  },
  btnOrangeText: {
    color: '#FFFFFF',
  },
  btnSecondary: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  btnSecondaryText: {
    color: COLORS.primaryDark,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  btnOutlineText: {
    color: COLORS.textPrimary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: COLORS.textPrimary,
  },
  btnDanger: {
    backgroundColor: COLORS.accentRed,
    ...SHADOWS.sm,
  },
  btnDangerText: {
    color: '#FFFFFF',
  },
});
