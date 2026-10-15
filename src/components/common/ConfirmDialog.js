import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, TOUCH_TARGET } from '../../theme/theme';
import AppModal from './AppModal';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmType = 'danger', // 'danger' | 'primary' | 'warning'
  icon = 'alert-circle',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  const getTheme = () => {
    switch (confirmType) {
      case 'danger':
        return {
          bg: COLORS.redLight,
          color: COLORS.accentRed,
          btnBg: COLORS.accentRed,
        };
      case 'warning':
        return {
          bg: COLORS.amberLight,
          color: COLORS.amberDark,
          btnBg: COLORS.accentAmber,
        };
      case 'primary':
      default:
        return {
          bg: COLORS.primaryLight,
          color: COLORS.primary,
          btnBg: COLORS.primary,
        };
    }
  };

  const theme = getTheme();

  return (
    <AppModal visible={visible} onClose={onCancel} position="center">
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: theme.bg }]}>
          <Ionicons name={icon} size={28} color={theme.color} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>{cancelText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: theme.btnBg }]}
            onPress={onConfirm}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            <Text style={styles.confirmBtnText}>
              {isLoading ? 'Đang xử lý...' : confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1.3,
    minHeight: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
