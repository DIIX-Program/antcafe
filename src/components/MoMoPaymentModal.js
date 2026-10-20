import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/theme';
import { queryMoMoPaymentStatus, simulateMoMoPayment } from '../api/services';
import { subscribeOrderPaymentUpdated } from '../services/socket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MoMoPaymentModal - Màn hình thanh toán trực tiếp qua Cổng MoMo (QR Code & Deep Link)
 */
export default function MoMoPaymentModal({
  visible,
  order,
  momoPayment,
  onClose,
  onPaymentSuccess,
  onSwitchToCash,
  onSwitchToVietQR,
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const orderCode = order?.order_code || order?.orderCode || 'ANT-0000';
  const totalAmount = order?.total_amount || momoPayment?.amount || 0;
  const payUrl = momoPayment?.payUrl || order?.momoPayment?.payUrl;
  const deeplink = momoPayment?.deeplink || order?.momoPayment?.deeplink;

  // URL sinh ảnh QR Code rõ nét từ MoMo Pay URL hoặc Deeplink
  const qrTargetUrl = payUrl || deeplink || `https://test-payment.momo.vn/v2/gateway/pay?orderCode=${orderCode}&amount=${totalAmount}`;
  const qrImageUri = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrTargetUrl)}`;

  // 1. Lắng nghe WebSocket Real-time: Khi MoMo gửi IPN hoặc có cập nhật thanh toán thành công
  useEffect(() => {
    if (!visible) {
      setPaymentSuccess(false);
      setErrorMessage('');
      return;
    }

    const unsubscribe = subscribeOrderPaymentUpdated((updatedOrder) => {
      const updatedCode = updatedOrder.order_code || updatedOrder.orderCode;
      if (updatedCode === orderCode && updatedOrder.payment_status === 'PAID') {
        console.log('[MoMo Modal] Real-time payment success detected via WebSocket for:', orderCode);
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
        onPaymentSuccess(paidOrder || { ...order, payment_status: 'PAID', payment_method: 'Ví MoMo' });
      }
    }, 1200);
  };

  // Mở App MoMo hoặc Web MoMo Gateway
  const handleOpenMoMoApp = async () => {
    try {
      if (deeplink) {
        const canOpen = await Linking.canOpenURL(deeplink).catch(() => false);
        if (canOpen) {
          await Linking.openURL(deeplink);
          return;
        }
      }

      if (payUrl) {
        await Linking.openURL(payUrl);
        return;
      }

      // Fallback: Mở trang chủ MoMo
      await Linking.openURL('https://momo.vn');
    } catch (err) {
      console.warn('[MoMo Modal] Could not open URL:', err.message);
      if (payUrl) {
        Linking.openURL(payUrl).catch(() => {});
      }
    }
  };

  // Tra cứu trạng thái từ Server
  const handleCheckStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    setErrorMessage('');

    try {
      const res = await queryMoMoPaymentStatus(orderCode);
      if (res?.isPaid || res?.paymentStatus === 'PAID') {
        handlePaymentSucceeded(res.order || { ...order, payment_status: 'PAID' });
      } else {
        setErrorMessage('Hệ thống chưa nhận được tiền từ MoMo. Vui lòng thanh toán và thử lại.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi tra cứu thanh toán.');
    } finally {
      setIsChecking(false);
    }
  };

  // Giả lập thanh toán MoMo thành công (Hỗ trợ chấm điểm / chạy thử nghiệm Sandbox)
  const handleSimulatePayment = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setErrorMessage('');

    try {
      const res = await simulateMoMoPayment(orderCode);
      if (res?.success) {
        handlePaymentSucceeded(res.data);
      } else {
        setErrorMessage(res?.message || 'Giả lập thanh toán thất bại.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ khi giả lập.');
    } finally {
      setIsSimulating(false);
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
          {/* Header MoMo */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.momoIconSquare}>
                <Text style={styles.momoIconText}>MoMo</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Thanh toán Ví MoMo</Text>
                <Text style={styles.headerSubtitle}>Cổng MoMo Sandbox API v2</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Trạng thái thành công */}
            {paymentSuccess ? (
              <View style={styles.successStateBox}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark-sharp" size={48} color="#FFF" />
                </View>
                <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                <Text style={styles.successSub}>
                  Đơn hàng #{orderCode} đã được thanh toán an toàn qua Ví MoMo. Ant Coffee đang chuẩn bị đồ uống cho bạn.
                </Text>
                <ActivityIndicator size="small" color="#A50064" style={{ marginTop: 16 }} />
              </View>
            ) : (
              <>
                {/* Thẻ tóm tắt đơn hàng */}
                <View style={styles.billCard}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Mã đơn hàng</Text>
                    <Text style={styles.billValueCode}>#{orderCode}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Khách hàng</Text>
                    <Text style={styles.billValueText}>
                      {order?.customer_name || 'Khách hàng'} • {order?.phone || ''}
                    </Text>
                  </View>
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billTotalLabel}>Số tiền cần thanh toán</Text>
                    <Text style={styles.billTotalValue}>
                      {totalAmount.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>

                {/* Khung mã QR MoMo */}
                <View style={styles.qrCard}>
                  <View style={styles.qrHeaderRow}>
                    <Ionicons name="qr-code-outline" size={18} color="#A50064" />
                    <Text style={styles.qrHeaderTitle}>Quét mã QR để thanh toán</Text>
                  </View>

                  <View style={styles.qrWrapper}>
                    <Image
                      source={{ uri: qrImageUri }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <View style={styles.qrLogoBadge}>
                      <Text style={styles.qrLogoText}>MoMo</Text>
                    </View>
                  </View>

                  <Text style={styles.qrInstruction}>
                    Sử dụng App MoMo hoặc ứng dụng Ngân hàng hỗ trợ VietQR để quét mã
                  </Text>
                </View>

                {/* Thông báo lỗi nếu có */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Nút hành động */}
                <View style={styles.actionButtonGroup}>
                  {/* Nút 1: Mở ứng dụng MoMo */}
                  <TouchableOpacity
                    style={styles.btnOpenMoMo}
                    onPress={handleOpenMoMoApp}
                    activeOpacity={0.85}
                  >
                    <View style={styles.momoMiniLogo}>
                      <Text style={styles.momoMiniLogoText}>MoMo</Text>
                    </View>
                    <Text style={styles.btnOpenMoMoText}>Mở ứng dụng MoMo thanh toán</Text>
                    <Ionicons name="open-outline" size={18} color="#FFF" />
                  </TouchableOpacity>

                  {/* Nút 2: Tra cứu trạng thái thanh toán */}
                  <TouchableOpacity
                    style={styles.btnCheckStatus}
                    onPress={handleCheckStatus}
                    disabled={isChecking}
                    activeOpacity={0.8}
                  >
                    {isChecking ? (
                      <ActivityIndicator size="small" color="#A50064" />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={18} color="#A50064" />
                        <Text style={styles.btnCheckStatusText}>Tôi đã thanh toán • Kiểm tra lại</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Nút 3: Giả lập thanh toán MoMo thành công (Dev/Testing Mode) */}
                  <TouchableOpacity
                    style={styles.btnSimulate}
                    onPress={handleSimulatePayment}
                    disabled={isSimulating}
                    activeOpacity={0.8}
                  >
                    {isSimulating ? (
                      <ActivityIndicator size="small" color="#166534" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={16} color="#16A34A" />
                        <Text style={styles.btnSimulateText}>
                          ⚡ Test Sandbox: Giả lập thanh toán MoMo thành công
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Nút 4: Đổi phương thức thanh toán */}
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {onSwitchToVietQR ? (
                      <TouchableOpacity
                        style={[styles.btnSwitchCash, { borderColor: '#005BAA' }]}
                        onPress={onSwitchToVietQR}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="qr-code-outline" size={16} color="#005BAA" />
                        <Text style={[styles.btnSwitchCashText, { color: '#005BAA' }]}>
                          Đổi sang Chuyển khoản VietQR
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {onSwitchToCash ? (
                      <TouchableOpacity
                        style={styles.btnSwitchCash}
                        onPress={onSwitchToCash}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cash-outline" size={16} color={COLORS.accentGreen} />
                        <Text style={[styles.btnSwitchCashText, { color: COLORS.accentGreen }]}>
                          Đổi sang Tiền mặt khi nhận (COD)
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgLight,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.92,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  momoIconSquare: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: '#A50064',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },
  momoIconText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.xs,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billValueCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  billValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#A50064',
    fontFamily: TYPOGRAPHY.fontFamilyMonospace,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.xs,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  qrHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A50064',
  },
  qrWrapper: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#A50064',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrLogoBadge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#A50064',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  qrLogoText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  qrInstruction: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    maxWidth: 260,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    fontWeight: '500',
  },
  actionButtonGroup: {
    gap: 10,
  },
  btnOpenMoMo: {
    backgroundColor: '#A50064',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  momoMiniLogo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  momoMiniLogoText: {
    color: '#A50064',
    fontSize: 9,
    fontWeight: '900',
  },
  btnOpenMoMoText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnCheckStatus: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#A50064',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
  },
  btnCheckStatusText: {
    color: '#A50064',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSimulate: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
  },
  btnSimulateText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  btnSwitchCash: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  btnSwitchCashText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  successStateBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
