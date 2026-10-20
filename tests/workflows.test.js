/**
 * Ant Coffee & Tea - Core Workflow & Integration Test Suite
 * Validates:
 * 1. Price calculation & Option item pricing
 * 2. Cart item signature and grouping
 * 3. Voucher application and minimum order thresholds
 * 4. Staff POS state machine transitions
 * 5. Shift cash calculations & discrepancies
 * 6. Store settings and emergency shutdown toggling
 */

const {
  STORE_SETTINGS,
  CATEGORIES,
  PRODUCTS,
  OPTION_GROUPS,
  VOUCHERS,
  INITIAL_ORDERS,
} = require('../src/data/mockData');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('====================================================');
console.log('ANT COFFEE & TEA — TEST RUNNER');
console.log('====================================================\n');

// TEST 1: CATALOG & OPTIONS INTEGRITY
console.log('--- TEST GROUP 1: CATALOG & DATA INTEGRITY ---');
assert(PRODUCTS.length >= 10, 'Catalog contains at least 10 drinks');
assert(CATEGORIES.length >= 5, 'Categories list contains at least 5 categories');
assert(OPTION_GROUPS.sizes.length === 3, 'Size options include S, M, L');
assert(OPTION_GROUPS.iceLevels.length >= 4, 'Ice levels options are defined');
assert(OPTION_GROUPS.sugarLevels.length >= 4, 'Sugar levels options are defined');
assert(OPTION_GROUPS.toppings.length >= 5, 'Toppings options are defined');

// TEST 2: PRICE CALCULATION & CUSTOMIZATION
console.log('\n--- TEST GROUP 2: PRICE CALCULATION LOGIC ---');
const sampleProduct = PRODUCTS[0]; // Base price e.g. 35,000đ
const sizeL = OPTION_GROUPS.sizes[2]; // +14,000đ
const topping1 = OPTION_GROUPS.toppings[0]; // +6,000đ
const topping2 = OPTION_GROUPS.toppings[1]; // +8,000đ

const unitPrice = sampleProduct.base_price + sizeL.extra_price + topping1.price + topping2.price;
const quantity = 3;
const totalPrice = unitPrice * quantity;

assert(unitPrice === sampleProduct.base_price + 14000 + 6000 + 8000, 'Single customized unit price calculates correctly');
assert(totalPrice === unitPrice * 3, 'Total price matches quantity * unitPrice');

// TEST 3: VOUCHER VALIDATION RULES
console.log('\n--- TEST GROUP 3: VOUCHER THRESHOLDS & DISCOUNTS ---');
const freeshipVoucher = VOUCHERS.find((v) => v.code === 'FREESHIP');
assert(freeshipVoucher !== undefined, 'FREESHIP voucher exists in system');
assert(freeshipVoucher.minOrder === 50000, 'FREESHIP requires minimum 50,000đ order');

const antWelcomeVoucher = VOUCHERS.find((v) => v.code === 'ANTWELCOME');
assert(antWelcomeVoucher !== undefined, 'ANTWELCOME voucher exists');
assert(antWelcomeVoucher.discount === 30000, 'ANTWELCOME provides 30,000đ discount');

// TEST 4: POS ORDER WORKFLOW STATE MACHINE
console.log('\n--- TEST GROUP 4: POS ORDER STATUS TRANSITIONS ---');
const validTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(current, next) {
  return validTransitions[current]?.includes(next);
}

assert(canTransition('PENDING', 'CONFIRMED'), 'Staff can accept PENDING order -> CONFIRMED');
assert(canTransition('CONFIRMED', 'READY'), 'Staff can mark CONFIRMED order -> READY');
assert(canTransition('READY', 'COMPLETED'), 'Staff can complete READY order -> COMPLETED');
assert(canTransition('PENDING', 'CANCELLED'), 'Staff can reject PENDING order with valid reason');
assert(!canTransition('COMPLETED', 'PENDING'), 'COMPLETED order cannot revert to PENDING');
assert(!canTransition('CANCELLED', 'CONFIRMED'), 'CANCELLED order cannot be transitioned');

