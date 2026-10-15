import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BaseBottomSheet({
  title,
  subtitle,
  icon,
  iconColor = COLORS.primary,
  onClose,
  children,
  maxHeight = SCREEN_HEIGHT * 0.88,
  rightAction,
}) {
  return (
    <View style={[styles.sheetContainer, { maxHeight }]}>
      {/* Drag Pill Handle */}
      <View style={styles.handleWrap}>
        <View style={styles.handleBar} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          {icon && (
            <View style={[styles.iconBox, { backgroundColor: iconColor + '18' }]}>
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText}>{title}</Text>
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.rightGroup}>
          {rightAction}
          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sheet Content */}
      <View style={styles.contentArea}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flexShrink: 1,
  },
});
