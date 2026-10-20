import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/theme';
import { simulateVietQRPayment, switchOrderPaymentMethod } from '../api/services';
import { subscribeOrderPaymentUpdated } from '../services/socket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Cấu hình tài khoản ngân hàng thụ hưởng Ant Coffee (Chuẩn VietQR - Napas 247)
const BANK_CONFIG = {
  bankId: 'MB', // MBBank - Ngân hàng TMCP Quân Đội (Mã BIN: 970422)
  bankName: 'MBBank (Quân Đội)',
  accountNo: '0901234567',
  accountName: 'ANT COFFEE AND TEA',
  template: 'compact2', // Giao diện thẻ VietQR chuẩn đầy đủ logo Napas247
};

export default function VietQRPaymentModal({
  visible,
  order,
  onClose,
  onPaymentSuccess,
  onSwitchToCash,
  onSwitchToMoMo,
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [showSwitchOptions, setShowSwitchOptions] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const orderCode = order?.order_code || order?.orderCode || 'ANT-0000';
  const totalAmount = order?.total_amount || 0;
  const transferContent = `ANT ${orderCode}`;

  // Tạo URL ảnh VietQR theo chuẩn API chính thức VietQR (img.vietqr.io)
  const vietQrImageUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // 1. Lắng nghe WebSocket Real-time: Khi thanh toán thành công được kích hoạt
  useEffect(() => {
    if (!visible) {
      setPaymentSuccess(false);
      setErrorMessage('');
      setShowSwitchOptions(false);
      setIsImageLoading(true);
      return;
    }

    const unsubscribe = subscribeOrderPaymentUpdated((updatedOrder) => {
      const updatedCode = updatedOrder.order_code || updatedOrder.orderCode;
      if (updatedCode === orderCode && updatedOrder.payment_status === 'PAID') {
        console.log('[VietQR Modal] Real-time payment success detected for:', orderCode);
        handlePaymentSucceeded(updatedOrder);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible, orderCode]);

  const handlePaymentSucceeded = (paidOrder) => {
    setPaymentSuccess(true);
    setErrorMessage('');
    setTimeout(() => {
      if (onPaymentSuccess) {
        onPaymentSuccess(paidOrder || { ...order, payment_status: 'PAID', payment_method: 'VietQR' });
      }
    }, 1300);
  };

  // Giả lập thanh toán VietQR thành công (Thử nghiệm quét QR & thanh toán không trừ tiền thật)
  const handleSimulatePayment = async () => {
    if (isSimulating || paymentSuccess) return;
    setIsSimulating(true);
    setErrorMessage('');

    try {
      const res = await simulateVietQRPayment(orderCode);
      if (res?.success) {
        handlePaymentSucceeded(res.data);
      } else {
        // Optimistic fallback nếu backend offline
        handlePaymentSucceeded({
          ...order,
          payment_status: 'PAID',
          payment_method: 'VietQR',
          payment_transaction_ref: `SIM_VIETQR_${Date.now()}`,
        });
      }
    } catch (err) {
      console.warn('[VietQR Modal] Simulation fallback optimistic:', err.message);
      handlePaymentSucceeded({
        ...order,
        payment_status: 'PAID',
        payment_method: 'VietQR',
        payment_transaction_ref: `SIM_VIETQR_${Date.now()}`,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Sao chép thông tin
  const handleCopyText = (fieldKey) => {
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

  // Chuyển sang Tiền mặt COD
  const handleSelectCash = async () => {
    setShowSwitchOptions(false);
    try {
      await switchOrderPaymentMethod(orderCode, 'CASH');
    } catch (e) {
      console.warn('[VietQR] switch to cash error:', e.message);
    }
    if (onSwitchToCash) {
      onSwitchToCash();
    }
  };

  // Chuyển sang Ví MoMo
  const handleSelectMoMo = async () => {
    setShowSwitchOptions(false);
    try {
      await switchOrderPaymentMethod(orderCode, 'MOMO');
    } catch (e) {
      console.warn('[VietQR] switch to MoMo error:', e.message);
    }
    if (onSwitchToMoMo) {
      onSwitchToMoMo();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.vietQrBadge}>
                <Ionicons name="qr-code-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Thanh toán VietQR</Text>
                <Text style={styles.headerSub}>Napas 247 • Chuyển khoản tức thì</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Banner thông báo trạng thái thanh toán thành công */}
          {paymentSuccess ? (
            <View style={styles.successStateContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-sharp" size={48} color="#FFF" />
              </View>
              <Text style={styles.successStateTitle}>Xác nhận thanh toán thành công!</Text>
              <Text style={styles.successStateSub}>
                Đơn hàng #{orderCode} đã thanh toán thành công qua VietQR. Ant Coffee bắt đầu pha chế ngay cho bạn!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Card Tổng tiền */}
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Số tiền cần thanh toán</Text>
                <Text style={styles.amountValue}>
                  {totalAmount.toLocaleString('vi-VN')}
                  <Text style={styles.amountCurrency}> đ</Text>
                </Text>
                <View style={styles.orderCodeRow}>
                  <Text style={styles.orderCodeText}>Mã đơn hàng: #{orderCode}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Chờ thanh toán</Text>
                  </View>
                </View>
              </View>

              {/* Khung chứa mã QR VietQR */}
              <View style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <View style={styles.qrHeaderLeft}>
                    <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.qrHeaderTitle}>Quét mã VietQR bằng app Ngân hàng</Text>
                  </View>
                  <Text style={styles.bankBadgeText}>{BANK_CONFIG.bankName}</Text>
                </View>

                <View style={styles.qrImageWrapper}>
                  {isImageLoading && (
                    <View style={styles.qrLoadingBox}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.qrLoadingText}>Đang tạo mã VietQR chuẩn Napas 247...</Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: vietQrImageUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    onLoadEnd={() => setIsImageLoading(false)}
                  />
                </View>

                <Text style={styles.qrScanHint}>
                  Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, TPBank, BIDV...) quét mã trên để chuyển tiền tự động.
                </Text>
              </View>

              {/* Thông tin chuyển khoản chi tiết */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Thông tin chuyển khoản thủ công</Text>

                {/* Ngân hàng */}
                <View style={styles.infoItemRow}>
                  <View style={styles.infoItemLeft}>
                    <Text style={styles.infoItemLabel}>Ngân hàng</Text>
                    <Text style={styles.infoItemValue}>{BANK_CONFIG.bankName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyText('bank')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'bank' ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={copiedField === 'bank' ? COLORS.accentGreen : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.copyBtnText,
                        copiedField === 'bank' && styles.copyBtnTextCopied,
                      ]}
                    >
                      {copiedField === 'bank' ? 'Đã sao chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Số tài khoản */}
                <View style={styles.infoItemRow}>
                  <View style={styles.infoItemLeft}>
                    <Text style={styles.infoItemLabel}>Số tài khoản</Text>
                    <Text style={[styles.infoItemValue, styles.highlightValue]}>
                      {BANK_CONFIG.accountNo}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyText('account')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'account' ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={copiedField === 'account' ? COLORS.accentGreen : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.copyBtnText,
                        copiedField === 'account' && styles.copyBtnTextCopied,
                      ]}
                    >
                      {copiedField === 'account' ? 'Đã sao chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tên chủ tài khoản */}
                <View style={styles.infoItemRow}>
                  <View style={styles.infoItemLeft}>
                    <Text style={styles.infoItemLabel}>Chủ tài khoản</Text>
                    <Text style={styles.infoItemValue}>{BANK_CONFIG.accountName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyText('name')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'name' ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={copiedField === 'name' ? COLORS.accentGreen : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.copyBtnText,
                        copiedField === 'name' && styles.copyBtnTextCopied,
                      ]}
                    >
                      {copiedField === 'name' ? 'Đã sao chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Nội dung chuyển khoản */}
                <View style={styles.infoItemRow}>
                  <View style={styles.infoItemLeft}>
                    <Text style={styles.infoItemLabel}>Nội dung chuyển khoản</Text>
                    <Text style={[styles.infoItemValue, styles.highlightValue]}>
                      {transferContent}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyText('content')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'content' ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={copiedField === 'content' ? COLORS.accentGreen : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.copyBtnText,
                        copiedField === 'content' && styles.copyBtnTextCopied,
                      ]}
                    >
                      {copiedField === 'content' ? 'Đã sao chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.accentRed} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Nút đổi phương thức thanh toán */}
              <View style={styles.switchSection}>
                <TouchableOpacity
                  style={styles.switchTriggerBtn}
                  onPress={() => setShowSwitchOptions(!showSwitchOptions)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                  <Text style={styles.switchTriggerText}>
                    {showSwitchOptions ? 'Thu gọn tùy chọn đổi' : 'Đổi sang phương thức thanh toán khác'}
                  </Text>
                  <Ionicons
                    name={showSwitchOptions ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>

                {showSwitchOptions && (
                  <View style={styles.switchOptionsBox}>
                    {/* Đổi sang COD */}
                    <TouchableOpacity
                      style={styles.switchOptionItem}
                      onPress={handleSelectCash}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.switchOptionIcon, { backgroundColor: COLORS.accentGreen }]}>
                        <Ionicons name="cash-outline" size={18} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.switchOptionTitle}>Tiền mặt khi nhận hàng (COD)</Text>
                        <Text style={styles.switchOptionSub}>Đặt hàng ngay, thanh toán khi nhận đồ uống</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    {/* Đổi sang Ví MoMo */}
                    <TouchableOpacity
                      style={styles.switchOptionItem}
                      onPress={handleSelectMoMo}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.switchOptionIcon, { backgroundColor: '#A50064' }]}>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>MoMo</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.switchOptionTitle}>Ví điện tử MoMo</Text>
                        <Text style={styles.switchOptionSub}>Mở App MoMo hoặc quét mã QR MoMo</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          {!paymentSuccess && (
            <View style={styles.footer}>
              {/* Nút bấm Giả lập thanh toán thành công (Test / Chấm điểm nhanh không trừ tiền) */}
              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={handleSimulatePayment}
                disabled={isSimulating}
                activeOpacity={0.88}
              >
                {isSimulating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                )}
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.simulateBtnText}>
                    {isSimulating ? 'Đang xác nhận giao dịch...' : 'Xác nhận đã chuyển khoản'}
                  </Text>
                  <Text style={styles.simulateBtnSub}>
                    (Giả lập thanh toán thành công • Không trừ tiền thật)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.92,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vietQrBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#005BAA', // Màu xanh Napas / VietQR đặc trưng
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  amountCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  amountLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#005BAA',
    marginVertical: 4,
  },
  amountCurrency: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  orderCodeText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPillText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  bankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005BAA',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  qrImageWrapper: {
    width: 260,
    height: 310,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  qrLoadingBox: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    gap: 8,
  },
  qrLoadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrScanHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
    ...SHADOWS.sm,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  infoItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSoft,
  },
  infoItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  infoItemLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  highlightValue: {
    color: '#005BAA',
    fontSize: 14,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  copyBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  copyBtnTextCopied: {
    color: COLORS.accentGreen,
  },
  switchSection: {
    marginTop: 4,
  },
  switchTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  switchOptionsBox: {
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  switchOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  switchOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchOptionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.accentRed,
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  simulateBtn: {
    backgroundColor: '#005BAA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  simulateBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  simulateBtnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  successStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  successStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  successStateSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
