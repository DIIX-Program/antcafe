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
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../../theme/theme';
import { loginUser, registerCustomer, loginWithGoogle } from '../../api/services';
import { GOOGLE_AUTH_CONFIG } from '../../config/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const GOOGLE_MOCK_ACCOUNTS = [
  {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana.antcafe@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
  {
    name: 'Khách Hàng Ant Coffee',
    email: 'customer.antcafe@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
];

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

  // Google OAuth State & Real Authentication Request
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState(
    GOOGLE_AUTH_CONFIG.webClientId.includes('sample-client-id') ? '' : GOOGLE_AUTH_CONFIG.webClientId
  );
  const [activeClientId, setActiveClientId] = useState(GOOGLE_AUTH_CONFIG.webClientId);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'antcafe',
    preferLocalhost: true,
  });

  const [authRequest, authResponse, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: activeClientId,
      scopes: GOOGLE_AUTH_CONFIG.scopes,
      responseType: AuthSession.ResponseType.Code,
      redirectUri: redirectUri,
    },
    googleDiscovery
  );

  useEffect(() => {
    if (authResponse?.type === 'success') {
      const { access_token, code } = authResponse.params;
      if (access_token) {
        fetchGoogleUserInfo(access_token);
      } else if (code) {
        handleExchangeCode(code);
      }
    } else if (authResponse?.type === 'error') {
      setIsLoading(false);
      const errDetail =
        authResponse.error?.message ||
        authResponse.params?.error_description ||
        'Đăng nhập Google qua OAuth thất bại. Vui lòng kiểm tra Authorized Redirect URIs trong Google Cloud Console.';
      setErrorText(errDetail);
    } else if (authResponse?.type === 'dismiss' || authResponse?.type === 'cancel') {
      setIsLoading(false);
    }
  }, [authResponse]);

  const handleExchangeCode = async (code) => {
    setIsLoading(true);
    setErrorText('');
    try {
      console.log('[Google Auth] Exchanging auth code for tokens...');
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: activeClientId,
          clientSecret: GOOGLE_AUTH_CONFIG.clientSecret,
          code: code,
          redirectUri: redirectUri,
          extraParams: authRequest?.codeVerifier ? { code_verifier: authRequest.codeVerifier } : undefined,
        },
        googleDiscovery
      );
      if (tokenResult?.accessToken) {
        await fetchGoogleUserInfo(tokenResult.accessToken);
      } else {
        throw new Error('Không nhận được Access Token từ Google');
      }
    } catch (err) {
      console.error('[Google Auth] Code exchange error:', err);
      setIsLoading(false);
      setErrorText(err.message || 'Lỗi khi đổi mã xác thực Google');
    }
  };

  const fetchGoogleUserInfo = async (accessToken) => {
    setIsLoading(true);
    setErrorText('');
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await userInfoRes.json();
      if (googleUser && googleUser.email) {
        const res = await loginWithGoogle({
          email: googleUser.email,
          full_name: googleUser.name || googleUser.given_name || 'Khách hàng Google',
          avatar_url: googleUser.picture || null,
        });
        setIsLoading(false);
        setShowGoogleModal(false);
        if (res.data?.user) {
          onAuthSuccess({
            role: res.data.role || 'CUSTOMER',
            user: res.data.user,
          });
        }
      } else {
        throw new Error('Không lấy được thông tin email từ Google UserInfo API');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Lỗi khi xác thực tài khoản Google');
    }
  };

  const handlePressGoogleLogin = () => {
    setErrorText('');
    setShowGoogleModal(true);
  };

  const handleLaunchGoogleBrowser = async () => {
    setErrorText('');
    console.log('[Google Auth] Launching Google OAuth with Client ID:', activeClientId);
    console.log('[Google Auth] Redirect URI configured:', redirectUri);

    try {
      setIsLoading(true);
      const result = await promptAsync();
      console.log('[Google Auth] promptAsync result:', result);
      if (result?.type !== 'success') {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Không thể mở trình duyệt đăng nhập Google OAuth');
    }
  };

  const handleDirectGoogleLogin = async () => {
    const emailToUse = directGoogleEmail.trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorText('Vui lòng nhập email Google hợp lệ (ví dụ: yourname@gmail.com)');
      return;
    }
    setIsLoading(true);
    setErrorText('');
    try {
      const res = await loginWithGoogle({
        email: emailToUse,
        full_name: emailToUse.split('@')[0],
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      });
      setIsLoading(false);
      setShowGoogleModal(false);
      if (res.data?.user) {
        onAuthSuccess({
          role: res.data.role || 'CUSTOMER',
          user: res.data.user,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const handleSaveAndAuthGoogle = async () => {
    const trimmed = googleClientIdInput.trim();
    if (!trimmed) {
      setErrorText('Vui lòng nhập Google Client ID từ Google Cloud Console');
      return;
    }

    setActiveClientId(trimmed);
    try {
      setIsLoading(true);
      const result = await promptAsync();
      if (result?.type !== 'success') {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Không thể mở trình duyệt đăng nhập Google');
    }
  };

  const handleOpenGoogleBrowserDirectly = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://accounts.google.com/signin');
    } catch (err) {
      setErrorText('Không thể mở trình duyệt: ' + err.message);
    }
  };

  const handleGoogleSelectAccount = async (account) => {
    setIsLoading(true);
    setErrorText('');
    try {
      const res = await loginWithGoogle({
        email: account.email,
        full_name: account.name,
        avatar_url: account.avatar,
      });
      setIsLoading(false);
      setShowGoogleModal(false);
      if (res.data?.user) {
        onAuthSuccess({
          role: res.data.role || 'CUSTOMER',
          user: res.data.user,
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const handleDirectRegister = async () => {
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
          id: Date.now(),
          name: fullName.trim(),
          phone: phoneOrEmail.trim(),
          role: 'CUSTOMER',
          loyalty_points: 50,
        },
      });
    } catch (err) {
      setIsLoading(false);
      setErrorText(err.message || 'Số điện thoại này đã được đăng ký');
    }
  };

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

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handlePressGoogleLogin}
              activeOpacity={0.85}
            >
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
              </View>
              <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
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
            <Text style={styles.screenHeader}>Đăng Ký Tài Khoản Mới</Text>
            <Text style={styles.screenSub}>
              Tạo tài khoản khách hàng để nhận mã giảm 30.000đ và tích điểm thành viên
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

            {/* Nút Tạo tài khoản ngay */}
            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleDirectRegister}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Ngay'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng ký nhanh</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Quick Register Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handlePressGoogleLogin}
              activeOpacity={0.85}
            >
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
              </View>
              <Text style={styles.googleBtnText}>Đăng ký nhanh bằng Google</Text>
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

      {/* Real Google OAuth 2.0 Authentication Modal */}
      <Modal
        visible={showGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.googleModalOverlay}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.googleModalBox}>
              <View style={styles.googleModalHeader}>
                <View style={styles.googleHeaderBadge}>
                  <Ionicons name="logo-google" size={26} color="#EA4335" />
                </View>
                <Text style={styles.googleModalTitle}>Đăng Nhập Google Ant Coffee</Text>
                <Text style={styles.googleModalSub}>
                  Chọn cách thức đăng nhập tài khoản Google của bạn
                </Text>
              </View>

              {/* METHOD 1: Direct Google Email Login (Recommended & Works 100%) */}
              <View style={styles.oauthDirectSection}>
                <View style={styles.oauthLabelRow}>
                  <Ionicons name="mail-outline" size={15} color="#16A34A" />
                  <Text style={[styles.oauthInputLabel, { color: '#16A34A' }]}>
                    CÁCH 1: ĐĂNG NHẬP NHANH BẰNG EMAIL GOOGLE (KHUYÊN DÙNG)
                  </Text>
                </View>
                <Text style={styles.oauthHintTextDirect}>
                  Nhập địa chỉ Gmail của bạn, hệ thống sẽ tự động tạo tài khoản hoặc đăng nhập ngay:
                </Text>
                <View style={styles.oauthEmailRow}>
                  <TextInput
                    style={styles.oauthTextInput}
                    placeholder="vd: tenban@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={directGoogleEmail}
                    onChangeText={setDirectGoogleEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.oauthDirectBtn, isLoading && styles.btnDisabled]}
                    onPress={handleDirectGoogleLogin}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-forward-circle" size={20} color="#FFF" />
                    <Text style={styles.oauthDirectBtnText}>Vào Ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* METHOD 2: Real Google OAuth Browser Flow */}
              <View style={styles.oauthActionsGroup}>
                <View style={styles.oauthLabelRow}>
                  <Ionicons name="globe-outline" size={15} color="#2563EB" />
                  <Text style={[styles.oauthInputLabel, { color: '#2563EB' }]}>
                    CÁCH 2: MỞ TRÌNH DUYỆT GOOGLE OAUTH 2.0 THẬT
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.oauthPrimaryBtn}
                  onPress={handleLaunchGoogleBrowser}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  <Ionicons name="logo-google" size={18} color="#FFF" />
                  <Text style={styles.oauthPrimaryBtnText}>
                    {isLoading ? 'Đang mở trình duyệt...' : 'Mở Trình Duyệt Google OAuth'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Guide: Why Error 400 happens and how to fix */}
              <View style={styles.oauthGuideBox}>
                <View style={styles.oauthGuideHeader}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={[styles.oauthGuideTitle, { color: '#DC2626' }]}>
                    Tại sao bị lỗi "Access blocked: auth error 400"?
                  </Text>
                </View>
                <Text style={styles.oauthGuideStep}>
                  1. Google Cloud Console bắt buộc phải cấp phép chính xác <Text style={{ fontWeight: '700' }}>Redirect URI</Text> cho Client ID.
                </Text>
                <Text style={styles.oauthGuideStep}>
                  2. URI của máy hiện tại:{' '}
                  <Text style={{ fontFamily: TYPOGRAPHY.fontFamilyMonospace, color: '#DC2626', fontWeight: '700' }}>
                    {redirectUri}
                  </Text>
                </Text>
                <Text style={styles.oauthGuideStep}>
                  3. Vào <Text style={{ fontWeight: '700' }}>Google Cloud Console</Text> → APIs & Services → Credentials → Chọn Client ID của bạn → Thêm URI trên vào mục <Text style={{ fontWeight: '700' }}>Authorized redirect URIs</Text> rồi bấm Lưu.
                </Text>
              </View>

              {/* METHOD 3: Quick Demo Accounts */}
              <View style={styles.oauthQuickTestSection}>
                <Text style={styles.oauthQuickTestLabel}>Hoặc chọn nhanh tài khoản thử nghiệm:</Text>
                <View style={styles.oauthQuickPillsRow}>
                  {GOOGLE_MOCK_ACCOUNTS.map((acc, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.oauthQuickPill}
                      onPress={() => handleGoogleSelectAccount(acc)}
                      activeOpacity={0.75}
                    >
                      <Image source={{ uri: acc.avatar }} style={styles.oauthQuickAvatar} />
                      <Text style={styles.oauthQuickName} numberOfLines={1}>
                        {acc.name.split(' ').pop()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {isLoading ? (
                <View style={styles.googleLoadingRow}>
                  <ActivityIndicator size="small" color="#4285F4" />
                  <Text style={styles.googleLoadingText}>Đang xử lý đăng nhập Google...</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.googleCancelBtn}
                onPress={() => setShowGoogleModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.googleCancelText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
    ...SHADOWS.sm,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  googleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  googleModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 22,
    ...SHADOWS.lg,
  },
  googleModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleHeaderBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  googleModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  googleModalSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  googleAccountList: {
    marginBottom: 16,
    gap: 10,
  },
  googleAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
  },
  googleAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  googleAddAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleAccName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  googleAccEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  googleLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  googleLoadingText: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '600',
  },
  googleCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    marginTop: 4,
  },
  googleCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  oauthDirectSection: {
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  oauthHintTextDirect: {
    fontSize: 11,
    color: '#15803D',
    marginBottom: 8,
    lineHeight: 16,
  },
  oauthEmailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  oauthDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  oauthDirectBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  oauthInputSection: {
    marginBottom: 14,
    width: '100%',
  },
  oauthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  oauthInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  oauthTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  oauthHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  oauthActionsGroup: {
    gap: 8,
    marginBottom: 14,
    width: '100%',
  },
  oauthPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  oauthPrimaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  oauthSecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  oauthSecBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  oauthGuideBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
    width: '100%',
  },
  oauthGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  oauthGuideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  oauthGuideStep: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
    marginBottom: 2,
  },
  oauthQuickTestSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginBottom: 8,
    width: '100%',
  },
  oauthQuickTestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  oauthQuickPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  oauthQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  oauthQuickAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  oauthQuickName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
