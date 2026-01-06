# Admin Panel

## 📋 Overview

The Admin Panel provides administrators with tools to manage users, orders, videos, prompts, and system settings.

---

## 🔐 Admin Access

### Role-Based Access Control

```python
# app/core/dependencies.py
async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user
```

### Admin Routes Protection

```tsx
// Frontend: app/(admin)/layout.tsx
export default function AdminLayout({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user?.is_admin) {
    redirect('/login');
  }
  
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## 📊 Admin Dashboard

### Overview Stats

| Metric | Description |
|--------|-------------|
| Total Users | All registered users |
| Active Users | Users active in last 30 days |
| Total Videos | All videos created |
| Pending Orders | Orders awaiting approval |
| Revenue (MTD) | Month-to-date revenue |
| Credits Sold | Total credits sold |

### Dashboard API

```
GET /api/v1/admin/stats
```

**Response:**
```json
{
  "users": {
    "total": 1500,
    "active": 850,
    "new_today": 25,
    "new_this_week": 120
  },
  "videos": {
    "total": 5000,
    "completed": 4800,
    "processing": 50,
    "failed": 150
  },
  "orders": {
    "pending": 12,
    "approved_today": 45,
    "revenue_mtd": 2500.00
  },
  "credits": {
    "total_sold": 50000,
    "total_used": 35000
  }
}
```

---

## 👥 User Management

### Features

- View all users with pagination
- Search users by email/name
- View user details
- Edit user info
- Adjust user credits
- Ban/unban users
- Make user admin

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users |
| GET | `/api/v1/admin/users/{id}` | Get user details |
| PATCH | `/api/v1/admin/users/{id}` | Update user |
| POST | `/api/v1/admin/users/{id}/credits` | Adjust credits |
| POST | `/api/v1/admin/users/{id}/ban` | Ban user |
| POST | `/api/v1/admin/users/{id}/make-admin` | Grant admin |

### User List Page

```tsx
// app/(admin)/admin/users/page.tsx
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  
  return (
    <div>
      <div className="flex justify-between">
        <h1>Users</h1>
        <Input 
          placeholder="Search users..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <DataTable
        columns={userColumns}
        data={users}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
      />
    </div>
  );
}
```

---

## 📦 Order Management

### Order Statuses

| Status | Description | Actions |
|--------|-------------|---------|
| `pending` | Awaiting admin review | Approve / Reject |
| `approved` | Payment verified, credits added | - |
| `rejected` | Payment declined | - |
| `cancelled` | Cancelled by user | - |

### Order Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Pending   │────▶│  Review     │────▶│  Approved   │
│   Order     │     │  Screenshot │     │  + Credits  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Rejected   │
                   │  (reason)   │
                   └─────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/orders` | List all orders |
| GET | `/api/v1/admin/orders/{id}` | Get order details |
| POST | `/api/v1/admin/orders/{id}/approve` | Approve order |
| POST | `/api/v1/admin/orders/{id}/reject` | Reject order |

### Approve Order Flow

```python
# app/api/v1/endpoints/orders.py
@router.post("/admin/orders/{order_id}/approve")
async def approve_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    order = await get_order_by_id(db, order_id)
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(400, "Order is not pending")
    
    # Update order status
    order.status = OrderStatus.APPROVED
    order.approved_at = datetime.utcnow()
    
    # Add credits to user
    user = await get_user_by_id(db, order.user_id)
    user.credit_balance += order.credits_amount
    
    # Create transaction record
    await create_credit_transaction(
        db,
        user_id=order.user_id,
        amount=order.credits_amount,
        transaction_type=TransactionType.PURCHASE,
        reference_type="order",
        reference_id=str(order.id)
    )
    
    await db.commit()
    return {"message": "Order approved", "credits_added": order.credits_amount}
```

---

## 🎬 Video Management

### Features

- View all videos
- Filter by status
- View processing details
- Retry failed videos
- Delete videos

### Video Statuses

