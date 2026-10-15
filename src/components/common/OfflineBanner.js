import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System OfflineBanner
 */
export default function OfflineBanner({
  message = 'Quán tạm ngưng nhận đơn online để xử lý tại quầy.',
  subtext = 'Bạn vẫn có thể xem trước menu và chuẩn bị giỏ hàng.',
  type = 'warning', // 'warning' | 'error' | 'info'
  actionText,
  onAction,
  style,
}) {
  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: COLORS.accentRed,
          icon: 'alert-circle',
        };
      case 'info':
        return {
          bg: COLORS.primaryDark,
          icon: 'information-circle',
        };
      case 'warning':
      default:
        return {
          bg: '#92400E',
          icon: 'pause-circle',
        };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.banner, { backgroundColor: c.bg }, style]}>
      <Ionicons name={c.icon} size={18} color="#FFF" style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{message}</Text>
        {subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
      {actionText && (
        <TouchableOpacity onPress={onAction} style={styles.btn} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  btn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
