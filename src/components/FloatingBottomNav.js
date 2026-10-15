import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS, TOUCH_TARGET } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * FloatingBottomNav
 * Premium Pill-Shaped Floating Bottom Navigation
 * Features a signature elevated circular central action button, minimal outline icons,
 * and role-adaptive tabs for Customer, Staff POS, and Owner.
 */
export default function FloatingBottomNav({
  activeRole = 'CUSTOMER',
  currentTab,
  onSelectTab,
  cartCount = 0,
  pendingCount = 0,
  isAcceptingOrders = true,
  onCentralAction,
}) {
  // Define navigation tabs per role
  const getTabsConfig = () => {
    switch (activeRole) {
      case 'STAFF':
        return {
          leftTabs: [
            { key: 'ORDERS', label: 'Hàng đợi', icon: 'receipt-outline', activeIcon: 'receipt', badge: pendingCount },
            { key: 'INVENTORY', label: 'Kho món', icon: 'cube-outline', activeIcon: 'cube' },
          ],
          center: {
            icon: 'flash',
            label: 'Đồng bộ',
            bgColor: COLORS.primaryDark,
            badge: pendingCount,
          },
          rightTabs: [
            { key: 'READY', label: 'Đơn xong', icon: 'bicycle-outline', activeIcon: 'bicycle' },
            { key: 'SHIFT', label: 'Két tiền', icon: 'wallet-outline', activeIcon: 'wallet' },
          ],
        };

      case 'OWNER':
        return {
          leftTabs: [
            { key: 'OVERVIEW', label: 'Báo cáo', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
            { key: 'BEST_SELLERS', label: 'Bán chạy', icon: 'flame-outline', activeIcon: 'flame' },
          ],
          center: {
            icon: isAcceptingOrders ? 'storefront' : 'pause-circle',
            label: 'Quán',
            bgColor: isAcceptingOrders ? COLORS.primary : COLORS.accentRed,
            badge: !isAcceptingOrders ? '!' : null,
          },
          rightTabs: [
            { key: 'AUDIT', label: 'Kiểm soát', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark' },
            { key: 'SETTINGS', label: 'Cấu hình', icon: 'settings-outline', activeIcon: 'settings' },
          ],
        };

      case 'CUSTOMER':
      default:
        return {
          leftTabs: [
            { key: 'HOME', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home' },
            { key: 'MENU', label: 'Thực đơn', icon: 'cafe-outline', activeIcon: 'cafe' },
          ],
          center: {
            icon: 'bag-handle',
            label: 'Giỏ hàng',
            bgColor: COLORS.accentOrange,
            badge: cartCount,
          },
          rightTabs: [
            { key: 'ORDERS', label: 'Đơn hàng', icon: 'receipt-outline', activeIcon: 'receipt' },
            { key: 'ACCOUNT', label: 'Tài khoản', icon: 'person-outline', activeIcon: 'person' },
          ],
        };
    }
  };

  const config = getTabsConfig();

  // Liquid Glass: web CSS backdrop-filter blur applied inline
  const webGlass = Platform.OS === 'web'
    ? { backdropFilter: `blur(${GLASS.blurMd}px)`, WebkitBackdropFilter: `blur(${GLASS.blurMd}px)` }
    : {};

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={[styles.pillContainer, webGlass]}>
        {/* Left Tabs */}
        <View style={styles.tabsHalf}>
          {config.leftTabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => onSelectTab(tab.key)}
                activeOpacity={0.7}
                accessibilityLabel={tab.label}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                  />
                  {tab.badge > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Central Circular Primary Action Button (Elevated) */}
        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity
            style={[styles.centralButton, { backgroundColor: config.center.bgColor }]}
            onPress={onCentralAction}
            activeOpacity={0.85}
            accessibilityLabel={config.center.label}
          >
            <Ionicons name={config.center.icon} size={24} color="#FFF" />
            {config.center.badge !== null && config.center.badge !== undefined && config.center.badge !== 0 && (
              <View style={styles.centralBadge}>
                <Text style={styles.centralBadgeText}>{config.center.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Right Tabs */}
        <View style={styles.tabsHalf}>
          {config.rightTabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => onSelectTab(tab.key)}
                activeOpacity={0.7}
                accessibilityLabel={tab.label}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                  />
                  {tab.badge > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
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
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  pillContainer: {
    width: '92%',
    maxWidth: 440,
    height: 64,
    backgroundColor: GLASS.navBg,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: GLASS.navBorder,
    ...SHADOWS.floatingNav,
    // Top specular highlight line
    borderTopColor: GLASS.borderLight,
    borderTopWidth: 1,
  },
  tabsHalf: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    minHeight: TOUCH_TARGET.minHeight,
    paddingVertical: 4,
  },
  tabItemActive: {},
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.accentOrange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  centerButtonWrapper: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centralButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -26,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.glowOrange,
  },
  centralBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FFF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.accentOrange,
  },
  centralBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 10,
    fontWeight: '900',
  },
});
