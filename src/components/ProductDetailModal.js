import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../theme/theme';
import { OPTION_GROUPS as DEFAULT_OPTION_GROUPS } from '../data/mockData';
import { fetchOptionGroups } from '../api/services';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function ProductDetailModalContent({ product, onClose, onAddToCart }) {
  const [optionGroups, setOptionGroups] = useState(DEFAULT_OPTION_GROUPS);
  const [selectedSize, setSelectedSize] = useState(DEFAULT_OPTION_GROUPS.sizes[0]);
  const [selectedIce, setSelectedIce] = useState(DEFAULT_OPTION_GROUPS.iceLevels[0]);
  const [selectedSugar, setSelectedSugar] = useState(DEFAULT_OPTION_GROUPS.sugarLevels[0]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeQuickChoice, setActiveQuickChoice] = useState(null);

  useEffect(() => {
    fetchOptionGroups()
      .then((data) => {
        if (data && data.sizes?.length) {
          setOptionGroups(data);
          if (data.sizes?.[0]) setSelectedSize(data.sizes[0]);
          if (data.iceLevels?.[0]) setSelectedIce(data.iceLevels[0]);
          if (data.sugarLevels?.[0]) setSelectedSugar(data.sugarLevels[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyQuickChoice = (type) => {
    if (activeQuickChoice === type) {
      setActiveQuickChoice(null);
      return;
    }

    setActiveQuickChoice(type);
    if (type === 'TRADITIONAL') {
      // Size M, 70% Đá, 70% Đường, Không topping
      setSelectedSize(optionGroups.sizes[1] || optionGroups.sizes[0]);
      setSelectedIce(optionGroups.iceLevels[1] || optionGroups.iceLevels[0]);
      setSelectedSugar(optionGroups.sugarLevels[1] || optionGroups.sugarLevels[0]);
      setSelectedToppings([]);
    } else if (type === 'REFRESHING') {
      // Size L, 100% Đá, 50% Đường, Thạch cà phê
      setSelectedSize(optionGroups.sizes[2] || optionGroups.sizes[0]);
      setSelectedIce(optionGroups.iceLevels[0]);
      setSelectedSugar(optionGroups.sugarLevels[2] || optionGroups.sugarLevels[0]);
      const coffeeJelly = optionGroups.toppings.find(
        (t) => t.id === 'top_4' || t.name.toLowerCase().includes('thạch cà phê')
      );
      setSelectedToppings(coffeeJelly ? [coffeeJelly] : []);
    }
  };

  const toggleTopping = (topping) => {
    setActiveQuickChoice(null);
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  // Safe pricing calculation
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t?.price || 0), 0);
  const basePrice = product?.base_price || 0;
  const singleUnitPrice = basePrice + (selectedSize?.extra_price || 0) + toppingsPrice;
  const totalPrice = singleUnitPrice * quantity;

  const originalUnitPrice =
    (product?.original_price || (basePrice > 0 ? Math.round(basePrice * 1.25) : 0)) +
    (selectedSize?.extra_price || 0) +
    toppingsPrice;
  const originalTotalPrice = originalUnitPrice * quantity;

  const handleAdd = () => {
    onAddToCart({
      product,
      selectedSize,
      selectedIce,
      selectedSugar,
      selectedToppings,
      note,
      quantity,
      unitPrice: singleUnitPrice,
      totalPrice,
    });
    onClose();
  };

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header Actions Floating over Hero Image */}
          <View style={styles.floatingHeader}>
            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                Platform.OS === 'web' && {
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                Platform.OS === 'web' && {
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                },
              ]}
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? COLORS.accentRed : COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Big Hero Image */}
            <View style={styles.heroImageWrap}>
              <Image source={{ uri: product.image }} style={styles.heroImage} resizeMode="cover" />
              {product.discount_tag && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{product.discount_tag}</Text>
                </View>
              )}
            </View>

            {/* Product Meta Info */}
            <View style={styles.metaSection}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc}>{product.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.basePriceText}>
                  {product.base_price.toLocaleString('vi-VN')}đ
                </Text>
                {product.original_price && (
                  <Text style={styles.originalPriceText}>
                    {product.original_price.toLocaleString('vi-VN')}đ
                  </Text>
                )}
              </View>
            </View>

            {/* QUICK CHOICES - Inspired by Talabat 'Try these quick choices' */}
            <View style={styles.quickChoicesSection}>
              <Text style={styles.quickChoicesTitle}>Gợi ý chọn nhanh</Text>
              <Text style={styles.quickChoicesSubtitle}>
                Bạn vẫn có thể tùy chỉnh chi tiết từng lựa chọn ở bên dưới
              </Text>

              <View style={styles.quickCardsRow}>
                {/* Quick Choice 1 */}
                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    activeQuickChoice === 'TRADITIONAL' && styles.quickCardActive,
                  ]}
                  onPress={() => handleApplyQuickChoice('TRADITIONAL')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickCardHeader}>
                    <View style={styles.fireTag}>
                      <Ionicons name="flame" size={13} color={COLORS.accentOrange} />
                      <Text style={styles.fireTagText}>Chuẩn vị quán</Text>
                    </View>
                    {activeQuickChoice === 'TRADITIONAL' && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.accentOrange} />
                    )}
                  </View>
                  <Text style={styles.quickCardTitle}>Đậm đà thơm ngậy</Text>
                  <Text style={styles.quickCardSpecs}>Size Vừa (M) • 70% Đá</Text>
                  <Text style={styles.quickCardPrice}>+6.000đ</Text>
                </TouchableOpacity>

                {/* Quick Choice 2 */}
                <TouchableOpacity
                  style={[
                    styles.quickCard,
                    activeQuickChoice === 'REFRESHING' && styles.quickCardActive,
                  ]}
                  onPress={() => handleApplyQuickChoice('REFRESHING')}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickCardHeader}>
                    <View style={styles.fireTag}>
                      <Ionicons name="sparkles" size={13} color={COLORS.accentOrange} />
                      <Text style={styles.fireTagText}>Giải nhiệt sảng khoái</Text>
                    </View>
                    {activeQuickChoice === 'REFRESHING' && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.accentOrange} />
                    )}
                  </View>
                  <Text style={styles.quickCardTitle}>Cỡ lớn mát lạnh</Text>
                  <Text style={styles.quickCardSpecs}>Size L • Thạch Cà Phê</Text>
                  <Text style={styles.quickCardPrice}>+20.000đ</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* SIZE OPTIONS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Kích cỡ ly (Size)</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Bắt buộc</Text>
                </View>
              </View>

              {optionGroups.sizes.map((size) => {
                const isSelected = selectedSize.id === size.id;
                return (
                  <TouchableOpacity
                    key={size.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => {
                      setActiveQuickChoice(null);
                      setSelectedSize(size);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioRow}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                        {size.name}
                      </Text>
                    </View>
                    <Text style={styles.extraPrice}>
                      {size.extra_price > 0
                        ? `+${size.extra_price.toLocaleString('vi-VN')}đ`
                        : 'Mặc định'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* ICE LEVEL */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mức Đá</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Bắt buộc</Text>
                </View>
              </View>
              <View style={styles.pillContainer}>
                {optionGroups.iceLevels.map((ice) => {
                  const isSelected = selectedIce.id === ice.id;
                  return (
                    <TouchableOpacity
                      key={ice.id}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => {
                        setActiveQuickChoice(null);
                        setSelectedIce(ice);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {ice.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* SUGAR LEVEL */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mức Đường</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Bắt buộc</Text>
                </View>
              </View>
              <View style={styles.pillContainer}>
                {optionGroups.sugarLevels.map((sugar) => {
                  const isSelected = selectedSugar.id === sugar.id;
                  return (
                    <TouchableOpacity
                      key={sugar.id}
                      style={[styles.pill, isSelected && styles.pillActive]}
                      onPress={() => {
                        setActiveQuickChoice(null);
                        setSelectedSugar(sugar);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {sugar.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* TOPPING SELECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Thêm Topping</Text>
                <Text style={styles.optionalText}>Chọn nhiều</Text>
              </View>

              {optionGroups.toppings.map((top) => {
                const isSelected = selectedToppings.some((t) => t.id === top.id);
                return (
                  <TouchableOpacity
                    key={top.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleTopping(top)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioRow}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                        {top.name}
                      </Text>
                    </View>
                    <Text style={styles.extraPrice}>
                      +{top.price.toLocaleString('vi-VN')}đ
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* NOTE INPUT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghi chú cho Barista</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="VD: Để riêng đá, dùng ống hút giấy, thêm nắp..."
                placeholderTextColor={COLORS.textMuted}
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View
            style={[
              styles.bottomBar,
              Platform.OS === 'web' && {
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              },
            ]}
          >
            {/* Quantity Stepper */}
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                disabled={quantity <= 1}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={quantity <= 1 ? COLORS.textMuted : COLORS.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={18} color={COLORS.accentOrange} />
              </TouchableOpacity>
            </View>

            {/* Prominent Orange CTA Button */}
            <TouchableOpacity
              style={styles.addCartBtn}
              onPress={handleAdd}
              activeOpacity={0.88}
            >
              <View style={styles.addCartBtnContent}>
                <Text style={styles.addCartBtnText}>Thêm vào giỏ</Text>
                <View style={styles.priceContainer}>
                  {product.original_price && (
                    <Text style={styles.strikethroughPrice}>
                      {originalTotalPrice.toLocaleString('vi-VN')}đ
                    </Text>
                  )}
                  <Text style={styles.addCartPriceText}>
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProductDetailModal({ visible, product, onClose, onAddToCart }) {
  if (!visible || !product) {
    return null;
  }

  return (
    <ProductDetailModalContent
      product={product}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: SCREEN_HEIGHT * 0.90,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  floatingHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    ...SHADOWS.sm,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroImageWrap: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.surfaceSoft,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  metaSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  productDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  basePriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  originalPriceText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  quickChoicesSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFF7ED',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FED7AA',
  },
  quickChoicesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  quickChoicesSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  quickCardActive: {
    borderColor: COLORS.accentOrange,
    backgroundColor: '#FFFBF5',
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fireTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  fireTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentOrange,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  quickCardSpecs: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  quickCardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 8,
    backgroundColor: COLORS.surfaceSoft,
  },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  requiredBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  optionalText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  optionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionNameActive: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  extraPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  pillText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.98)',
    gap: 12,
    ...SHADOWS.lg,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  addCartBtn: {
    flex: 1,
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  addCartBtnContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addCartBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikethroughPrice: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addCartPriceText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
});
