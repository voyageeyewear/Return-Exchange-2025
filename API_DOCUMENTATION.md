# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Admin endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Public Endpoints

### 1. Order Verification

Verify an order using order number and contact information.

**Endpoint:** `POST /api/orders/verify`

**Request Body:**
```json
{
  "orderNumber": "ORD-2025-001",
  "contact": "customer@example.com"
}
```

**Response (Success):**
```json
{
  "message": "Order found",
  "order": {
    "id": 1,
    "orderNumber": "ORD-2025-001",
    "customerName": "John Doe",
    "customerEmail": "customer@example.com",
    "customerMobile": "+1234567890",
    "orderDate": "2025-10-01",
    "items": [
      {
        "id": 1,
        "product_name": "Classic Aviator Sunglasses",
        "product_image": "/images/aviator.jpg",
        "sku": "SKU-AV-001",
        "quantity": 1,
        "price": 149.99
      }
    ]
  }
}
```

**Response (Error):**
```json
{
  "error": "Order not found. Please check your order number and contact information."
}
```

---

### 2. Submit Return/Exchange Request

Submit a new return or exchange request with optional image upload.

**Endpoint:** `POST /api/returns/submit`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `orderId` (required): Order ID
- `orderItemId` (required): Order item ID
- `customerName` (required): Customer name
- `customerEmail` (required): Customer email
- `customerMobile` (optional): Customer mobile
- `actionType` (required): "Return" or "Exchange"
- `reason` (required): Reason for return/exchange
- `otherReason` (optional): Additional details if reason is "Other"
- `exchangeDetails` (optional): Size/color details for exchange
- `image` (optional): Image file (max 5MB, jpg/png/gif)

**Response (Success):**
```json
{
  "message": "Request submitted successfully",
  "requestId": "REQ-1697123456789-123"
}
```

**Response (Error):**
```json
{
  "error": "Missing required fields"
}
```

---

### 3. Get Request Status

Get the status of a specific return/exchange request.

**Endpoint:** `GET /api/returns/status/:requestId`

**Response (Success):**
```json
{
  "request": {
    "id": 1,
    "request_id": "REQ-1697123456789-123",
    "order_number": "ORD-2025-001",
    "product_name": "Classic Aviator Sunglasses",
    "customer_name": "John Doe",
    "customer_email": "customer@example.com",
    "action_type": "Return",
    "reason": "Size doesn't fit",
    "status": "Pending",
    "submitted_date": "2025-10-13T10:30:00.000Z"
  }
}
```

---

## Admin Authentication Endpoints

### 4. Admin Login

Authenticate as admin and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 5. Verify Token

Verify if a JWT token is valid.

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid token",
  "valid": false
}
```

---

## Admin Management Endpoints

All endpoints below require authentication.

### 6. Get All Requests

Retrieve all return/exchange requests with filtering and pagination.

**Endpoint:** `GET /api/admin/requests`

**Query Parameters:**
- `status` (optional): Filter by status ("Pending", "In Progress", "Approved", "Rejected", "Completed", or "All")
- `search` (optional): Search by request ID, customer name, or order number
- `limit` (optional, default: 50): Number of results per page
- `offset` (optional, default: 0): Starting position

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "requests": [
    {
      "id": 1,
      "request_id": "REQ-1697123456789-123",
      "order_number": "ORD-2025-001",
      "order_id": 1,
      "order_item_id": 1,
      "customer_name": "John Doe",
      "customer_email": "customer@example.com",
      "customer_mobile": "+1234567890",
      "product_name": "Classic Aviator Sunglasses",
      "product_image": "/images/aviator.jpg",
      "sku": "SKU-AV-001",
      "action_type": "Return",
      "reason": "Size doesn't fit",
      "other_reason": null,
      "exchange_details": null,
      "image_path": "/uploads/return-123456.jpg",
      "status": "Pending",
      "admin_notes": null,
      "submitted_date": "2025-10-13T10:30:00.000Z",
      "updated_date": null
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### 7. Get Single Request Details

Get detailed information about a specific request including status history.

**Endpoint:** `GET /api/admin/requests/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "request": {
    "id": 1,
    "request_id": "REQ-1697123456789-123",
    "order_number": "ORD-2025-001",
    "order_date": "2025-10-01",
    "customer_name": "John Doe",
    "customer_email": "customer@example.com",
    "customer_mobile": "+1234567890",
    "product_name": "Classic Aviator Sunglasses",
    "product_image": "/images/aviator.jpg",
    "sku": "SKU-AV-001",
    "quantity": 1,
    "price": 149.99,
    "action_type": "Return",
    "reason": "Size doesn't fit",
    "other_reason": null,
    "exchange_details": null,
    "image_path": "/uploads/return-123456.jpg",
    "status": "Pending",
    "admin_notes": null,
    "submitted_date": "2025-10-13T10:30:00.000Z",
    "updated_date": null
  },
  "history": [
    {
      "id": 1,
      "request_id": "REQ-1697123456789-123",
      "old_status": null,
      "new_status": "Pending",
      "changed_by": "Customer",
      "changed_at": "2025-10-13T10:30:00.000Z"
    }
  ]
}
```

---

### 8. Update Request Status

Update the status of a return/exchange request.

**Endpoint:** `PUT /api/admin/requests/:id/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "Approved",
  "notes": "Request approved. Processing refund.",
  "sendNotification": true
}
```

**Response (Success):**
```json
{
  "message": "Status updated successfully"
}
```

**Response (Error):**
```json
{
  "error": "Request not found"
}
```

---

### 9. Get Statistics

Get overall statistics about return/exchange requests.

**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 25,
  "pending": 8,
  "approved": 10,
  "inProgress": 3,
  "completed": 2,
  "rejected": 2
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (token expired)
- `404` - Not Found
- `500` - Internal Server Error

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider adding rate limiting to prevent abuse.

---

## CORS

CORS is enabled for all origins in development. In production, configure allowed origins in `backend/server.js`.

---

## Example Usage with cURL

### Verify Order
```bash
curl -X POST http://localhost:5000/api/orders/verify \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ORD-2025-001","contact":"customer@example.com"}'
```

### Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Get Requests (with token)
```bash
curl http://localhost:5000/api/admin/requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Status
```bash
curl -X PUT http://localhost:5000/api/admin/requests/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status":"Approved","notes":"Request approved","sendNotification":true}'
```

---

## Postman Collection

Import this JSON to Postman for easy testing:

```json
{
  "info": {
    "name": "Return & Exchange System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Verify Order",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\"orderNumber\":\"ORD-2025-001\",\"contact\":\"customer@example.com\"}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/orders/verify",
          "host": ["{{baseUrl}}"],
          "path": ["orders", "verify"]
        }
      }
    },
    {
      "name": "Admin Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      }
    },
    {
      "name": "Get All Requests",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/admin/requests",
          "host": ["{{baseUrl}}"],
          "path": ["admin", "requests"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

For more information, see the main README.md file.

