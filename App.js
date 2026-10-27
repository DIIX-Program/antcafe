import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  AppState,
  NativeModules,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, GLASS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from './src/theme/theme';
import {
  STORE_SETTINGS,
  CATEGORIES as INITIAL_CATEGORIES,
  PRODUCTS as INITIAL_PRODUCTS,
  ADDRESSES,
  INITIAL_ORDERS,
  VOUCHERS,
} from './src/data/mockData';

import {
  fetchStoreStatus,
  toggleStoreAcceptingOrders,
  fetchCategories,
  fetchProducts,
  fetchAllOrders,
  checkoutOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  toggleProductAvailability as apiToggleAvailability,
  fetchCustomerAddresses,
  fetchNotifications,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from './src/api/services';
import { getAuthToken, setAuthToken } from './src/api/client';

import {
  initSocketClient,
  subscribeOrderCreated,
  subscribeOrderStatusUpdated,
  subscribeOrderPaymentUpdated,
  subscribeStoreStatusUpdated,
  subscribeProductAvailabilityUpdated,
  subscribeConnectionStatus,
  subscribeNotification,
} from './src/services/socket';

import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  presentLocalNotification,
} from './src/services/notifications';

import Header from './src/components/Header';
import ProductCard from './src/components/ProductCard';
import ProductDetailModal from './src/components/ProductDetailModal';
import CartModal from './src/components/CartModal';
import OrderTrackingModal from './src/components/OrderTrackingModal';
import OrderSuccessModal from './src/components/OrderSuccessModal';
import MoMoPaymentModal from './src/components/MoMoPaymentModal';
import VietQRPaymentModal from './src/components/VietQRPaymentModal';
import LoginModal from './src/components/LoginModal';
import AddressModal from './src/components/AddressModal';
import StaffView from './src/components/StaffView';
import OwnerView from './src/components/OwnerView';
import FloatingBottomNav from './src/components/FloatingBottomNav';
import SearchModal from './src/components/SearchModal';
import AccountModal from './src/components/AccountModal';
import NotificationModal from './src/components/NotificationModal';

if (Platform.OS === 'web') {
  if (typeof document !== 'undefined') {
    try {
      const fontLinkId = 'ant-coffee-typography-link';
      if (!document.getElementById(fontLinkId)) {
        const preconnect1 = document.createElement('link');
        preconnect1.rel = 'preconnect';
        preconnect1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect1);

        const preconnect2 = document.createElement('link');
        preconnect2.rel = 'preconnect';
        preconnect2.href = 'https://fonts.gstatic.com';
        preconnect2.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect2);

        const fontLink = document.createElement('link');
        fontLink.id = fontLinkId;
        fontLink.rel = 'stylesheet';
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@500;600;700&display=swap';
        document.head.appendChild(fontLink);
      }

      // Always update global style so hot-reload fixes font immediately
      let styleGlobal = document.getElementById('ant-coffee-global-font-override');
      if (!styleGlobal) {
        styleGlobal = document.createElement('style');
        styleGlobal.id = 'ant-coffee-global-font-override';
        document.head.appendChild(styleGlobal);
      }
      styleGlobal.innerHTML = `
        /* General document typography */
        html, body, #root, input, button, textarea, select {
          font-family: 'Plus Jakarta Sans', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* React Native Web text: Apply font ONLY when NOT an icon font */
        [class*="css-text"]:not([style*="ionicons"]):not([style*="Ionicons"]):not([style*="Material"]):not([style*="Feather"]):not([style*="FontAwesome"]):not([style*="AntDesign"]) {
          font-family: 'Plus Jakarta Sans', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* STRICTLY PROTECT VECTOR ICON FONTS (Never override with sans-serif) */
        [style*="ionicons"],
        [style*="Ionicons"],
        [style*="font-family: ionicons"],
        [style*="font-family: Ionicons"],
        [style*="font-family: 'ionicons'"],
        [style*="font-family: 'Ionicons'"],
        [style*='font-family: "ionicons"'],
        [style*='font-family: "Ionicons"'] {
          font-family: ionicons, Ionicons !important;
        }

        body, html, #root {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `;
    } catch (e) {
      // Graceful fallback
    }
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    id: 'hero_1',
    tag: 'ƯU ĐÃI ĐỘC QUYỀN',
    tagColor: COLORS.accentOrange,
    title: 'Cà Phê Muối Hoàng Gia',
    desc: 'Kem muối béo mặn sánh mịn • Giảm 30% hôm nay',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    ctaText: 'Đặt Thử Ngay',
    bgColor: COLORS.primaryDark,
    productId: 101,
  },
  {
    id: 'hero_2',
    tag: 'BEST SELLER 2026',
    tagColor: '#059669',
    title: 'Trà Lài Macchiato Phô Mai',
    desc: 'Vị trà thanh tao hòa quyện kem phô mai béo ngậy',
    image: 'https://images.unsplash.com/photo-1558857563-b37cf5a285d8?w=600&auto=format&fit=crop&q=80',
    ctaText: 'Khám Phá',
    bgColor: '#1E293B',
    productId: 104,
  },
  {
    id: 'hero_3',
    tag: 'MÃ FREESHIP',
    tagColor: '#DC2626',
    title: 'Miễn Phí Giao Hàng',
    desc: 'Freeship cho đơn hàng từ 50.000đ • Áp dụng tại giỏ',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    ctaText: 'Dùng Mã Ngay',
    bgColor: COLORS.primary,
    isCartAction: true,
  },
];

