# RecapVideo.AI - API Reference

> Complete API documentation for RecapVideo.AI v3

**Base URL:** `https://api.recapvideo.ai/api/v1`

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

#### POST /auth/signup
Create a new account with email/password.

**Request:**
```json
{
  "email": "user@gmail.com",
  "password": "securepassword",
  "name": "User Name",
  "device_id": "optional-fingerprint"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "User Name",
    "credit_balance": 4,
    "is_verified": false
  }
}
```

#### POST /auth/login
Login with email/password.

**Request:**
```json
{
  "email": "user@gmail.com",
  "password": "securepassword",
  "device_id": "optional-fingerprint",
  "remember_me": true
}
```

#### POST /auth/google
Login/signup with Google OAuth.

**Request:**
```json
{
  "code": "google-oauth-code",
  "device_id": "optional-fingerprint"
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

#### POST /auth/logout
Logout current session.

#### GET /auth/check-ip
Check if user's IP is allowed (VPN/proxy detection).

---

## 👤 Users

#### GET /users/me
Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@gmail.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "credit_balance": 10,
  "is_verified": true,
  "is_admin": false,
  "created_at": "2026-01-10T00:00:00Z"
}
```

#### PATCH /users/me
Update current user profile.

**Request:**
```json
{
  "name": "New Name"
}
```

#### GET /users/me/sessions
Get all active sessions.

#### DELETE /users/me/sessions/{session_id}
Revoke a specific session.

---

## 🎬 Videos

#### POST /videos
Create a new video recap.

**Request:**
```json
{
  "source_url": "https://youtube.com/watch?v=...",
  "voice_type": "my-MM-NilarNeural",
  "output_language": "my",
  "options": {
    "aspect_ratio": "9:16",
    "copyright": {
      "color_adjust": true,
      "horizontal_flip": true,
      "slight_zoom": false,
      "audio_pitch_shift": true
    },
    "subtitles": {
      "enabled": true,
      "size": "large",
      "position": "bottom",
      "background": "semi",
      "color": "#FFFFFF"
    },
    "logo": {
      "enabled": false
    },
    "outro": {
      "enabled": false
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "source_url": "https://youtube.com/...",
  "status": "pending",
  "progress_percent": 0,
  "created_at": "2026-01-10T00:00:00Z"
}
```

#### GET /videos
List user's videos.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 10, max: 50)
- `status` (string): Filter by status

**Response:**
```json
{
  "videos": [...],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

#### GET /videos/{video_id}
Get video details.

#### GET /videos/{video_id}/status
Get video processing status (for polling).

**Response:**
```json
{
  "status": "generating_audio",
  "progress_percent": 65,
  "status_message": "Generating voiceover...",
  "estimated_time_remaining": 30
}
```

#### DELETE /videos/{video_id}
Cancel/delete a video.

---

## 💰 Credits

#### GET /credits/balance
Get current credit balance.

**Response:**
```json
{
  "balance": 10,
  "pending_credits": 0
}
```

#### GET /credits/transactions
Get credit transaction history.

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "amount": -1,
      "balance_after": 9,
      "description": "Created video: ...",
      "created_at": "2026-01-10T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1
}
```

---

## 🛒 Orders

#### POST /orders
Create a new credit order.

**Request:**
```json
{
  "package_id": "uuid",
  "payment_method_id": "uuid"
}
```

#### POST /orders/{order_id}/upload-screenshot
Upload payment screenshot.

**Request:** `multipart/form-data`
- `file`: Image file (JPG, PNG)

#### GET /orders
List user's orders.

#### GET /orders/{order_id}
Get order details.

---

## 💳 Payment Methods (Public)

#### GET /payment-methods
List active payment methods.

**Response:**
```json
{
  "payment_methods": [
    {
      "id": "uuid",
      "phone": "09777777777",
      "account_name": "Ko Xun",
      "types": ["kbzpay", "wavepay"],
      "qr_code_url": "https://..."
    }
  ]
}
```

---

## 📦 Credit Packages (Public)

#### GET /credit-packages
List available credit packages.

**Response:**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Starter",
      "credits": 10,
      "price": 5000,
      "currency": "MMK",
      "is_popular": false
    },
    {
      "id": "uuid",
      "name": "Pro",
      "credits": 100,
      "price": 40000,
      "currency": "MMK",
      "is_popular": true
    }
  ]
}
```

---

## 🎙️ Voices

#### GET /voices
List available TTS voices.

**Response:**
```json
{
  "voices": [
    {
      "id": "my-MM-NilarNeural",
      "name": "Nilar",
      "language": "my-MM",
      "gender": "female",
      "sample_url": "https://..."
    },
    {
      "id": "my-MM-ThihaNeural",
      "name": "Thiha",
      "language": "my-MM",
      "gender": "male",
      "sample_url": "https://..."
    }
  ]
}
```

---

## 🔧 Admin Endpoints

> All admin endpoints require `is_admin: true` on user.

### Users

#### GET /admin/users
List all users with pagination and search.

#### GET /admin/users/{user_id}
Get user details.

#### PATCH /admin/users/{user_id}
Update user (credit balance, admin status, etc.)

#### POST /admin/users/{user_id}/add-credits
Add credits to user.

### Orders

#### GET /admin/orders
List all orders.

#### POST /admin/orders/{order_id}/approve
Approve order and add credits.

#### POST /admin/orders/{order_id}/reject
Reject order.

### Videos

#### GET /admin/videos
List all videos.

#### DELETE /admin/videos/{video_id}
Delete any video.

### API Keys

#### GET /admin/api-keys
List API keys.

#### POST /admin/api-keys
Create new API key.

#### DELETE /admin/api-keys/{key_id}
Delete API key.

### Dashboard

#### GET /admin/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "total_users": 1000,
  "total_videos": 5000,
  "total_orders": 500,
  "revenue_this_month": 1500000,
  "users_today": 15,
  "videos_today": 45
}
```

---

## 📱 Telegram Webhook

#### POST /telegram/webhook
Telegram bot webhook endpoint.

#### POST /telegram/set-webhook
Set webhook URL (admin only).

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid request body |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## 🔒 Rate Limiting

- **General:** 60 requests/minute per IP
- **Video creation:** 10 requests/minute per user
- **Auth endpoints:** 5 requests/minute per IP
