# ANT COFFEE & TEA — BACKEND API CONTRACT & REAL-TIME INTEGRATION
**Version:** 2.0.0  
**Backend Runtime:** Node.js Express API  
**Database:** Microsoft SQL Server (`ant_coffee_db`)  
**Prefix:** `/api/v1`  
**Default Port:** 5000  
**Real-Time Engine:** Socket.IO  

---

## 1. Authentication & Security Policy

All protected routes require an HTTP Bearer Token in the `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```
Tokens are generated using `jsonwebtoken` signed with `JWT_SECRET` and contain `{ id, phone, role, name }`.

### User Roles
- `CUSTOMER` — Default role for ordering customers.
- `STAFF` — Cashiers, baristas, and operational staff.
- `OWNER` — Store owners and system administrators.

---

## 2. Exhaustive Endpoint Contract Matrix

### 2.1 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | None | Public | `{ phoneOrEmail, password }` | `{ success, data: { token, role, user } }` | `AuthFlow.js`, `LoginModal.js` |
| `POST` | `/auth/register` | None | Public | `{ phone, password, full_name, email }` | `{ success, data: { token, role, user } }` | `AuthFlow.js` |
| `POST` | `/auth/google` | None | Public | `{ email, full_name, avatar_url }` | `{ success, data: { token, role, user } }` | `AuthFlow.js` (Google OAuth) |
| `GET` | `/auth/me` | Bearer | Any | None | `{ success, data: { user } }` | Session restore on app launch |
| `PUT` | `/auth/me` | Bearer | Any | `{ full_name, email, avatar_url }` | `{ success, data: { user } }` | `AccountModal.js` |
| `PUT` | `/auth/change-password` | Bearer | Any | `{ old_password, new_password }` | `{ success, message }` | `AccountModal.js` |
| `POST` | `/auth/logout` | None | Public | None | `{ success, message }` | `Header.js`, `AccountModal.js` |

---

### 2.2 Store Operations & Emergency Controls (`/api/v1/store`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/store/status` | None | Public | None | `{ success, data: { is_accepting_orders, store_name, phone, address, wifi_password } }` | `App.js` Header & Order Guard |
| `PATCH` | `/store/toggle-accepting` | Bearer | `OWNER` | None | `{ success, data: { is_accepting_orders } }` | `OwnerView.js` Emergency FAB |
| `PUT` | `/store/settings` | Bearer | `OWNER` | `{ store_name, phone, address, wifi_name, wifi_password, hotline }` | `{ success, data: storeSettings }` | `OwnerView.js` Settings tab |

---

### 2.3 Product Catalog & Options (`/api/v1/categories`, `/api/v1/products`)

| Method | Endpoint | Auth | Role | Request Parameters | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/categories` | None | Public | None | `{ success, data: Category[] }` | `App.js` category pills |
| `GET` | `/products` | None | Public | `?category_id&search&is_featured&tag` | `{ success, data: Product[] }` | Drink grid, Search modal |
| `GET` | `/products/:id` | None | Public | Route `:id` | `{ success, data: ProductDetail }` | `ProductDetailModal.js` |
| `PATCH` | `/products/:id/availability` | Bearer | `STAFF`, `OWNER` | None | `{ success, data: { id, is_available } }` | `StaffView.js` Inventory tab |
| `GET` | `/products/options/groups` | None | Public | None | `{ success, data: { sizes, sugarLevels, iceLevels, toppings } }` | `ProductDetailModal.js` |

---

### 2.4 Customer Addresses (`/api/v1/customer`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/customer/addresses` | Bearer | `CUSTOMER` | None | `{ success, data: Address[] }` | `AddressModal.js`, `CartModal.js` |
| `POST` | `/customer/addresses` | Bearer | `CUSTOMER` | `{ recipient_name, phone, address_line, tag, is_default }` | `{ success, data: Address }` | `AddressModal.js` |
| `DELETE` | `/customer/addresses/:id` | Bearer | `CUSTOMER` | Route `:id` | `{ success, message }` | `AddressModal.js` |

---

### 2.5 Vouchers & Promotions (`/api/v1/vouchers`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/vouchers/available` | None | Public | None | `{ success, data: Voucher[] }` | `CartModal.js` |
| `POST` | `/vouchers/apply` | None | Public | `{ code, order_amount }` | `{ success, data: { voucher, discount_amount, final_amount } }` | `CartModal.js` Apply Voucher |

---

