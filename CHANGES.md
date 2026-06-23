# WiFi Extender SaaS Platform — Changes & Migration Log

Every change made during development, migration, and feature addition.

---

## 1. Environment Migration (macOS)

### Java Version
- `pom.xml`: `java.version` `17` → `21` (Temurin JDK 21)

### Database
```bash
psql -U postgres -c "CREATE DATABASE wifi_extender;"
psql -U postgres -c "CREATE USER wifiuser WITH PASSWORD 'securepassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wifi_extender TO wifiuser;"
psql -U postgres -c "ALTER DATABASE wifi_extender OWNER TO wifiuser;"
psql -U postgres -d wifi_extender -c "GRANT ALL ON SCHEMA public TO wifiuser;"
```

### Maven Wrapper
- Created `backend/mvnw` — delegates to system Maven at `/opt/homebrew/bin/mvn`

### macOS Quarantine Fix
```bash
xattr -rd com.apple.quarantine ~/Desktop/wifi/frontend/node_modules
xattr -rd com.apple.quarantine ~/Desktop/wifi/desktop-app/node_modules
```

---

## 2. Backend Changes

### `pom.xml`
| Change | Detail |
|--------|--------|
| Java version | `17` → `21` |
| Added | `com.stripe:stripe-java:24.3.0` |
| Added | `org.apache.httpcomponents.client5:httpclient5:5.3.1` |
| Updated | AGP `8.2.0` → `8.3.0` |

### `application.properties`
| Property | Value |
|----------|-------|
| datasource username | `wifiuser` |
| datasource password | `securepassword` |
| CORS origins | Added `localhost:5174`, `192.168.1.78:5173/5174` |
| stripe.secret-key | `sk_test_REPLACE` |
| stripe.webhook-secret | `whsec_REPLACE` |
| stripe.publishable-key | `pk_test_REPLACE` |
| razorpay.key-id | `rzp_test_REPLACE` |
| razorpay.key-secret | `REPLACE` |
| paypal.client-id | `REPLACE` |
| paypal.client-secret | `REPLACE` |
| paypal.mode | `sandbox` |
| frontend.url | `http://localhost:5173` |

### New Backend Files

| File | Purpose |
|------|---------|
| `entity/Payment.java` | Payment entity — Stripe/Razorpay/PayPal fields |
| `repository/PaymentRepository.java` | Payment queries + revenue aggregation |
| `service/PaymentService.java` | Full Stripe, Razorpay, PayPal order + verify |
| `controller/PaymentController.java` | `/api/payments/*` endpoints |
| `dto/PaymentDto.java` | Payment request/response DTOs |

### Modified Backend Files

| File | What Changed |
|------|-------------|
| `service/SubscriptionService.java` | `requestPlan()` auto-activates instantly — no admin needed. Issues license immediately. |
| `repository/SubscriptionRepository.java` | Added `JOIN FETCH s.user` — fixed 500 lazy load error |
| `repository/LicenseRepository.java` | Added `JOIN FETCH l.subscription.plan` — fixed 500 lazy load error |
| `controller/AdminController.java` | Injected `PaymentRepository` for real revenue in stats |
| `config/SecurityConfig.java` | Added `/api/payments/webhook/stripe` to public endpoints |

### New Migration: `V6__payments_and_extender.sql`
- `payments`: `gateway_order_id`, `gateway_signature`, `currency`, `description`, `refund_id`, `refunded_at`, `metadata`
- `hotspots`: `mode` (SHARING/REPEATER/BRIDGE), `upstream_ssid`, `upstream_signal`, `upstream_adapter`, `downstream_adapter`, `ics_enabled`
- `plans`: `currency` column

---

## 3. Subscription Flow Change

**Before** — Admin approval required:
```
Request plan → PENDING → Admin activates → License issued
```

**After** — Instant activation:
```
Request plan → ACTIVE immediately → License key generated instantly
```

---

## 4. Frontend Changes

### New Frontend Files

| File | Purpose |
|------|---------|
| `pages/PaymentPage.jsx` | Stripe / Razorpay / PayPal checkout UI |
| `pages/dashboard/AdminLayout.jsx` | Dark-themed admin sidebar layout |
| `pages/dashboard/AdminOverview.jsx` | Admin overview with dark stats cards |
| `pages/dashboard/admin/AdminPayments.jsx` | Payment transactions table |

### Modified Frontend Files

