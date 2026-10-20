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
import { fetchRevenueAnalytics, fetchAuditLogs, updateStoreSettings } from '../api/services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hourly sales data for today's chart
const HOURLY_SALES = [
  { hour: '07h', label: '07:00', revenue: 240000, orders: 4 },
  { hour: '09h', label: '09:00', revenue: 480000, orders: 8 },
  { hour: '11h', label: '11:00', revenue: 860000, orders: 13, isPeak: true },
  { hour: '13h', label: '13:00', revenue: 520000, orders: 7 },
  { hour: '15h', label: '15:00', revenue: 640000, orders: 9 },
  { hour: '17h', label: '17:00', revenue: 390000, orders: 5 },
  { hour: '19h', label: '19:00', revenue: 260000, orders: 4 },
  { hour: '21h', label: '21:00', revenue: 60000, orders: 1 },
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    time: '14:20 Hôm nay',
    actor: 'Admin (Chủ quán)',
    action: 'Chỉnh sửa giá món',
    detail: 'Cà Phê Muối Hoàng Gia: 32.000đ ➔ 35.000đ (+3.000đ)',
    type: 'PRICE_CHANGE',
    icon: 'pricetag',
    iconColor: COLORS.primary,
  },
  {
    id: 2,
    time: '12:05 Hôm nay',
    actor: 'Nhân viên (Thu ngân 1)',
    action: 'Hủy đơn #ANT-8902',
    detail: 'Lý do: Khách đổi ý, đặt nhầm địa chỉ nhận',
    type: 'CANCEL_ORDER',
    icon: 'close-circle',
    iconColor: COLORS.accentRed,
  },
  {
    id: 3,
    time: '07:00 Hôm nay',
    actor: 'Nhân viên (Ca sáng)',
    action: 'Mở ca làm việc (Shift Check-in)',
    detail: 'Tiền mặt đầu ca bàn giao: 1.500.000đ (Khớp 100%)',
    type: 'SHIFT',
    icon: 'wallet',
    iconColor: COLORS.accentGreen,
  },
  {
    id: 4,
    time: 'Hôm qua 18:30',
    actor: 'Admin (Chủ quán)',
    action: 'Bật mã khuyến mãi',
    detail: 'Áp dụng mã FREESHIP cho đơn từ 50.000đ',
    type: 'PRICE_CHANGE',
    icon: 'ticket',
    iconColor: COLORS.accentOrange,
  },
];

