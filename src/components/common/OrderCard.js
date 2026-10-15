import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { StatusBadge } from './Badge';

/**
 * Ant Coffee & Tea Boarding-Pass-Inspired OrderCard
 * Features:
 * - Top header with orderCode and sequence number (e.g. #A001)
 * - Perforated dashed divider with side cutout notches
 * - Items summary with customized options
 * - Real-time StatusBadge
 * - Authoritative total price with tabular numerals
 */
export default function OrderCard({
  order,
  onPress,
  onActionPress,
  actionText,
  actionVariant = 'primary',
  style,
}) {
  if (!order) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[styles.ticketContainer, style]}
    >
      {/* Ticket Top: Brand & Order Sequence */}
      <View style={styles.topSegment}>
        <View style={styles.headerLeft}>
          <View style={styles.codeRow}>
            <Text style={styles.orderCode}>
              {order.orderCode?.startsWith('#') ? order.orderCode : `${order.orderCode}`}
            </Text>
            {order.sequence_number ? (
              <View style={styles.seqBadge}>
                <Text style={styles.seqText}>{order.sequence_number}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.timestamp}>{order.created_at}</Text>
        </View>

        <StatusBadge status={order.status} size="sm" />
      </View>

      {/* Perforated Divider with Left & Right Cutout Notches */}
      <View style={styles.perforationWrap}>
        <View style={styles.notchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.notchRight} />
      </View>

      {/* Ticket Bottom: Items summary & Total */}
      <View style={styles.bottomSegment}>
        <View style={styles.itemsList}>
          {order.items?.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{it.quantity}x</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.name}
                </Text>
                {it.options ? (
                  <Text style={styles.itemOptions} numberOfLines={1}>
                    {it.options}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>
                {(it.totalPrice || it.price * it.quantity).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalAmount}>
              {(order.total_amount || 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>

          {actionText && (
            <TouchableOpacity
              onPress={onActionPress || onPress}
              style={[
                styles.actionBtn,
                actionVariant === 'orange' ? styles.actionOrange : styles.actionPurple,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>{actionText}</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  topSegment: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    gap: 3,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  seqBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  seqText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primaryDark,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Perforation
  perforationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  notchLeft: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.background,
    marginLeft: -7,
  },
  notchRight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.background,
    marginRight: -7,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },

  // Bottom Segment
  bottomSegment: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 6,
    backgroundColor: COLORS.surface,
  },
  itemsList: {
    marginBottom: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    width: 24,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemOptions: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  actionPurple: {
    backgroundColor: COLORS.primaryDark,
  },
  actionOrange: {
    backgroundColor: COLORS.accentOrange,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
