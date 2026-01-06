# Credits & Billing System

## 📋 Overview

RecapVideo.AI uses a credit-based billing system where users purchase credits to create videos.

---

## 💰 Credit System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CREDITS SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐  │
│  │   User      │      │   Credits   │      │   Transaction   │  │
│  │ credit_     │◀────▶│   System    │◀────▶│   History       │  │
│  │ balance     │      │             │      │                 │  │
│  └─────────────┘      └─────────────┘      └─────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    TRANSACTION TYPES                       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  + PURCHASE    │ Buy credits via order                    │  │
│  │  + BONUS       │ Welcome bonus, promotions                │  │
│  │  + REFUND      │ Failed video refund                      │  │
│  │  - USAGE       │ Video creation                           │  │
│  │  - ADJUSTMENT  │ Admin manual adjustment                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Credit Packages

| Package | Credits | Price (USD) | Price (MMK) | Per Credit |
|---------|---------|-------------|-------------|------------|
| **Starter** | 10 | $4.99 | 10,000 | $0.50 |
| **Basic** | 30 | $9.99 | 21,000 | $0.33 |
| **Pro** | 100 | $29.99 | 63,000 | $0.30 |
| **Business** | 500 | $99.99 | 210,000 | $0.20 |

```python
# app/schemas/credit.py
CREDIT_PACKAGES = [
    CreditPackage(
        id="starter",
        name="Starter",
        credits=10,
        price_usd=4.99,
        price_mmk=10000,
        popular=False,
    ),
    CreditPackage(
        id="basic",
        name="Basic",
        credits=30,
        price_usd=9.99,
        price_mmk=21000,
        popular=True,
    ),
    # ...
]
```

---

## 📊 Credit Usage

| Action | Credits | Notes |
|--------|---------|-------|
| Video creation (< 10 min) | 1 | Standard video |
| Video creation (10-30 min) | 2 | Medium video |
| Video creation (30-60 min) | 3 | Long video |
| Welcome bonus | +3 | New user signup |
| Failed video refund | +1 | Automatic refund |

---

## 📡 API Endpoints

### GET `/api/v1/credits/balance`
Get current credit balance and summary.

**Response:**
```json
{
  "balance": 25,
  "total_earned": 50,
  "total_spent": 25
}
```

### GET `/api/v1/credits/transactions`
List credit transactions with pagination.

**Query Parameters:**
- `page` (int): Page number
- `page_size` (int): Items per page
- `transaction_type` (string): Filter by type

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "amount": -1,
      "balance_after": 24,
      "description": "Video creation: How to...",
      "reference_type": "video",
      "reference_id": "video-uuid",
      "created_at": "2024-01-05T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "purchase",
      "amount": 30,
      "balance_after": 25,
      "description": "Basic package purchase",
      "reference_type": "order",
      "reference_id": "order-uuid",
      "created_at": "2024-01-04T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 10,
  "total_pages": 5
}
```

### GET `/api/v1/credits/packages`
List available credit packages.

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

## 🗄️ Database Models

### Credit Transaction Model

```python
# app/models/credit.py
class TransactionType(str, Enum):
    PURCHASE = "purchase"    # Credit purchase
    USAGE = "usage"          # Video creation
    BONUS = "bonus"          # Welcome/promo bonus
    REFUND = "refund"        # Failed video refund
    ADJUSTMENT = "adjustment" # Admin adjustment

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    transaction_type = Column(String(20), nullable=False)
    amount = Column(Integer, nullable=False)  # Positive or negative
    balance_after = Column(Integer, nullable=False)
    
    description = Column(String(500), nullable=True)
    reference_type = Column(String(50), nullable=True)  # "video", "order"
    reference_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="credit_transactions")
```

### User Credit Balance

```python
# In app/models/user.py
class User(Base):
    # ...
    credit_balance = Column(Integer, default=0)
    
    def can_create_video(self, credits_required: int) -> bool:
        return self.credit_balance >= credits_required
```

---

## 🔄 Order System

### Order Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Create   │     │  Payment  │     │  Verify   │     │  Add      │
│  Order    │────▶│  Process  │────▶│  Payment  │────▶│  Credits  │
│           │     │           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
   pending          pending         approved/          completed
                                    rejected
```

### Order Model

```python
# app/models/order.py
class OrderStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    
    # Package details
    credits_amount = Column(Integer, nullable=False)
    price_usd = Column(Numeric(10, 2), nullable=False)
    price_mmk = Column(Numeric(12, 2), nullable=True)
    
    # Payment
    payment_method = Column(String(50), nullable=False)
    payment_id = Column(String(200), nullable=True)
    payment_screenshot_url = Column(String(500), nullable=True)
    
    # Promo
    promo_code = Column(String(50), nullable=True)
    discount_percent = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default=OrderStatus.PENDING)
    admin_note = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders")
```

---

## 📡 Order API Endpoints

### POST `/api/v1/orders`
Create new order.

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
  "credits_amount": 30,
  "price_usd": 9.99,
  "price_mmk": 21000,
  "payment_method": "kbzpay",
  "status": "pending",
  "created_at": "2024-01-05T10:00:00Z"
}
```

### GET `/api/v1/orders`
List user's orders.

### POST `/api/v1/orders/{id}/screenshot`
Upload payment screenshot (for manual payment methods).

### Admin: POST `/api/v1/admin/orders/{id}/approve`
Approve order and add credits.

### Admin: POST `/api/v1/admin/orders/{id}/reject`
Reject order with reason.

---

## 🖥️ Frontend Components

### Credits Page

```tsx
// app/(dashboard)/credits/page.tsx
export default function CreditsPage() {
  const { balance, transactions, isLoading } = useCredits();
  
  return (
    <div>
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{balance.balance}</div>
          <p>Total earned: {balance.total_earned}</p>
          <p>Total spent: {balance.total_spent}</p>
        </CardContent>
      </Card>
      
      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.map(tx => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Buy Credits Page

```tsx
// app/(dashboard)/buy/page.tsx
export default function BuyCreditsPage() {
  const { packages, createOrder } = useCredits();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {packages.map(pkg => (
        <Card key={pkg.id} className={pkg.popular ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle>{pkg.name}</CardTitle>
            {pkg.popular && <Badge>Most Popular</Badge>}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pkg.credits} Credits</div>
            <div className="text-xl">${pkg.price_usd}</div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => createOrder(pkg.id)}>
              Buy Now
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

---

## 🔐 Credit Security

| Security Feature | Implementation |
|------------------|----------------|
| **Atomic transactions** | Database transactions ensure balance consistency |
| **Balance validation** | Check before video creation |
| **Audit trail** | All changes logged in credit_transactions |
| **Admin only** | Manual adjustments require admin role |
| **Refund automation** | Failed videos auto-refund |

---

## 📂 Related Files

### Backend
- `app/models/credit.py` - Credit transaction model
- `app/models/order.py` - Order model
- `app/schemas/credit.py` - Credit schemas + packages
- `app/schemas/order.py` - Order schemas
- `app/api/v1/endpoints/credits.py` - Credit endpoints
- `app/api/v1/endpoints/orders.py` - Order endpoints

### Frontend
- `hooks/use-credits.ts` - Credit hooks
- `app/(dashboard)/credits/page.tsx` - Credits page
- `app/(dashboard)/buy/page.tsx` - Buy credits page
- `app/(admin)/admin/orders/page.tsx` - Admin orders management
