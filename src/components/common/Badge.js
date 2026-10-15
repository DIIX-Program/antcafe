import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System StatusBadge
 * Visual status badge for order workflows and store operations:
 * - PENDING: Amber
 * - CONFIRMED: Royal Purple
 * - READY: Citrus Orange
 * - COMPLETED: Emerald Green
 * - CANCELLED: Coral Red
 */
export function StatusBadge({ status, style, showIcon = true, size = 'md' }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Chờ nhận',
          icon: 'time-outline',
          bg: COLORS.statusPendingBg,
          text: COLORS.statusPendingText,
          border: '#FDE68A',
        };
      case 'CONFIRMED':
        return {
          label: 'Đang pha chế',
          icon: 'cafe-outline',
          bg: COLORS.statusConfirmedBg,
          text: COLORS.statusConfirmedText,
          border: '#D8B4FE',
        };
      case 'READY':
        return {
          label: 'Sẵn sàng lấy',
          icon: 'bicycle-outline',
          bg: COLORS.statusReadyBg,
          text: COLORS.statusReadyText,
          border: '#FED7AA',
        };
      case 'COMPLETED':
        return {
          label: 'Hoàn tất',
          icon: 'checkmark-circle-outline',
          bg: COLORS.statusCompletedBg,
          text: COLORS.statusCompletedText,
          border: '#A7F3D0',
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy',
          icon: 'close-circle-outline',
          bg: COLORS.statusCancelledBg,
          text: COLORS.statusCancelledText,
          border: '#FECACA',
        };
      default:
        return {
          label: status || 'Khác',
          icon: 'information-circle-outline',
          bg: COLORS.surfaceSoft,
          text: COLORS.textSecondary,
          border: COLORS.border,
        };
    }
  };

  const config = getStatusConfig();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 7 : 10,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={isSm ? 11 : 13}
          color={config.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSm ? 10 : 12,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

export default function Badge({
  text,
  variant = 'default', // 'default' | 'orange' | 'purple' | 'green' | 'red'
  style,
  textStyle,
}) {
  const getColors = () => {
    switch (variant) {
      case 'orange':
        return { bg: '#FFEDD5', text: COLORS.accentOrange };
      case 'purple':
        return { bg: '#F3E8FF', text: COLORS.primary };
      case 'green':
        return { bg: '#DCFCE7', text: COLORS.accentGreen };
      case 'red':
        return { bg: '#FEE2E2', text: COLORS.accentRed };
      default:
        return { bg: COLORS.surfaceSoft, text: COLORS.textPrimary };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: 'transparent' }, style]}>
      <Text style={[styles.text, { color: c.text }, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
