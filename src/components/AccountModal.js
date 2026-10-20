import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS, RADIUS, TYPOGRAPHY } from '../theme/theme';

export default function AccountModal({
  visible,
  onClose,
  currentUser,
  onLogout,
  onOpenAddressModal,
  onOpenOrderTracking,
}) {
  if (!visible) return null;

  const handleConfirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?')) {
        onLogout();
        onClose();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: () => {
              onLogout();
              onClose();
            },
          },
        ]
      );
    }
  };

  const loyaltyPoints = currentUser?.loyalty_points ?? 150;
  const memberRank = loyaltyPoints >= 500 ? 'Hạng Kim Cương' : loyaltyPoints >= 200 ? 'Hạng Vàng' : 'Hạng Bạc';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tài khoản cá nhân</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* User Info Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUser?.full_name || currentUser?.name || 'Khách hàng Ant Coffee'}</Text>
                <Text style={styles.userPhone}>{currentUser?.phone || '0901 234 567'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Khách hàng thành viên</Text>
                </View>
              </View>
            </View>

            {/* Loyalty Points Banner */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyTop}>
                <View style={styles.loyaltyLabelWrap}>
                  <Ionicons name="sparkles" size={16} color="#F59E0B" />
                  <Text style={styles.loyaltyLabel}>ANT REWARDS</Text>
                </View>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>{memberRank}</Text>
                </View>
              </View>
              <View style={styles.loyaltyBottom}>
                <Text style={styles.pointsNumber}>{loyaltyPoints}</Text>
                <Text style={styles.pointsUnit}>điểm khả dụng</Text>
              </View>
              <Text style={styles.loyaltyDesc}>Đổi 100 điểm để nhận voucher giảm 20.000đ cho đơn tiếp theo</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onOpenAddressModal();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Sổ địa chỉ nhận hàng</Text>
                  <Text style={styles.menuSub}>Quản lý địa chỉ giao tận nơi</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onOpenOrderTracking();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="receipt" size={20} color={COLORS.accentOrange} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Lịch sử & Đơn đang đặt</Text>
                  <Text style={styles.menuSub}>Theo dõi tiến trình pha chế</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Alert.alert('Hotline Hỗ Trợ', 'Tổng đài chăm sóc khách hàng: 1900 6868 (Miễn phí)');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="call" size={20} color={COLORS.accentGreen} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Tổng đài hỗ trợ</Text>
                  <Text style={styles.menuSub}>1900 6868 (07:00 - 22:30)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleConfirmLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.accentRed} />
              <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loyaltyCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 20,
    ...SHADOWS.md,
  },
  loyaltyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loyaltyLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loyaltyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  rankBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },
  loyaltyBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  pointsNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  pointsUnit: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  loyaltyDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  menuSection: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
});
