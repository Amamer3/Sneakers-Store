# Backend API Requirements for Cart Functionality

This document outlines the required backend API endpoints that need to be implemented to support the cart functionality in the frontend application.

## Base URL
The frontend is configured to connect to: `https://sneaker-server-7gec.onrender.com/api`

## Required Cart API Endpoints

### 1. Get Cart
```
GET /cart
Headers: Authorization: Bearer <token>
Response: {
  "items": [
    {
      "id": "string",
      "productId": "string",
      "quantity": number,
      "size": "string" | null,
      "price": number,
      "product": {
        "id": "string",
        "name": "string",
        "image": "string",
        "price": number
      }
    }
  ]
}
```

### 2. Add Item to Cart
```
POST /cart
Headers: Authorization: Bearer <token>
Body: {
  "productId": "string",
  "quantity": number,
  "size": "string" | undefined
}
Response: {
  "items": [...] // Same structure as Get Cart
}
```

### 3. Update Cart Item
```
PUT /cart
Headers: Authorization: Bearer <token>
Body: {
  "productId": "string",
  "quantity": number,
  "size": "string" | null
}
Response: {
  "items": [...] // Same structure as Get Cart
}
```

### 4. Remove Item from Cart
```
DELETE /cart/item
Headers: Authorization: Bearer <token>
Body: {
  "productId": "string",
  "size": "string" | null
}
Response: {
  "items": [...] // Same structure as Get Cart
}
```

### 5. Clear Entire Cart (NEW)
```
DELETE /cart
Headers: Authorization: Bearer <token>
Response: {
  "message": "Cart cleared successfully"
}
```

### 6. Sync Cart (NEW)
```
POST /cart/sync
Headers: Authorization: Bearer <token>
Body: {
  "items": [
    {
      "productId": "string",
      "quantity": number,
      "size": "string" | undefined
    }
  ]
}
Response: {
  "items": [...] // Same structure as Get Cart
}
```

### 7. Checkout
```
POST /cart/checkout
Headers: Authorization: Bearer <token>
Response: {
  "orderId": "string",
  "total": number,
  "paymentUrl": "string" // Optional for payment gateway
}
```

## Authentication
- All cart endpoints require authentication via Bearer token
- Token should be stored in localStorage with key 'token'
- Invalid tokens should return 401/403 status codes

## Error Handling
- 401/403: Authentication errors - frontend will fall back to localStorage
- 404: Product not found
- 400: Invalid request data
- 500: Server errors

## Notes
- The frontend handles both authenticated (API) and non-authenticated (localStorage) cart states
- When API calls fail due to authentication, the cart automatically falls back to localStorage
- Cart items are synchronized between localStorage and server when user logs in