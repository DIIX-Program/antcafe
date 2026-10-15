import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../theme/theme';
import { VOUCHERS } from '../data/mockData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Cross-sell suggestions inspired by Talabat
// Sourced from actual bakery catalog items
const CROSS_SELL_ITEMS = [
  {
    id: 110,
    name: 'Croissant Bơ Pháp Nướng Giòn',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
    description: 'Nhiều lớp giòn xốp thơm lừng bơ Pháp cao cấp',
  },
  {
    id: 111,
    name: 'Tiramisu Cà Phê Ant Signature',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&auto=format&fit=crop&q=80',
    description: 'Bánh ladyfingers ngấm espresso cùng mascarpone béo mịn',
  },
  {
    id: 112,
    name: 'Bánh Muffin Vanilla Pháp',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&auto=format&fit=crop&q=80',
    description: 'Bánh muffin nướng vàng xốp mềm hương vani Pháp',
  },
];

export default function CartModal({
  visible,
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onAddToCart,
  onCheckout,
  selectedAddress,
  onOpenAddressModal,
  shippingFee = 15000,
}) {
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOMO'); // MOMO | CASH | BANK
  const [needCutlery, setNeedCutlery] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  let discount = 0;
  if (selectedVoucher) {
    if (subtotal >= selectedVoucher.minOrder) {
      discount = selectedVoucher.discount;
    }
  }

  // Free shipping on orders >= 50.000đ
  const isFreeShipEligible = subtotal >= 50000;
  const effectiveShipping = subtotal > 0 ? (isFreeShipEligible ? 0 : shippingFee) : 0;
  const finalTotal = Math.max(0, subtotal + effectiveShipping - discount);

  const handleApplyVoucherCode = () => {
    setVoucherError('');
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = VOUCHERS.find((v) => v.code === code);
    if (!found) {
      setVoucherError('Mã không hợp lệ hoặc đã hết hạn');
      return;
    }
    if (subtotal < found.minOrder) {
      setVoucherError(
        `Đơn hàng chưa đủ tối thiểu ${found.minOrder.toLocaleString('vi-VN')}đ`
      );
      return;
    }
    setSelectedVoucher(found);
    setVoucherCodeInput('');
  };

  const handleSelectVoucherCard = (v) => {
    setVoucherError('');
    if (selectedVoucher?.code === v.code) {
      setSelectedVoucher(null);
    } else {
      if (subtotal < v.minOrder) {
        setVoucherError(
          `Cần thêm ${(v.minOrder - subtotal).toLocaleString('vi-VN')}đ để dùng mã này`
        );
        return;
      }
      setSelectedVoucher(v);
    }
  };

  const handleQuickAddCrossSell = (item) => {
    if (onAddToCart) {
      onAddToCart({
        product: {
          id: item.id,
          name: item.name,
          base_price: item.price,
          image: item.image,
          category_name: 'Bánh Ngọt',
        },
        selectedSize: { name: 'Tiêu chuẩn', extra_price: 0 },
        selectedIce: null,
        selectedSugar: null,
        selectedToppings: [],
        note: '',
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
      });
    }
  };

  const handleProceedCheckout = () => {
    if (cartItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onCheckout({
        items: cartItems,
        subtotal,
        shippingFee: effectiveShipping,
        discount,
        totalAmount: finalTotal,
        voucher: selectedVoucher,
        address: selectedAddress,
        paymentMethod,
        orderNote: needCutlery ? `${orderNote ? orderNote + ' • ' : ''}Cần muỗng/ống hút` : orderNote,
      });
      setIsSubmitting(false);
    }, 250);
  };

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
            <TouchableOpacity onPress={onClose} style={styles.backCircleBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Giỏ hàng ({cartItems.length})</Text>
              <Text style={styles.headerSubtitle}>Ant Coffee & Tea • 123 Nguyễn Huệ, Q.1</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cafe-outline" size={54} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
              <Text style={styles.emptySub}>
                Hãy khám phá các món cà phê muối, trà trái cây và bánh tươi thơm ngon từ Ant Coffee nhé!
              </Text>
              <TouchableOpacity style={styles.continueShopBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.continueShopText}>Khám phá thực đơn</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Delivery Address Banner */}
                <TouchableOpacity
                  style={styles.addressCard}
                  onPress={onOpenAddressModal}
                  activeOpacity={0.8}
                >
                  <View style={styles.addressIconWrap}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeaderRow}>
                      <Text style={styles.addressLabel}>Giao đến tận nơi</Text>
                      <Text style={styles.addressChangeText}>Thay đổi</Text>
                    </View>
                    <Text style={styles.addressDetail} numberOfLines={1}>
                      {selectedAddress?.address_detail || '123 Nguyễn Huệ, P. Bến Nghé, Q.1'}
                    </Text>
                    <Text style={styles.recipientInfo}>
                      {selectedAddress?.recipient_name || 'Khách hàng'} •{' '}
                      {selectedAddress?.phone || '0901 234 567'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Items List - Talabat Style */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Món đã chọn</Text>
                  {cartItems.map((item, index) => (
                    <View key={`${item.product.id}-${index}`} style={styles.itemRow}>
                      {/* Left: Info, options, edit link, price */}
                      <View style={styles.itemLeftInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.itemOptions}>
                          {item.selectedSize?.name || 'Size S'}
                          {item.selectedIce?.name ? ` • ${item.selectedIce.name}` : ''}
                          {item.selectedSugar?.name ? ` • ${item.selectedSugar.name}` : ''}
                        </Text>
                        {item.selectedToppings?.length > 0 && (
                          <Text style={styles.itemToppings} numberOfLines={1}>
                            + {item.selectedToppings.map((t) => t.name).join(', ')}
                          </Text>
                        )}
                        {item.note ? (
                          <Text style={styles.itemNoteText} numberOfLines={1}>
                            "{item.note}"
                          </Text>
                        ) : null}

                        <Text style={styles.itemPrice}>
                          {item.totalPrice.toLocaleString('vi-VN')}đ
                        </Text>
                      </View>

                      {/* Right: Product Thumbnail + Compact Stepper */}
                      <View style={styles.itemRightCol}>
                        <Image
                          source={{ uri: item.product.image }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                        <View style={styles.stepperPill}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => onUpdateQuantity(index, item.quantity - 1)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons
                              name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                              size={14}
                              color={item.quantity === 1 ? COLORS.accentRed : COLORS.textPrimary}
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => onUpdateQuantity(index, item.quantity + 1)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="add" size={14} color={COLORS.accentOrange} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* "You might also like..." Carousel - Inspired by Talabat (talabat iOS 78.png) */}
                <View style={styles.crossSellSection}>
                  <Text style={styles.crossSellTitle}>Có thể bạn cũng thích...</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.crossSellScroll}
                  >
                    {CROSS_SELL_ITEMS.map((crumb) => (
                      <View key={crumb.id} style={styles.crossSellCard}>
                        <View style={styles.crossSellImageWrap}>
                          <Image
                            source={{ uri: crumb.image }}
                            style={styles.crossSellImage}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.crossSellAddBtn}
                            onPress={() => handleQuickAddCrossSell(crumb)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="add" size={18} color={COLORS.accentOrange} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.crossSellName} numberOfLines={1}>
                          {crumb.name}
                        </Text>
                        <Text style={styles.crossSellPrice}>
                          {crumb.price.toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* "Special request" Cutlery Toggle - Talabat Pattern */}
                <View style={styles.specialRequestCard}>
                  <View style={styles.specialRequestLeft}>
                    <View style={styles.cutleryIconWrap}>
                      <Ionicons name="restaurant-outline" size={20} color={COLORS.textPrimary} />
                    </View>
                    <View style={styles.cutleryTextWrap}>
                      <Text style={styles.cutleryTitle}>Dụng cụ ăn uống (muỗng/ống hút)</Text>
                      <Text style={styles.cutleryDesc}>
                        Gạt bật nếu bạn cần quán kèm muỗng, ống hút dùng một lần
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={needCutlery}
                    onValueChange={setNeedCutlery}
                    trackColor={{ false: '#E2E8F0', true: COLORS.accentOrange }}
                    thumbColor={needCutlery ? '#FFF' : '#FFF'}
                  />
                </View>

                {/* Voucher Section */}
                <View style={styles.section}>
                  <View style={styles.voucherHeaderRow}>
                    <Text style={styles.sectionTitle}>Mã ưu đãi & Voucher</Text>
                    {selectedVoucher && (
                      <TouchableOpacity onPress={() => setSelectedVoucher(null)}>
                        <Text style={styles.removeVoucherText}>Bỏ chọn</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.voucherInputRow}>
                    <TextInput
                      style={styles.voucherInput}
                      placeholder="Nhập mã ưu đãi (FREESHIP, CHAOBAN)..."
                      placeholderTextColor={COLORS.textMuted}
                      value={voucherCodeInput}
                      onChangeText={setVoucherCodeInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={handleApplyVoucherCode}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.applyBtnText}>Áp dụng</Text>
                    </TouchableOpacity>
                  </View>

                  {voucherError ? (
                    <Text style={styles.voucherErrorText}>{voucherError}</Text>
                  ) : null}

                  {/* Available Vouchers Horizontal Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.voucherChipsScroll}
                  >
                    {VOUCHERS.map((v) => {
                      const isSelected = selectedVoucher?.code === v.code;
                      const isEligible = subtotal >= v.minOrder;
                      return (
                        <TouchableOpacity
                          key={v.code}
                          style={[
                            styles.voucherCard,
                            isSelected && styles.voucherCardSelected,
                            !isEligible && styles.voucherCardDisabled,
                          ]}
                          onPress={() => handleSelectVoucherCard(v)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.voucherCardTop}>
                            <Ionicons
                              name="ticket-outline"
                              size={15}
                              color={isSelected ? COLORS.accentOrange : COLORS.primary}
                            />
                            <Text
                              style={[
                                styles.voucherCode,
                                isSelected && styles.voucherCodeSelected,
                              ]}
                            >
                              {v.code}
                            </Text>
                          </View>
                          <Text style={styles.voucherTitle} numberOfLines={2}>
                            {v.title}
                          </Text>
                          <Text style={styles.voucherMin}>
                            {isEligible ? 'Đủ điều kiện áp dụng' : `Đơn từ ${v.minOrder.toLocaleString('vi-VN')}đ`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

                  {/* MoMo */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'MOMO' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('MOMO')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentLeft}>
                      <View style={[styles.paymentIconBox, { backgroundColor: '#A50064' }]}>
                        <Text style={styles.momoText}>MoMo</Text>
                      </View>
                      <View>
                        <Text style={styles.paymentTitle}>Ví điện tử MoMo</Text>
                        <Text style={styles.paymentSubtitle}>Thanh toán bảo mật tức thì</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={paymentMethod === 'MOMO' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={paymentMethod === 'MOMO' ? COLORS.accentOrange : COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* COD */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'CASH' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('CASH')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentLeft}>
                      <View style={[styles.paymentIconBox, { backgroundColor: COLORS.accentGreen }]}>
                        <Ionicons name="cash-outline" size={18} color="#FFF" />
                      </View>
                      <View>
                        <Text style={styles.paymentTitle}>Tiền mặt (COD)</Text>
                        <Text style={styles.paymentSubtitle}>Thanh toán khi nhận đồ uống</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={paymentMethod === 'CASH' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={paymentMethod === 'CASH' ? COLORS.accentOrange : COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* VietQR */}
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'BANK' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('BANK')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentLeft}>
                      <View style={[styles.paymentIconBox, { backgroundColor: COLORS.accentBlue }]}>
                        <Ionicons name="qr-code-outline" size={18} color="#FFF" />
                      </View>
                      <View>
                        <Text style={styles.paymentTitle}>Chuyển khoản VietQR</Text>
                        <Text style={styles.paymentSubtitle}>Quét mã QR ngân hàng tự động</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={paymentMethod === 'BANK' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={paymentMethod === 'BANK' ? COLORS.accentOrange : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Delivery Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ghi chú đơn hàng cho tài xế</Text>
                  <TextInput
                    style={styles.orderNoteInput}
                    placeholder="VD: Giao lên lầu 2, gọi trước khi đến 5 phút..."
                    placeholderTextColor={COLORS.textMuted}
                    value={orderNote}
                    onChangeText={setOrderNote}
                  />
                </View>

                {/* Price Breakdown Bill Card */}
                <View style={styles.billCard}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Tạm tính ({cartItems.length} món)</Text>
                    <Text style={styles.billValue}>{subtotal.toLocaleString('vi-VN')}đ</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Phí giao hàng</Text>
                    <View style={styles.shippingValWrap}>
                      {isFreeShipEligible && (
                        <Text style={styles.freeShipTag}>FREESHIP</Text>
                      )}
                      <Text
                        style={[
                          styles.billValue,
                          isFreeShipEligible && styles.strikethroughShipping,
                        ]}
                      >
                        {effectiveShipping === 0 && !isFreeShipEligible
                          ? '0đ'
                          : `${(isFreeShipEligible ? shippingFee : effectiveShipping).toLocaleString('vi-VN')}đ`}
                      </Text>
                      {isFreeShipEligible && (
                        <Text style={styles.freeText}>0đ</Text>
                      )}
                    </View>
                  </View>

                  {discount > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: COLORS.accentGreen }]}>
                        Giảm giá ({selectedVoucher?.code})
                      </Text>
                      <Text style={[styles.billValue, { color: COLORS.accentGreen }]}>
                        -{discount.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  )}

                  <View style={styles.billDivider} />

                  <View style={styles.billRow}>
                    <Text style={styles.billTotalLabel}>Tổng thanh toán</Text>
                    <Text style={styles.billTotalValue}>
                      {finalTotal.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Dual Action Sticky Bottom Bar - Talabat Pattern */}
              <View
                style={[
                  styles.bottomBar,
                  Platform.OS === 'web' && {
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addMoreBtnText}>Thêm món</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={handleProceedCheckout}
                  activeOpacity={0.88}
                >
                  <Text style={styles.checkoutBtnText}>
                    Đặt đơn • {finalTotal.toLocaleString('vi-VN')}đ
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgLight,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.94,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  continueShopBtn: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  continueShopText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  addressIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  addressChangeText: {
    fontSize: 12,
    color: COLORS.accentOrange,
    fontWeight: '700',
  },
  addressDetail: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  recipientInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemLeftInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemOptions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  itemToppings: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  itemNoteText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
    marginTop: 8,
  },
  itemRightCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 8,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 8,
  },
  crossSellSection: {
    backgroundColor: '#FAF5FF',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  crossSellTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  crossSellScroll: {
    gap: 12,
  },
  crossSellCard: {
    width: 120,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  crossSellImageWrap: {
    width: '100%',
    height: 90,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceSoft,
    marginBottom: 6,
  },
  crossSellImage: {
    width: '100%',
    height: '100%',
  },
  crossSellAddBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  crossSellName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  crossSellPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  specialRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  specialRequestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  cutleryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutleryTextWrap: {
    flex: 1,
  },
  cutleryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cutleryDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeVoucherText: {
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: '700',
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  applyBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  voucherErrorText: {
    fontSize: 12,
    color: COLORS.accentRed,
    marginTop: 6,
  },
  voucherChipsScroll: {
    gap: 10,
    marginTop: 12,
    paddingBottom: 4,
  },
  voucherCard: {
    width: 170,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  voucherCardSelected: {
    borderColor: COLORS.accentOrange,
    backgroundColor: '#FFF7ED',
  },
  voucherCardDisabled: {
    opacity: 0.6,
  },
  voucherCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  voucherCodeSelected: {
    color: COLORS.accentOrange,
  },
  voucherTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  voucherMin: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: COLORS.accentOrange,
    backgroundColor: '#FFF7ED',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paymentSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  orderNoteInput: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
    ...SHADOWS.xs,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  shippingValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeShipTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    backgroundColor: COLORS.accentGreen,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  strikethroughShipping: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentGreen,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  bottomBar: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.90)' : 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.lg,
  },
  addMoreBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addMoreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: COLORS.accentOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
});