| Status | Color | Description |
|--------|-------|-------------|
| `pending` | Yellow | Queued for processing |
| `processing` | Blue | Currently processing |
| `completed` | Green | Successfully completed |
| `failed` | Red | Processing failed |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/videos` | List all videos |
| GET | `/api/v1/admin/videos/{id}` | Get video details |
| POST | `/api/v1/admin/videos/{id}/retry` | Retry failed video |
| DELETE | `/api/v1/admin/videos/{id}` | Delete video |

---

## 📝 Prompt Management

### System Prompts

| Prompt ID | Purpose |
|-----------|---------|
| `script_generation` | AI script generation prompt |
| `translation` | Translation prompt template |
| `summarization` | Content summarization prompt |

### Prompt Schema

```python
class SystemPrompt(Base):
    __tablename__ = "system_prompts"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    prompt_template = Column(Text, nullable=False)
    variables = Column(JSON, default=[])  # e.g., ["language", "style"]
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(UUID, ForeignKey("users.id"))
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/prompts` | List all prompts |
| GET | `/api/v1/admin/prompts/{id}` | Get prompt |
| PUT | `/api/v1/admin/prompts/{id}` | Update prompt |

### Prompt Editor

```tsx
// app/(admin)/admin/prompts/page.tsx
export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Prompt List */}
      <div className="col-span-1">
        {prompts.map(prompt => (
          <Card 
            key={prompt.id}
            onClick={() => setSelectedPrompt(prompt)}
            className={selectedPrompt?.id === prompt.id ? 'border-primary' : ''}
          >
            <CardHeader>
              <CardTitle>{prompt.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      
      {/* Prompt Editor */}
      <div className="col-span-2">
        {selectedPrompt && (
          <PromptEditor 
            prompt={selectedPrompt}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
```

---

## ⚙️ Settings Management

### System Settings

| Setting | Type | Description |
|---------|------|-------------|
| `welcome_credits` | number | Credits given on signup |
| `max_video_duration` | number | Max video duration (seconds) |
| `credits_per_minute` | number | Credits per minute of video |
| `maintenance_mode` | boolean | Enable maintenance mode |
| `allowed_languages` | array | Supported output languages |

### API Key Management

```python
# app/models/api_key.py
class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    service = Column(String(50), nullable=False)  # "gemini", "transcript"
    key_name = Column(String(100), nullable=False)
    api_key = Column(String(500), nullable=False)  # Encrypted
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Settings Page

```tsx
// app/(admin)/admin/settings/page.tsx
export default function AdminSettingsPage() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="storage">Storage</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>
      
      <TabsContent value="api-keys">
        <ApiKeySettings />
      </TabsContent>
      
      {/* ... */}
    </Tabs>
  );
}
```

---

## 🖥️ Admin Components

### AdminSidebar

```tsx
// components/admin/admin-sidebar.tsx
const adminNavItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Videos', href: '/admin/videos', icon: Video },
  { title: 'Orders', href: '/admin/orders', icon: CreditCard },
  { title: 'Prompts', href: '/admin/prompts', icon: FileText },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];
```

### StatsCard

```tsx
// components/admin/stats-card.tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
}

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### DataTable

```tsx
// components/admin/data-table.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  pagination?: boolean;
}

export function DataTable<T>({ columns, data, onRowClick, pagination }: DataTableProps<T>) {
  // Uses @tanstack/react-table for advanced features
  return (
    <Table>
      <TableHeader>
        {/* Column headers */}
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow 
            key={row.id} 
            onClick={() => onRowClick?.(row)}
            className="cursor-pointer hover:bg-muted"
          >
            {/* Row cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 📂 Related Files

### Backend
- `app/api/v1/endpoints/admin_api_keys.py` - API key management
- `app/core/dependencies.py` - Admin dependency check
- `app/services/api_key_service.py` - API key service

### Frontend
- `app/(admin)/layout.tsx` - Admin layout
- `app/(admin)/admin/page.tsx` - Dashboard
- `app/(admin)/admin/users/page.tsx` - User management
- `app/(admin)/admin/videos/page.tsx` - Video management
- `app/(admin)/admin/orders/page.tsx` - Order management
- `app/(admin)/admin/prompts/page.tsx` - Prompt management
- `app/(admin)/admin/settings/page.tsx` - Settings
- `components/admin/admin-sidebar.tsx` - Sidebar navigation
- `components/admin/admin-header.tsx` - Header component
- `components/admin/stats-card.tsx` - Statistics card
- `components/admin/data-table.tsx` - Data table component