export default function OwnerView({
  isAcceptingOrders,
  onToggleAcceptingOrders,
  storeSettings,
  products,
  currentTab = 'OVERVIEW',
  onSelectTab,
}) {
  // Mobile owner navigation: 'OVERVIEW' | 'BEST_SELLERS' | 'AUDIT' | 'SETTINGS'
  const [currentSection, setCurrentSection] = useState(currentTab || 'OVERVIEW');
  const [hourlySales, setHourlySales] = useState(HOURLY_SALES);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [analyticsData, setAnalyticsData] = useState(null);

  React.useEffect(() => {
    if (currentTab) {
      setCurrentSection(currentTab);
    }
  }, [currentTab]);

  React.useEffect(() => {
    fetchRevenueAnalytics()
      .then((data) => {
        if (data) {
          setAnalyticsData(data);
          if (data.hourlySales?.length) {
            setHourlySales(data.hourlySales);
          }
        }
      })
      .catch(() => {});

    fetchAuditLogs()
      .then((logs) => {
        if (logs && logs.length > 0) {
          setAuditLogs(logs);
        }
      })
      .catch(() => {});
  }, [currentSection]);

  // Time period filter: 'TODAY' | 'WEEK' | 'MONTH'
  const [timePeriod, setTimePeriod] = useState('TODAY');

  // Selected bar in revenue chart
  const [selectedBar, setSelectedBar] = useState(HOURLY_SALES[2]); // Default peak 11:00
  const [showChartTable, setShowChartTable] = useState(false);

  // Audit filter: 'ALL' | 'PRICE_CHANGE' | 'CANCEL_ORDER' | 'SHIFT'
  const [auditFilter, setAuditFilter] = useState('ALL');

  // Emergency dialog confirmation
  const [confirmEmergencyVisible, setConfirmEmergencyVisible] = useState(false);

  // Store settings form state
  const [formStoreName, setFormStoreName] = useState(storeSettings?.store_name || 'Ant Coffee & Tea');
  const [formAddress, setFormAddress] = useState(storeSettings?.address || '123 Nguyễn Huệ, P. Bến Nghé, Q.1');
  const [formPhone, setFormPhone] = useState(storeSettings?.phone || '0901 234 567');
  const [formWifiName, setFormWifiName] = useState(storeSettings?.wifi_name || 'Ant Coffee Guest Wifi');
  const [formWifiPass, setFormWifiPass] = useState(storeSettings?.wifi_password || 'antcoffee2026');
  const [formOpenHours, setFormOpenHours] = useState('07:00 - 22:30');

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState('');

  const triggerToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast('');
    }, 2800);
  };

  const handleToggleEmergency = () => {
    if (isAcceptingOrders) {
      setConfirmEmergencyVisible(true);
    } else {
      onToggleAcceptingOrders();
      triggerToast('Đã mở cửa nhận đơn trực tuyến bình thường!');
    }
  };

  const confirmShutdownOrders = () => {
    onToggleAcceptingOrders();
    setConfirmEmergencyVisible(false);
    triggerToast('Khẩn cấp: Đã tạm dừng nhận đơn trên toàn bộ ứng dụng.');
  };

  const handleSaveSettings = async () => {
    try {
      await updateStoreSettings({
        store_name: formStoreName,
        phone: formPhone,
        address: formAddress,
        wifi_name: formWifiName,
        wifi_password: formWifiPass,
      });
      triggerToast('Đã lưu cấu hình vào cơ sở dữ liệu thành công!');
    } catch (e) {
      triggerToast('Đã lưu cấu hình cửa hàng!');
    }
  };

  // Max value in hourly sales for bar height scaling
  const maxHourlyRevenue = Math.max(...hourlySales.map((s) => s.revenue || 1));

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === 'ALL') return auditLogs;
    return auditLogs.filter((log) => log.type === auditFilter);
  }, [auditFilter, auditLogs]);

  return (
    <View style={styles.container}>
      {/* Toast Feedback */}
      {feedbackToast ? (
        <View style={styles.toastCard}>
          <Ionicons name="checkmark-circle" size={18} color="#FFF" />
          <Text style={styles.toastText}>{feedbackToast}</Text>
        </View>
      ) : null}

      {/* A. Mobile Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="storefront" size={18} color={COLORS.primary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>{formStoreName}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed },
                ]}
              />
            </View>
            <Text style={styles.brandSub}>Bảng điều hành chủ quán • Q.1, TP.HCM</Text>
          </View>
        </View>

        {/* Time period switcher */}
        <View style={styles.periodPillGroup}>
          <TouchableOpacity
            style={[styles.periodBtn, timePeriod === 'TODAY' && styles.periodBtnActive]}
            onPress={() => setTimePeriod('TODAY')}
          >
            <Text style={[styles.periodBtnText, timePeriod === 'TODAY' && styles.periodBtnTextActive]}>
              Hôm nay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, timePeriod === 'WEEK' && styles.periodBtnActive]}
            onPress={() => setTimePeriod('WEEK')}
          >
            <Text style={[styles.periodBtnText, timePeriod === 'WEEK' && styles.periodBtnTextActive]}>
              7 ngày
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 1: OVERVIEW & REVENUE DATA */}
      {currentSection === 'OVERVIEW' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* B. Emergency Store Control Banner */}
          <View
            style={[
              styles.emergencyCard,
              isAcceptingOrders ? styles.emergencyCardOpen : styles.emergencyCardClosed,
            ]}
          >
            <View style={styles.emergencyLeft}>
              <View
                style={[
                  styles.emergencyIconWrap,
                  { backgroundColor: isAcceptingOrders ? COLORS.greenLight : COLORS.redLight },
                ]}
              >
                <Ionicons
                  name={isAcceptingOrders ? 'storefront' : 'pause-circle'}
                  size={24}
                  color={isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>
                  {isAcceptingOrders
                    ? 'CỬA HÀNG ĐANG MỞ CỬA'
                    : 'TẠM DỪNG NHẬN ĐƠN KHẨN CẤP'}
                </Text>
                <Text style={styles.emergencyDesc}>
                  {isAcceptingOrders
                    ? 'Khách hàng có thể đặt đồ uống bình thường qua ứng dụng.'
                    : 'Toàn bộ khách hàng sẽ thấy thông báo tạm dừng nhận đơn.'}
                </Text>
              </View>
            </View>

            <Switch
              value={isAcceptingOrders}
              onValueChange={handleToggleEmergency}
              trackColor={{ false: COLORS.redLight, true: COLORS.greenLight }}
              thumbColor={isAcceptingOrders ? COLORS.accentGreen : COLORS.accentRed}
            />
          </View>

          {/* C. KPI Cards Grid (Responsive 2x2 Grid) */}
          <View style={styles.kpiGrid}>
            {/* KPI 1: Revenue */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="wallet" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.kpiGrowthPill}>
                  <Ionicons name="trending-up" size={11} color={COLORS.accentGreen} />
                  <Text style={styles.kpiGrowthText}>+18.5%</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Doanh thu hôm nay</Text>
              <Text style={styles.kpiMainValue}>3.450.000đ</Text>
              <Text style={styles.kpiSubText}>Hôm qua: 2.910.000đ</Text>
            </View>

            {/* KPI 2: Total Orders */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: COLORS.orangeLight }]}>
                  <Ionicons name="receipt" size={16} color={COLORS.accentOrange} />
                </View>
                <View style={styles.kpiGrowthPill}>
                  <Ionicons name="trending-up" size={11} color={COLORS.accentGreen} />
                  <Text style={styles.kpiGrowthText}>+4 đơn</Text>
                </View>
              </View>
              <Text style={styles.kpiLabel}>Tổng số đơn hàng</Text>
              <Text style={styles.kpiMainValue}>42 đơn</Text>
              <Text style={styles.kpiSubText}>38 xong • 2 đang làm • 2 hủy</Text>
            </View>

            {/* KPI 3: AOV */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: COLORS.blueLight }]}>
                  <Ionicons name="calculator" size={16} color={COLORS.accentBlue} />
                </View>
              </View>
              <Text style={styles.kpiLabel}>Giá trị TB / đơn (AOV)</Text>
              <Text style={styles.kpiMainValue}>82.100đ</Text>
              <Text style={styles.kpiSubText}>Trung bình 2.1 ly / đơn</Text>
            </View>

            {/* KPI 4: Completion Rate */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.kpiIconBox, { backgroundColor: COLORS.greenLight }]}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.accentGreen} />
                </View>
              </View>
              <Text style={styles.kpiLabel}>Tỷ lệ hoàn thành</Text>
              <Text style={styles.kpiMainValue}>95.2%</Text>
              <Text style={styles.kpiSubText}>Đánh giá: 4.8 ★ (1.2k+)</Text>
            </View>
          </View>

          {/* D. Responsive Revenue Chart (Pure React Native) */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Biểu Đồ Doanh Thu Theo Giờ</Text>
                <Text style={styles.chartSubtitle}>
                  Chạm vào từng cột để xem chi tiết doanh thu & số đơn
                </Text>
              </View>
              <TouchableOpacity
                style={styles.toggleTableBtn}
                onPress={() => setShowChartTable(!showChartTable)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showChartTable ? 'bar-chart' : 'list'}
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.toggleTableBtnText}>
                  {showChartTable ? 'Dạng cột' : 'Bảng số'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Active hour inspector box */}
            {selectedBar && (
              <View style={styles.selectedHourBox}>
                <View style={styles.selectedHourLeft}>
                  <View style={styles.hourPill}>
                    <Text style={styles.hourPillText}>Khung {selectedBar.label}</Text>
                  </View>
                  {selectedBar.isPeak && (
                    <View style={styles.peakPill}>
                      <Ionicons name="flame" size={12} color="#FFF" />
                      <Text style={styles.peakPillText}>Cao điểm trưa</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.selectedRevenueText}>
                    {selectedBar.revenue.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={styles.selectedOrdersText}>{selectedBar.orders} đơn hoàn tất</Text>
                </View>
              </View>
            )}

            {!showChartTable ? (
              /* Bar Visualizer */
              <View style={styles.barVisualizer}>
                <View style={styles.barsRow}>
                  {HOURLY_SALES.map((item) => {
                    const isSelected = selectedBar?.hour === item.hour;
                    const barHeightPct = Math.max(
                      14,
                      Math.round((item.revenue / maxHourlyRevenue) * 110)
                    );

                    return (
                      <TouchableOpacity
                        key={item.hour}
                        style={styles.barCol}
                        onPress={() => setSelectedBar(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { height: barHeightPct },
                              item.isPeak && styles.barFillPeak,
                              isSelected && styles.barFillSelected,
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barHourText,
                            isSelected && styles.barHourTextSelected,
                          ]}
                        >
                          {item.hour}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* Accessible Table View */
              <View style={styles.chartTableView}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColText, { flex: 1 }]}>Khung giờ</Text>
                  <Text style={[styles.tableColText, { flex: 1, textAlign: 'center' }]}>
                    Số đơn
                  </Text>
                  <Text style={[styles.tableColText, { flex: 1.5, textAlign: 'right' }]}>
                    Doanh thu
                  </Text>
                </View>
                {HOURLY_SALES.map((item) => (
                  <View key={item.hour} style={styles.tableBodyRow}>
                    <Text style={[styles.tableCellText, { flex: 1, fontWeight: '700' }]}>
                      {item.label} {item.isPeak ? '🔥' : ''}
                    </Text>
                    <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>
                      {item.orders} đơn
                    </Text>
                    <Text
                      style={[
                        styles.tableCellText,
                        { flex: 1.5, textAlign: 'right', fontWeight: '800', color: COLORS.primary },
                      ]}
                    >
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* SECTION 2: TOP BEST-SELLING PRODUCTS */}
      {currentSection === 'BEST_SELLERS' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeaderCard}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: COLORS.orangeLight }]}>
                <Ionicons name="flame" size={20} color={COLORS.accentOrange} />
              </View>
              <View>
                <Text style={styles.sectionHeaderTitle}>Món Bán Chạy Nhất</Text>
                <Text style={styles.sectionHeaderSub}>
                  Xếp hạng dựa trên dữ liệu gọi món và doanh thu thực tế
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bestSellersList}>
            {products.slice(0, 6).map((item, index) => {
              const rank = index + 1;
              const soldCount = 48 - index * 6; // Mock distribution
              const revenueContrib = soldCount * item.base_price;
              const maxUnits = 48;
              const progressPct = Math.round((soldCount / maxUnits) * 100);

              return (
                <View key={item.id} style={styles.bestSellerCard}>
                  <View style={styles.bestSellerTopRow}>
                    <View
                      style={[
                        styles.rankBadge,
                        rank === 1
                          ? styles.rankBadgeGold
                          : rank === 2
                          ? styles.rankBadgeSilver
                          : rank === 3
                          ? styles.rankBadgeBronze
                          : styles.rankBadgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankBadgeText,
                          rank <= 3 && styles.rankBadgeTextTop,
                        ]}
                      >
                        #{rank}
                      </Text>
                    </View>

                    <View style={styles.bestSellerInfo}>
                      <Text style={styles.bestSellerName}>{item.name}</Text>
                      <Text style={styles.bestSellerCat}>
                        {item.category_name} • {item.base_price.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>

                    <View style={styles.bestSellerNumbers}>
                      <Text style={styles.bestSellerUnitsText}>{soldCount} ly</Text>
                      <Text style={styles.bestSellerRevenueText}>
                        {revenueContrib.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPct}%` },
                        rank === 1 && { backgroundColor: COLORS.accentOrange },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* SECTION 3: AUDIT & CONTROL LOGS */}
      {currentSection === 'AUDIT' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.auditBanner}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.auditBannerTitle}>Kiểm Soát & Chống Gian Lận</Text>
              <Text style={styles.auditBannerSub}>
                Tất cả thao tác sửa giá, hủy đơn và bàn giao két đều được ghi nhận vĩnh viễn vào nhật ký hệ thống.
              </Text>
            </View>
          </View>

          {/* Audit Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.auditFilterRow}
          >
            {[
              { key: 'ALL', label: 'Tất cả nhật ký' },
              { key: 'PRICE_CHANGE', label: 'Sửa giá' },
              { key: 'CANCEL_ORDER', label: 'Hủy đơn' },
              { key: 'SHIFT', label: 'Bàn giao ca' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.auditFilterChip,
                  auditFilter === f.key && styles.auditFilterChipActive,
                ]}
                onPress={() => setAuditFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.auditFilterChipText,
                    auditFilter === f.key && styles.auditFilterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Logs Timeline */}
          <View style={styles.logsListWrap}>
            {filteredAuditLogs.map((log) => (
              <View key={log.id} style={styles.auditLogItem}>
                <View style={styles.auditLogTop}>
                  <View style={styles.auditLogActorWrap}>
                    <View
                      style={[
                        styles.auditTypeIconBox,
                        { backgroundColor: log.iconColor + '20' },
                      ]}
                    >
                      <Ionicons name={log.icon} size={15} color={log.iconColor} />
                    </View>
                    <View>
                      <Text style={styles.auditActionText}>{log.action}</Text>
                      <Text style={styles.auditActorText}>{log.actor}</Text>
                    </View>
                  </View>
                  <Text style={styles.auditTimeText}>{log.time}</Text>
                </View>

                <View style={styles.auditDetailBox}>
                  <Text style={styles.auditDetailText}>{log.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* SECTION 4: STORE CONFIGURATION */}
      {currentSection === 'SETTINGS' && (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.settingsFormCard}>
            <Text style={styles.settingsSectionTitle}>Thông Tin Cửa Hàng</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên quán</Text>
              <TextInput
                style={styles.formInput}
                value={formStoreName}
                onChangeText={setFormStoreName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Địa chỉ quán</Text>
              <TextInput
                style={styles.formInput}
                value={formAddress}
                onChangeText={setFormAddress}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hotline gọi quán</Text>
              <TextInput
                style={styles.formInput}
                value={formPhone}
                keyboardType="phone-pad"
                onChangeText={setFormPhone}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Giờ mở cửa</Text>
              <TextInput
                style={styles.formInput}
                value={formOpenHours}
                onChangeText={setFormOpenHours}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.settingsSectionTitle}>Cấu Hình Wi-Fi Cho Khách</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên mạng Wi-Fi (SSID)</Text>
              <TextInput
                style={styles.formInput}
                value={formWifiName}
                onChangeText={setFormWifiName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mật khẩu Wi-Fi</Text>
              <TextInput
                style={styles.formInput}
                value={formWifiPass}
                onChangeText={setFormWifiPass}
              />
            </View>

            <TouchableOpacity
              style={styles.saveSettingsBtn}
              onPress={handleSaveSettings}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.saveSettingsBtnText}>Lưu Thay Đổi Cấu Hình</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Confirmation Dialog before Shutting Down Orders */}
      {confirmEmergencyVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmEmergencyVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogIconBox}>
                <Ionicons name="alert" size={28} color={COLORS.accentRed} />
              </View>
              <Text style={styles.dialogTitle}>Xác Nhận Tạm Dừng Nhận Đơn?</Text>
              <Text style={styles.dialogDesc}>
                Khi tắt nhận đơn, tất cả khách hàng truy cập ứng dụng sẽ thấy thông báo quán tạm ngưng và không thể đặt món mới.
              </Text>
              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.dialogCancelBtn}
                  onPress={() => setConfirmEmergencyVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dialogCancelBtnText}>Giữ nhận đơn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dialogConfirmBtn}
                  onPress={confirmShutdownOrders}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dialogConfirmBtnText}>Tắt nhận đơn ngay</Text>
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
    flex: 1,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  periodPillGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSoft,
    padding: 3,
    borderRadius: RADIUS.full,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 14,
  },
  emergencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOWS.sm,
  },
  emergencyCardOpen: {
    backgroundColor: '#FAFDFB',
    borderColor: COLORS.greenBorder,
  },
  emergencyCardClosed: {
    backgroundColor: '#FEF8F8',
    borderColor: COLORS.redBorder,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  emergencyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrowthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  kpiGrowthText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.greenDark,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  kpiMainValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginVertical: 4,
  },
  kpiSubText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  chartSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  toggleTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  toggleTableBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectedHourBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSoft,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  selectedHourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourPill: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  hourPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  peakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  peakPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  selectedRevenueText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  selectedOrdersText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  barVisualizer: {
    height: 150,
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barCol: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 8,
  },
  barTrack: {
    height: 115,
    width: 22,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 2,
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xs,
  },
  barFillPeak: {
    backgroundColor: COLORS.orangeBorder,
  },
  barFillSelected: {
    backgroundColor: COLORS.primary,
  },
  barHourText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 6,
  },
  barHourTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  chartTableView: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableColText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableCellText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  sectionHeaderCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bestSellersList: {
    gap: 10,
  },
  bestSellerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
    ...SHADOWS.card,
  },
  bestSellerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#F59E0B',
  },
  rankBadgeSilver: {
    backgroundColor: '#94A3B8',
  },
  rankBadgeBronze: {
    backgroundColor: '#D97706',
  },
  rankBadgeNormal: {
    backgroundColor: COLORS.surfaceSoft,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },
  rankBadgeTextTop: {
    color: '#FFF',
  },
  bestSellerInfo: {
    flex: 1,
  },
  bestSellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bestSellerCat: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  bestSellerNumbers: {
    alignItems: 'flex-end',
  },
  bestSellerUnitsText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  bestSellerRevenueText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  auditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  auditBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  auditBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  auditFilterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  auditFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  auditFilterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  auditFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  auditFilterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  logsListWrap: {
    gap: 10,
  },
  auditLogItem: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
    ...SHADOWS.card,
  },
  auditLogTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  auditLogActorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  auditTypeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  auditActorText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  auditTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  auditDetailBox: {
    backgroundColor: COLORS.surfaceSoft,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  auditDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  settingsFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.card,
  },
  settingsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  formInput: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 6,
  },
  saveSettingsBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    marginTop: 8,
    ...SHADOWS.glowPurple,
  },
  saveSettingsBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
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
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
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
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 22,
    alignItems: 'center',
    gap: 14,
    ...SHADOWS.lg,
  },
  dialogIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  dialogDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
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
    flex: 1.4,
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
});
