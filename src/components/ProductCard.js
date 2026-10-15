import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS } from '../theme/theme';

/**
 * ProductCard - Talabat iOS inspired product card
 * Portrait layout with full bleed image, layered tags, rating badge,
 * and a prominent orange price + purple add-button CTA.
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
      style={[styles.card, isOutOfStock && styles.cardDisabled]}
      activeOpacity={0.88}
      onPress={() => !isOutOfStock && onSelect(product)}
      accessibilityLabel={`${product.name}, ${product.base_price.toLocaleString('vi-VN')}đ`}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Gradient scrim for bottom text legibility */}
        <View style={styles.imageScrim} />

        {/* Discount/Tag Pill */}
        {product.discount_tag && !isOutOfStock && (
          <View style={[styles.tagPill, { backgroundColor: tagColor }]}>
            <Text style={styles.tagText}>{product.discount_tag}</Text>
          </View>
        )}

        {/* Rating glass pill (bottom left) */}
        <View style={[styles.ratingBadge, Platform.OS === 'web' && styles.ratingBadgeWebBlur]}>
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={styles.ratingText}>{product.rating}</Text>
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

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.categoryTitle} numberOfLines={1}>
          {product.category_name}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Orders count social proof */}
        {product.orders_count && (
          <Text style={styles.ordersCount}>
            {product.orders_count} đã đặt
          </Text>
        )}

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
            activeOpacity={0.75}
            accessibilityLabel={`Thêm ${product.name} vào giỏ`}
          >
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: 148,
    backgroundColor: COLORS.surfaceSoft,
    position: 'relative',
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
    height: 48,
    // Simulates gradient scrim on web; on native use a gradient lib if needed
    backgroundColor: 'rgba(0,0,0,0.0)',
  },
  tagPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS.bgLight,
    paddingVertical: 3,
    paddingHorizontal: 6,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockPill: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    padding: 11,
    paddingTop: 9,
  },
  categoryTitle: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 3,
  },
  ordersCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 7,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentOrange,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...SHADOWS.glowPurple,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
});
