# WiFi Extender SaaS Platform — Production MVP

A full-stack White-Label WiFi Extender/Repeater SaaS Platform.
Converts a Windows laptop into a true WiFi range extender with subscription management,
multi-gateway payments, license activation, real-time device monitoring, and a complete admin dashboard.

---

## Architecture

```
Main Router
    ↓ (upstream — WiFi or Ethernet)
Windows Laptop running WiFiExtender
    ↓ (downstream — extended hotspot)
Nearby Devices get extended coverage
```

### Three Modes

| Mode | Upstream | Downstream | Adapters needed |
|------|----------|------------|-----------------|
| Repeater | WiFi Adapter 1 → Router | WiFi Adapter 2 → Devices | 2 WiFi adapters |
| Bridge | Ethernet → Router | WiFi Adapter → Devices | 1 adapter + cable |
| Sharing | Any internet | WiFi Hotspot | 1 adapter |

---

## Project Structure

```
wifi/
├── backend/                        # Spring Boot 3 REST API
│   ├── src/main/java/com/wifiextender/
│   │   ├── config/                 # Security, WebSocket, OpenAPI
│   │   ├── controller/             # Auth, Plans, Subscriptions, Licenses,
│   │   │                           # Hotspots, Devices, Payments, Admin
│   │   ├── dto/                    # Request/Response DTOs
│   │   ├── entity/                 # JPA entities
│   │   ├── repository/             # Spring Data JPA repositories
│   │   ├── security/               # JWT filter and utility
│   │   └── service/                # Business logic + PaymentService
│   └── src/main/resources/
│       ├── db/migration/           # Flyway V1–V6
│       └── application.properties
├── frontend/                       # React + Vite web dashboard
│   └── src/
│       ├── pages/
│       │   ├── PaymentPage.jsx     # Stripe / Razorpay / PayPal checkout
│       │   └── dashboard/admin/
│       │       └── AdminPayments.jsx
│       └── ...
├── desktop-app/                    # Electron desktop app (Windows)
│   └── src/
│       ├── main.js                 # IPC: hotspot, wifi scan, ICS, extender
│       ├── preload.js              # IPC bridge
│       └── renderer/
│           └── pages/
│               └── SetupWizard.jsx # Mode → Upstream → Config → Start
└── deploy.sh
```

---

## Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Zustand, React Router  |
| Backend    | Spring Boot 3.2, Spring Security, JWT, JPA/Hibernate |
| Database   | PostgreSQL 16                                        |
| Migrations | Flyway (V1–V6)                                       |
| Payments   | Stripe, Razorpay, PayPal                             |
| Desktop    | Electron 28, React, Node.js                          |
| Realtime   | STOMP over SockJS (WebSocket)                        |
| Proxy      | NGINX                                                |
| Deployment | Ubuntu VPS                                           |

---

## Quick Start

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE wifi_extender;"
psql -U postgres -c "CREATE USER wifiuser WITH PASSWORD 'securepassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wifi_extender TO wifiuser;"
psql -U postgres -c "ALTER DATABASE wifi_extender OWNER TO wifiuser;"
psql -U postgres -d wifi_extender -c "GRANT ALL ON SCHEMA public TO wifiuser;"
```

### 2. Backend — Terminal 1

```bash
cd backend
mvn spring-boot:run
```

### 3. Frontend — Terminal 2

```bash
cd frontend
npm install
npm run dev
```

### 4. Desktop App — Terminal 3

```bash
cd desktop-app
npm install
npm run dev
```

---

## Fix: macOS "bad interpreter" error

```bash
xattr -rd com.apple.quarantine ~/Desktop/wifi/frontend/node_modules
xattr -rd com.apple.quarantine ~/Desktop/wifi/desktop-app/node_modules
```

## Fix: Port 8080 in use

```bash
lsof -ti :8080 | xargs kill -9
```

---

## Default Credentials

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@wifiextender.com | admin123 |

---

## Payment Gateway Setup

Edit `backend/src/main/resources/application.properties`:

```properties
# Stripe
app.payment.stripe.secret-key=sk_test_YOUR_KEY
app.payment.stripe.webhook-secret=whsec_YOUR_SECRET
app.payment.stripe.publishable-key=pk_test_YOUR_KEY

# Razorpay
app.payment.razorpay.key-id=rzp_test_YOUR_KEY_ID
app.payment.razorpay.key-secret=YOUR_KEY_SECRET

