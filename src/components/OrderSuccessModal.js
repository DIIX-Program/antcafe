import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * OrderSuccessModal
 * Order Completion Screen inspired by Mobbin & Dribbble Travel Booking Ticket Cards
 * Features a perforated ticket card with side notches, sequence number, order details,
 * and clear primary tracking & secondary home navigation actions.
 */
export default function OrderSuccessModal({
  visible,
  order,
  onClose,
  onTrackOrder,
}) {
  if (!visible || !order) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardContainer}>
          {/* Top Success Badge */}
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={32} color="#FFF" />
            </View>
          </View>

          <Text style={styles.congratsTitle}>Đặt Hàng Thành Công!</Text>
          <Text style={styles.congratsSub}>
            Quán đã nhận được đơn của bạn và đang chuẩn bị nguyên liệu tươi ngon nhất.
          </Text>

          <ScrollView
            style={styles.ticketScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ticketScrollContent}
          >
            {/* The Ticket Card (Flight Ticket / Boarding Pass Aesthetic) */}
            <View style={styles.ticketCard}>
              {/* Ticket Header Segment */}
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketStoreName}>ANT COFFEE & TEA</Text>
                  <Text style={styles.ticketOrderCode}>Mã đơn: {order.orderCode}</Text>
                </View>
                {order.sequence_number ? (
                  <View style={styles.seqPill}>
                    <Text style={styles.seqLabel}>Số thứ tự</Text>
                    <Text style={styles.seqNumber}>{order.sequence_number}</Text>
                  </View>
                ) : null}
              </View>

              {/* Perforated Divider with Semicircular Notches */}
              <View style={styles.perforatedRow}>
                <View style={styles.leftNotch} />
                <View style={styles.dashedDivider} />
                <View style={styles.rightNotch} />
              </View>

              {/* Ticket Body Segment */}
              <View style={styles.ticketBody}>
                {/* Estimated Delivery Time */}
                <View style={styles.estimateBanner}>
                  <Ionicons name="time" size={18} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.estimateLabel}>Thời gian dự kiến nhận:</Text>
                    <Text style={styles.estimateValue}>
                      {order.estimated_delivery || '15 - 25 phút'}
                    </Text>
                  </View>
                  <View style={styles.freshTag}>
                    <Text style={styles.freshTagText}>Pha chế tươi</Text>
                  </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Giao đến:</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {order.address || 'Giao tận nơi'}
                    </Text>
                    <Text style={styles.recipientMeta}>
                      {order.customer_name} • {order.phone}
                    </Text>
                  </View>
                </View>

                {/* Order Items List */}
                <View style={styles.itemsSection}>
                  <Text style={styles.itemsSectionTitle}>Thực đơn đã chọn</Text>
                  {order.items?.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemQtyCircle}>
                        <Text style={styles.itemQtyText}>{it.quantity}x</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>{it.name}</Text>
                        {it.options ? (
                          <Text style={styles.itemOptionsText}>{it.options}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.itemPriceText}>
                        {(it.price || it.totalPrice || 0).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Payment & Total */}
                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.infoLabel}>Hình thức thanh toán</Text>
                    <View style={styles.paymentMethodPill}>
                      <Ionicons
                        name={order.payment_status === 'PAID' ? 'shield-checkmark' : 'cash'}
                        size={12}
                        color={order.payment_status === 'PAID' ? COLORS.greenDark : COLORS.amberDark}
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          {
                            color:
                              order.payment_status === 'PAID'
                                ? COLORS.greenDark
                                : COLORS.amberDark,
                          },
                        ]}
                      >
                        {order.payment_method || 'Tiền mặt'} (
                        {order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thu'})
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Tổng tiền thanh toán</Text>
                    <Text style={styles.ticketTotalValue}>
                      {order.total_amount?.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.trackOrderBtn}
              onPress={() => {
                onClose();
                onTrackOrder(order);
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate-circle" size={20} color="#FFF" />
              <Text style={styles.trackOrderBtnText}>Theo Dõi Tiến Trình Đơn Hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.backHomeBtnText}>Tiếp tục đặt món / Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  successIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  congratsSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  ticketScroll: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.52,
  },
  ticketScrollContent: {
    paddingBottom: 10,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  ticketStoreName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  ticketOrderCode: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  seqPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  seqLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  seqNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  perforatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 20,
    backgroundColor: COLORS.surface,
  },
  leftNotch: {
    width: 14,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rightNotch: {
    width: 14,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  ticketBody: {
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  estimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primarySurface,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  estimateLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  estimateValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  freshTag: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  freshTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  recipientMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    gap: 8,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemQtyCircle: {
    backgroundColor: COLORS.surfaceSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  itemQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemOptionsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginTop: 3,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
    marginTop: 14,
  },
  trackOrderBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    ...SHADOWS.glowPurple,
  },
  trackOrderBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  backHomeBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