| File | What Changed |
|------|-------------|
| `App.jsx` | Separated admin (`/admin/*`) and user (`/dashboard/*`) routes. Added `/payment` route. |
| `pages/dashboard/DashboardLayout.jsx` | Removed admin NavLink. Added "Admin Panel" button → navigates to `/admin`. |
| `pages/dashboard/SubscriptionPage.jsx` | Paid plans → `/payment?planId=X`. Removed `pendingSub` state and pending banner. |
| `pages/dashboard/AdminPage.jsx` | Added `AdminPayments` tab. |
| `vite.config.js` | Added `host: true` — expose frontend on local network for phone. |

### Admin Routes (separate layout)

```
/admin                 → AdminOverview
/admin/analytics       → AdminAnalytics
/admin/users           → AdminUsers
/admin/subscriptions   → AdminSubscriptions
/admin/payments        → AdminPayments  ← NEW
/admin/licenses        → AdminLicenses
/admin/plans           → AdminPlans
/admin/hotspots        → AdminHotspots
/admin/devices         → AdminDevices
/admin/reports         → AdminReports
```

---

## 5. Desktop App Changes

### `src/main.js` — New IPC Handlers

| Channel | Description |
|---------|-------------|
| `wifi:scan` | Scan WiFi via `netsh wlan show networks` |
| `wifi:adapters` | List adapters via `netsh wlan show interfaces` |
| `wifi:connect-upstream` | Connect to upstream router |
| `wifi:upstream-signal` | Get upstream signal strength |
| `ics:enable` | Enable Internet Connection Sharing via PowerShell |
| `ics:disable` | Disable ICS |
| `extender:config` | Get extender mode config |
| `extender:save` | Save extender mode config |

Added `runPowerShell()` helper.

### `src/preload.js`
```js
wifi:     { scan, adapters, connectUpstream, upstreamSignal }
ics:      { enable, disable }
extender: { getConfig, saveConfig }
```

### New Desktop Files

| File | Purpose |
|------|---------|
| `src/renderer/pages/SetupWizard.jsx` | Mode → Upstream → Config → Confirm+ICS |

### Modified Desktop Files

| File | What Changed |
|------|-------------|
| `src/renderer/App.jsx` | Added SetupWizard between License and Hotspot screens |
| `src/renderer/store/appStore.js` | Added `setupComplete` state + `setSetupComplete` |

### Setup Wizard Steps
```
Step 1: Mode Selection — Repeater / Bridge / Sharing
Step 2: Upstream WiFi scan + connect (Repeater) or adapter select (Bridge)
Step 3: Hotspot SSID + password
Step 4: Confirm + ICS enabled automatically
```

---

## 6. Android App — Built from Scratch

### Project Config

| File | Detail |
|------|--------|
| `build.gradle` root | AGP `8.3.0`, Kotlin `1.9.22` |
| `app/build.gradle` | compileSdk 34, minSdk 26, Java 11, ViewBinding |
| `settings.gradle` | JitPack added for StompProtocolAndroid |
| `local.properties` | `sdk.dir=/Users/akashsharma/Library/Android/sdk` |
| `BASE_URL` | `http://192.168.1.78:8080/api/` (update on IP change) |

### Permissions (AndroidManifest.xml)
```xml
INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE,
CHANGE_WIFI_STATE, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION,
CHANGE_NETWORK_STATE, WRITE_SETTINGS, NEARBY_WIFI_DEVICES,
ACCESS_BACKGROUND_LOCATION
```

### Dependencies
```gradle
androidx.core:core-ktx:1.12.0
androidx.fragment:fragment-ktx:1.6.2
androidx.activity:activity-ktx:1.8.2
androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0
com.squareup.retrofit2:retrofit:2.9.0
com.squareup.retrofit2:converter-gson:2.9.0
com.squareup.okhttp3:logging-interceptor:4.12.0
kotlinx-coroutines-android:1.7.3
com.github.bumptech.glide:glide:4.16.0
```

### File Structure
```
android/app/src/main/java/com/wifiextender/
├── data/
│   ├── api/ApiService.kt          # All REST endpoints
│   ├── api/RetrofitClient.kt      # OkHttp + JWT interceptor
│   ├── model/Models.kt            # All data classes
│   └── prefs/TokenManager.kt     # JWT SharedPreferences storage
├── ui/
│   ├── auth/
│   │   ├── SplashActivity.kt      # Auto-login → Login or Dashboard
│   │   ├── LoginActivity.kt       # Email/password login
│   │   ├── RegisterActivity.kt    # Registration
│   │   └── AuthViewModel.kt       # Login/register API calls
│   └── dashboard/
│       ├── MainActivity.kt        # Bottom navigation host
│       ├── DashboardViewModel.kt  # Shared ViewModel
│       ├── HomeFragment.kt        # Subscription + license + stats
│       ├── HotspotFragment.kt     # Hotspot control
│       ├── DevicesFragment.kt     # Device list + block/unblock
│       ├── SubscriptionFragment.kt # Plans + license key
│       ├── ProfileFragment.kt     # User info + logout
│       └── adapter/
│           ├── DeviceAdapter.kt   # Device RecyclerView
│           └── PlanAdapter.kt     # Plan RecyclerView
└── utils/
    └── HotspotManager.kt          # Programmatic hotspot via reflection
```

