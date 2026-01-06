# Authentication System

## 📋 Overview

RecapVideo.AI uses JWT (JSON Web Token) based authentication with access and refresh token mechanism.

---

## 🔐 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Backend   │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  POST /auth/signup│                   │
       │──────────────────▶│                   │
       │                   │  Create User      │
       │                   │──────────────────▶│
       │                   │                   │
       │  { access_token,  │◀──────────────────│
       │    refresh_token }│                   │
       │◀──────────────────│                   │
       │                   │                   │
       │  GET /users/me    │                   │
       │  Authorization:   │                   │
       │  Bearer <token>   │                   │
       │──────────────────▶│                   │
       │                   │  Validate JWT     │
       │                   │  Get User         │
       │                   │──────────────────▶│
       │                   │◀──────────────────│
       │  { user_data }    │                   │
       │◀──────────────────│                   │
```

---

## 🔑 Token Types

### Access Token
- **Lifetime**: 30 minutes (configurable)
- **Usage**: API authorization
- **Storage**: Memory (Zustand store)

### Refresh Token
- **Lifetime**: 7 days (configurable)
- **Usage**: Get new access token
- **Storage**: HTTP-only cookie (recommended) or localStorage

---

## 📡 API Endpoints

### POST `/api/v1/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "StrongPass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "is_admin": false,
    "credit_balance": 3
  }
}
```

### POST `/api/v1/auth/login`
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

### POST `/api/v1/auth/refresh`
Get new access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/v1/auth/logout`
Invalidate current tokens.

### POST `/api/v1/auth/forgot-password`
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST `/api/v1/auth/reset-password`
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewStrongPass123"
}
```

---

## 🗄️ Backend Implementation

### Security Module (`app/core/security.py`)

```python
# Password Hashing
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# JWT Token Creation
def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
```

### User Model (`app/models/user.py`)

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    credit_balance = Column(Integer, default=0)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

---

## 🖥️ Frontend Implementation

### Auth Store (`stores/auth-store.ts`)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    { name: 'auth-storage' }
  )
);
```

### Auth Guard Component

```tsx
// components/auth/auth-guard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;
  
  return <>{children}</>;
}
```

### API Client with Token Refresh

```typescript
// lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const { data } = await axios.post('/auth/refresh', { refreshToken });
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return axios(error.config);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt (via passlib) |
| **JWT Algorithm** | HS256 |
| **Token Storage** | Zustand with persist |
| **CORS** | Configurable origins |
| **Rate Limiting** | TODO |
| **Brute Force Protection** | TODO |

---

## ⚙️ Configuration

### Backend (.env)
```env
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 📂 Related Files

### Backend
- `app/core/security.py` - JWT & password utilities
- `app/api/v1/endpoints/auth.py` - Auth endpoints
- `app/models/user.py` - User model
- `app/schemas/user.py` - User schemas
- `app/core/dependencies.py` - Auth dependencies

### Frontend
- `stores/auth-store.ts` - Auth state management
- `hooks/use-auth.ts` - Auth hooks
- `components/auth/auth-guard.tsx` - Route protection
- `components/auth/login-form.tsx` - Login form
- `components/auth/signup-form.tsx` - Signup form
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/signup/page.tsx` - Signup page
