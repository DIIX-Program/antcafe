import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING, TOUCH_TARGET } from '../theme/theme';
import { subscribeNewMessage, sendOrderMessage, getOrderMessagesViaSocket } from '../services/socket';
import { fetchOrderMessagesApi, sendOrderMessageApi } from '../api/services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CANCEL_REASONS = [
  'Hết nguyên liệu pha chế',
  'Quán quá tải giờ cao điểm',
  'Khách gọi yêu cầu đổi món / hủy',
  'Không thể liên hệ số điện thoại khách',
];

export default function StaffView({
  orders,
  onUpdateOrderStatus,
  products,
  onToggleProductAvailability,
  isAcceptingOrders = true,
  currentTab = 'ORDERS',
  onSelectTab,
}) {
  // Mobile staff navigation tabs: 'ORDERS' | 'INVENTORY' | 'SHIFT'
  const [currentSection, setCurrentSection] = useState('ORDERS');

  // Order status filter: 'ALL' | 'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED'
  const [activeTab, setActiveTab] = useState('ALL');

  React.useEffect(() => {
    if (currentTab === 'READY') {
      setCurrentSection('ORDERS');
      setActiveTab('READY');
    } else if (currentTab === 'ORDERS') {
      setCurrentSection('ORDERS');
    } else if (currentTab === 'INVENTORY') {
      setCurrentSection('INVENTORY');
    } else if (currentTab === 'SHIFT') {
      setCurrentSection('SHIFT');
    }
  }, [currentTab]);

  // Search & filter for inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('ALL');

  // Expanded cards tracker (set of order IDs)
  const [expandedOrders, setExpandedOrders] = useState({});

  // Cancel order dialog state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState(CANCEL_REASONS[0]);

  // Chat with customer state
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [orderMessages, setOrderMessages] = useState({});
  const [staffChatInput, setStaffChatInput] = useState('');

  // Toast / feedback message
  const [feedbackToast, setFeedbackToast] = useState('');

  // Processing state for buttons to prevent duplicate taps
  const [processingId, setProcessingId] = useState(null);

  // Shift & Cash state
  const [openingCash] = useState(1500000); // 1.5M VNĐ
  const [shiftNote, setShiftNote] = useState('');

  const triggerToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast('');
    }, 2800);
  };

  // Real-time listener for incoming customer messages with strict deduplication
  React.useEffect(() => {
    const unsub = subscribeNewMessage((msg) => {
      const oId = Number(msg.orderId);
      if (oId) {
        setOrderMessages((prev) => {
          const list = prev[oId] || [];
          const exists = list.some((m) =>
            (m.id && msg.id && String(m.id) === String(msg.id)) ||
            (m.message === msg.message &&
             m.senderRole === msg.senderRole &&
             Math.abs(new Date(m.timestamp || 0) - new Date(msg.timestamp || 0)) < 4000)
          );
          if (exists) return prev;
          return {
            ...prev,
            [oId]: [...list, msg],
          };
        });
      }

      if (msg.senderRole === 'CUSTOMER') {
        triggerToast(`💬 Khách nhắn (#${msg.orderCode || msg.orderId}): "${msg.message}"`);
      }
    });
    return () => unsub();
  }, []);

  const openOrderChat = (order) => {
    setActiveChatOrder(order);
    setChatModalVisible(true);
    setStaffChatInput('');
    const oId = order.id;

    fetchOrderMessagesApi(oId).then((history) => {
      if (history && history.length > 0) {
        setOrderMessages((prev) => ({
          ...prev,
          [oId]: history,
        }));
      } else {
        getOrderMessagesViaSocket(oId, (socketHistory) => {
          if (socketHistory && socketHistory.length > 0) {
            setOrderMessages((prev) => ({
              ...prev,
              [oId]: socketHistory,
            }));
          }
        });
      }
    });
  };

  const handleSendStaffMessage = (customText = null) => {
    const text = customText || staffChatInput;
    if (!text || !text.trim() || !activeChatOrder) return;

    const trimmed = text.trim();
    const payload = {
      orderId: activeChatOrder.id,
      orderCode: activeChatOrder.orderCode || activeChatOrder.order_code,
      message: trimmed,
      senderName: 'Barista Minh Tuấn',
      senderRole: 'STAFF',
    };

    const sent = sendOrderMessage(payload);
    if (!sent) {
      sendOrderMessageApi(activeChatOrder.id, payload).then((res) => {
        if (res && res.data) {
          const newMsg = res.data;
          setOrderMessages((prev) => {
            const list = prev[activeChatOrder.id] || [];
            const exists = list.some((m) =>
              (m.id && newMsg.id && String(m.id) === String(newMsg.id)) ||
              (m.message === newMsg.message && m.senderRole === newMsg.senderRole)
            );
            if (exists) return prev;
            return {
              ...prev,
              [activeChatOrder.id]: [...list, newMsg],
            };
          });
        }
      });
    }

    setStaffChatInput('');
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Status counts
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (activeTab === 'ALL') return true;
      return ord.status === activeTab;
    });
  }, [orders, activeTab]);

  // Filtered inventory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (inventoryCategory !== 'ALL' && p.category_name !== inventoryCategory) {
        return false;
      }
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, inventoryCategory, inventorySearch]);

  const outOfStockCount = products.filter((p) => !p.is_available).length;

  // Handlers for Order status transitions
  const handleAcceptOrder = (orderId) => {
    setProcessingId(orderId);
    setTimeout(() => {
      onUpdateOrderStatus(orderId, 'CONFIRMED');
      setProcessingId(null);
      triggerToast('Đã nhận đơn! Bắt đầu pha chế.');
    }, 250);
  };

  const handleReadyOrder = (orderId) => {
    setProcessingId(orderId);
    setTimeout(() => {
      onUpdateOrderStatus(orderId, 'READY');
      setProcessingId(null);
      triggerToast('Đã hoàn thành pha chế! Báo khách/tài xế lấy.');
    }, 250);
  };

  const handleCompleteOrder = (orderId) => {
    setProcessingId(orderId);
    setTimeout(() => {
      onUpdateOrderStatus(orderId, 'COMPLETED');
      setProcessingId(null);
      triggerToast('Đơn hàng đã hoàn tất & cập nhật thanh toán.');
    }, 250);
  };

  const openCancelDialog = (order) => {
    setOrderToCancel(order);
    setSelectedCancelReason(CANCEL_REASONS[0]);
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = () => {
    if (!orderToCancel) return;
    onUpdateOrderStatus(orderToCancel.id, 'CANCELLED');
    setCancelModalVisible(false);
    setOrderToCancel(null);
    triggerToast('Đã từ chối đơn hàng.');
  };

  // Calculate cash collected from completed orders with payment_method Tiền mặt
  const cashCollected = orders
    .filter((o) => o.status === 'COMPLETED' && o.payment_method?.includes('Tiền mặt'))
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Toast Feedback Notification */}
      {feedbackToast ? (
        <View style={styles.toastCard}>
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      ) : null}

      {/* A. Mobile Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="cafe" size={18} color={COLORS.primary} />
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>Ant Coffee POS</Text>
              <View
                style={[
                  styles.storeStatusDot,
                  { backgroundColor: isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed },
                ]}
              />
              <Text
                style={[
                  styles.storeStatusLabel,
                  { color: isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed },
                ]}
              >
                {isAcceptingOrders ? 'Mở cửa' : 'Tạm ngưng'}
              </Text>
            </View>
            <Text style={styles.staffSubtitle}>Barista Minh Tuấn • Ca sáng (07:00 - 15:00)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => triggerToast('Đã đồng bộ dữ liệu mới nhất!')}
          activeOpacity={0.7}
          accessibilityLabel="Làm mới dữ liệu"
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.primaryDark} />
          {pendingCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SECTION 1: ORDERS MANAGEMENT */}
      {currentSection === 'ORDERS' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* B. Order Summary KPI Cards (Responsive 2x2 Grid) */}
          <View style={styles.summaryGrid}>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                activeTab === 'PENDING' && styles.summaryCardActivePending,
              ]}
              onPress={() => setActiveTab('PENDING')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryTopRow}>
                <View style={[styles.summaryIconBox, { backgroundColor: COLORS.amberLight }]}>
                  <Ionicons name="time" size={16} color={COLORS.amberDark} />
                </View>
                <Text style={styles.summaryValueText}>{pendingCount}</Text>
              </View>
              <Text style={styles.summaryLabelText}>Chờ tiếp nhận</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                activeTab === 'CONFIRMED' && styles.summaryCardActiveConfirmed,
              ]}
              onPress={() => setActiveTab('CONFIRMED')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryTopRow}>
                <View style={[styles.summaryIconBox, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="flame" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.summaryValueText}>{confirmedCount}</Text>
              </View>
              <Text style={styles.summaryLabelText}>Đang pha chế</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                activeTab === 'READY' && styles.summaryCardActiveReady,
              ]}
              onPress={() => setActiveTab('READY')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryTopRow}>
                <View style={[styles.summaryIconBox, { backgroundColor: COLORS.orangeLight }]}>
                  <Ionicons name="bicycle" size={16} color={COLORS.accentOrange} />
                </View>
                <Text style={styles.summaryValueText}>{readyCount}</Text>
              </View>
              <Text style={styles.summaryLabelText}>Sẵn sàng giao</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                activeTab === 'COMPLETED' && styles.summaryCardActiveCompleted,
              ]}
              onPress={() => setActiveTab('COMPLETED')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryTopRow}>
                <View style={[styles.summaryIconBox, { backgroundColor: COLORS.greenLight }]}>
                  <Ionicons name="checkmark-done" size={16} color={COLORS.greenDark} />
                </View>
                <Text style={styles.summaryValueText}>{completedCount}</Text>
              </View>
              <Text style={styles.summaryLabelText}>Đã hoàn tất</Text>
            </TouchableOpacity>
          </View>

          {/* C. Order Filters (Horizontal Segmented Control) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsScroll}
          >
            {[
              { key: 'ALL', label: 'Tất cả', count: orders.length },
              { key: 'PENDING', label: 'Chờ duyệt', count: pendingCount },
              { key: 'CONFIRMED', label: 'Đang pha chế', count: confirmedCount },
              { key: 'READY', label: 'Sẵn sàng', count: readyCount },
              { key: 'COMPLETED', label: 'Hoàn tất', count: completedCount },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View
                      style={[
                        styles.filterChipBadge,
                        isSelected && styles.filterChipBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipBadgeText,
                          isSelected && styles.filterChipBadgeTextActive,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* D. Orders Cards List */}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
              <Text style={styles.emptySub}>
                Hiện tại không có đơn nào ở trạng thái này. Đơn mới sẽ tự động hiển thị tại đây!
              </Text>
            </View>
          ) : (
            <View style={styles.ordersListWrap}>
              {filteredOrders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isConfirmed = order.status === 'CONFIRMED';
                const isReady = order.status === 'READY';
                const isCompleted = order.status === 'COMPLETED';
                const isCancelled = order.status === 'CANCELLED';

                const isExpanded = !!expandedOrders[order.id];
                const totalDrinksCount = order.items?.reduce(
                  (sum, it) => sum + (it.quantity || 1),
                  0
                );

                const isProcessingThis = processingId === order.id;

                return (
                  <View key={order.id} style={styles.orderCard}>
                    {/* Top Order Identification Bar */}
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderSeqGroup}>
                        <View
                          style={[
                            styles.seqPill,
                            isPending
                              ? styles.seqPillPending
                              : isConfirmed
                              ? styles.seqPillConfirmed
                              : isReady
                              ? styles.seqPillReady
                              : styles.seqPillCompleted,
                          ]}
                        >
                          <Text style={styles.seqPillText}>
                            {order.sequence_number || 'A001'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.orderCodeText}>{order.orderCode}</Text>
                          <Text style={styles.orderElapsedText}>
                            {order.created_at || 'Vừa xong'} • {totalDrinksCount} ly
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.orderStatusBadge,
                          {
                            backgroundColor: isPending
                              ? COLORS.statusPendingBg
                              : isConfirmed
                              ? COLORS.statusConfirmedBg
                              : isReady
                              ? COLORS.statusReadyBg
                              : isCompleted
                              ? COLORS.statusCompletedBg
                              : COLORS.statusCancelledBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.orderStatusBadgeText,
                            {
                              color: isPending
                                ? COLORS.statusPendingText
                                : isConfirmed
                                ? COLORS.statusConfirmedText
                                : isReady
                                ? COLORS.statusReadyText
                                : isCompleted
                                ? COLORS.statusCompletedText
                                : COLORS.statusCancelledText,
                            },
                          ]}
                        >
                          {isPending
                            ? 'Chờ duyệt'
                            : isConfirmed
                            ? 'Đang pha chế'
                            : isReady
                            ? 'Sẵn sàng'
                            : isCompleted
                            ? 'Hoàn tất'
                            : 'Đã hủy'}
                        </Text>
                      </View>
                    </View>

                    {/* Customer Row */}
                    <View style={styles.customerRow}>
                      <View style={styles.customerAvatar}>
                        <Ionicons name="person" size={13} color={COLORS.primary} />
                      </View>
                      <Text style={styles.customerNameText} numberOfLines={1}>
                        {order.customer_name || 'Khách vãng lai'}
                      </Text>
                      <Text style={styles.customerPhoneText}>• {order.phone || '0901 234 567'}</Text>
                    </View>

                    {/* Drinks Checklist */}
                    <View style={styles.drinksBox}>
                      {(isExpanded ? order.items : order.items?.slice(0, 2))?.map((it, idx) => (
                        <View key={idx} style={styles.drinkRow}>
                          <View style={styles.drinkQtyBox}>
                            <Text style={styles.drinkQtyText}>{it.quantity}x</Text>
                          </View>
                          <View style={styles.drinkDetailWrap}>
                            <Text style={styles.drinkNameText}>{it.name}</Text>
                            {it.options ? (
                              <Text style={styles.drinkOptionsText}>{it.options}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}

                      {/* Accordion expand if order has > 2 drinks */}
                      {order.items?.length > 2 && (
                        <TouchableOpacity
                          style={styles.expandToggleBtn}
                          onPress={() => toggleExpand(order.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.expandToggleText}>
                            {isExpanded
                              ? 'Thu gọn danh sách món ▲'
                              : `Xem thêm ${order.items.length - 2} món khác ▼`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Bill & Payment Row */}
                    <View style={styles.billRow}>
                      <View>
                        <Text style={styles.billTotalLabel}>Tổng hóa đơn</Text>
                        <Text style={styles.billTotalValue}>
                          {order.total_amount?.toLocaleString('vi-VN')}đ
                        </Text>
                      </View>

                      <View style={styles.paymentBadgeWrap}>
                        <View
                          style={[
                            styles.paymentMethodPill,
                            {
                              backgroundColor:
                                order.payment_status === 'PAID'
                                  ? COLORS.greenLight
                                  : COLORS.amberLight,
                            },
                          ]}
                        >
                          <Ionicons
                            name={order.payment_status === 'PAID' ? 'checkmark-circle' : 'time'}
                            size={12}
                            color={
                              order.payment_status === 'PAID'
                                ? COLORS.greenDark
                                : COLORS.amberDark
                            }
                          />
                          <Text
                            style={[
                              styles.paymentMethodPillText,
                              {
                                color:
                                  order.payment_status === 'PAID'
                                    ? COLORS.greenDark
                                    : COLORS.amberDark,
                              },
                            ]}
                          >
                            {order.payment_method || 'Tiền mặt'} (
                            {order.payment_status === 'PAID' ? 'Đã thu' : 'Chưa thu'})
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Customer Chat & Live Notes Button */}
                    <View style={styles.cardChatRow}>
                      <TouchableOpacity
                        style={styles.btnChatCustomer}
                        onPress={() => openOrderChat(order)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.btnChatCustomerLeft}>
                          <Ionicons name="chatbubbles-outline" size={15} color={COLORS.primary} />
                          <Text style={styles.btnChatCustomerText}>
                            Trò chuyện với khách {orderMessages[order.id]?.length ? `(${orderMessages[order.id].length})` : ''}
                          </Text>
                        </View>
                        {orderMessages[order.id]?.some((m) => m.senderRole === 'CUSTOMER') ? (
                          <View style={styles.customerNoteBadge}>
                            <Text style={styles.customerNoteBadgeText}>Có tin nhắn</Text>
                          </View>
                        ) : (
                          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Operational Action Buttons (Touch Target >= 44px) */}
                    <View style={styles.actionRow}>
                      {isPending && (
                        <View style={styles.actionButtonsSplit}>
                          <TouchableOpacity
                            style={styles.btnReject}
                            onPress={() => openCancelDialog(order)}
                            disabled={isProcessingThis}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close" size={16} color={COLORS.accentRed} />
                            <Text style={styles.btnRejectText}>Từ chối</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnAccept}
                            onPress={() => handleAcceptOrder(order.id)}
                            disabled={isProcessingThis}
                            activeOpacity={0.88}
                          >
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                            <Text style={styles.btnAcceptText}>
                              {isProcessingThis ? 'Đang nhận...' : 'Nhận đơn pha chế'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {isConfirmed && (
                        <TouchableOpacity
                          style={styles.btnReady}
                          onPress={() => handleReadyOrder(order.id)}
                          disabled={isProcessingThis}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="cafe" size={18} color="#FFF" />
                          <Text style={styles.btnReadyText}>
                            {isProcessingThis ? 'Đang cập nhật...' : 'Pha chế xong ➔ Sẵn sàng'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isReady && (
                        <TouchableOpacity
                          style={styles.btnComplete}
                          onPress={() => handleCompleteOrder(order.id)}
                          disabled={isProcessingThis}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="checkmark-done" size={18} color="#FFF" />
                          <Text style={styles.btnCompleteText}>
                            {isProcessingThis
                              ? 'Đang xử lý...'
                              : 'Giao đồ uống & Thu tiền (Hoàn tất)'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isCompleted && (
                        <View style={styles.completedNotice}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.accentGreen} />
                          <Text style={styles.completedNoticeText}>
                            Đơn hàng đã giao thành công & đóng sổ
                          </Text>
                        </View>
                      )}

                      {isCancelled && (
                        <View style={styles.cancelledNotice}>
                          <Ionicons name="close-circle" size={16} color={COLORS.accentRed} />
                          <Text style={styles.cancelledNoticeText}>
                            Đơn này đã bị hủy bởi nhân viên
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* SECTION 2: QUICK OUT-OF-STOCK INVENTORY */}
      {currentSection === 'INVENTORY' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner notification */}
          <View style={styles.inventoryBanner}>
            <View style={styles.inventoryBannerIconWrap}>
              <Ionicons name="cube" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inventoryBannerTitle}>Báo Hết Món Nhanh Tại Quầy</Text>
              <Text style={styles.inventoryBannerSub}>
                Gạt tắt công tắc để món chuyển sang trạng thái "Tạm hết" ngay lập tức trên app khách hàng.
              </Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm món đồ uống theo tên..."
              placeholderTextColor={COLORS.textMuted}
              value={inventorySearch}
              onChangeText={setInventorySearch}
            />
            {inventorySearch.length > 0 && (
              <TouchableOpacity onPress={() => setInventorySearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick out of stock count pill */}
          <View style={styles.stockSummaryRow}>
            <Text style={styles.stockSummaryText}>
              Đang bán: <Text style={{ fontWeight: '800', color: COLORS.accentGreen }}>{products.length - outOfStockCount}</Text> món
            </Text>
            <Text style={styles.stockSummaryText}>
              Tạm hết: <Text style={{ fontWeight: '800', color: COLORS.accentRed }}>{outOfStockCount}</Text> món
            </Text>
          </View>

          {/* Inventory Items List */}
          <View style={styles.inventoryListWrap}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={styles.inventoryItemCard}>
                <View style={styles.inventoryItemLeft}>
                  <View
                    style={[
                      styles.stockStatusIndicator,
                      {
                        backgroundColor: item.is_available
                          ? COLORS.accentGreen
                          : COLORS.accentRed,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryItemName}>{item.name}</Text>
                    <Text style={styles.inventoryItemMeta}>
                      {item.category_name} • {item.base_price.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>

                <View style={styles.inventoryToggleGroup}>
                  <Text
                    style={[
                      styles.availabilityText,
                      {
                        color: item.is_available
                          ? COLORS.accentGreen
                          : COLORS.accentRed,
                      },
                    ]}
                  >
                    {item.is_available ? 'Còn món' : 'Tạm hết'}
                  </Text>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => {
                      onToggleProductAvailability(item.id);
                      triggerToast(
                        item.is_available
                          ? `Đã đánh dấu "${item.name}" là TẠM HẾT`
                          : `Đã mở bán lại "${item.name}"`
                      );
                    }}
                    trackColor={{ false: COLORS.redLight, true: COLORS.greenLight }}
                    thumbColor={item.is_available ? COLORS.accentGreen : COLORS.accentRed}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* SECTION 3: SHIFT & CASH REGISTER (Ca làm & Két tiền) */}
      {currentSection === 'SHIFT' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Shift Overview Card */}
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeaderRow}>
              <View>
                <Text style={styles.shiftTitle}>Ca Sáng • Đang Trực</Text>
                <Text style={styles.shiftTimeText}>07:00 - 15:00 Hôm nay</Text>
              </View>
              <View style={styles.shiftBadgeActive}>
                <Text style={styles.shiftBadgeText}>Đang làm việc</Text>
              </View>
            </View>

            <View style={styles.shiftDivider} />

            <View style={styles.shiftMoneyRow}>
              <Text style={styles.shiftMoneyLabel}>Tiền mặt đầu ca (Bàn giao)</Text>
              <Text style={styles.shiftMoneyVal}>{openingCash.toLocaleString('vi-VN')}đ</Text>
            </View>

            <View style={styles.shiftMoneyRow}>
              <Text style={styles.shiftMoneyLabel}>Tiền mặt thu từ đơn hôm nay</Text>
              <Text style={[styles.shiftMoneyVal, { color: COLORS.accentGreen }]}>
                +{cashCollected.toLocaleString('vi-VN')}đ
              </Text>
            </View>

            <View style={styles.shiftDivider} />

            <View style={styles.shiftTotalRow}>
              <Text style={styles.shiftTotalLabel}>Dự kiến tiền trong két</Text>
              <Text style={styles.shiftTotalVal}>
                {(openingCash + cashCollected).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>

          {/* Quick Check-out button */}
          <TouchableOpacity
            style={styles.shiftActionBtn}
            onPress={() => triggerToast('Đã ghi nhận kiểm két! Ca làm việc chuẩn xác.')}
            activeOpacity={0.88}
          >
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
            <Text style={styles.shiftActionBtnText}>Kiểm Két & Bàn Giao Ca</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Confirmation Dialog for Rejecting / Cancelling Order */}
      {cancelModalVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <View style={styles.dialogIconBox}>
                  <Ionicons name="alert-circle" size={24} color={COLORS.accentRed} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dialogTitle}>Từ chối đơn #{orderToCancel?.orderCode}</Text>
                  <Text style={styles.dialogSub}>Chọn lý do hủy để thông báo cho khách hàng:</Text>
                </View>
              </View>

              <View style={styles.reasonsList}>
                {CANCEL_REASONS.map((reason) => {
                  const isSelected = selectedCancelReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reasonItem, isSelected && styles.reasonItemActive]}
                      onPress={() => setSelectedCancelReason(reason)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? COLORS.accentRed : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.reasonItemText,
                          isSelected && styles.reasonItemTextActive,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setCancelModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dialogCancelBtnText}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dialogConfirmBtn}
                  onPress={confirmCancelOrder}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dialogConfirmBtnText}>Xác nhận từ chối</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Real-time 2-Way Chat Modal for Staff/Barista */}
      {chatModalVisible && activeChatOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setChatModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.chatModalCard}>
              {/* Header */}
              <View style={styles.chatModalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.chatModalTitle}>
                      Chat đơn #{activeChatOrder.orderCode || activeChatOrder.id}
                    </Text>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveIndicatorDot} />
                      <Text style={styles.liveIndicatorText}>Live</Text>
                    </View>
                  </View>
                  <Text style={styles.chatModalSubtitle}>
                    {activeChatOrder.customer_name || 'Khách hàng'} • {activeChatOrder.phone || '0901 234 567'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.chatModalCloseBtn}
                  onPress={() => setChatModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Messages List */}
              <ScrollView
                style={styles.chatMessagesArea}
                contentContainerStyle={styles.chatMessagesContent}
                showsVerticalScrollIndicator={false}
              >
                {(!orderMessages[activeChatOrder.id] || orderMessages[activeChatOrder.id].length === 0) ? (
                  <View style={styles.chatEmptyWrap}>
                    <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
                    <Text style={styles.chatEmptyText}>Chưa có trao đổi nào</Text>
                    <Text style={styles.chatEmptySub}>
                      Khách hàng hoặc bạn có thể gửi tin nhắn phản hồi trực tiếp tại đây!
                    </Text>
                  </View>
                ) : (
                  orderMessages[activeChatOrder.id].map((m, idx) => {
                    const isStaff = m.senderRole === 'STAFF';
                    return (
                      <View
                        key={m.id || idx}
                        style={[
                          styles.chatBubble,
                          isStaff ? styles.chatBubbleStaff : styles.chatBubbleCustomer,
                        ]}
                      >
                        <Text style={[styles.chatBubbleSender, isStaff && styles.chatBubbleSenderStaff]}>
                          {isStaff ? 'Bạn (Barista)' : `${m.senderName || 'Khách'}`}:
                        </Text>
                        <Text style={[styles.chatBubbleText, isStaff && styles.chatBubbleTextStaff]}>
                          {m.message}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              {/* Quick response suggestions for Staff */}
              <View style={styles.quickReplyRow}>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => handleSendStaffMessage('Quán đã nhận ghi chú của bạn rồi nhé!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyChipText}>+ Đã nhận ghi chú</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => handleSendStaffMessage('Món của bạn đang được pha chế ạ!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyChipText}>+ Đang pha chế</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => handleSendStaffMessage('Món đã sẵn sàng nhận tại quầy ạ!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyChipText}>+ Sẵn sàng lấy</Text>
                </TouchableOpacity>
              </View>

              {/* Chat Input */}
              <View style={styles.staffChatInputRow}>
                <TextInput
                  style={styles.staffChatTextInput}
                  placeholder="Nhập tin nhắn phản hồi cho khách..."
                  placeholderTextColor={COLORS.textMuted}
                  value={staffChatInput}
                  onChangeText={setStaffChatInput}
                />
                <TouchableOpacity
                  style={[
                    styles.staffChatSendBtn,
                    !staffChatInput.trim() && { opacity: 0.5 },
                  ]}
                  onPress={() => handleSendStaffMessage()}
                  disabled={!staffChatInput.trim()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  toastCard: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
    ...SHADOWS.lg,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  storeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  storeStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  staffSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accentOrange,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48.3%',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryCardActivePending: {
    borderColor: COLORS.accentAmber,
    backgroundColor: '#FFFDF9',
  },
  summaryCardActiveConfirmed: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  summaryCardActiveReady: {
    borderColor: COLORS.accentOrange,
    backgroundColor: COLORS.orangeLight,
  },
  summaryCardActiveCompleted: {
    borderColor: COLORS.accentGreen,
    backgroundColor: '#F7FEFA',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValueText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  summaryLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  filterChipBadge: {
    backgroundColor: COLORS.surfaceSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  filterChipBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  filterChipBadgeTextActive: {
    color: '#FFF',
  },
  ordersListWrap: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.card,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderSeqGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seqPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  seqPillPending: {
    backgroundColor: COLORS.amberLight,
  },
  seqPillConfirmed: {
    backgroundColor: COLORS.primaryLight,
  },
  seqPillReady: {
    backgroundColor: COLORS.orangeLight,
  },
  seqPillCompleted: {
    backgroundColor: COLORS.greenLight,
  },
  seqPillText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  orderCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderElapsedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  orderStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  customerPhoneText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  drinksBox: {
    backgroundColor: COLORS.surfaceSoft,
    padding: 12,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  drinkQtyBox: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  drinkQtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  drinkDetailWrap: {
    flex: 1,
  },
  drinkNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  drinkOptionsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  expandToggleBtn: {
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 4,
  },
  expandToggleText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  billTotalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  paymentBadgeWrap: {},
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  paymentMethodPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 2,
  },
  actionButtonsSplit: {
    flexDirection: 'row',
    gap: 10,
  },
  btnReject: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.redLight,
    borderRadius: RADIUS.md,
  },
  btnRejectText: {
    color: COLORS.accentRed,
    fontSize: 13,
    fontWeight: '700',
  },
  btnAccept: {
    flex: 2,
    minHeight: TOUCH_TARGET.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    ...SHADOWS.glowPurple,
  },
  btnAcceptText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnReady: {
    minHeight: TOUCH_TARGET.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.md,
    ...SHADOWS.glowOrange,
  },
  btnReadyText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnComplete: {
    minHeight: TOUCH_TARGET.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.md,
  },
  btnCompleteText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  completedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.greenDark,
  },
  cancelledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  cancelledNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  inventoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  inventoryBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  inventoryBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  stockSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stockSummaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inventoryListWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  inventoryItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  inventoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  stockStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inventoryItemMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inventoryToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  shiftCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.card,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  shiftTimeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shiftBadgeActive: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  shiftBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.greenDark,
  },
  shiftDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  shiftMoneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftMoneyLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  shiftMoneyVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shiftTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  shiftTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  shiftActionBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    ...SHADOWS.glowPurple,
  },
  shiftActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 4,
    ...SHADOWS.lg,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    minHeight: TOUCH_TARGET.minHeight,
  },
  bottomNavItemActive: {},
  navIconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  navBadge: {
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
  navBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bottomNavLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 16,
    ...SHADOWS.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dialogIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  dialogSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonItemActive: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.accentRed,
  },
  reasonItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  reasonItemTextActive: {
    color: COLORS.redDark,
    fontWeight: '700',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogCancelBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.md,
  },
  dialogCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dialogConfirmBtn: {
    flex: 1.5,
    minHeight: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentRed,
    borderRadius: RADIUS.md,
  },
  dialogConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  cardChatRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  btnChatCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5EBE6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E8D5CA',
  },
  btnChatCustomerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  btnChatCustomerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  customerNoteBadge: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  customerNoteBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatModalCard: {
    width: '92%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: COLORS.surfaceSoft,
  },
  chatModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chatModalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatModalCloseBtn: {
    padding: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentRed,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  chatMessagesArea: {
    maxHeight: 280,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatMessagesContent: {
    gap: 8,
    paddingBottom: 10,
  },
  chatEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  chatEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chatEmptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chatBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  chatBubbleCustomer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 2,
  },
  chatBubbleStaff: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 2,
  },
  chatBubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  chatBubbleSenderStaff: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  chatBubbleText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  chatBubbleTextStaff: {
    color: '#FFF',
  },
  quickReplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quickReplyChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0D0C5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  quickReplyChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  staffChatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
    gap: 8,
  },
  staffChatTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  staffChatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