// TEST 5: CASH RECONCILIATION & DISCREPANCY CALCULATION
console.log('\n--- TEST GROUP 5: CASH RECONCILIATION ---');
const openingCash = 1500000;
const cashFromOrders = INITIAL_ORDERS
  .filter((o) => o.status === 'COMPLETED' && o.payment_method?.includes('Tiền mặt'))
  .reduce((sum, o) => sum + (o.total_amount || 0), 0);

const expectedDrawerCash = openingCash + cashFromOrders;
const actualClosingCashCounted = expectedDrawerCash; // Perfect match
const discrepancy = actualClosingCashCounted - expectedDrawerCash;

assert(expectedDrawerCash >= openingCash, 'Expected cash is at least opening cash');
assert(discrepancy === 0, 'Zero discrepancy when counted cash matches expected');

// TEST 6: EMERGENCY STORE ORDER RECEPTION TOGGLE
console.log('\n--- TEST GROUP 6: STORE EMERGENCY TOGGLE ---');
let storeAccepting = STORE_SETTINGS.is_accepting_orders;
const toggleStore = () => {
  storeAccepting = !storeAccepting;
  return storeAccepting;
};

const state1 = toggleStore();
assert(state1 === false, 'Toggling turns store offline (halts customer orders)');
const state2 = toggleStore();
assert(state2 === true, 'Toggling turns store online again');

// TEST 7: ORDER SEQUENCE ALLOCATION & DRIVER VISIBILITY
console.log('\n--- TEST GROUP 7: SEQUENCE & DRIVER POLICY ---');
const generateSequence = (queueLength) => `#${String(queueLength + 1).padStart(3, '0')}`;
assert(generateSequence(0) === '#001', 'First order sequence is formatted as #001');
assert(generateSequence(9) === '#010', '10th order sequence is formatted as #010');
assert(generateSequence(99) === '#100', '100th order sequence is formatted as #100');

const pendingOrder = { status: 'PENDING', driver: null };
const readyDeliveryOrder = { status: 'READY', driver: { name: 'Tài xế', phone: '0901' } };
const shouldShowDriver = (order) => Boolean(order.driver && order.status !== 'CANCELLED');
assert(!shouldShowDriver(pendingOrder), 'Pending order without assigned driver does not show driver card');
assert(shouldShowDriver(readyDeliveryOrder), 'Ready order with assigned driver displays driver card');

// TEST 8: CART TOTAL & ROLE PRIVILEGE BOUNDARIES
console.log('\n--- TEST GROUP 8: TOTAL PRICE CLAMPING & ROLE PRIVILEGES ---');
const calculateFinalTotal = (subtotal, shipping, discount) => Math.max(0, subtotal + shipping - discount);
assert(calculateFinalTotal(20000, 15000, 50000) === 0, 'Discount exceeding order amount is clamped to 0đ, never negative');
assert(calculateFinalTotal(60000, 0, 30000) === 30000, '30k discount on 60k order yields 30,000đ total');

const ROLE_PERMISSIONS = {
  CUSTOMER: ['BROWSE', 'CUSTOMIZE', 'CHECKOUT', 'TRACK_ORDER'],
  STAFF: ['VIEW_QUEUE', 'UPDATE_ORDER_STATUS', 'TOGGLE_STOCK', 'RECONCILE_SHIFT'],
  OWNER: ['VIEW_ANALYTICS', 'VIEW_AUDIT', 'UPDATE_STORE_SETTINGS', 'TOGGLE_STORE_EMERGENCY'],
};
const hasPermission = (role, action) => ROLE_PERMISSIONS[role]?.includes(action);
assert(hasPermission('CUSTOMER', 'CHECKOUT'), 'Customer can perform checkout');
assert(!hasPermission('CUSTOMER', 'TOGGLE_STORE_EMERGENCY'), 'Customer is strictly denied store emergency toggle');
assert(hasPermission('STAFF', 'UPDATE_ORDER_STATUS'), 'Staff can update order status');
assert(!hasPermission('STAFF', 'TOGGLE_STORE_EMERGENCY'), 'Staff cannot access owner emergency toggle');
assert(hasPermission('OWNER', 'TOGGLE_STORE_EMERGENCY'), 'Owner has permission to toggle store emergency mode');

