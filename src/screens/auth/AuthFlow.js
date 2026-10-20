import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../../theme/theme';
import { loginUser, registerCustomer } from '../../api/services';

export default function AuthFlow({
  onAuthSuccess,
  onCancel,
  initialScreen = 'LOGIN',
}) {
  // Screens: 'WELCOME' | 'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY_OTP' | 'RESET_PASS' | 'COMPLETE_PROFILE'
  const [screen, setScreen] = useState(initialScreen);

  // Form states
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [favoriteCoffee, setFavoriteCoffee] = useState('Cà phê muối');

  // Timer for OTP
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // Status & Errors
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  const handleStartOtp = () => {
    setCountdown(60);
    setIsCounting(true);
    setScreen('VERIFY_OTP');
  };

  const handleLoginSubmit = async () => {
    setErrorText('');
    if (!phoneOrEmail.trim()) {
      setErrorText('Vui lòng nhập số điện thoại hoặc email');
      return;
    }
    if (!password) {
      setErrorText('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(phoneOrEmail.trim(), password);
      setIsLoading(false);
      if (res.data?.user) {
        onAuthSuccess({
          role: res.data.role,
          user: res.data.user,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Số điện thoại hoặc mật khẩu không chính xác');
    }
  };

  const handleRegisterSubmit = () => {
    setErrorText('');
    if (!fullName.trim()) {
      setErrorText('Vui lòng nhập họ và tên');
      return;
    }
    if (!phoneOrEmail.trim()) {
      setErrorText('Vui lòng nhập số điện thoại nhận hàng');
      return;
    }
    if (password.length < 6) {
      setErrorText('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setErrorText('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreedTerms) {
      setErrorText('Vui lòng đồng ý với điều khoản sử dụng Ant Coffee');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      handleStartOtp();
    }, 400);
  };

  const handleVerifyOtp = () => {
    setErrorText('');
    const code = otpCode.join('');
    if (code.length < 4) {
      setErrorText('Vui lòng nhập đủ 4 số OTP');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (screen === 'VERIFY_OTP' && confirmPassword) {
        setScreen('COMPLETE_PROFILE');
      } else {
        setScreen('RESET_PASS');
      }
    }, 350);
  };

  const handleCompleteProfile = async () => {
    setIsLoading(true);
    try {
      const res = await registerCustomer({
        phone: phoneOrEmail.trim(),
        password: password,
        full_name: fullName.trim(),
        email: phoneOrEmail.includes('@') ? phoneOrEmail.trim() : null,
      });
      setIsLoading(false);
      onAuthSuccess({
        role: 'CUSTOMER',
        user: res.data?.user || {
          name: fullName || 'Khách hàng thân thiết',
          phone: phoneOrEmail,
          favoriteCoffee,
          role: 'CUSTOMER',
        },
      });
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Lỗi khi hoàn tất đăng ký');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Bar with Back & Close */}
      <View style={styles.topBar}>
        {screen !== 'WELCOME' ? (
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => {
              if (screen === 'LOGIN' || screen === 'REGISTER') setScreen('WELCOME');
              else if (screen === 'FORGOT') setScreen('LOGIN');
              else if (screen === 'VERIFY_OTP') setScreen('FORGOT');
              else if (screen === 'RESET_PASS') setScreen('LOGIN');
              else if (screen === 'COMPLETE_PROFILE') setScreen('LOGIN');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primaryDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpacer} />
        )}

        <Image
          source={require('../../../img/logo.png')}
          style={styles.logoTiny}
          resizeMode="contain"
        />

        {onCancel ? (
          <TouchableOpacity style={styles.navIconButton} onPress={onCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpacer} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error notification banner */}
        {errorText ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={COLORS.accentRed} />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {/* SCREEN 1: WELCOME */}
        {screen === 'WELCOME' && (
          <View style={styles.welcomeSection}>
            <View style={styles.heroImageWrap}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&auto=format&fit=crop&q=80',
                }}
                style={styles.heroPhoto}
                resizeMode="cover"
              />
              <View style={styles.heroOverlayPill}>
                <Ionicons name="cafe" size={14} color="#FFF" />
                <Text style={styles.heroOverlayText}>Cà phê rang mộc chuẩn vị</Text>
              </View>
            </View>

            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeTitle}>Ant Coffee & Tea</Text>
              <Text style={styles.welcomeSub}>
                Tận hưởng từng ly cà phê phin đậm đà, trà trái cây tươi mát cùng ưu đãi thành viên hấp dẫn mỗi ngày.
              </Text>
            </View>

            <View style={styles.welcomeBtnCol}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setScreen('LOGIN')}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>Đăng Nhập Ngay</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setScreen('REGISTER')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>Tạo Tài Khoản Khách Hàng Mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCREEN 2: LOGIN */}
        {screen === 'LOGIN' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Chào mừng bạn trở lại!</Text>
            <Text style={styles.screenSub}>
              Nhập số điện thoại hoặc email đã đăng ký để tiếp tục
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại hoặc Email</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="0901 234 567 hoặc email..."
                  placeholderTextColor={COLORS.textMuted}
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => setScreen('FORGOT')} activeOpacity={0.7}>
                <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleLoginSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => setScreen('REGISTER')} activeOpacity={0.7}>
                <Text style={styles.switchAuthLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCREEN 3: REGISTER */}
        {screen === 'REGISTER' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Đăng Ký Tài Khoản</Text>
            <Text style={styles.screenSub}>
              Đăng ký tài khoản khách hàng để nhận mã giảm 30.000đ cho đơn đầu tiên
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại nhận hàng</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="0901 234 567"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu (Tối thiểu 6 ký tự)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Mật khẩu của bạn..."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận lại mật khẩu</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Nhập lại mật khẩu..."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedTerms(!agreedTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={agreedTerms ? 'checkbox' : 'square-outline'}
                size={20}
                color={agreedTerms ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.termsText}>
                Tôi đồng ý với <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Điều khoản dịch vụ</Text> & Chính sách bảo mật của Ant Coffee.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleRegisterSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Đang tạo tài khoản...' : 'Tiếp Tục Xác Thực'}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => setScreen('LOGIN')} activeOpacity={0.7}>
                <Text style={styles.switchAuthLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCREEN 4: FORGOT PASSWORD */}
        {screen === 'FORGOT' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Quên Mật Khẩu?</Text>
            <Text style={styles.screenSub}>
              Nhập số điện thoại hoặc email để nhận mã OTP xác thực khôi phục tài khoản
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại hoặc Email</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="0901 234 567 hoặc email..."
                  placeholderTextColor={COLORS.textMuted}
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartOtp}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Gửi Mã Xác Thực OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 5: VERIFY OTP */}
        {screen === 'VERIFY_OTP' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Xác Thực Mã OTP</Text>
            <Text style={styles.screenSub}>
              Mã gồm 4 chữ số đã được gửi tới{' '}
              <Text style={{ fontWeight: '800', color: COLORS.primaryDark }}>
                {phoneOrEmail || '0901 234 567'}
              </Text>
            </Text>

            <View style={styles.otpBoxesRow}>
              {[0, 1, 2, 3].map((idx) => (
                <TextInput
                  key={idx}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={otpCode[idx]}
                  onChangeText={(val) => {
                    const newOtp = [...otpCode];
                    newOtp[idx] = val;
                    setOtpCode(newOtp);
                  }}
                />
              ))}
            </View>

            <View style={styles.resendRow}>
              {isCounting ? (
                <Text style={styles.resendTimerText}>
                  Gửi lại mã sau <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleStartOtp} activeOpacity={0.7}>
                  <Text style={styles.resendActionLink}>Gửi lại mã OTP ngay</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Đang xác minh...' : 'Xác Minh OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 6: RESET PASSWORD */}
        {screen === 'RESET_PASS' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Đặt Mật Khẩu Mới</Text>
            <Text style={styles.screenSub}>
              Vui lòng thiết lập mật khẩu mới để bảo vệ tài khoản Ant Coffee
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Mật khẩu mới..."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setScreen('LOGIN')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Lưu & Đăng Nhập</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 7: COMPLETE PROFILE */}
        {screen === 'COMPLETE_PROFILE' && (
          <View style={styles.formSection}>
            <Text style={styles.screenHeader}>Hoàn Thiện Hồ Sơ</Text>
            <Text style={styles.screenSub}>
              Chọn sở thích đồ uống để Ant Coffee gợi ý món chuẩn gu cho bạn nhé!
            </Text>

            <View style={styles.choiceGroup}>
              <Text style={styles.label}>Món khoái khẩu của bạn:</Text>
              <View style={styles.pillsWrap}>
                {['Cà phê muối', 'Bạc xỉu ba tầng', 'Trà sữa Ant Signature', 'Trà đào cam sả', 'Matcha đá xay'].map(
                  (drink) => (
                    <TouchableOpacity
                      key={drink}
                      style={[
                        styles.choicePill,
                        favoriteCoffee === drink && styles.choicePillActive,
                      ]}
                      onPress={() => setFavoriteCoffee(drink)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          favoriteCoffee === drink && styles.choicePillTextActive,
                        ]}
                      >
                        {drink}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleCompleteProfile}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Đang hoàn tất...' : 'Bắt Đầu Đặt Đồ Uống'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
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
  navIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySpacer: {
    width: 36,
  },
  logoTiny: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.redLight,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: '700',
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    gap: 16,
  },
  heroImageWrap: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.md,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroOverlayPill: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31, 26, 36, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  heroOverlayText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  welcomeTextWrap: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  welcomeBtnCol: {
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  primaryBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    ...SHADOWS.glowPurple,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  formSection: {
    gap: 14,
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  screenSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    minHeight: 46,
    ...SHADOWS.sm,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  forgotLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  switchAuthText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  switchAuthLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 14,
  },
  otpBox: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
    ...SHADOWS.sm,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  resendTimerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resendActionLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
  },
  choiceGroup: {
    gap: 10,
    marginVertical: 6,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choicePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  choicePillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
});
