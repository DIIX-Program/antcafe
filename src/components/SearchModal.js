import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// "What are you craving today?" circular categories
const CRAVING_CATEGORIES = [
  {
    id: 'coffee',
    name: 'Cà phê',
    iconUri: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80',
    query: 'cà phê',
  },
  {
    id: 'tea',
    name: 'Trà trái cây',
    iconUri: 'https://images.unsplash.com/photo-1558857563-b37cf5a285d8?w=200&auto=format&fit=crop&q=80',
    query: 'trà',
  },
  {
    id: 'milktea',
    name: 'Trà sữa',
    iconUri: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80',
    query: 'trà sữa',
  },
  {
    id: 'bakery',
    name: 'Bánh nướng',
    iconUri: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80',
    query: 'croissant',
  },
  {
    id: 'dessert',
    name: 'Tráng miệng',
    iconUri: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=200&auto=format&fit=crop&q=80',
    query: 'bánh',
  },
];

// Popular searches with trending arrows
const POPULAR_SEARCHES = [
  'Cà phê muối',
  'Trà đào cam sả',
  'Bạc xỉu 3 tầng',
  'Croissant trứng muối',
  'Trà sen vàng',
  'Tiramisu',
  'Cold Brew cam sành',
  'Matcha Latte',
];

/**
 * SearchModal
 * Inspired by Talabat iOS Search reference (talabat iOS 35.png)
 * Features:
 * - Clean search bar with auto-focus & instant clear
 * - Quick category tabs (Tất cả, Cà phê, Trà, Bánh)
 * - "Hôm nay bạn thèm gì?" craving carousel
 * - "Tìm kiếm phổ biến" trending search chips with ↗ arrow
 * - Live instant product search results
 */
export default function SearchModal({
  visible,
  onClose,
  products = [],
  onSelectProduct,
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | COFFEE | TEA | BAKERY

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      const matchText =
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      if (!matchText) return false;

      if (activeTab === 'COFFEE' && p.category_id !== 2) return false;
      if (activeTab === 'TEA' && p.category_id !== 3 && p.category_id !== 4) return false;
      if (activeTab === 'BAKERY' && p.category_id !== 5) return false;

      return true;
    });
  }, [query, products, activeTab]);

  const handleApplyTag = (tag) => {
    setQuery(tag);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cà phê muối, trà, bánh..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus={true}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs Row */}
        <View style={styles.tabsRow}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'COFFEE', label: 'Cà phê' },
            { id: 'TEA', label: 'Trà & Trà sữa' },
            { id: 'BAKERY', label: 'Bánh nướng' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Body content */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {query.trim().length === 0 ? (
            <>
              {/* Craving Category Carousel - "What are you craving today?" */}
              <View style={styles.cravingSection}>
                <Text style={styles.sectionHeading}>Hôm nay bạn thèm gì?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cravingsScroll}
                >
                  {CRAVING_CATEGORIES.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cravingItem}
                      onPress={() => handleApplyTag(item.query)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cravingImageCircle}>
                        <Image
                          source={{ uri: item.iconUri }}
                          style={styles.cravingImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.cravingLabel}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Popular Searches Tags - "Popular searches" */}
              <View style={styles.popularSection}>
                <Text style={styles.sectionHeading}>Tìm kiếm phổ biến</Text>
                <View style={styles.tagsContainer}>
                  {POPULAR_SEARCHES.map((tag, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.popularTag}
                      onPress={() => handleApplyTag(tag)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trending-up" size={14} color={COLORS.accentOrange} />
                      <Text style={styles.popularTagText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            /* Live Results List */
            <View style={styles.resultsSection}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  Kết quả cho "{query}" ({filteredProducts.length})
                </Text>
              </View>

              {filteredProducts.length === 0 ? (
                <View style={styles.emptyResults}>
                  <Ionicons name="search" size={44} color={COLORS.textMuted} />
                  <Text style={styles.emptyResultsTitle}>Không tìm thấy món nào</Text>
                  <Text style={styles.emptyResultsSub}>
                    Hãy thử từ khóa khác như "cà phê", "muối", "trà sữa"...
                  </Text>
                </View>
              ) : (
                filteredProducts.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.productRow}
                    onPress={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: p.image }} style={styles.productThumb} resizeMode="cover" />
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productDesc} numberOfLines={1}>
                        {p.description}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>
                          {p.base_price.toLocaleString('vi-VN')}đ
                        </Text>
                        {p.discount_tag && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{p.discount_tag}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.addIconCircle}>
                      <Ionicons name="add" size={18} color={COLORS.accentOrange} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSoft,
  },
  tabChipActive: {
    backgroundColor: COLORS.primaryDark,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  cravingSection: {},
  cravingsScroll: {
    gap: 16,
  },
  cravingItem: {
    alignItems: 'center',
    width: 72,
  },
  cravingImageCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSoft,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.sm,
  },
  cravingImage: {
    width: '100%',
    height: '100%',
  },
  cravingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  popularSection: {},
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOWS.xs,
  },
  popularTagText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  resultsSection: {},
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyResultsSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 10,
    gap: 12,
    ...SHADOWS.xs,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  productDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentOrange,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  tagBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentOrange,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
});
