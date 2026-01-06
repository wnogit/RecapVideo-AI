# API Reference

## 📋 Overview

Base URL: `http://localhost:8000/api/v1`

All endpoints return JSON responses and accept JSON request bodies.

---

## 🔐 Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 📡 Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Create new account | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/refresh` | Refresh tokens | ❌ |
| POST | `/auth/logout` | Logout user | ✅ |
| POST | `/auth/forgot-password` | Request password reset | ❌ |
| POST | `/auth/reset-password` | Reset password | ❌ |
| POST | `/auth/verify-email` | Verify email | ❌ |

---

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user | ✅ |
| PATCH | `/users/me` | Update current user | ✅ |
| POST | `/users/me/avatar` | Upload avatar | ✅ |
| PUT | `/users/me/password` | Change password | ✅ |

#### GET `/users/me`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://...",
  "is_admin": false,
  "is_verified": true,
  "credit_balance": 25,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PATCH `/users/me`

**Request:**
```json
{
  "name": "New Name"
}
```

---

### Videos

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/videos` | List user's videos | ✅ |
| POST | `/videos` | Create new video | ✅ |
| GET | `/videos/{id}` | Get video details | ✅ |
| GET | `/videos/{id}/status` | Get processing status | ✅ |
| DELETE | `/videos/{id}` | Delete video | ✅ |

#### GET `/videos`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 10 | Items per page |
| status | string | - | Filter by status |

**Response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "source_url": "https://youtube.com/...",
      "status": "completed",
      "progress": 100,
      "output_url": "https://...",
      "thumbnail_url": "https://...",
      "title": "Video Title",
      "duration": 180,
      "credits_used": 1,
      "created_at": "2024-01-05T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 10,
  "total_pages": 5
}
```

#### POST `/videos`

**Request:**
```json
{
  "source_url": "https://youtube.com/watch?v=abc123",
  "output_language": "my",
  "voice_type": "female",
  "output_resolution": "1080p"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "source_url": "https://youtube.com/watch?v=abc123",
  "output_language": "my",
  "credits_used": 1,
  "created_at": "2024-01-05T10:00:00Z"
}
```

#### GET `/videos/{id}/status`

**Response:**
```json
{
  "id": "uuid",
  "status": "processing",
  "progress": 45,
  "current_stage": "generating_script",
  "error_message": null
}
```

---

### Credits

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/credits/balance` | Get credit balance | ✅ |
| GET | `/credits/transactions` | List transactions | ✅ |
| GET | `/credits/packages` | List credit packages | ✅ |

#### GET `/credits/balance`

**Response:**
```json
{
  "balance": 25,
  "total_earned": 50,
  "total_spent": 25
}
```

#### GET `/credits/transactions`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| page_size | int | 20 | Items per page |
| type | string | - | Filter by type |

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "amount": -1,
      "balance_after": 24,
      "description": "Video creation",
      "reference_type": "video",
      "reference_id": "uuid",
      "created_at": "2024-01-05T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### GET `/credits/packages`

**Response:**
```json
{
  "packages": [
    {
      "id": "starter",
      "name": "Starter",
      "credits": 10,
      "price_usd": 4.99,
      "price_mmk": 10000,
      "popular": false
    },
    {
      "id": "basic",
      "name": "Basic",
      "credits": 30,
      "price_usd": 9.99,
      "price_mmk": 21000,
      "popular": true
    }
  ]
}
```

---

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | List user's orders | ✅ |
| POST | `/orders` | Create new order | ✅ |
| GET | `/orders/{id}` | Get order details | ✅ |
| POST | `/orders/{id}/screenshot` | Upload payment screenshot | ✅ |
| POST | `/orders/{id}/cancel` | Cancel order | ✅ |

#### POST `/orders`

**Request:**
```json
{
  "package_id": "basic",
  "payment_method": "kbzpay",
  "promo_code": "WELCOME10"
}
```

**Response:**
```json
{
  "id": "uuid",
  "package_id": "basic",
  "credits_amount": 30,
  "price_usd": 9.99,
  "price_mmk": 21000,
  "discount_percent": 10,
  "final_price_mmk": 18900,
  "payment_method": "kbzpay",
  "status": "pending",
  "created_at": "2024-01-05T10:00:00Z"
}
```

---

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | ❌ |
| GET | `/health/db` | Database health | ❌ |
| GET | `/health/redis` | Redis health | ❌ |

#### GET `/health`

**Response:**
```json
{
  "status": "healthy",
  "version": "3.0.0",
  "timestamp": "2024-01-05T10:00:00Z"
}
```

---

## 👑 Admin Endpoints

All admin endpoints require admin role.

### Admin Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Get dashboard stats |

### Admin Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/{id}` | Get user details |
| PATCH | `/admin/users/{id}` | Update user |
| POST | `/admin/users/{id}/credits` | Adjust credits |
| POST | `/admin/users/{id}/ban` | Ban/unban user |
| POST | `/admin/users/{id}/make-admin` | Grant admin |

#### POST `/admin/users/{id}/credits`

**Request:**
```json
{
  "amount": 10,
  "reason": "Promotional bonus"
}
```

### Admin Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/orders` | List all orders |
| GET | `/admin/orders/{id}` | Get order details |
| POST | `/admin/orders/{id}/approve` | Approve order |
| POST | `/admin/orders/{id}/reject` | Reject order |

#### POST `/admin/orders/{id}/reject`

**Request:**
```json
{
  "reason": "Invalid payment screenshot"
}
```

### Admin Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/videos` | List all videos |
| GET | `/admin/videos/{id}` | Get video details |
| POST | `/admin/videos/{id}/retry` | Retry failed video |
| DELETE | `/admin/videos/{id}` | Delete video |

### Admin Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/prompts` | List all prompts |
| GET | `/admin/prompts/{id}` | Get prompt |
| PUT | `/admin/prompts/{id}` | Update prompt |

### Admin API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/api-keys` | List API keys |
| POST | `/admin/api-keys` | Add API key |
| DELETE | `/admin/api-keys/{id}` | Delete API key |

---

## ❌ Error Responses

### Error Format

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request data |
| `INSUFFICIENT_CREDITS` | 400 | Not enough credits |
| `VIDEO_PROCESSING_FAILED` | 500 | Video processing error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Validation Errors

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

---

## 📊 Pagination

Paginated endpoints return:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

---

## 🔄 Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Auth endpoints | 10/minute |
| API endpoints | 100/minute |
| Video creation | 10/hour |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704456000
```

---

## 📂 Related Files

- `app/api/v1/router.py` - Main API router
- `app/api/v1/endpoints/auth.py` - Auth endpoints
- `app/api/v1/endpoints/users.py` - User endpoints
- `app/api/v1/endpoints/videos.py` - Video endpoints
- `app/api/v1/endpoints/credits.py` - Credit endpoints
- `app/api/v1/endpoints/orders.py` - Order endpoints
- `app/api/v1/endpoints/health.py` - Health endpoints
- `app/api/v1/endpoints/admin_api_keys.py` - Admin API key endpoints