### 2.6 Order Workflow (`/api/v1/orders`, `/api/v1/staff`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/orders/checkout` | Optional | `CUSTOMER` | `{ customer_id, order_type, delivery_address, items: [{ product_id, quantity, size_id, sugar_level, ice_level, toppings: [] }], voucher_code, payment_method, note }` | `{ success, data: Order, momoPayment?: { payUrl, qrCodeUrl } }` | `CartModal.js` Submit Order |
| `GET` | `/orders/queue` | None | `STAFF`, `OWNER` | `?status` | `{ success, data: Order[] }` | `StaffView.js`, `OwnerView.js` |
| `GET` | `/orders/my-history` | Optional | `CUSTOMER` | `?customerId&phone` | `{ success, data: Order[] }` | `AccountModal.js`, `OrderTrackingModal.js` |
| `PUT` | `/orders/:id/status` | Bearer | `STAFF`, `OWNER` | `{ status: 'CONFIRMED'|'READY'|'COMPLETED'|'CANCELLED', cancel_reason? }` | `{ success, data: Order }` | `StaffView.js` Status transition buttons |

---

### 2.7 Staff Shifts & Cash Reconciliation (`/api/v1/staff/shifts`)

| Method | Endpoint | Auth | Role | Request Body | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/staff/shifts/current` | Bearer | `STAFF`, `OWNER` | None | `{ success, data: Shift }` | `StaffView.js` Shift tab |
| `POST` | `/staff/shifts/check-in` | Bearer | `STAFF` | `{ opening_cash, note }` | `{ success, data: Shift }` | `StaffView.js` Open Shift |
| `POST` | `/staff/shifts/check-out` | Bearer | `STAFF` | `{ actual_closing_cash, note }` | `{ success, data: { shift, discrepancy } }` | `StaffView.js` Cash Drawer Handover |

---

### 2.8 Business Analytics & Audits (`/api/v1/admin`)

| Method | Endpoint | Auth | Role | Response Payload | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/reports/revenue` | Bearer | `OWNER` | `{ revenue, totalOrders, completedOrders, cancelledOrders, avgOrderValue, hourlySales: [], bestSellers: [] }` | `OwnerView.js` Overview, Web Dashboard |
| `GET` | `/admin/audit/price-logs` | Bearer | `OWNER` | `{ success, data: AuditLog[] }` | `OwnerView.js` Audit tab |

---

### 2.9 Payment Gateways (`/api/v1/payment`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/payment/momo/create` | Initializes MoMo v2 Payment Session, returning deep link and QR code. |
| `POST` | `/payment/momo/ipn` | Server-to-server webhook endpoint verifying HMAC SHA256 signature from MoMo gateway. |
| `GET` | `/payment/momo/callback` | Redirect landing URL after customer completes payment in MoMo app. |
| `GET` | `/payment/momo/status/:orderCode` | Real-time query to check payment completion status. |
| `POST` | `/payment/momo/simulate` | Test environment simulation to mark MoMo payment as `PAID`. |
| `POST` | `/payment/vietqr/simulate` | Test environment simulation to verify bank transfer for VietQR orders. |
| `POST` | `/payment/switch-method` | Changes pending order payment method (e.g. from MoMo to Cash). |

---

## 3. Real-Time Socket.IO Synchronization

The application establishes a continuous WebSocket channel connected to `http://localhost:5000` (or `EXPO_PUBLIC_API_URL`):

```javascript
// Server Socket.IO Contract
io.on('connection', (socket) => {
  socket.on('join:orders', () => socket.join('room:orders'));
  socket.on('join:customer', (customerId) => socket.join(`customer_${customerId}`));
  socket.on('join:store', () => socket.join('room:store'));
});
```

### Event Specifications

1. **`order:created`**:
   - **Payload**: Full order object with ticket sequence (`daily_queue_number`), customer phone, items array, and total amount.
   - **Target Rooms**: `room:orders` (Staff POS, Owner Dashboard).
   - **Client Behavior**: Inserts new order at top of `PENDING` queue with visual alert and incremented badge count.

2. **`order:status_updated`**:
   - **Payload**: `{ id, order_code, status, updated_at, cancel_reason }`.
   - **Target Rooms**: `room:orders`, `customer_{customer_id}`.
   - **Client Behavior**: Transitions order in staff board; advances 5-stage stepper in customer `OrderTrackingModal`.

3. **`order:payment_updated`**:
   - **Payload**: `{ id, order_code, payment_status, payment_method }`.
   - **Target Rooms**: `room:orders`, `customer_{customer_id}`.
   - **Client Behavior**: Automatically dismisses `MoMoPaymentModal` or `VietQRPaymentModal` and presents `OrderSuccessModal`.

4. **`store:status_updated`**:
   - **Payload**: `{ is_accepting_orders }`.
   - **Target Rooms**: Broadcast globally to all connected clients.
   - **Client Behavior**: Disables "Đặt hàng" buttons in customer cart; displays store closed banner.

5. **`product:availability_updated`**:
   - **Payload**: `{ product_id, is_available }`.
   - **Target Rooms**: Broadcast globally.
   - **Client Behavior**: Toggles out-of-stock badge on menu cards without requiring customer page reload.
