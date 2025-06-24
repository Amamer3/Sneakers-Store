# API Endpoint Fixes - Double `/api` Issue Resolution

## Problem Summary

The application was experiencing 404 errors due to double `/api` prefixes in API endpoint URLs. The issue occurred because:

1. **API Client Base URL**: `https://sneaker-server-7gec.onrender.com/api` (already includes `/api`)
2. **Service Endpoints**: Used `/api/...` paths, resulting in URLs like `https://sneaker-server-7gec.onrender.com/api/api/...`

## Root Cause

The `apiClient` in `src/lib/api-client.ts` is configured with a base URL that already includes the `/api` prefix:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://sneaker-server-7gec.onrender.com/api';
```

When services used endpoints starting with `/api/`, it created double prefixes.

## Files Fixed

### 1. User Service (`src/services/user-service.ts`)
- **Before**: `/api/admin/users` → **After**: `/admin/users`
- **Endpoints Fixed**:
  - `getUsers()`: GET `/admin/users`
  - `createUser()`: POST `/admin/users`
  - `updateUser()`: PUT `/admin/users/{id}`
  - `deleteUser()`: DELETE `/admin/users/{id}`

### 2. Coupon Service (`src/services/coupon-service.ts`)
- **Admin Endpoints**:
  - `getAllCoupons()`: GET `/admin/coupons`
  - `getCouponById()`: GET `/admin/coupons/{id}`
  - `createCoupon()`: POST `/admin/coupons`
  - `updateCoupon()`: PATCH `/admin/coupons/{id}`
  - `deleteCoupon()`: DELETE `/admin/coupons/{id}`
  - `getCouponStats()`: GET `/admin/coupons/stats`
- **User Endpoints**:
  - `validateCoupon()`: POST `/coupons/validate`
  - `applyCoupon()`: POST `/coupons/apply`
  - `getUserCoupons()`: GET `/coupons/user`
  - User usage check: GET `/coupons/{id}/user-usage/{userId}`

### 3. Dashboard Service (`src/services/dashboard-service.ts`)
- **Before**: `/api/admin/dashboard/...` → **After**: `/admin/dashboard/...`
- **Endpoints Fixed**:
  - `getDashboardStats()`: GET `/admin/dashboard/stats`
  - `getRecentOrders()`: GET `/admin/dashboard/recent-orders`

### 4. Inventory Service (`src/services/inventory-service.ts`)
- **Admin Endpoints**:
  - `updateStock()`: PUT `/admin/inventory/products/{id}/stock`
  - `adjustStock()`: PATCH `/admin/inventory/products/{id}/adjust`
  - `getStockMovements()`: GET `/admin/inventory/movements`
  - `getLowStockAlerts()`: GET `/admin/inventory/alerts/low-stock`
  - `getInventorySummary()`: GET `/admin/inventory/summary`
- **User Endpoints**:
  - `checkStock()`: GET `/inventory/check`
  - `bulkCheckStock()`: POST `/inventory/bulk-check`
  - `getProductInventory()`: GET `/inventory/products/{id}`
  - `reserveStock()`: POST `/inventory/reserve`
  - `releaseReservation()`: DELETE `/inventory/reservations/{id}`
  - `confirmReservation()`: POST `/inventory/reservations/{id}/confirm`
  - `extendReservation()`: PATCH `/inventory/reservations/{id}/extend`
  - `getUserReservations()`: GET `/inventory/reservations/my`
  - `getRestockEstimate()`: GET `/inventory/products/{id}/restock-estimate`

### 5. Notification Service (`src/services/notification-service.ts`)
- **Admin Endpoints**:
  - `sendNotification()`: POST `/admin/notifications/send`
  - `broadcastNotification()`: POST `/admin/notifications/broadcast`
  - `getNotificationTemplates()`: GET `/admin/notifications/templates`
  - `createTemplate()`: POST `/admin/notifications/templates`
  - `updateTemplate()`: PUT `/admin/notifications/templates/{id}`
  - `deleteTemplate()`: DELETE `/admin/notifications/templates/{id}`
- **User Endpoints**:
  - `getNotifications()`: GET `/notifications`
  - `markAsRead()`: PATCH `/notifications/{id}/read`
  - `markAllAsRead()`: PATCH `/notifications/read-all`
  - `deleteNotification()`: DELETE `/notifications/{id}`
  - `getNotificationStats()`: GET `/notifications/stats`
  - `getPreferences()`: GET `/notifications/preferences`
  - `updatePreferences()`: PUT `/notifications/preferences`
  - `subscribeToPush()`: POST `/notifications/push/subscribe`
  - `unsubscribeFromPush()`: DELETE `/notifications/push/unsubscribe`
  - `testPushNotification()`: POST `/notifications/push/test`

## URL Pattern Guidelines

### ✅ Correct Patterns
```typescript
// Admin endpoints
apiClient.get('/admin/users')           // ✅ Correct
apiClient.post('/admin/products')       // ✅ Correct
apiClient.put('/admin/orders/{id}')     // ✅ Correct

// User endpoints
apiClient.get('/products')              // ✅ Correct
apiClient.post('/orders')               // ✅ Correct
apiClient.get('/profile')               // ✅ Correct

// Auth endpoints
apiClient.post('/auth/login')           // ✅ Correct
apiClient.post('/auth/register')        // ✅ Correct
```

### ❌ Incorrect Patterns
```typescript
// Double /api prefix - AVOID
apiClient.get('/api/admin/users')       // ❌ Wrong
apiClient.post('/api/products')         // ❌ Wrong
apiClient.put('/api/auth/login')        // ❌ Wrong
```

## Development Guidelines

### 1. Endpoint Naming Convention
- **Admin endpoints**: Start with `/admin/`
- **User endpoints**: Start with resource name (e.g., `/products`, `/orders`)
- **Auth endpoints**: Start with `/auth/`
- **Never** start with `/api/` (it's already in the base URL)

### 2. Testing Endpoints
When adding new endpoints, verify the final URL:
```typescript
// Base URL: https://sneaker-server-7gec.onrender.com/api
// Endpoint: /admin/users
// Final URL: https://sneaker-server-7gec.onrender.com/api/admin/users ✅
```

### 3. Error Debugging
If you see 404 errors, check for:
1. Double `/api` in the URL
2. Incorrect endpoint paths
3. Missing authentication headers

## Benefits of This Fix

1. **Resolved 404 Errors**: All API calls now use correct endpoint URLs
2. **Consistent URL Structure**: Standardized endpoint patterns across all services
3. **Better Maintainability**: Clear separation between admin and user endpoints
4. **Improved Debugging**: Easier to identify and fix endpoint issues
5. **Future-Proof**: Guidelines prevent similar issues in new development

## Testing Recommendations

1. **User Management**: Test creating, updating, and deleting users
2. **Admin Functions**: Verify all admin dashboard features work
3. **Inventory Operations**: Test stock management and reservations
4. **Notifications**: Check notification sending and preferences
5. **Coupons**: Validate coupon creation and application

## Next Steps

1. Test all affected functionality in development
2. Monitor server logs for any remaining 404 errors
3. Update API documentation if needed
4. Consider adding automated tests for endpoint validation
5. Review other services for similar issues

---

**Note**: This fix addresses the immediate 404 errors. If you encounter other API-related issues, check the server logs and ensure the backend endpoints are properly implemented and accessible.