# PayPal
app.payment.paypal.client-id=YOUR_CLIENT_ID
app.payment.paypal.client-secret=YOUR_CLIENT_SECRET
app.payment.paypal.mode=sandbox
```

### Payment Flow

```
User clicks plan → /payment?planId=X
    ↓
Select gateway (Stripe / Razorpay / PayPal)
    ↓
POST /api/payments/create-order  → returns clientSecret / orderId / approvalUrl
    ↓
Gateway SDK handles UI (card form / Razorpay modal / PayPal redirect)
    ↓
POST /api/payments/verify  → verifies signature / captures payment
    ↓
Subscription auto-activated → License key generated
    ↓
User redirected to /dashboard/subscription
```

### Stripe Webhook

Register in Stripe Dashboard:
```
https://yourdomain.com/api/payments/webhook/stripe
Event: payment_intent.succeeded
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Auth   | Description               |
|--------|----------------------|--------|---------------------------|
| POST   | `/api/auth/register` | Public | Register new user         |
| POST   | `/api/auth/login`    | Public | Login, returns JWT tokens |
| POST   | `/api/auth/refresh`  | Public | Refresh access token      |
| POST   | `/api/auth/logout`   | User   | Revoke refresh tokens     |
| GET    | `/api/auth/me`       | User   | Get current user profile  |

### Plans
| Method | Endpoint          | Auth   | Description       |
|--------|-------------------|--------|-------------------|
| GET    | `/api/plans`      | Public | List active plans |
| GET    | `/api/plans/{id}` | Public | Get plan by ID    |

### Payments
| Method | Endpoint                        | Auth   | Description                        |
|--------|---------------------------------|--------|------------------------------------|
| POST   | `/api/payments/create-order`    | User   | Create Stripe/Razorpay/PayPal order|
| POST   | `/api/payments/verify`          | User   | Verify payment + activate sub      |
| POST   | `/api/payments/webhook/stripe`  | Public | Stripe webhook handler             |
| GET    | `/api/payments`                 | User   | My payment history                 |
| GET    | `/api/payments/admin`           | Admin  | All payments                       |

### Subscriptions
| Method | Endpoint                          | Auth | Description            |
|--------|-----------------------------------|------|------------------------|
| GET    | `/api/subscriptions`              | User | My subscriptions       |
| GET    | `/api/subscriptions/active`       | User | My active subscription |
| POST   | `/api/subscriptions/request/{id}` | User | Request free plan      |
| GET    | `/api/subscriptions/licenses`     | User | My license keys        |

### Licenses
| Method | Endpoint                         | Auth | Description                 |
|--------|----------------------------------|------|-----------------------------|
| POST   | `/api/licenses/activate`         | User | Activate license on machine |
| POST   | `/api/licenses/validate`         | User | Validate license (heartbeat)|
| GET    | `/api/licenses`                  | User | My licenses                 |
| POST   | `/api/licenses/{key}/deactivate` | User | Unbind machine              |

### Hotspots
| Method | Endpoint                   | Auth | Description           |
|--------|----------------------------|------|-----------------------|
| GET    | `/api/hotspots`            | User | List my hotspots      |
| GET    | `/api/hotspots/active`     | User | Get active hotspot    |
| POST   | `/api/hotspots`            | User | Create hotspot        |
| PUT    | `/api/hotspots/{id}`       | User | Update hotspot config |
| POST   | `/api/hotspots/{id}/start` | User | Start hotspot         |
| POST   | `/api/hotspots/{id}/stop`  | User | Stop hotspot          |
| DELETE | `/api/hotspots/{id}`       | User | Delete hotspot        |

### Devices
| Method | Endpoint                   | Auth | Description                 |
|--------|----------------------------|------|-----------------------------|
| GET    | `/api/devices`             | User | List connected devices      |
| GET    | `/api/devices/stats`       | User | Device statistics           |
| POST   | `/api/devices/report`      | User | Report device (upsert)      |
| POST   | `/api/devices/report/bulk` | User | Bulk report devices         |
| PUT    | `/api/devices/{id}/block`  | User | Toggle block/unblock device |

