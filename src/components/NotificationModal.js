import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, RADIUS, SHADOWS, TYPOGRAPHY } from '../theme/theme';
import {
  scheduleLocalCoffeeReminder,
  cancelAllScheduledNotifications,
  presentLocalNotification,
} from '../services/notifications';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationModal({
  visible,
  onClose,
  notifications = [],
  currentUser = null,
  onOpenLogin,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotificationAction,
}) {
  const [activeTab, setActiveTab] = useState('LIST'); // 'LIST' | 'SETTINGS'
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Preference switches
  const [orderNotifsEnabled, setOrderNotifsEnabled] = useState(true);
  const [promoNotifsEnabled, setPromoNotifsEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [scheduledStatus, setScheduledStatus] = useState(null);

  const filteredNotifications = notifications.filter((item) => {
    if (filterUnreadOnly) return !item.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleTestSchedule = async (seconds = 5) => {
    try {
      const id = await scheduleLocalCoffeeReminder({
        seconds,
        title: '☕ Ant Coffee - Giờ giải lao đã đến!',
        body: 'Nạp lại năng lượng cho ngày dài cùng một ly Cà phê muối béo ngậy hoặc Trà sen vàng nhé! ✨',
        data: { screen: 'HOME' },
      });
      setScheduledStatus(`Đã lên lịch thông báo sau ${seconds}s (ID: ${id || 'OK'})`);
      Alert.alert(
        'Đã lên lịch thành công! ⏰',
        `Thông báo cục bộ sẽ hiển thị sau ${seconds} giây. Hãy thử chuyển app về background hoặc quan sát thanh thông báo nhé!`
      );
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleCancelScheduled = async () => {
    await cancelAllScheduledNotifications();
    setScheduledStatus('Đã hủy tất cả thông báo lên lịch');
    Alert.alert('Thành công', 'Đã hủy tất cả các thông báo đã lên lịch.');
  };

  const handleTestInstantNotification = async (type = 'READY') => {
    try {
      const isReady = type === 'READY';
      const title = isReady ? '🎉 Mời bạn nhận món tại quầy!' : '✨ Đơn hàng đã hoàn tất!';
      const body = isReady
        ? 'Đơn hàng #ANT-8899 đã pha chế xong và sẵn sàng. Mời bạn ghé quầy nhận thức uống nhé! ☕'
        : 'Cảm ơn bạn đã ghé Ant Coffee! Đơn hàng #ANT-8899 đã hoàn thành. Chúc bạn một ngày tuyệt vời ❤️';

      const id = await presentLocalNotification({
        title,
        body,
        data: { screen: 'ORDER_DETAIL', orderCode: 'ANT-8899', status: type },
        channelId: 'antcafe_orders_v2',
      });
      setScheduledStatus(`⚡ Đã gửi thông báo: ${title}`);
    } catch (err) {
      console.warn('Lỗi phát thông báo:', err);
      setScheduledStatus(`Lỗi: ${err.message}`);
    }
  };

  const renderNotificationItem = ({ item }) => {
    let iconName = 'notifications-outline';
    let iconColor = COLORS.primary;

    if (item.type === 'ORDER_CREATED') {
      iconName = 'receipt-outline';
      iconColor = COLORS.warning;
    } else if (item.type === 'ORDER_STATUS') {
      iconName = 'cafe-outline';
      iconColor = COLORS.primary;
    } else if (item.type === 'PAYMENT_SUCCESS') {
      iconName = 'checkmark-circle-outline';
      iconColor = COLORS.success;
    } else if (item.type === 'PROMOTION') {
      iconName = 'gift-outline';
      iconColor = '#EC4899';
    }

    return (
      <TouchableOpacity
        style={[styles.itemCard, !item.is_read && styles.itemCardUnread]}
        activeOpacity={0.7}
        onPress={() => {
          if (onMarkAsRead && !item.is_read) {
            onMarkAsRead(item.id);
          }
          if (onSelectNotificationAction) {
            onSelectNotificationAction(item);
          }
        }}
      >
        <View style={[styles.itemIconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <Text style={[styles.itemTitle, !item.is_read && styles.itemTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>

          <Text style={styles.itemTime}>
            {item.created_at ? new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Thông báo</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'LIST' && styles.tabButtonActive]}
              onPress={() => setActiveTab('LIST')}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={activeTab === 'LIST' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'LIST' && styles.tabTextActive]}>
                Lịch sử ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SETTINGS' && styles.tabButtonActive]}
              onPress={() => setActiveTab('SETTINGS')}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={activeTab === 'SETTINGS' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'SETTINGS' && styles.tabTextActive]}>
                Cài đặt & Lên lịch
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'LIST' ? (
            <View style={styles.tabBody}>
              {/* Action Toolbar */}
              <View style={styles.filterToolbar}>
                <View style={styles.subFilterRow}>
                  <TouchableOpacity
                    style={[styles.chip, !filterUnreadOnly && styles.chipActive]}
                    onPress={() => setFilterUnreadOnly(false)}
                  >
                    <Text style={[styles.chipText, !filterUnreadOnly && styles.chipTextActive]}>Tất cả</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, filterUnreadOnly && styles.chipActive]}
                    onPress={() => setFilterUnreadOnly(true)}
                  >
                    <Text style={[styles.chipText, filterUnreadOnly && styles.chipTextActive]}>
                      Chưa đọc ({unreadCount})
                    </Text>
                  </TouchableOpacity>
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity style={styles.markAllBtn} onPress={onMarkAllAsRead}>
                    <Ionicons name="checkmark-done" size={15} color={COLORS.primary} />
                    <Text style={styles.markAllText}>Đọc tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notification List */}
              <FlatList
                data={filteredNotifications}
                keyExtractor={(item, index) => `${item.id || 'notif'}-${index}`}
                renderItem={renderNotificationItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  !currentUser ? (
                    <View style={styles.emptyContainer}>
                      <View style={styles.guestIconCircle}>
                        <Ionicons name="notifications-off-outline" size={40} color={COLORS.primary} />
                      </View>
                      <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
                      <Text style={styles.emptySubtitle}>
                        Vui lòng đăng nhập để nhận thông báo về tiến độ đơn hàng, quà tặng và ưu đãi dành riêng cho bạn.
                      </Text>
                      {onOpenLogin && (
                        <TouchableOpacity
                          style={styles.guestLoginBtn}
                          onPress={() => {
                            onClose();
                            onOpenLogin();
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="log-in-outline" size={16} color="#FFF" />
                          <Text style={styles.guestLoginBtnText}>Đăng nhập ngay</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
                      <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                      <Text style={styles.emptySubtitle}>
                        Các cập nhật về đơn hàng, pha chế và ưu đãi sẽ xuất hiện tại đây.
                      </Text>
                    </View>
                  )
                }
              />
            </View>
          ) : (
            <View style={styles.settingsBody}>
              <Text style={styles.settingsSectionTitle}>TÙY CHỌN BẬT / TẮT THÔNG BÁO</Text>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Trạng thái đơn hàng</Text>
                    <Text style={styles.settingDesc}>Nhận thông báo khi quán nhận đơn, pha chế xong</Text>
                  </View>
                  <Switch
                    value={orderNotifsEnabled}
                    onValueChange={setOrderNotifsEnabled}
                    trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary }}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Khuyến mãi & Voucher</Text>
                    <Text style={styles.settingDesc}>Nhận thông báo về deal hot, giảm giá thành viên</Text>
                  </View>
                  <Switch
                    value={promoNotifsEnabled}
                    onValueChange={setPromoNotifsEnabled}
                    trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary }}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Âm thanh thông báo</Text>
                    <Text style={styles.settingDesc}>Phát chuông khi có thông báo mới</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary }}
                  />
                </View>
              </View>

              <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>
                THÔNG BÁO CỤC BỘ ĐƯỢC LÊN LỊCH (YÊU CẦU 5)
              </Text>

              <View style={styles.settingCard}>
                <Text style={styles.scheduleDesc}>
                  Thử nghiệm tính năng lên lịch thông báo cục bộ (nhắc giờ giải lao, deadline, uống cà phê sáng):
                </Text>

                <View style={styles.scheduleActionRow}>
                  <TouchableOpacity
                    style={[styles.scheduleBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleTestSchedule(5)}
                  >
                    <Ionicons name="timer-outline" size={18} color="#FFF" />
                    <Text style={styles.scheduleBtnText}>Lên lịch sau 5 giây</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scheduleBtn, { backgroundColor: '#4F46E5' }]}
                    onPress={() => handleTestSchedule(15)}
                  >
                    <Ionicons name="cafe-outline" size={18} color="#FFF" />
                    <Text style={styles.scheduleBtnText}>Nhắc sau 15 giây</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.scheduleBtn, styles.cancelBtn]}
                  onPress={handleCancelScheduled}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  <Text style={[styles.scheduleBtnText, { color: COLORS.error }]}>Hủy tất cả lịch hẹn</Text>
                </TouchableOpacity>

                {scheduledStatus && (
                  <Text style={styles.scheduledStatusText}>⚡ {scheduledStatus}</Text>
                )}
              </View>

              <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>
                THỬ NGHIỆM THÔNG BÁO TỨC THÌ (ĐƠN HÀNG)
              </Text>

              <View style={styles.settingCard}>
                <Text style={styles.scheduleDesc}>
                  Kiểm tra âm thanh, độ rung và banner thông báo khi quán hoàn tất hoặc sẵn sàng giao:
                </Text>

                <View style={styles.scheduleActionRow}>
                  <TouchableOpacity
                    style={[styles.scheduleBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleTestInstantNotification('READY')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.scheduleBtnText}>Đơn Sẵn Sàng (Test)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scheduleBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleTestInstantNotification('COMPLETED')}
                  >
                    <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                    <Text style={styles.scheduleBtnText}>Đơn Hoàn Tất (Test)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 16,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabBody: {
    flex: 1,
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceHighlight,
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 10,
    alignItems: 'center',
  },
  itemCardUnread: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '30',
  },
  itemIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  itemTitleBold: {
    color: COLORS.text,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  itemBody: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
  guestIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    marginTop: 18,
    ...SHADOWS.sm,
  },
  guestLoginBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsBody: {
    padding: 20,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  settingCard: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: 10,
  },
  scheduleDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  scheduleActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    marginTop: 4,
  },
  scheduleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  scheduledStatusText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});
