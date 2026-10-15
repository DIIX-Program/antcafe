import React, { useState, useMemo, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, GLASS, SHADOWS, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from './src/theme/theme';
import {
  STORE_SETTINGS,
  CATEGORIES,
  PRODUCTS as INITIAL_PRODUCTS,
  ADDRESSES,
  INITIAL_ORDERS,
  VOUCHERS,
} from './src/data/mockData';

import Header from './src/components/Header';
import ProductCard from './src/components/ProductCard';
import ProductDetailModal from './src/components/ProductDetailModal';
import CartModal from './src/components/CartModal';
import OrderTrackingModal from './src/components/OrderTrackingModal';
import OrderSuccessModal from './src/components/OrderSuccessModal';
import LoginModal from './src/components/LoginModal';
import AddressModal from './src/components/AddressModal';
import StaffView from './src/components/StaffView';
import OwnerView from './src/components/OwnerView';
import FloatingBottomNav from './src/components/FloatingBottomNav';
import SearchModal from './src/components/SearchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  // Global & Multi-role state
  const [activeRole, setActiveRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'STAFF' | 'OWNER'
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(
    STORE_SETTINGS.is_accepting_orders
  );
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [currentUser, setCurrentUser] = useState({
    name: 'Nguyễn Văn A',
    phone: '0901 234 567',
    role: 'CUSTOMER',
  });

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
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const mainScrollRef = useRef(null);

  // Cart Management
  const handleOpenDetail = (product) => {
    setDetailProduct(product);
    setIsDetailModalVisible(true);
  };

  const handleAddToCart = (customizedItem) => {
    setCart((prev) => [...prev, customizedItem]);
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

  // Checkout flow -> Opens ticket-style OrderSuccessModal
  const handleCheckout = (orderData) => {
    const nextSeqNum = `#${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder = {
      id: Date.now(),
      orderCode: `ANT-${Math.floor(1000 + Math.random() * 9000)}`,
      sequence_number: nextSeqNum,
      status: 'PENDING',
      customer_name: orderData.address?.recipient_name || currentUser.name || 'Khách hàng',
      phone: orderData.address?.phone || currentUser.phone || '0901 234 567',
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
      payment_status: orderData.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      payment_method:
        orderData.paymentMethod === 'MOMO'
          ? 'Ví MoMo'
          : orderData.paymentMethod === 'BANK'
          ? 'VietQR'
          : 'Tiền mặt khi nhận',
      driver: null,
    };

    // Add to orders queue, clear cart, close cart, show OrderSuccessModal!
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setIsCartModalVisible(false);
    setLatestCreatedOrder(newOrder);
    setIsSuccessModalVisible(true);
  };

  const handleCancelOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
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
  const handleUpdateOrderStatus = (orderId, nextStatus) => {
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
  };

  const handleToggleProductAvailability = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: !p.is_available } : p))
    );
  };

  // Authentication login handler
  const handleLoginSuccess = ({ role, user }) => {
    setCurrentUser(user);
    setActiveRole(role);
  };

  // Bottom Navigation tab selection
  const handleSelectCustomerTab = (tabKey) => {
    setCustomerTab(tabKey);
    if (tabKey === 'HOME') {
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (tabKey === 'MENU') {
      mainScrollRef.current?.scrollTo({ y: 340, animated: true });
    } else if (tabKey === 'ORDERS') {
      setIsOrderTrackingVisible(true);
    } else if (tabKey === 'ACCOUNT') {
      setIsLoginModalVisible(true);
    }
  };

  const handleSelectStaffTab = (tabKey) => {
    setStaffTab(tabKey);
  };

  const handleSelectOwnerTab = (tabKey) => {
    setOwnerTab(tabKey);
  };

  const handleCentralAction = () => {
    if (activeRole === 'CUSTOMER') {
      setIsCartModalVisible(true);
    } else if (activeRole === 'STAFF') {
      setStaffTab('ORDERS');
    } else if (activeRole === 'OWNER') {
      setIsAcceptingOrders((prev) => !prev);
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

  // Active ongoing customer order (if any)
  const activeCustomerOrder = useMemo(() => {
    return orders.find(
      (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'READY'
    );
  }, [orders]);

  const totalCartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Global Multi-role Header */}
        <Header
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartModalVisible(true)}
          selectedAddress={selectedAddress}
          onOpenAddressModal={() => setIsAddressModalVisible(true)}
          isAcceptingOrders={isAcceptingOrders}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalVisible(true)}
        />

        {/* VIEW 1: CUSTOMER VIEW */}
        {activeRole === 'CUSTOMER' && (
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
              {/* Promo Banners Carousel */}
              <View style={styles.heroSection}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.heroScroll}
                >
                  <View style={[styles.heroCard, { backgroundColor: COLORS.primaryDark }]}>
                    <View style={styles.heroTextWrap}>
                      <View style={styles.heroTag}>
                        <Text style={styles.heroTagText}>ƯU ĐÃI ĐỘC QUYỀN</Text>
                      </View>
                      <Text style={styles.heroTitle}>Cà Phê Muối Hoàng Gia</Text>
                      <Text style={styles.heroDesc}>
                        Kem muối béo mặn sánh mịn • Giảm ngay 30% hôm nay
                      </Text>
                      <TouchableOpacity
                        style={styles.heroCta}
                        onPress={() => handleOpenDetail(products[0])}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.heroCtaText}>Đặt Thử Ngay</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primaryDark} />
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
                      }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={[styles.heroCard, { backgroundColor: COLORS.primary }]}>
                    <View style={styles.heroTextWrap}>
                      <View style={[styles.heroTag, { backgroundColor: '#FFF' }]}>
                        <Text style={[styles.heroTagText, { color: COLORS.primary }]}>
                          MÃ FREESHIP
                        </Text>
                      </View>
                      <Text style={styles.heroTitle}>Miễn Phí Giao Hàng</Text>
                      <Text style={styles.heroDesc}>
                        Nhập mã 'FREESHIP' cho đơn hàng từ 50.000đ
                      </Text>
                      <TouchableOpacity
                        style={styles.heroCta}
                        onPress={() => setIsCartModalVisible(true)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.heroCtaText}>Dùng Mã Ngay</Text>
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1558857563-b37cf5a285d8?w=600&auto=format&fit=crop&q=80',
                      }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  </View>
                </ScrollView>
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
                    <Ionicons
                      name="flame"
                      size={14}
                      color={selectedFilterTag === 'BEST_SELLER' ? '#FFF' : COLORS.accentOrange}
                    />
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
                    <Ionicons
                      name="pricetag"
                      size={13}
                      color={selectedFilterTag === 'DISCOUNT' ? '#FFF' : COLORS.primary}
                    />
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
                    <Ionicons
                      name="star"
                      size={13}
                      color={selectedFilterTag === 'FEATURED' ? '#FFF' : COLORS.accentAmber}
                    />
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

              {/* Categories Horizontal Selector */}
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionHeaderTitle}>Danh mục thức uống</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          isSelected && styles.categoryCardSelected,
                        ]}
                        onPress={() => setSelectedCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.categoryIconCircle,
                            isSelected && styles.categoryIconCircleSelected,
                          ]}
                        >
                          <Ionicons
                            name={cat.icon}
                            size={20}
                            color={isSelected ? '#FFF' : COLORS.primaryDark}
                          />
                        </View>
                        <Text
                          style={[
                            styles.categoryName,
                            isSelected && styles.categoryNameSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Products Grid */}
              <View style={styles.catalogSection}>
                <View style={styles.catalogHeader}>
                  <Text style={styles.catalogTitle}>
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Menu'}
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

        {/* VIEW 2: STAFF POS VIEW */}
        {activeRole === 'STAFF' && (
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

        {/* VIEW 3: OWNER ADMIN VIEW */}
        {activeRole === 'OWNER' && (
          <OwnerView
            isAcceptingOrders={isAcceptingOrders}
            onToggleAcceptingOrders={() => setIsAcceptingOrders(!isAcceptingOrders)}
            storeSettings={STORE_SETTINGS}
            products={products}
            currentTab={ownerTab}
            onSelectTab={setOwnerTab}
          />
        )}

        {/* Universal Floating Bottom Navigation for all roles */}
        <FloatingBottomNav
          activeRole={activeRole}
          currentTab={
            activeRole === 'CUSTOMER'
              ? customerTab
              : activeRole === 'STAFF'
              ? staffTab
              : ownerTab
          }
          onSelectTab={(tabKey) => {
            if (activeRole === 'CUSTOMER') handleSelectCustomerTab(tabKey);
            else if (activeRole === 'STAFF') handleSelectStaffTab(tabKey);
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
          onClose={() => setIsCartModalVisible(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckout}
          selectedAddress={selectedAddress}
          onOpenAddressModal={() => {
            setIsAddressModalVisible(true);
          }}
          shippingFee={STORE_SETTINGS.default_shipping_fee}
        />

        {/* Order Completion Screen (Flight-Ticket Style) */}
        <OrderSuccessModal
          visible={isSuccessModalVisible}
          order={latestCreatedOrder}
          onClose={() => setIsSuccessModalVisible(false)}
          onTrackOrder={(order) => {
            setIsSuccessModalVisible(false);
            setIsOrderTrackingVisible(true);
          }}
        />

        {/* Order Tracking Modal */}
        <OrderTrackingModal
          visible={isOrderTrackingVisible}
          orders={orders}
          onClose={() => setIsOrderTrackingVisible(false)}
          onCancelOrder={handleCancelOrder}
          onReorder={handleReorder}
        />

        {/* Authentication Modal */}
        <LoginModal
          visible={isLoginModalVisible}
          onClose={() => setIsLoginModalVisible(false)}
          onLoginSuccess={handleLoginSuccess}
          initialRole={activeRole}
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
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCard: {
    width: SCREEN_WIDTH - 32,
    height: 155,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 16,
    ...SHADOWS.md,
  },
  heroTextWrap: {
    flex: 1.3,
    justifyContent: 'center',
    zIndex: 2,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
    lineHeight: 15,
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCtaText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  heroImage: {
    width: 125,
    height: 125,
    borderRadius: RADIUS.md,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: 74,
  },
  categoryCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  categoryIconCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: COLORS.primary,
    fontWeight: '800',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCol: {
    width: '48.5%',
    marginBottom: 14,
  },
  floatingOrderBanner: {
    position: 'absolute',
    bottom: 88,
    left: 16,
    right: 16,
    backgroundColor: Platform.OS === 'web' ? 'rgba(30, 41, 59, 0.88)' : 'rgba(30, 41, 59, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  floatingOrderCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
});