### Bottom Navigation

| Tab | Fragment | Features |
|-----|----------|---------|
| Home | HomeFragment | Plan status, license key, copy, device stats |
| Hotspot | HotspotFragment | Start/stop hotspot, SSID/password, uptime timer |
| Devices | DevicesFragment | Live list, online/blocked count, block toggle |
| Plans | SubscriptionFragment | Plan cards, activate instantly, license key copy |
| Profile | ProfileFragment | Name, email, role badge, logout |

### Hotspot Implementation

**Primary (reflection — Android 8-9):**
```kotlin
wifiManager.javaClass.getMethod("setWifiApEnabled",
    WifiConfiguration::class.java, Boolean::class.java)
    .invoke(wifiManager, config, true)
```

**Fallback (Android 10+):**
- reflection blocked → show manual setup dialog
- user enables in phone settings → taps "Mark as Active"

---

## 7. Bug Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| 500 on `/api/subscriptions` | Lazy load outside transaction | `JOIN FETCH s.user` in JPQL |
| 500 on `/api/licenses` | Lazy load outside transaction | `JOIN FETCH l.subscription.plan` |
| Android build jlink error | Java 21 + AGP 8.2 incompatible | Upgrade AGP → `8.3.0` |
| `viewModels` unresolved | Missing fragment-ktx | Added `fragment-ktx:1.6.2` |
| Frontend 403 on phone | CORS missing phone IP | Added phone network IP to CORS |
| Account locked on phone | Too many failed attempts | `UPDATE users SET failed_attempts=0, locked_until=NULL` |
| `Ethernet` icon crash | Icon doesn't exist in lucide-react | Replaced with `Network` |
| Desktop ENOEXEC on macOS | Windows Electron binary installed | Reinstalled Electron for darwin |
| Hotspot permission denied | Android 12 UID mismatch | Fresh uninstall + reinstall |

---

## 8. IP Change Rebuild Script

Run every time your Mac IP changes:

```bash
IP=$(ipconfig getifaddr en0) && \
sed -i '' "s|http://[0-9.]*:8080/api/|http://$IP:8080/api/|g" \
  ~/Desktop/wifi/android/app/build.gradle && \
cd ~/Desktop/wifi/android && ./gradlew assembleDebug && \
~/Library/Android/sdk/platform-tools/adb push \
  ~/Desktop/wifi/android/app/build/outputs/apk/debug/app-debug.apk \
  /sdcard/Download/wifiextender.apk && \
echo "Done! New IP: $IP"
```

---

## 9. ADB Commands Reference

```bash
# Add adb to PATH
echo 'export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"' >> ~/.zshrc
source ~/.zshrc

# Check connected devices
adb devices

# Install APK
adb install -r ~/Desktop/wifi/android/app/build/outputs/apk/debug/app-debug.apk

# Push APK to phone Downloads
adb push ~/Desktop/wifi/android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/wifiextender.apk

# Launch app
adb shell am start -n com.wifiextender/.ui.auth.SplashActivity

# Open app settings on phone
adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:com.wifiextender

# Capture logs
adb logcat -c && sleep 1 && adb logcat -d | grep "wifiextender\|HotspotManager" | head -20

# Unlock all accounts
psql -U wifiuser -d wifi_extender -c "UPDATE users SET failed_attempts=0, locked_until=NULL;"
```

---

## 10. All Credentials

| Service | Email/Key | Password/Secret |
|---------|-----------|----------------|
| Admin | admin@wifiextender.com | admin123 |
| Test User | test@test.com | test123 |
| DB User | wifiuser | securepassword |
| DB Name | wifi_extender | — |

---

## 11. Port Reference

| Service | Port |
|---------|------|
| Spring Boot Backend | 8080 |
| Frontend (Vite) | 5173 |
| Desktop App (Vite) | 5174 |
| PostgreSQL | 5432 |