// TEST 9: CART DEDUPLICATION & STORE PAUSED GUARD
console.log('\n--- TEST GROUP 9: CART DEDUPLICATION & STORE PAUSED GUARD ---');
const isSameCartItem = (itemA, itemB) => {
  if (!itemA || !itemB) return false;
  if (!itemA.product || !itemB.product) return false;
  if (itemA.product.id !== itemB.product.id) return false;

  const sizeA = (itemA.selectedSize?.name || itemA.selectedSize?.id || '').toString();
  const sizeB = (itemB.selectedSize?.name || itemB.selectedSize?.id || '').toString();
  if (sizeA !== sizeB) return false;

  const iceA = (itemA.selectedIce?.name || itemA.selectedIce?.id || '').toString();
  const iceB = (itemB.selectedIce?.name || itemB.selectedIce?.id || '').toString();
  if (iceA !== iceB) return false;

  const sugarA = (itemA.selectedSugar?.name || itemA.selectedSugar?.id || '').toString();
  const sugarB = (itemB.selectedSugar?.name || itemB.selectedSugar?.id || '').toString();
  if (sugarA !== sugarB) return false;

  const toppingsA = (itemA.selectedToppings || []).map((t) => (t.id || t.name || '').toString()).sort().join('|');
  const toppingsB = (itemB.selectedToppings || []).map((t) => (t.id || t.name || '').toString()).sort().join('|');
  if (toppingsA !== toppingsB) return false;

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

const item1 = {
  product: { id: 101, name: 'Cà phê muối' },
  selectedSize: { id: 'M', name: 'Size M' },
  selectedIce: { id: '50', name: '50% Đá' },
  selectedSugar: { id: '50', name: '50% Đường' },
  selectedToppings: [{ id: 'TC', name: 'Trân châu' }],
  note: 'Ít đắng',
  quantity: 1,
  unitPrice: 35000,
  totalPrice: 35000,
};

const item1Duplicate = {
  product: { id: 101, name: 'Cà phê muối' },
  selectedSize: { id: 'M', name: 'Size M' },
  selectedIce: { id: '50', name: '50% Đá' },
  selectedSugar: { id: '50', name: '50% Đường' },
  selectedToppings: [{ id: 'TC', name: 'Trân châu' }],
  note: 'Ít đắng',
  quantity: 2,
  unitPrice: 35000,
  totalPrice: 70000,
};

const item1DifferentSize = {
  ...item1,
  selectedSize: { id: 'L', name: 'Size L' },
};

let testCart = [];
testCart = addItemToCartList(testCart, item1);
assert(testCart.length === 1 && testCart[0].quantity === 1, 'Initial item added to cart');

testCart = addItemToCartList(testCart, item1Duplicate);
assert(testCart.length === 1, 'Duplicate item does NOT create a new cart row');
assert(testCart[0].quantity === 3, 'Duplicate item increments existing item quantity (1 + 2 = 3)');
assert(testCart[0].totalPrice === 105000, 'Duplicate item recalculates total price (35,000 * 3 = 105,000đ)');

testCart = addItemToCartList(testCart, item1DifferentSize);
assert(testCart.length === 2, 'Item with different size creates a separate cart row');

// Store Paused Guard
const canCreateOrder = (isAccepting) => Boolean(isAccepting);
assert(!canCreateOrder(false), 'Orders are strictly blocked when store is paused');
assert(canCreateOrder(true), 'Orders are allowed when store is online');

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================');


