import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS } from '../theme/theme';

/**
 * Header - Talabat iOS-inspired sticky top bar with Strict Role-Based Header Layout
 * - CUSTOMER (Guest / Member): Shows Brand, Store status, Cart with count, Login/Account, Address
 * - STAFF POS: Shows Staff bar, Barista name, Quick Logout
 * - OWNER DASHBOARD: Shows Owner bar, Store settings status, Quick Logout
 */
export default function Header({
  activeRole = 'CUSTOMER',
  cartCount = 0,
  onOpenCart,
  selectedAddress,
  onOpenAddressModal,
  isAcceptingOrders = true,
  currentUser = null,
  onOpenLogin,
  onOpenAccount,
  onLogout,
}) {
  const webGlass = Platform.OS === 'web'
    ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
    : {};

  const handlePromptLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi ca làm việc?')) {
        onLogout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng xuất', style: 'destructive', onPress: onLogout },
        ]
      );
    }
  };

  // 1. STAFF POS HEADER
  if (activeRole === 'STAFF') {
    return (
      <View style={[styles.container, styles.staffOwnerContainer, webGlass]}>
        <View style={styles.topRowResponsive}>
          <View style={styles.brandContainerResponsive}>
            <Image
              source={require('../../img/logo.png')}
              style={styles.logoCompact}
              resizeMode="contain"
            />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName} numberOfLines={1}>ANT COFFEE</Text>
              <View style={[styles.roleBadge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="receipt" size={11} color={COLORS.primary} />
                <Text style={[styles.roleBadgeText, { color: COLORS.primary }]} numberOfLines={1}>POS THU NGÂN</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRowResponsive}>
            <View style={styles.userInfoWrap}>
              <Text style={styles.userRoleText}>Nhân viên</Text>
              <Text style={styles.userRoleName} numberOfLines={1}>
                {currentUser?.full_name || currentUser?.name || 'Thu ngân'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtnSmall}
              onPress={handlePromptLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color={COLORS.accentRed} />
              <Text style={styles.logoutBtnText}>Thoát ca</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 2. OWNER DASHBOARD HEADER
  if (activeRole === 'OWNER') {
    return (
      <View style={[styles.container, styles.staffOwnerContainer, webGlass]}>
        <View style={styles.topRowResponsive}>
          <View style={styles.brandContainerResponsive}>
            <Image
              source={require('../../img/logo.png')}
              style={styles.logoCompact}
              resizeMode="contain"
            />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName} numberOfLines={1}>ANT COFFEE</Text>
              <View style={[styles.roleBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="storefront" size={11} color="#D97706" />
                <Text style={[styles.roleBadgeText, { color: '#B45309' }]} numberOfLines={1}>CHỦ QUÁN</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRowResponsive}>
            <View style={styles.userInfoWrap}>
              <Text style={styles.userRoleText}>Chủ quán</Text>
              <Text style={styles.userRoleName} numberOfLines={1}>
                {currentUser?.full_name || currentUser?.name || 'Chủ hệ thống'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtnSmall}
              onPress={handlePromptLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color={COLORS.accentRed} />
              <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 3. CUSTOMER HEADER (Guest or Logged in Customer)
  const isGuest = !currentUser;

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
          {/* Cart Button */}
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

          {/* User Account or Login CTA */}
          {isGuest ? (
            <TouchableOpacity
              style={styles.loginPillBtn}
              onPress={onOpenLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={16} color="#FFF" />
              <Text style={styles.loginPillText}>Đăng nhập</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.accountBtn}
              onPress={onOpenAccount}
              activeOpacity={0.8}
              accessibilityLabel={`Tài khoản ${currentUser?.full_name || currentUser?.name}`}
            >
              <View style={styles.userAvatarWrap}>
                <Ionicons name="person" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.accountNameText} numberOfLines={1}>
                {currentUser?.full_name?.split(' ').pop() || currentUser?.name?.split(' ').pop() || 'Tôi'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Address Row (customer only) */}
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
    marginBottom: 8,
  },
  topRowResponsive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    width: '100%',
  },
  staffOwnerContainer: {
    paddingVertical: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  brandContainerResponsive: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  brandTextWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  logo: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  logoCompact: {
    width: 32,
    height: 32,
    marginRight: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.primaryDark,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  actionRowResponsive: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accentOrange,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  loginPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.sm,
  },
  loginPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatarWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 80,
  },
  userInfoWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 2,
    maxWidth: 95,
  },
  userRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 12,
  },
  userRoleName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 16,
    maxWidth: 95,
  },
  logoutBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  locationIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addressTextWrap: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
