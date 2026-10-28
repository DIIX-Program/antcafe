import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS, TOUCH_TARGET } from '../theme/theme';

/**
 * ProductCard - 1 Hàng 1 Thẻ To & Chất Lượng (Single Row Luxury Editorial Card)
 * Designed based on user visual feedback and mobile-app-ui-design principles:
 * Full-width luxury card, generous 124x124 food photography, clear description,
 * prominent tabular price, and tactile thumb-friendly add CTA.
 */
export default function ProductCard({ product, onSelect, onQuickAdd }) {
  const isOutOfStock = !product.is_available;

  const tagColor = product.discount_tag === 'Best Seller'
    ? COLORS.accentAmber
    : product.discount_tag && product.discount_tag.includes('OFF')
    ? COLORS.accentOrange
    : COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isOutOfStock && styles.cardDisabled,
        Platform.OS === 'web' && styles.cardWeb,
      ]}
      activeOpacity={0.88}
      onPress={() => !isOutOfStock && onSelect(product)}
      accessibilityLabel={`${product.name}, ${product.base_price.toLocaleString('vi-VN')}đ`}
    >
      {/* Product Image Column (Left) */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Subtle Bottom Scrim */}
        <View style={styles.imageScrim} />

        {/* Discount / Promo Tag */}
        {product.discount_tag && !isOutOfStock && (
          <View style={[styles.tagPill, { backgroundColor: tagColor }]}>
            <Text style={styles.tagText}>{product.discount_tag}</Text>
          </View>
        )}

        {/* Rating Glass Pill */}
        <View style={[styles.ratingBadge, Platform.OS === 'web' && styles.ratingBadgeWebBlur]}>
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={styles.ratingText}>{product.rating || '4.9'}</Text>
        </View>

        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockPill}>
              <Text style={styles.outOfStockText}>Tạm hết</Text>
            </View>
          </View>
        )}
      </View>

      {/* Product Information Column (Right) */}
      <View style={styles.infoCol}>
        <View>
          {/* Category & Social Proof Row */}
          <View style={styles.metaHeaderRow}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {product.category_name || 'Đặc sản'}
            </Text>
            {product.orders_count ? (
              <View style={styles.ordersBadge}>
                <Ionicons name="flame" size={11} color={COLORS.accentOrange} />
                <Text style={styles.ordersCount}>{product.orders_count}</Text>
              </View>
            ) : null}
          </View>

          {/* Product Title */}
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Product Description */}
          {product.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}
        </View>

        {/* Price & Add CTA Row */}
        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {product.base_price.toLocaleString('vi-VN')}đ
            </Text>
            {product.original_price && product.original_price > product.base_price && (
              <Text style={styles.originalPrice}>
                {product.original_price.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
            disabled={isOutOfStock}
            onPress={() => !isOutOfStock && onSelect(product)}
            activeOpacity={0.78}
            accessibilityLabel={`Thêm ${product.name} vào giỏ`}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
    minHeight: 146,
    width: '100%',
  },
  cardWeb: {
    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: 'pointer',
  },
  cardDisabled: {
    opacity: 0.65,
  },
  imageWrap: {
    width: 122,
    height: 122,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSoft,
    position: 'relative',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  tagPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingVertical: 3,
    paddingHorizontal: 7.5,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS.bgLight,
    paddingVertical: 2.5,
    paddingHorizontal: 6.5,
    borderRadius: RADIUS.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: GLASS.borderLight,
  },
  ratingBadgeWebBlur: {
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,25,23,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockPill: {
    backgroundColor: 'rgba(28,25,23,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    minHeight: 122,
  },
  metaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  categoryTitle: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ordersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  ordersCount: {
    fontSize: 10,
    color: COLORS.orangeDark,
    fontWeight: '700',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 20.5,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16.5,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.accentOrange,
    fontVariant: ['tabular-nums'],
  },
  originalPrice: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...SHADOWS.glowAmber,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
});