### Admin
| Method | Endpoint                                 | Auth  | Description                   |
|--------|------------------------------------------|-------|-------------------------------|
| GET    | `/api/admin/stats`                       | Admin | Platform stats + real revenue |
| GET    | `/api/admin/users`                       | Admin | All users                     |
| GET    | `/api/admin/plans`                       | Admin | All plans                     |
| POST   | `/api/admin/plans`                       | Admin | Create plan                   |
| PUT    | `/api/admin/plans/{id}`                  | Admin | Update plan                   |
| PATCH  | `/api/admin/plans/{id}/toggle`           | Admin | Toggle active/inactive        |
| DELETE | `/api/admin/plans/{id}`                  | Admin | Delete plan                   |
| GET    | `/api/admin/subscriptions`               | Admin | All subscriptions             |
| POST   | `/api/admin/subscriptions/assign`        | Admin | Assign plan to user           |
| POST   | `/api/admin/subscriptions/{id}/activate` | Admin | Activate subscription         |
| POST   | `/api/admin/subscriptions/{id}/extend`   | Admin | Extend subscription           |
| POST   | `/api/admin/subscriptions/{id}/disable`  | Admin | Disable subscription          |
| GET    | `/api/admin/licenses`                    | Admin | All licenses                  |
| GET    | `/api/admin/licenses/stats`              | Admin | License statistics            |
| POST   | `/api/admin/licenses/{id}/revoke`        | Admin | Revoke license                |
| POST   | `/api/admin/licenses/{id}/reset-machine` | Admin | Reset machine binding         |
| GET    | `/api/admin/hotspots`                    | Admin | All hotspots                  |
| GET    | `/api/admin/devices`                     | Admin | All connected devices         |
| GET    | `/api/admin/analytics`                   | Admin | Platform analytics            |
| GET    | `/api/admin/reports/{type}`              | Admin | Download CSV/JSON report      |

---

## Database Migrations

| Version | Description                                        |
|---------|----------------------------------------------------|
| V1      | Full base schema + seed data                       |
| V2      | Partial indexes for performance                    |
| V3      | Subscription system + plan types + seeded plans    |
| V4      | License machine binding + activation audit log     |
| V5      | Device online/vendor/signal fields                 |
| V6      | Payment gateway columns + hotspot extender mode    |

---

## Desktop App — Setup Wizard Flow

```
Launch → Login → License Activation → Setup Wizard → Hotspot Dashboard
```

### Setup Wizard Steps

1. **Mode Selection** — Repeater / Bridge / Sharing
2. **Upstream Config** (Repeater: scan + connect WiFi | Bridge: select adapters)
3. **Hotspot Config** — SSID + password
4. **Confirm + Start** — enables ICS automatically for Repeater/Bridge

### IPC Channels (preload.js)

| Channel | Description |
|---------|-------------|
| `wifi:scan` | Scan available WiFi networks |
| `wifi:adapters` | List all network adapters |
| `wifi:connect-upstream` | Connect to upstream router |
| `wifi:upstream-signal` | Get upstream signal strength |
| `ics:enable` | Enable Internet Connection Sharing |
| `ics:disable` | Disable ICS |
| `extender:config` | Get/save extender mode config |
| `hotspot:start/stop/status` | Control hosted network |
| `network:speed` | Get live upload/download speed |
| `machine:id/label/info` | Machine fingerprint for license |

---

## WebSocket (Real-time)

STOMP over SockJS at `/ws`

| Topic | Description |
|-------|-------------|
| `/topic/devices/{userId}` | Full device list refresh |
| `/topic/devices/{userId}/event` | Device connect/block event |

---

## Security

| Feature | Detail |
|---------|--------|
| Passwords | BCrypt strength 12 |
| Access tokens | JWT, 24h expiry |
| Refresh tokens | JWT, 7d, rotated on use |
| Payment verification | Razorpay HMAC-SHA256, Stripe webhook signature |
| Account lockout | 5 failed attempts → 15 min lock |
| Roles | `ROLE_USER`, `ROLE_ADMIN` |
| License binding | SHA-256 of hostname + CPU + OS + arch |

---

## Seeded Plans

| Plan | Price | Type | Devices | Duration |
|------|-------|------|---------|----------|
| Free Trial | $0.00 | FREE_TRIAL | 3 | 7 days |
| Starter | $4.99/mo | MONTHLY | 3 | 30 days |
| Basic | $9.99/mo | MONTHLY | 10 | 30 days |
| Premium | $19.99/mo | MONTHLY | Unlimited | 30 days |
| Lifetime | $99.99 | LIFETIME | Unlimited | Forever |

---

## Project URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Pricing | http://localhost:5173/pricing |
| Payment | http://localhost:5173/payment?planId=X |
| User Dashboard | http://localhost:5173/dashboard |
| Admin Dashboard | http://localhost:5173/admin |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

---

## Deployment (Ubuntu VPS)

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

NGINX proxies `/api/*` and `/ws/*` → Spring Boot 8080, `/*` → React build.
SSL via Let's Encrypt — uncomment certbot line in `deploy.sh`.