export default function App() {
  console.log('[App] Rendering App component...');
  // Global & Multi-role state
  const [activeRole, setActiveRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'STAFF' | 'OWNER'
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(
    STORE_SETTINGS.is_accepting_orders
  );
  const [storeSettings, setStoreSettings] = useState(STORE_SETTINGS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [currentUser, setCurrentUser] = useState(null); // null = Guest browsing mode
  const [pendingItemToAdd, setPendingItemToAdd] = useState(null); // Lưu món khách chọn trước khi đăng nhập

  // Navigation state per role
  const [customerTab, setCustomerTab] = useState('HOME'); // 'HOME' | 'MENU' | 'ORDERS' | 'ACCOUNT'
  const [staffTab, setStaffTab] = useState('ORDERS'); // 'ORDERS' | 'INVENTORY' | 'READY' | 'SHIFT'
  const [ownerTab, setOwnerTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'BEST_SELLERS' | 'AUDIT' | 'SETTINGS'
  const [cart, setCart] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0]);
  const [selectedCategory, setSelectedCategory] = useState(1); // 1 = Tất cả
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState('ALL'); // ALL | BEST_SELLER | DISCOUNT | FEATURED

  // Modal visibilities
  const [detailProduct, setDetailProduct] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isOrderTrackingVisible, setIsOrderTrackingVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState(null);
  const [isMoMoModalVisible, setIsMoMoModalVisible] = useState(false);
  const [activeMoMoOrder, setActiveMoMoOrder] = useState(null);
  const [isVietQRModalVisible, setIsVietQRModalVisible] = useState(false);
  const [activeVietQROrder, setActiveVietQROrder] = useState(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socketStatus, setSocketStatus] = useState('CONNECTING');

  // Security Guard: Tách biệt hoàn toàn - nếu không có quyền STAFF/OWNER thì chỉ được ở giao diện CUSTOMER
  const guardedRole = useMemo(() => {
    if (activeRole === 'STAFF' && currentUser?.role !== 'STAFF') {
      return 'CUSTOMER';
    }
    if (activeRole === 'OWNER' && currentUser?.role !== 'OWNER') {
      return 'CUSTOMER';
    }
    return activeRole;
  }, [activeRole, currentUser]);

  const mainScrollRef = useRef(null);

  useEffect(() => {
    if (typeof Ionicons?.loadFont === 'function') {
      Ionicons.loadFont().catch(() => {});
    }
  }, []);

  // ==========================================================
  // ANDROID NAVIGATION BAR AUTO-HIDE (IMMERSIVE STICKY MODE)
  // ==========================================================
  useEffect(() => {
    let Nav = null;

    async function configureAndroidImmersiveMode() {
      if (Platform.OS === 'android') {
        try {
          const hasNativeNavigationBar = Boolean(
            globalThis?.expo?.modules?.ExpoNavigationBar ||
            NativeModules?.ExpoNavigationBar
          );

          if (hasNativeNavigationBar) {
            Nav = require('expo-navigation-bar');
            if (Nav && typeof Nav.setVisibilityAsync === 'function') {
              await Nav.setVisibilityAsync('hidden');
              await Nav.setBehaviorAsync('overlay-swipe');
              await Nav.setBackgroundColorAsync('#00000000');
              await Nav.setButtonStyleAsync('light');
            }
          }
        } catch (e) {
          // Gracefully fallback
        }
      }
    }
    configureAndroidImmersiveMode();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && Platform.OS === 'android' && Nav) {
        Nav.setVisibilityAsync?.('hidden').catch?.(() => {});
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  // ==========================================================
  // REAL-TIME WEBSOCKET & BACKEND API DATA SYNCHRONIZATION
  // ==========================================================
  useEffect(() => {
    // 1. Initialize real-time WebSocket connection
    initSocketClient();

    // Subscribe to new incoming orders in real time
    const unsubOrderCreated = subscribeOrderCreated((newOrder) => {
      setOrders((prev) => {
        const orderId = newOrder.id;
        const exists = prev.some(
          (o) => o.id === orderId || o.orderCode === (newOrder.orderCode || newOrder.order_code)
        );
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      // Nếu nhân viên hoặc chủ quán đang trực, hiện thông báo hệ thống có đơn mới
      const code = newOrder.order_code || newOrder.orderCode || `#${newOrder.id}`;
      if (activeRole === 'STAFF' || activeRole === 'OWNER') {
        presentLocalNotification({
          title: '🔔 Có đơn hàng mới!',
          body: `Đơn ${code} của khách ${newOrder.customer_name || 'Khách vãng lai'} (${(newOrder.items || []).length} món).`,
          data: { screen: 'ORDER_DETAIL', orderId: newOrder.id, orderCode: code },
          channelId: 'antcafe_orders_v2',
        });
      }
    });

    // Subscribe to order status updates (e.g. Barista confirmed or order ready)
    const unsubOrderStatus = subscribeOrderStatusUpdated((updated) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updated.id || o.orderCode === (updated.orderCode || updated.order_code)
            ? { ...o, ...updated }
            : o
        )
      );

      // Kích hoạt thông báo tức thì trên thanh thông báo hệ điều hành
      const code = updated.order_code || updated.orderCode || `#${updated.id}`;
      const status = updated.status;

      let notifTitle = null;
      let notifBody = null;

      if (status === 'READY') {
        notifTitle = '🎉 Mời bạn nhận món tại quầy!';
        notifBody = `Đơn hàng ${code} đã pha chế xong và sẵn sàng. Chúc bạn thưởng thức cà phê thật ngon miệng! ☕`;
      } else if (status === 'COMPLETED') {
        notifTitle = '✨ Đơn hàng đã hoàn tất!';
        notifBody = `Cảm ơn bạn đã lựa chọn Ant Coffee! Đơn hàng ${code} đã hoàn thành. Hẹn gặp lại bạn lần sau! ❤️`;
      } else if (status === 'CONFIRMED') {
        notifTitle = '☕ Quán đã nhận đơn & đang pha chế';
        notifBody = `Barista Ant Coffee đang chuẩn bị các món nước thơm ngon cho đơn ${code}.`;
      } else if (status === 'CANCELLED') {
        notifTitle = '⚠️ Đơn hàng đã bị hủy';
        notifBody = `Đơn hàng ${code} đã được hủy.${updated.cancel_reason ? ' Lý do: ' + updated.cancel_reason : ''}`;
      }

      if (notifTitle && notifBody) {
        // Chỉ lưu và hiển thị thông báo nếu người dùng đã đăng nhập
        if (currentUser) {
          const orderCustId = updated.customer_id || updated.customerId;
          const isMyOrder = currentUser.role !== 'CUSTOMER' || (orderCustId && String(orderCustId) === String(currentUser.id));
          if (isMyOrder) {
            presentLocalNotification({
              title: notifTitle,
              body: notifBody,
              data: {
                screen: 'ORDER_DETAIL',
                orderId: updated.id,
                orderCode: code,
                status: updated.status,
              },
              channelId: 'antcafe_orders_v2',
            });

            const newNotifItem = {
              id: Date.now(),
              title: notifTitle,
              body: notifBody,
              data: { orderId: updated.id, orderCode: code, screen: 'ORDER_DETAIL' },
              type: 'ORDER_STATUS',
              is_read: false,
              created_at: new Date().toISOString(),
            };
            setNotifications((prev) => [newNotifItem, ...prev]);
          }
        }
      }
    });

    // Subscribe to real-time payment status updates (e.g. MoMo payment confirmed via IPN)
    const unsubPaymentUpdated = subscribeOrderPaymentUpdated((paidOrder) => {
      const targetCode = paidOrder.order_code || paidOrder.orderCode;
      console.log('[App] Received order:payment_updated for #', targetCode, paidOrder.payment_status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === paidOrder.id || (o.orderCode || o.order_code) === targetCode
            ? { ...o, payment_status: paidOrder.payment_status, payment_transaction_ref: paidOrder.payment_transaction_ref }
            : o
        )
      );
      setLatestCreatedOrder((prev) => {
        if (!prev) return prev;
        const prevCode = prev.orderCode || prev.order_code;
        if (prev.id === paidOrder.id || prevCode === targetCode) {
          return { ...prev, payment_status: paidOrder.payment_status, payment_transaction_ref: paidOrder.payment_transaction_ref };
        }
        return prev;
      });
    });

    // Subscribe to store online order status changes
    const unsubStore = subscribeStoreStatusUpdated((store) => {
      if (store.is_accepting_orders !== undefined) {
        const nextAccepting = Boolean(store.is_accepting_orders);
        setIsAcceptingOrders(nextAccepting);
        setStoreSettings((prev) => ({
          ...prev,
          is_accepting_orders: nextAccepting,
        }));
      }
    });

    // Subscribe to product stock / availability changes
    const unsubProduct = subscribeProductAvailabilityUpdated(({ productId, is_available }) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available } : p))
      );
    });

    // 2. Push Notification registration & Handshake
    registerForPushNotificationsAsync(currentUser);

    // Setup Notification Listeners (Foreground, Background, Killed states)
    const unsubPush = setupNotificationListeners({
      onNotificationReceived: (notification) => {
        const content = notification.request?.content || {};
        const newNotifItem = {
          id: Date.now(),
          title: content.title || 'Thông báo mới',
          body: content.body || '',
          data: content.data || {},
          type: content.data?.type || 'ORDER_STATUS',
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotifItem, ...prev]);
      },
      onNotificationResponse: (data) => {
        // Requirement A.4: Nhấn vào thông báo điều hướng đúng màn hình
        if (data?.screen === 'ORDER_DETAIL' || data?.orderId || data?.orderCode) {
          setIsOrderTrackingVisible(true);
        } else if (data?.screen === 'MENU') {
          setCustomerTab('MENU');
        } else if (data?.screen === 'NOTIFICATIONS') {
          setIsNotificationModalVisible(true);
        }
      },
    });

    // Subscribe to Socket Connection Status (Connected / Reconnecting / Disconnected)
    const unsubConn = subscribeConnectionStatus((status) => {
      setSocketStatus(status);
    });

    // Subscribe to real-time server push notification dispatch
    const unsubNotifSocket = subscribeNotification((newNotif) => {
      // Chỉ nhận thông báo nếu đã đăng nhập và thông báo thuộc về user này
      if (!currentUser) return;
      if (newNotif.userId && currentUser.id && Number(newNotif.userId) !== Number(currentUser.id) && currentUser.role === 'CUSTOMER') {
        return;
      }

      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === newNotif.id);
        if (exists) return prev;
        return [newNotif, ...prev];
      });

      // Kích hoạt thông báo tức thì trên OS cho mọi thông báo mới nhận qua Socket
      if (newNotif?.title) {
        presentLocalNotification({
          title: newNotif.title,
          body: newNotif.body || '',
          data: newNotif.data || { screen: 'NOTIFICATIONS' },
          channelId: newNotif.type === 'ORDER_STATUS' ? 'antcafe_orders_v2' : 'antcafe_reminders_v2',
        });
      }
    });

    // Fetch initial notifications: CHỈ fetch khi ĐÃ ĐĂNG NHẬP! Nếu chưa đăng nhập thì làm trống notifications
    if (currentUser?.id) {
      fetchNotifications(currentUser.id).then((notifs) => {
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        }
      });
    } else {
      setNotifications([]);
    }

    // 3. Fetch Initial Dynamic Data from SQL Server Backend
    fetchStoreStatus().then((store) => {
      if (store) {
        setStoreSettings(store);
        setIsAcceptingOrders(Boolean(store.is_accepting_orders));
      }
    });

    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });

    fetchProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods);
      }
    });

    fetchAllOrders().then((ords) => {
      if (ords && ords.length > 0) {
        setOrders(ords);
      }
    });

    fetchCustomerAddresses().then((addrs) => {
      if (addrs && addrs.length > 0) {
        setSelectedAddress(addrs[0]);
      }
    });

    return () => {
      unsubOrderCreated();
      unsubOrderStatus();
      unsubPaymentUpdated();
      unsubStore();
      unsubProduct();
      unsubConn();
      unsubNotifSocket();
      if (unsubPush) unsubPush();
    };
  }, [currentUser]);

  // Cart Deduplication & Aggregation Helper
  const isSameCartItem = (itemA, itemB) => {
    if (!itemA || !itemB) return false;
    if (!itemA.product || !itemB.product) return false;
    if (itemA.product.id !== itemB.product.id) return false;

    // Compare Size
    const sizeA = (itemA.selectedSize?.name || itemA.selectedSize?.id || '').toString();
    const sizeB = (itemB.selectedSize?.name || itemB.selectedSize?.id || '').toString();
    if (sizeA !== sizeB) return false;

    // Compare Ice
    const iceA = (itemA.selectedIce?.name || itemA.selectedIce?.id || '').toString();
    const iceB = (itemB.selectedIce?.name || itemB.selectedIce?.id || '').toString();
    if (iceA !== iceB) return false;

    // Compare Sugar
    const sugarA = (itemA.selectedSugar?.name || itemA.selectedSugar?.id || '').toString();
    const sugarB = (itemB.selectedSugar?.name || itemB.selectedSugar?.id || '').toString();
    if (sugarA !== sugarB) return false;

    // Compare Toppings
    const toppingsA = (itemA.selectedToppings || [])
      .map((t) => (t.id || t.name || '').toString())
      .sort()
      .join('|');
    const toppingsB = (itemB.selectedToppings || [])
      .map((t) => (t.id || t.name || '').toString())
      .sort()
      .join('|');
    if (toppingsA !== toppingsB) return false;

    // Compare Notes
    const noteA = (itemA.note || '').trim().toLowerCase();
    const noteB = (itemB.note || '').trim().toLowerCase();
    if (noteA !== noteB) return false;

    return true;
  };

  const addItemToCartList = (cartList, newItem) => {
    const matchIndex = cartList.findIndex((item) => isSameCartItem(item, newItem));
    if (matchIndex >= 0) {
      const updated = [...cartList];
      const existing = updated[matchIndex];
      const addQty = Number(newItem.quantity) || 1;
      const newQty = (Number(existing.quantity) || 1) + addQty;
      const singleUnitPrice =
        Number(existing.unitPrice) ||
        Number(existing.totalPrice) / (Number(existing.quantity) || 1);
      updated[matchIndex] = {
        ...existing,
        quantity: newQty,
        unitPrice: singleUnitPrice,
        totalPrice: Math.round(singleUnitPrice * newQty),
      };
      return updated;
    }
    return [...cartList, newItem];
  };

  // Cart Management
  const handleOpenDetail = (product) => {
    setDetailProduct(product);
    setIsDetailModalVisible(true);
  };

  const handleAddToCart = (customizedItem) => {
    // 1. Kiểm tra trạng thái quán: Nếu đang tạm ngừng nhận đơn thì không nhận
    if (!isAcceptingOrders) {
      if (Platform.OS === 'web') {
        alert('Quán hiện đang tạm ngưng nhận đơn. Vui lòng quay lại sau ít phút nhé!');
      } else {
        Alert.alert(
          'Thông báo',
          'Quán hiện đang tạm ngưng nhận đơn. Vui lòng quay lại sau ít phút nhé!'
        );
      }
      return;
    }

    // 2. Yêu cầu bảo mật: Khách xem trước thoải mái, nhưng khi ấn mua/thêm vào giỏ thì buộc phải đăng nhập/đăng ký
    if (!currentUser) {
      setPendingItemToAdd(customizedItem);
      setIsDetailModalVisible(false);
      setIsLoginModalVisible(true);
      return;
    }

    // 3. Tự động kiểm tra: Nếu cùng 1 món và cùng lựa chọn tùy biến thì tăng số lượng thay vì tạo item mới
    setCart((prev) => addItemToCartList(prev, customizedItem));
  };

  const handleUpdateCartQuantity = (index, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const singleUnit = item.unitPrice || item.totalPrice / item.quantity;
      updated[index] = {
        ...item,
        quantity: newQty,
        totalPrice: singleUnit * newQty,
      };
      return updated;
    });
  };

  const handleRemoveCartItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Checkout flow -> Posts to Backend API and routes to MoMo Payment or OrderSuccessModal
  const handleCheckout = async (orderData) => {
    if (!isAcceptingOrders) {
      if (Platform.OS === 'web') {
        alert('Cửa hàng hiện đang tạm ngưng nhận đơn. Quý khách vui lòng thử lại sau ít phút!');
      } else {
        Alert.alert(
          'Thông báo',
          'Cửa hàng hiện đang tạm ngưng nhận đơn. Quý khách vui lòng thử lại sau ít phút!'
        );
      }
      return;
    }

    const payload = {
      address: orderData.address,
      items: orderData.items,
      subtotalAmount: orderData.subtotal,
      shippingFee: orderData.shippingFee,
      discountAmount: orderData.discount,
      totalAmount: orderData.totalAmount,
      voucherCode: orderData.voucher?.code,
      paymentMethod: orderData.paymentMethod,
      customerId: currentUser?.id,
      currentUser: currentUser,
    };

    let targetOrder = null;

    try {
      const created = await checkoutOrder(payload);
      if (created) {
        setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
        setLatestCreatedOrder(created);
        targetOrder = created;
      }
    } catch (err) {
      console.warn('[Checkout Fallback to Optimistic]', err);
      const errMsg = err.response?.data?.message || err.message || '';
      if (errMsg.includes('tạm ngưng') || errMsg.includes('tạm dừng')) {
        setIsAcceptingOrders(false);
        if (Platform.OS === 'web') {
          alert(errMsg);
        } else {
          Alert.alert('Thông báo', errMsg);
        }
        return;
      }
      const nextSeqNum = `#${String(orders.length + 1).padStart(3, '0')}`;
      const fallbackOrder = {
        id: Date.now(),
        orderCode: `ANT-${Math.floor(1000 + Math.random() * 9000)}`,
        sequence_number: nextSeqNum,
        status: 'PENDING',
        customer_id: currentUser?.id || 3,
        customer_name: orderData.address?.recipient_name || currentUser?.name || 'Khách hàng',
        phone: orderData.address?.phone || currentUser?.phone || '0901 234 567',
        address: orderData.address?.address_detail || '123 Nguyễn Huệ, P. Bến Nghé, Q.1',
        created_at: 'Vừa xong',
        estimated_delivery: '15 - 25 phút',
        items: orderData.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: it.unitPrice || it.totalPrice,
          totalPrice: it.totalPrice,
          options: `${it.selectedSize?.name || 'Size S'}, ${it.selectedIce?.name || '100% Đá'}, ${
            it.selectedSugar?.name || '100% Đường'
          }${
            it.selectedToppings?.length
              ? `, +${it.selectedToppings.map((t) => t.name).join(', ')}`
              : ''
          }`,
        })),
        total_amount: orderData.totalAmount,
        payment_status: 'UNPAID',
        payment_method:
          orderData.paymentMethod === 'MOMO'
            ? 'Ví MoMo'
            : orderData.paymentMethod === 'BANK'
            ? 'VietQR'
            : 'Tiền mặt khi nhận',
        driver: null,
      };
      setOrders((prev) => [fallbackOrder, ...prev]);
      setLatestCreatedOrder(fallbackOrder);
      targetOrder = fallbackOrder;
    }

    setCart([]);
    setIsCartModalVisible(false);

    // Điều hướng phương thức thanh toán:
    // 1. MoMo -> Mở MoMo Payment Sheet
    if (orderData.paymentMethod === 'MOMO') {
      setActiveMoMoOrder(targetOrder);
      setIsMoMoModalVisible(true);
    } 
    // 2. Chuyển khoản VietQR -> Mở VietQR Payment Modal
    else if (orderData.paymentMethod === 'BANK' || orderData.paymentMethod === 'VietQR') {
      setActiveVietQROrder(targetOrder);
      setIsVietQRModalVisible(true);
    } 
    // 3. Tiền mặt (COD) -> Đặt hàng thành công ngay lập tức!
    else {
      setIsSuccessModalVisible(true);
    }
  };

  const handleMoMoPaymentSuccess = (paidOrder) => {
    if (paidOrder) {
      const code = paidOrder.order_code || paidOrder.orderCode;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === paidOrder.id || (o.orderCode || o.order_code) === code
            ? { ...o, payment_status: 'PAID', payment_method: 'Ví MoMo', payment_transaction_ref: paidOrder.payment_transaction_ref }
            : o
        )
      );
      setLatestCreatedOrder((prev) =>
        prev ? { ...prev, payment_status: 'PAID', payment_method: 'Ví MoMo', payment_transaction_ref: paidOrder.payment_transaction_ref } : prev
      );
    }
    setIsMoMoModalVisible(false);
    setIsSuccessModalVisible(true); // Thanh toán xong -> Đặt hàng thành công!
  };

  const handleMoMoSwitchToCash = () => {
    if (activeMoMoOrder) {
      const cashOrder = {
        ...activeMoMoOrder,
        payment_method: 'Tiền mặt khi nhận',
        payment_status: 'UNPAID',
      };
      setOrders((prev) =>
        prev.map((o) => (o.id === cashOrder.id ? cashOrder : o))
      );
      setLatestCreatedOrder(cashOrder);
    }
    setIsMoMoModalVisible(false);
    setIsSuccessModalVisible(true); // Chuyển sang COD -> Đặt hàng thành công!
  };

  const handleMoMoSwitchToVietQR = () => {
    const target = activeMoMoOrder;
    setIsMoMoModalVisible(false);
    setActiveVietQROrder(target);
    setIsVietQRModalVisible(true);
  };

  const handleVietQRPaymentSuccess = (paidOrder) => {
    if (paidOrder) {
      const code = paidOrder.order_code || paidOrder.orderCode;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === paidOrder.id || (o.orderCode || o.order_code) === code
            ? { ...o, payment_status: 'PAID', payment_method: 'VietQR', payment_transaction_ref: paidOrder.payment_transaction_ref }
            : o
        )
      );
      setLatestCreatedOrder((prev) =>
        prev ? { ...prev, payment_status: 'PAID', payment_method: 'VietQR', payment_transaction_ref: paidOrder.payment_transaction_ref } : prev
      );
    }
    setIsVietQRModalVisible(false);
    setIsSuccessModalVisible(true); // Thanh toán xong -> Đặt hàng thành công!
  };

  const handleVietQRSwitchToCash = () => {
    if (activeVietQROrder) {
      const cashOrder = {
        ...activeVietQROrder,
        payment_method: 'Tiền mặt khi nhận',
        payment_status: 'UNPAID',
      };
      setOrders((prev) =>
        prev.map((o) => (o.id === cashOrder.id ? cashOrder : o))
      );
      setLatestCreatedOrder(cashOrder);
    }
    setIsVietQRModalVisible(false);
    setIsSuccessModalVisible(true); // Chuyển sang COD -> Đặt hàng thành công!
  };

  const handleVietQRSwitchToMoMo = () => {
    const target = activeVietQROrder;
    setIsVietQRModalVisible(false);
    setActiveMoMoOrder(target);
    setIsMoMoModalVisible(true);
  };

  const handleCancelOrder = async (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
    try {
      await apiUpdateOrderStatus(orderId, 'CANCELLED', 'Khách hàng tự hủy đơn');
    } catch (e) {
      console.warn('[Cancel Order Error]', e.message);
    }
  };

  const handleReorder = (order) => {
    const recreatedItems = order.items.map((it) => {
      const matchingProduct =
        products.find((p) => p.name === it.name) || products[0];
      return {
        product: matchingProduct,
        quantity: it.quantity,
        unitPrice: it.price,
        totalPrice: it.price * it.quantity,
        selectedSize: { name: 'Size Tiêu chuẩn', extra_price: 0 },
        selectedIce: { name: '100% Đá' },
        selectedSugar: { name: '100% Đường' },
        selectedToppings: [],
        note: '',
      };
    });

    setCart((prev) => [...prev, ...recreatedItems]);
    setIsOrderTrackingVisible(false);
    setIsCartModalVisible(true);
  };

  // Staff POS actions
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: nextStatus,
            payment_status: nextStatus === 'COMPLETED' ? 'PAID' : o.payment_status,
          };
        }
        return o;
      })
    );
    try {
      await apiUpdateOrderStatus(orderId, nextStatus);
    } catch (e) {
      console.warn('[Update Status Error]', e.message);
    }
  };

  const handleToggleProductAvailability = async (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: !p.is_available } : p))
    );
    try {
      await apiToggleAvailability(productId);
    } catch (e) {
      console.warn('[Toggle Availability Error]', e.message);
    }
  };

  // Authentication login handler
  const handleLoginSuccess = ({ role, user }) => {
    setCurrentUser(user);
    setActiveRole(role);

    // Requirement A.2: Token push được lưu theo tài khoản khi đăng nhập
    registerForPushNotificationsAsync(user);

    // Requirement B: Handshake WebSocket bằng token JWT của tài khoản đăng nhập
    const token = getAuthToken();
    if (token) {
      initSocketClient(token);
    }

    if (role === 'CUSTOMER') {
      // Nếu trước đó khách đã chọn món đồ uống trước khi đăng nhập thì tự động thêm vào giỏ
      if (pendingItemToAdd) {
        setCart((prev) => addItemToCartList(prev, pendingItemToAdd));
        setPendingItemToAdd(null);
      }
      fetchCustomerAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          setSelectedAddress(addrs[0]);
        }
      });
      fetchNotifications(user?.id).then((notifs) => {
        if (Array.isArray(notifs) && notifs.length > 0) {
          setNotifications(notifs);
        }
      });
    } else if (role === 'STAFF') {
      setPendingItemToAdd(null);
      setStaffTab('ORDERS');
    } else if (role === 'OWNER') {
      setPendingItemToAdd(null);
      setOwnerTab('OVERVIEW');
    }
  };

  // Đăng xuất và đưa giao diện về chế độ Khách vãng lai (Guest) an toàn
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveRole('CUSTOMER');
    setCart([]);
    setNotifications([]); // Xóa sạch dữ liệu thông báo khi đăng xuất
    setPendingItemToAdd(null);
    setCustomerTab('HOME');
    setIsAccountModalVisible(false);
    // Reset socket về guest mode
    initSocketClient(null);
  };

  // Quản lý trạng thái Bật / Tạm ngưng nhận đơn toàn hệ thống (Dành cho Chủ quán)
  const handleToggleStoreAcceptingOrders = async () => {
    try {
      const nextStatus = !isAcceptingOrders;
      setIsAcceptingOrders(nextStatus);
      setStoreSettings((prev) => ({ ...prev, is_accepting_orders: nextStatus }));
      await toggleStoreAcceptingOrders();
    } catch (err) {
      console.warn('Lỗi khi bật/tắt nhận đơn:', err);
    }
  };

  // Bottom Navigation tab selection
  const handleSelectCustomerTab = (tabKey) => {
    setCustomerTab(tabKey);
    if (tabKey === 'HOME') {
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (tabKey === 'MENU') {
      mainScrollRef.current?.scrollTo({ y: 340, animated: true });
    } else if (tabKey === 'ORDERS') {
      if (!currentUser) {
        setIsLoginModalVisible(true);
      } else {
        setIsOrderTrackingVisible(true);
      }
    } else if (tabKey === 'ACCOUNT') {
      if (!currentUser) {
        setIsLoginModalVisible(true);
      } else {
        setIsAccountModalVisible(true);
      }
    }
  };

  const handleSelectStaffTab = (tabKey) => {
    setStaffTab(tabKey);
  };

  const handleSelectOwnerTab = (tabKey) => {
    setOwnerTab(tabKey);
  };

  const handleCentralAction = async () => {
    if (guardedRole === 'CUSTOMER') {
      if (!currentUser && cart.length === 0) {
        setIsLoginModalVisible(true);
      } else {
        setIsCartModalVisible(true);
      }
    } else if (guardedRole === 'STAFF') {
      setStaffTab('ORDERS');
    } else if (guardedRole === 'OWNER') {
      const nextVal = !isAcceptingOrders;
      setIsAcceptingOrders(nextVal);
      try {
        await toggleStoreAcceptingOrders();
      } catch (e) {
        console.warn('[Toggle Accepting Orders Error]', e.message);
      }
    }
  };

  // Filtered Products for Customer catalog
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 1 && prod.category_id !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = prod.name.toLowerCase().includes(query);
        const matchCat = prod.category_name.toLowerCase().includes(query);
        const matchDesc = prod.description.toLowerCase().includes(query);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      // Tag filter
      if (selectedFilterTag === 'BEST_SELLER' && prod.discount_tag !== 'Best Seller') {
        return false;
      }
      if (selectedFilterTag === 'DISCOUNT' && !prod.discount_tag) {
        return false;
      }
      if (selectedFilterTag === 'FEATURED' && !prod.is_featured) {
        return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, selectedFilterTag]);

  // Active ongoing customer order (if any) - CHỈ hiển thị nếu đã đăng nhập và là đơn của currentUser!
  const activeCustomerOrder = useMemo(() => {
    if (!currentUser) return null;
    return orders.find((o) => {
      const isOngoing = o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'READY';
      if (!isOngoing) return false;
      const orderCustId = o.customer_id || o.customerId;
      if (orderCustId && currentUser.id && String(orderCustId) === String(currentUser.id)) return true;
      const oPhone = (o.phone || o.recipient_phone || '').replace(/\D/g, '');
      const uPhone = (currentUser.phone || '').replace(/\D/g, '');
      if (oPhone && uPhone && (oPhone === uPhone || uPhone.endsWith(oPhone) || oPhone.endsWith(uPhone))) return true;
      return false;
    });
  }, [orders, currentUser]);

  const totalCartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Global Multi-role Header */}
        <Header
          activeRole={guardedRole}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartModalVisible(true)}
          selectedAddress={selectedAddress}
          onOpenAddressModal={() => {
            if (!currentUser) setIsLoginModalVisible(true);
            else setIsAddressModalVisible(true);
          }}
          isAcceptingOrders={isAcceptingOrders}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalVisible(true)}
          onOpenAccount={() => setIsAccountModalVisible(true)}
          onLogout={handleLogout}
          socketStatus={socketStatus}
          unreadNotificationCount={currentUser ? notifications.filter((n) => !n.is_read).length : 0}
          onOpenNotifications={() => setIsNotificationModalVisible(true)}
        />

        {/* VIEW 1: CUSTOMER VIEW */}
        {guardedRole === 'CUSTOMER' && (
          <View style={styles.contentContainer}>
            {/* Store Closed Banner if Owner disabled accepting orders */}
            {!isAcceptingOrders && (
              <View style={styles.closedBanner}>
                <Ionicons name="information-circle" size={18} color="#FFF" />
                <Text style={styles.closedBannerText}>
                  Quán tạm ngưng nhận đơn online để xử lý tại quầy. Bạn vẫn có thể xem trước menu nhé!
                </Text>
              </View>
            )}

            <ScrollView
              ref={mainScrollRef}
              style={styles.mainScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mainScrollContent}
            >
              {/* Promo Sliderbar with Gesture Swiping & Liquid Dots */}
              <View style={styles.heroSection}>
                <ScrollView
                  horizontal
                  pagingEnabled={Platform.OS !== 'web'}
                  snapToInterval={SCREEN_WIDTH - 24}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.heroScroll}
                  onScroll={(e) => {
                    const offset = e.nativeEvent.contentOffset.x;
                    const index = Math.round(offset / (SCREEN_WIDTH - 28));
                    if (index >= 0 && index < HERO_SLIDES.length && index !== activeHeroIndex) {
                      setActiveHeroIndex(index);
                    }
                  }}
                  scrollEventThrottle={16}
                >
                  {HERO_SLIDES.map((slide, idx) => (
                    <View
                      key={slide.id}
                      style={[
                        styles.heroCard,
                        { backgroundColor: slide.bgColor },
                        Platform.OS === 'web' && styles.heroCardWeb,
                      ]}
                    >
                      <View style={styles.heroTextWrap}>
                        <View style={[styles.heroTag, { backgroundColor: slide.tagColor }]}>
                          <Text style={styles.heroTagText}>{slide.tag}</Text>
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={1}>{slide.title}</Text>
                        <Text style={styles.heroDesc} numberOfLines={2}>
                          {slide.desc}
                        </Text>
                        <TouchableOpacity
                          style={styles.heroCta}
                          onPress={() => {
                            if (slide.isCartAction) {
                              setIsCartModalVisible(true);
                            } else {
                              const target = products.find((p) => p.id === slide.productId) || products[0];
                              handleOpenDetail(target);
                            }
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.heroCtaText}>{slide.ctaText}</Text>
                          <Ionicons name="arrow-forward" size={13} color={COLORS.primaryDark} />
                        </TouchableOpacity>
                      </View>
                      <Image
                        source={{ uri: slide.image }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>

                {/* Hero Pagination Indicators */}
                <View style={styles.heroPagination}>
                  {HERO_SLIDES.map((_, i) => (
                    <View
                      key={`dot_${i}`}
                      style={[
                        styles.paginationDot,
                        activeHeroIndex === i && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm cà phê muối, trà sữa, croissant..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <TouchableOpacity
                    style={{ paddingHorizontal: 4 }}
                    onPress={() => setIsSearchModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="options-outline" size={18} color={COLORS.accentOrange} />
                  </TouchableOpacity>
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter tags */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterTagsScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilterTag === 'ALL' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedFilterTag('ALL')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFilterTag === 'ALL' && styles.filterChipTextActive,
                      ]}
                    >
                      Tất cả
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilterTag === 'BEST_SELLER' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedFilterTag('BEST_SELLER')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFilterTag === 'BEST_SELLER' && styles.filterChipTextActive,
                      ]}
                    >
                      Bán chạy nhất
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilterTag === 'DISCOUNT' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedFilterTag('DISCOUNT')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFilterTag === 'DISCOUNT' && styles.filterChipTextActive,
                      ]}
                    >
                      Đang giảm giá
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilterTag === 'FEATURED' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedFilterTag('FEATURED')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFilterTag === 'FEATURED' && styles.filterChipTextActive,
                      ]}
                    >
                      Món nổi bật
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Categories Liquid Glass Capsule Navigation */}
              <View style={styles.categoriesSection}>
                <View style={styles.categoriesHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Danh mục thức uống</Text>
                  <Text style={styles.sectionHeaderSubtitle}>Chọn vị yêu thích</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const iconName = isSelected && cat.activeIcon ? cat.activeIcon : cat.icon;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.glassCategoryPill,
                          isSelected && styles.glassCategoryPillSelected,
                          Platform.OS === 'web' && styles.glassCategoryPillWeb,
                        ]}
                        onPress={() => setSelectedCategory(cat.id)}
                        activeOpacity={0.82}
                      >
                        <View
                          style={[
                            styles.categoryIconWrap,
                            isSelected && styles.categoryIconWrapSelected,
                          ]}
                        >
                          <Ionicons
                            name={iconName}
                            size={16}
                            color={isSelected ? '#FFF' : COLORS.accentOrange}
                          />
                        </View>
                        <Text
                          style={[
                            styles.categoryPillName,
                            isSelected && styles.categoryPillNameSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        {cat.count ? (
                          <View
                            style={[
                              styles.categoryCountBadge,
                              isSelected && styles.categoryCountBadgeSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryCountText,
                                isSelected && styles.categoryCountTextSelected,
                              ]}
                            >
                              {cat.count}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Products Grid */}
              <View style={styles.catalogSection}>
                <View style={styles.catalogHeader}>
                  <Text style={styles.catalogTitle}>
                    {categories.find((c) => c.id === selectedCategory)?.name || 'Menu'}
                  </Text>
                  <Text style={styles.catalogCount}>({filteredProducts.length} món)</Text>
                </View>

                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyProducts}>
                    <Ionicons name="search" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyProductsTitle}>Không tìm thấy món phù hợp</Text>
                    <Text style={styles.emptyProductsSub}>
                      Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác
                    </Text>
                  </View>
                ) : (
                  <View style={styles.productGrid}>
                    {filteredProducts.map((prod) => (
                      <View key={prod.id} style={styles.productCol}>
                        <ProductCard
                          product={prod}
                          onSelect={handleOpenDetail}
                          onQuickAdd={handleOpenDetail}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Floating Live Order Tracker pill (if ongoing order exists) */}
            {activeCustomerOrder && (
              <TouchableOpacity
                style={[
                  styles.floatingOrderBanner,
                  Platform.OS === 'web' && {
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  },
                ]}
                onPress={() => setIsOrderTrackingVisible(true)}
                activeOpacity={0.9}
              >
                <View style={styles.floatingOrderLeft}>
                  <View style={styles.floatingPulsingDot} />
                  <View>
                    <Text style={styles.floatingOrderTitle}>
                      Đơn #{activeCustomerOrder.orderCode} • {activeCustomerOrder.sequence_number}
                    </Text>
                    <Text style={styles.floatingOrderSub}>
                      {activeCustomerOrder.status === 'PENDING'
                        ? 'Chờ quán tiếp nhận...'
                        : activeCustomerOrder.status === 'CONFIRMED'
                        ? 'Barista đang pha chế...'
                        : 'Đồ uống đã sẵn sàng!'}
                    </Text>
                  </View>
                </View>
                <View style={styles.floatingOrderCta}>
                  <Text style={styles.floatingOrderCtaText}>Xem tiến trình</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
            )}

          </View>
        )}

        {/* VIEW 2: STAFF POS VIEW (Phân tách bảo mật) */}
        {guardedRole === 'STAFF' && (
          <StaffView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            products={products}
            onToggleProductAvailability={handleToggleProductAvailability}
            isAcceptingOrders={isAcceptingOrders}
            currentTab={staffTab}
            onSelectTab={setStaffTab}
          />
        )}

        {/* VIEW 3: OWNER ADMIN VIEW (Phân tách bảo mật) */}
        {guardedRole === 'OWNER' && (
          <OwnerView
            isAcceptingOrders={isAcceptingOrders}
            onToggleAcceptingOrders={handleToggleStoreAcceptingOrders}
            storeSettings={storeSettings}
            products={products}
            currentTab={ownerTab}
            onSelectTab={setOwnerTab}
          />
        )}

        {/* Universal Floating Bottom Navigation for all roles */}
        <FloatingBottomNav
          activeRole={guardedRole}
          currentTab={
            guardedRole === 'CUSTOMER'
              ? customerTab
              : guardedRole === 'STAFF'
              ? staffTab
              : ownerTab
          }
          onSelectTab={(tabKey) => {
            if (guardedRole === 'CUSTOMER') handleSelectCustomerTab(tabKey);
            else if (guardedRole === 'STAFF') handleSelectStaffTab(tabKey);
            else handleSelectOwnerTab(tabKey);
          }}
          cartCount={totalCartCount}
          pendingCount={pendingOrdersCount}
          isAcceptingOrders={isAcceptingOrders}
          onCentralAction={handleCentralAction}
        />

        {/* MODALS */}
        {/* Product Customization Detail Modal */}
        <ProductDetailModal
          visible={isDetailModalVisible}
          product={detailProduct}
          isAcceptingOrders={isAcceptingOrders}
          onClose={() => {
            setIsDetailModalVisible(false);
            setDetailProduct(null);
          }}
          onAddToCart={handleAddToCart}
        />

        {/* Cart & Checkout Modal */}
        <CartModal
          visible={isCartModalVisible}
          cartItems={cart}
          isAcceptingOrders={isAcceptingOrders}
          onClose={() => setIsCartModalVisible(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckout}
          selectedAddress={selectedAddress}
          onOpenAddressModal={() => {
            if (!currentUser) setIsLoginModalVisible(true);
            else setIsAddressModalVisible(true);
          }}
          shippingFee={STORE_SETTINGS.default_shipping_fee}
          currentUser={currentUser}
          onRequireLogin={() => {
            setIsCartModalVisible(false);
            setIsLoginModalVisible(true);
          }}
        />

        {/* MoMo Payment Gateway Modal */}
        <MoMoPaymentModal
          visible={isMoMoModalVisible}
          order={activeMoMoOrder}
          momoPayment={activeMoMoOrder?.momoPayment}
          onClose={() => {
            setIsMoMoModalVisible(false);
          }}
          onPaymentSuccess={handleMoMoPaymentSuccess}
          onSwitchToCash={handleMoMoSwitchToCash}
          onSwitchToVietQR={handleMoMoSwitchToVietQR}
        />

        {/* VietQR Payment Modal (Chuẩn Napas 247) */}
        <VietQRPaymentModal
          visible={isVietQRModalVisible}
          order={activeVietQROrder}
          onClose={() => setIsVietQRModalVisible(false)}
          onPaymentSuccess={handleVietQRPaymentSuccess}
          onSwitchToCash={handleVietQRSwitchToCash}
          onSwitchToMoMo={handleVietQRSwitchToMoMo}
        />

        {/* Order Completion Screen (Flight-Ticket Style) */}
        <OrderSuccessModal
          visible={isSuccessModalVisible}
          order={latestCreatedOrder}
          onClose={() => setIsSuccessModalVisible(false)}
          onTrackOrder={(order) => {
            setIsSuccessModalVisible(false);
            if (!currentUser) {
              setIsLoginModalVisible(true);
            } else {
              setIsOrderTrackingVisible(true);
            }
          }}
          onOpenMoMoPayment={(order) => {
            setActiveMoMoOrder(order);
            setIsMoMoModalVisible(true);
          }}
          onOpenVietQRPayment={(order) => {
            setActiveVietQROrder(order);
            setIsVietQRModalVisible(true);
          }}
          currentUser={currentUser}
          onRequireLogin={() => setIsLoginModalVisible(true)}
        />

        {/* Order Tracking Modal - Chỉ người đăng nhập mới xem được đơn của mình */}
        <OrderTrackingModal
          visible={isOrderTrackingVisible}
          orders={orders}
          onClose={() => setIsOrderTrackingVisible(false)}
          onCancelOrder={handleCancelOrder}
          onReorder={handleReorder}
          currentUser={currentUser}
          onRequireLogin={() => setIsLoginModalVisible(true)}
        />

        {/* Authentication Modal */}
        <LoginModal
          visible={isLoginModalVisible}
          onClose={() => setIsLoginModalVisible(false)}
          onLoginSuccess={handleLoginSuccess}
          initialRole={guardedRole}
        />

        {/* Customer Account & Profile Modal */}
        <AccountModal
          visible={isAccountModalVisible}
          onClose={() => setIsAccountModalVisible(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAddressModal={() => setIsAddressModalVisible(true)}
          onOpenOrderTracking={() => {
            if (!currentUser) {
              setIsLoginModalVisible(true);
            } else {
              setIsOrderTrackingVisible(true);
            }
          }}
        />

        {/* Address Selection Modal */}
        <AddressModal
          visible={isAddressModalVisible}
          currentAddress={selectedAddress}
          onClose={() => setIsAddressModalVisible(false)}
          onSelectAddress={setSelectedAddress}
        />

        {/* Talabat-Style Search & Craving Discovery Modal */}
        <SearchModal
          visible={isSearchModalVisible}
          onClose={() => setIsSearchModalVisible(false)}
          products={products}
          onSelectProduct={handleOpenDetail}
        />

        {/* Notification Center Modal (Requirement A.6) */}
        <NotificationModal
          visible={isNotificationModalVisible}
          notifications={currentUser ? notifications : []}
          currentUser={currentUser}
          onOpenLogin={() => {
            setIsNotificationModalVisible(false);
            setIsLoginModalVisible(true);
          }}
          onClose={() => setIsNotificationModalVisible(false)}
          onMarkAsRead={async (id) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            await markNotificationAsReadApi(id);
          }}
          onMarkAllAsRead={async () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            await markAllNotificationsAsReadApi(currentUser?.id);
          }}
          onSelectNotificationAction={(notif) => {
            setIsNotificationModalVisible(false);
            const data = notif.data || {};
            if (data.screen === 'ORDER_DETAIL' || data.orderId || data.orderCode) {
              setIsOrderTrackingVisible(true);
            } else if (data.screen === 'MENU') {
              setCustomerTab('MENU');
            }
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closedBanner: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedBannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 110, // Generous padding to ensure no content is hidden by FloatingBottomNav
  },
  heroSection: {
    marginVertical: 14,
  },
  heroScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  heroCard: {
    width: SCREEN_WIDTH - 24,
    height: 156,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 16,
    ...SHADOWS.md,
  },
  heroCardWeb: {
    cursor: 'pointer',
  },
  heroTextWrap: {
    flex: 1.3,
    justifyContent: 'center',
    zIndex: 2,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8.5,
    paddingVertical: 3.5,
    borderRadius: RADIUS.xs,
    marginBottom: 6,
  },
  heroTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 10,
    lineHeight: 16,
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  heroCtaText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  heroImage: {
    width: 124,
    height: 124,
    borderRadius: RADIUS.lg,
  },
  heroPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
  },
  paginationDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentOrange,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterTagsScroll: {
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.sm,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  categoriesSection: {
    marginBottom: 18,
  },
  categoriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  glassCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 7,
    ...SHADOWS.sm,
  },
  glassCategoryPillWeb: {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    cursor: 'pointer',
  },
  glassCategoryPillSelected: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.glowAmber,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapSelected: {
    backgroundColor: COLORS.accentOrange,
  },
  categoryPillName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryPillNameSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  categoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSoft,
  },
  categoryCountBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  categoryCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  categoryCountTextSelected: {
    color: '#FFF',
  },
  catalogSection: {
    paddingHorizontal: 16,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  catalogCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyProductsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 10,
  },
  emptyProductsSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  productGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  productCol: {
    width: '100%',
    marginBottom: 12,
  },
  floatingOrderBanner: {
    position: 'absolute',
    bottom: 86,
    left: 16,
    right: 16,
    backgroundColor: Platform.OS === 'web' ? 'rgba(28, 25, 23, 0.88)' : 'rgba(28, 25, 23, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...SHADOWS.lg,
  },
  floatingOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  floatingPulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentOrange,
  },
  floatingOrderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  floatingOrderSub: {
    fontSize: 11,
    color: COLORS.primaryLight,
  },
  floatingOrderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
  },
  floatingOrderCtaText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFF',
  },
});
