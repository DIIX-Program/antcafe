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
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Đặt đơn', icon: 'time-outline' },
  { key: 'CONFIRMED', label: 'Pha chế', icon: 'cafe-outline' },
  { key: 'READY', label: 'Chờ lấy / Giao', icon: 'bicycle-outline' },
  { key: 'COMPLETED', label: 'Hoàn tất', icon: 'checkmark-circle-outline' },
];

export default function OrderTrackingModal({
  visible,
  orders,
  onClose,
  onCancelOrder,
  onReorder,
}) {
  const [selectedOrderId, setSelectedOrderId] = React.useState(null);

  // Set default selected order to latest
  React.useEffect(() => {
    if (orders && orders.length > 0) {
      if (!selectedOrderId || !orders.find((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(orders[0].id);
      }
    }
  }, [orders, visible]);

  const currentOrder = orders?.find((o) => o.id === selectedOrderId) || orders?.[0];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'READY':
        return 2;
      case 'COMPLETED':
        return 3;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = currentOrder ? getStepIndex(currentOrder.status) : 0;
  const isCancelled = currentOrder?.status === 'CANCELLED';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Đơn hàng của bạn</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {(!orders || orders.length === 0) ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
              <Text style={styles.emptySub}>
                Các đơn hàng bạn đặt sẽ xuất hiện tại đây để theo dõi tiến trình pha chế trực tiếp!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Order Tabs Selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.orderTabsScroll}
              >
                {orders.map((ord) => {
                  const isSelected = ord.id === currentOrder?.id;
                  return (
                    <TouchableOpacity
                      key={ord.id}
                      style={[
                        styles.orderTabItem,
                        isSelected && styles.orderTabItemSelected,
                      ]}
                      onPress={() => setSelectedOrderId(ord.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.orderTabCode,
                          isSelected && styles.orderTabCodeSelected,
                        ]}
                      >
                        {ord.orderCode}
                      </Text>
                      <View
                        style={[
                          styles.orderTabStatusDot,
                          {
                            backgroundColor:
                              ord.status === 'COMPLETED'
                                ? COLORS.accentGreen
                                : ord.status === 'CANCELLED'
                                ? COLORS.accentRed
                                : COLORS.primary,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {currentOrder && (
                <>
                  {/* Order Top Banner */}
                  <View style={styles.statusBanner}>
                    <View style={styles.bannerHeader}>
                      <View>
                        <Text style={styles.bannerCode}>{currentOrder.orderCode}</Text>
                        {currentOrder.sequence_number ? (
                          <Text style={styles.bannerSequence}>
                            Số thứ tự: <Text style={styles.seqHighlight}>{currentOrder.sequence_number}</Text>
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isCancelled
                              ? '#FEE2E2'
                              : currentOrder.status === 'COMPLETED'
                              ? '#DCFCE7'
                              : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: isCancelled
                                ? COLORS.accentRed
                                : currentOrder.status === 'COMPLETED'
                                ? COLORS.accentGreen
                                : '#D97706',
                            },
                          ]}
                        >
                          {isCancelled
                            ? 'Đã hủy'
                            : currentOrder.status === 'PENDING'
                            ? 'Chờ quán duyệt'
                            : currentOrder.status === 'CONFIRMED'
                            ? 'Đang pha chế'
                            : currentOrder.status === 'READY'
                            ? 'Đã sẵn sàng'
                            : 'Đã hoàn tất'}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Stepper */}
                    {!isCancelled ? (
                      <View style={styles.stepperContainer}>
                        <View style={styles.stepTrackBackground} />
                        <View
                          style={[
                            styles.stepTrackProgress,
                            {
                              width: `${(Math.max(0, currentStep) / (ORDER_STEPS.length - 1)) * 100}%`,
                            },
                          ]}
                        />
                        <View style={styles.stepNodesRow}>
                          {ORDER_STEPS.map((step, idx) => {
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                              <View key={step.key} style={styles.stepNodeWrap}>
                                <View
                                  style={[
                                    styles.stepCircle,
                                    isDone && styles.stepCircleDone,
                                    isCurrent && styles.stepCircleCurrent,
                                  ]}
                                >
                                  <Ionicons
                                    name={step.icon}
                                    size={16}
                                    color={isDone ? '#FFF' : COLORS.textMuted}
                                  />
                                </View>
                                <Text
                                  style={[
                                    styles.stepLabel,
                                    isDone && styles.stepLabelDone,
                                    isCurrent && styles.stepLabelCurrent,
                                  ]}
                                >
                                  {step.label}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.cancelledBox}>
                        <Ionicons name="alert-circle-outline" size={20} color={COLORS.accentRed} />
                        <Text style={styles.cancelledText}>
                          Đơn hàng đã bị hủy. Nếu có thắc mắc vui lòng liên hệ hotline quán.
                        </Text>
                      </View>
                    )}

                    {currentOrder.estimated_delivery && !isCancelled && (
                      <View style={styles.estimateRow}>
                        <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.estimateText}>
                          Dự kiến giao: <Text style={styles.estimateValue}>{currentOrder.estimated_delivery}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Driver Card if shipping */}
                  {currentOrder.driver && (
                    <View style={styles.driverCard}>
                      <View style={styles.driverAvatar}>
                        <Ionicons name="person" size={22} color={COLORS.primary} />
                      </View>
                      <View style={styles.driverInfo}>
                        <Text style={styles.driverRole}>Tài xế giao hàng</Text>
                        <Text style={styles.driverName}>{currentOrder.driver.name}</Text>
                        <Text style={styles.driverVehicle}>{currentOrder.driver.vehicle}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.driverCallBtn}
                        onPress={() => alert(`Gọi tài xế: ${currentOrder.driver.phone}`)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Items List */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeader}>Chi tiết thức uống ({currentOrder.items?.length} món)</Text>
                    {currentOrder.items?.map((item, idx) => (
                      <View key={idx} style={styles.orderItemRow}>
                        <View style={styles.orderItemLeft}>
                          <View style={styles.qtyBubble}>
                            <Text style={styles.qtyBubbleText}>{item.quantity}x</Text>
                          </View>
                          <View style={styles.itemTextWrap}>
                            <Text style={styles.orderItemName}>{item.name}</Text>
                            {item.options ? (
                              <Text style={styles.orderItemOptions}>{item.options}</Text>
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.orderItemPrice}>
                          {((item.price || item.totalPrice || 0) * (item.quantity > 1 ? 1 : 1)).toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Địa chỉ giao</Text>
                      <Text style={styles.summaryValue} numberOfLines={2}>
                        {currentOrder.address || 'Tại quán'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Hình thức thanh toán</Text>
                      <Text style={styles.summaryValue}>
                        {currentOrder.payment_method || 'Tiền mặt'} ({currentOrder.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryTotalLabel}>Tổng số tiền</Text>
                      <Text style={styles.summaryTotalValue}>
                        {currentOrder.total_amount?.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionsRow}>
                    {currentOrder.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => onCancelOrder(currentOrder.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.accentRed} />
                        <Text style={styles.cancelBtnText}>Hủy đơn này</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => onReorder(currentOrder)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#FFF" />
                      <Text style={styles.reorderBtnText}>Đặt lại đơn này</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  orderTabsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  orderTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderTabItemSelected: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  orderTabCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderTabCodeSelected: {
    color: '#FFF',
  },
  orderTabStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBanner: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bannerCode: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  bannerSequence: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seqHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperContainer: {
    position: 'relative',
    marginVertical: 12,
    paddingVertical: 6,
  },
  stepTrackBackground: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  stepTrackProgress: {
    position: 'absolute',
    top: 20,
    left: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    zIndex: 2,
  },
  stepNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  stepNodeWrap: {
    alignItems: 'center',
    width: 68,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleCurrent: {
    transform: [{ scale: 1.15 }],
    ...SHADOWS.md,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelDone: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: RADIUS.sm,
    marginVertical: 8,
  },
  cancelledText: {
    fontSize: 12,
    color: COLORS.accentRed,
    flex: 1,
    lineHeight: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceSoft,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },
  estimateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  estimateValue: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.sm,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  driverVehicle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  driverCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  qtyBubble: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  qtyBubbleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemTextWrap: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  orderItemOptions: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    color: COLORS.accentRed,
    fontWeight: '700',
    fontSize: 13,
  },
  reorderBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  reorderBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
