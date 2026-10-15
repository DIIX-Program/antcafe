import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS, TOUCH_TARGET } from '../theme/theme';

/**
 * Header - Talabat iOS-inspired sticky top bar
 * Minimal brand presence + prominent delivery address row + dev role switcher
 */
export default function Header({
  activeRole,
  onRoleChange,
  cartCount,
  onOpenCart,
  selectedAddress,
  onOpenAddressModal,
  isAcceptingOrders,
  currentUser,
  onOpenLogin,
}) {
  const webGlass = Platform.OS === 'web'
    ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
    : {};

  return (
    <View style={[styles.container, webGlass]}>
      {/* Top Row: Brand + Store Status + Actions */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandName}>ANT COFFEE</Text>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed },
                ]}
              />
              <Text style={styles.statusText}>
                {isAcceptingOrders ? 'Đang mở cửa' : 'Tạm ngưng'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          {activeRole === 'CUSTOMER' && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={onOpenCart}
              activeOpacity={0.8}
              accessibilityLabel={`Giỏ hàng ${cartCount} món`}
            >
              <Ionicons name="bag-handle" size={19} color={COLORS.primary} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.accountBtn}
            onPress={onOpenLogin}
            activeOpacity={0.8}
            accessibilityLabel={`Tài khoản ${currentUser?.name || 'Đăng nhập'}`}
          >
            <Ionicons name="person-circle-outline" size={24} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Row (customer only) - Talabat-style prominent delivery location */}
      {activeRole === 'CUSTOMER' && (
        <TouchableOpacity
          style={styles.addressRow}
          onPress={onOpenAddressModal}
          activeOpacity={0.7}
          accessibilityLabel="Chọn địa chỉ giao hàng"
        >
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
          </View>
          <View style={styles.addressTextWrap}>
            <Text style={styles.addressLabel}>GIAO ĐẾN</Text>
            <Text style={styles.addressValue} numberOfLines={1}>
              {selectedAddress?.address_detail || '123 Nguyễn Huệ, P. Bến Nghé, Q.1'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Dev Role Switcher */}
      <View style={styles.devBarWrap}>
        <View style={styles.devLabelRow}>
          <Ionicons name="code-slash" size={10} color={COLORS.primary} />
          <Text style={styles.devLabelText}>VAI TRÒ (DEV PREVIEW)</Text>
        </View>
        <View style={styles.roleTabsContainer}>
          {[
            { role: 'CUSTOMER', icon: 'person', iconOff: 'person-outline', label: 'Khách hàng' },
            { role: 'STAFF', icon: 'receipt', iconOff: 'receipt-outline', label: 'Thu ngân' },
            { role: 'OWNER', icon: 'storefront', iconOff: 'storefront-outline', label: 'Chủ quán' },
          ].map(({ role, icon, iconOff, label }) => {
            const isActive = activeRole === role;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.roleTab, isActive && styles.roleTabActive]}
                onPress={() => onRoleChange(role)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isActive ? icon : iconOff}
                  size={13}
                  color={isActive ? '#FFF' : COLORS.textSecondary}
                />
                <Text style={[styles.roleTabText, isActive && styles.roleTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GLASS.navBg,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.borderNeutral,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: COLORS.accentOrange,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  accountBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.md,
    marginTop: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  locationIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextWrap: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  devBarWrap: {
    marginTop: 9,
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADIUS.lg,
    padding: 7,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  devLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 5,
  },
  devLabelText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 3,
  },
  roleTab: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    gap: 4,
  },
  roleTabActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glowPurple,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
});
