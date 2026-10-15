import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';

/**
 * Ant Coffee & Tea Design System KPICard
 * Operational and revenue metric card with icon, title, formatted value, and trend/subtext.
 */
export default function KPICard({
  title,
  value,
  subtext,
  icon,
  iconBg = COLORS.primaryLight,
  iconColor = COLORS.primary,
  trend, // 'up' | 'down' | null
  trendValue,
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      {(subtext || trendValue) && (
        <View style={styles.bottomRow}>
          {trend && (
            <View
              style={[
                styles.trendBadge,
                trend === 'up' ? styles.trendUp : styles.trendDown,
              ]}
            >
              <Ionicons
                name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
                size={11}
                color={trend === 'up' ? COLORS.greenDark : COLORS.redDark}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: trend === 'up' ? COLORS.greenDark : COLORS.redDark },
                ]}
              >
                {trendValue}
              </Text>
            </View>
          )}
          {subtext && <Text style={styles.subtext}>{subtext}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  trendUp: {
    backgroundColor: COLORS.greenLight,
  },
  trendDown: {
    backgroundColor: COLORS.redLight,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
