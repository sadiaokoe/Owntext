# 📱 OwnText — SMS Gateway Platform v1.0 (Final PRD)

> **প্রজেক্ট নাম:** OwnText  
> **ভার্সন:** 1.0 (Test Mode — Supabase-only)  
> **অনুপ্রেরণা:** [textbee.dev](https://textbee.dev)  
> **তারিখ:** ৩০ জুন ২০২৬  
> **আর্কিটেকচার:** Supabase-only (Auth + DB + Edge Functions + Realtime)  
> **পেমেন্ট:** ❌ নেই (v2.0-তে যোগ হবে)  
> **Access:** Email Whitelist (অনুমোদিত ইমেইল ছাড়া কেউ ব্যবহার করতে পারবে না)

---

## ১. প্রোডাক্ট ভিশন

OwnText হলো একটি SMS Gateway প্ল্যাটফর্ম যেটি ইউজারের নিজস্ব Android ফোনকে SMS Gateway হিসেবে ব্যবহার করে। Twilio/MessageBird-এর মতো per-message charge ছাড়াই, নিজের SIM কার্ড দিয়ে যেকোনো ওয়েবসাইট বা অ্যাপ্লিকেশন থেকে API-এর মাধ্যমে SMS পাঠানো ও গ্রহণ করা যাবে।

### v1.0 vs v2.0 রোডম্যাপ

| বিষয় | v1.0 (এখন — টেস্ট মোড) | v2.0 (পরে — বিজনেস মোড) |
|---|---|---|
| **Backend** | Supabase-only (Edge Functions) | VPS + Node.js/NestJS |
| **Database** | Supabase PostgreSQL (Free tier) | VPS-এ PostgreSQL বা Supabase Pro |
| **Access** | Email Whitelist (invite-only) | Public Signup + Plan system |
| **Payment** | ❌ নেই | SSLCommerz / Stripe |
| **Hosting খরচ** | **৳০** (সব Free tier) | VPS খরচ + Domain |
| **লক্ষ্য** | সিস্টেম প্রমাণ ও টেস্ট | পূর্ণ বিজনেস লঞ্চ |

---

## ২. সিস্টেম আর্কিটেকচার (Supabase-Only)

```mermaid
graph TB
    subgraph "ক্লায়েন্ট সাইড"
        A["🌐 Web Dashboard<br/>(Next.js + Supabase Client)"]
        B["📱 Android App<br/>(Kotlin)"]
        C["🔌 Third-party Apps<br/>(REST API ব্যবহারকারী)"]
    end

    subgraph "Supabase (সব একখানে)"
        D["🔐 Supabase Auth<br/>(Email Whitelist)"]
        E["🗄️ PostgreSQL DB<br/>(RLS Protected)"]
        F["⚡ Edge Functions<br/>(send-sms, webhook, etc.)"]
        G["📡 Realtime<br/>(WebSocket)"]
    end

    H["🔔 Firebase FCM<br/>(Push to Android)"]

    A -->|Auth| D
    A -->|Direct Query (RLS)| E
    A -->|Realtime Subscribe| G
    C -->|API Key Header| F
    F -->|Read/Write| E
    F -->|Push Command| H
    H -->|SMS পাঠাও| B
    B -->|Status Update| F
    B -->|Heartbeat| F
    G -->|Live Updates| A
```

### কোনো আলাদা Backend Server নেই!

| কাজ | Supabase-র যেটা ব্যবহার হবে |
|---|---|
| User Login/Signup | **Supabase Auth** (built-in) |
| ডেটা Read/Write (Dashboard থেকে) | **Supabase Client + RLS** (সরাসরি DB query, middleware দরকার নেই) |
| SMS পাঠানোর API (বাহিরের apps-এর জন্য) | **Edge Function:** `send-sms` |
| API Key তৈরি ও verify | **Edge Function:** `manage-api-keys` |
| Android থেকে status update | **Edge Function:** `update-message-status` |
| Android ডিভাইস register | **Edge Function:** `register-device` |
| Webhook fire করা | **Edge Function:** `fire-webhook` (DB trigger দিয়ে) |
| Realtime dashboard update | **Supabase Realtime** (built-in WebSocket) |
| Data Security | **Row Level Security (RLS)** policies |

---

## ৩. ডাটাবেস স্কিমা (Supabase PostgreSQL)

### ৩.১ `profiles` — ইউজার প্রোফাইল

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,   -- ✅ Whitelist: TRUE হলেই সিস্টেম ব্যবহার করতে পারবে
    messages_sent_today INT DEFAULT 0,
    messages_sent_this_month INT DEFAULT 0,
    last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
    last_monthly_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- নতুন ইউজার signup করলে অটো profile তৈরি হবে
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### ৩.২ `api_keys` — API Key ম্যানেজমেন্ট

```sql
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,        -- SHA-256 hash (plain text কখনো সেভ হবে না)
    key_prefix TEXT NOT NULL,             -- প্রথম ৮ char (UI-তে চেনার জন্য: "owtxt_k_...")
    name TEXT DEFAULT 'Default Key',
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ৩.৩ `devices` — রেজিস্টার্ড Android ডিভাইস

```sql
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT,                     -- "Samsung Galaxy S24"
    device_model TEXT,                    -- "SM-S921B"
    phone_number TEXT,
    android_version TEXT,
    app_version TEXT,
    fcm_token TEXT,                       -- Firebase Cloud Messaging token
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ৩.৪ `messages` — SMS Log (সবচেয়ে গুরুত্বপূর্ণ টেবিল)

```sql
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    batch_id TEXT,                        -- bulk SMS-এ একই batch_id
    recipient TEXT NOT NULL,              -- ফোন নম্বর
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent_to_device', 'sent', 'delivered', 'failed')),
    direction TEXT DEFAULT 'outbound'
        CHECK (direction IN ('outbound', 'inbound')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_device_id ON public.messages(device_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_direction ON public.messages(direction);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_batch_id ON public.messages(batch_id);
```

### ৩.৫ `webhooks` — Webhook কনফিগারেশন

```sql
CREATE TABLE public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] DEFAULT ARRAY['message.sent', 'message.delivered', 'message.failed', 'message.received'],
    secret TEXT NOT NULL,                 -- HMAC signature verification
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ৩.৬ `message_templates` — SMS Template

```sql
CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                   -- "OTP Template"
    body TEXT NOT NULL,                   -- "আপনার OTP: {{otp}}"
    variables TEXT[],                     -- ["otp"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ৪. Row Level Security (RLS) Policies

RLS-ই আমাদের মূল সিকিউরিটি — কোনো middleware দরকার নেই।

```sql
-- সব টেবিলে RLS চালু করা
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- profiles: শুধু নিজের প্রোফাইল দেখা ও আপডেট করা যাবে
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- api_keys: শুধু নিজের keys দেখা ও ম্যানেজ করা যাবে
CREATE POLICY "Users can manage own API keys"
    ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- devices: শুধু নিজের devices
CREATE POLICY "Users can manage own devices"
    ON public.devices FOR ALL USING (auth.uid() = user_id);

-- messages: শুধু নিজের messages
CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert messages"
    ON public.messages FOR INSERT WITH CHECK (true);  -- Edge Function service_role দিয়ে insert করবে

-- webhooks: শুধু নিজের webhooks
CREATE POLICY "Users can manage own webhooks"
    ON public.webhooks FOR ALL USING (auth.uid() = user_id);

-- message_templates: শুধু নিজের templates
CREATE POLICY "Users can manage own templates"
    ON public.message_templates FOR ALL USING (auth.uid() = user_id);
```

---

## ৫. Supabase Edge Functions (আমাদের "Backend")

### ৫.১ `send-sms` — মূল SMS পাঠানোর Function

```
POST https://<project>.supabase.co/functions/v1/send-sms
Headers: { "x-api-key": "owtxt_k_abc123..." }

Request Body:
{
    "device_id": "uuid-of-device",
    "recipients": ["+8801712345678"],
    "message": "Hello from OwnText!"
}
```

**এই Function যা করবে:**
1. `x-api-key` header থেকে API key নিবে → hash করে `api_keys` টেবিলে match করবে
2. ইউজারের `is_approved` চেক করবে (whitelist)
3. Daily/Monthly limit চেক করবে
4. `messages` টেবিলে `status: 'queued'` হিসেবে insert করবে
5. ডিভাইসের `fcm_token` দিয়ে **Firebase FCM push notification** পাঠাবে
6. Response ফেরত দিবে

### ৫.২ `register-device` — Android App থেকে ডিভাইস রেজিস্ট্রেশন

```
POST https://<project>.supabase.co/functions/v1/register-device
Headers: { "x-api-key": "owtxt_k_abc123..." }

Request Body:
{
    "device_name": "Samsung Galaxy S24",
    "device_model": "SM-S921B",
    "phone_number": "+8801712345678",
    "android_version": "14",
    "app_version": "1.0.0",
    "fcm_token": "fcm_token_string..."
}
```

### ৫.৩ `update-message-status` — Android App থেকে SMS স্ট্যাটাস আপডেট

```
POST https://<project>.supabase.co/functions/v1/update-message-status
Headers: { "x-api-key": "owtxt_k_abc123..." }

Request Body:
{
    "message_id": "uuid-of-message",
    "status": "sent",          // sent | delivered | failed
    "error_message": null
}
```

### ৫.৪ `device-heartbeat` — ডিভাইস Online/Offline ট্র্যাকিং

```
POST https://<project>.supabase.co/functions/v1/device-heartbeat
Headers: { "x-api-key": "owtxt_k_abc123..." }

Request Body:
{
    "device_id": "uuid-of-device",
    "fcm_token": "updated_token_if_changed"
}
```

### ৫.৫ `receive-sms` — Android App থেকে ইনকামিং SMS রিপোর্ট

```
POST https://<project>.supabase.co/functions/v1/receive-sms
Headers: { "x-api-key": "owtxt_k_abc123..." }

Request Body:
{
    "device_id": "uuid-of-device",
    "sender": "+8801812345678",
    "message": "Reply text...",
    "received_at": "2026-06-30T00:15:00+06:00"
}
```

### ৫.৬ `generate-api-key` — নতুন API Key তৈরি

```
POST https://<project>.supabase.co/functions/v1/generate-api-key
Headers: { "Authorization": "Bearer <supabase_jwt>" }

Request Body:
{
    "name": "My App Key"
}

Response:
{
    "api_key": "owtxt_k_a1b2c3d4e5f6...",   // এটি শুধু একবারই দেখানো হবে!
    "key_prefix": "owtxt_k_a1b2c3d4",
    "name": "My App Key"
}
```

---

## ৬. Email Whitelist Access Control

### কীভাবে কাজ করবে:

1. **যেকেউ signup করতে পারবে** (Supabase Auth দিয়ে)
2. কিন্তু signup-এর পর `profiles.is_approved = FALSE` থাকবে
3. **আপনি Supabase Dashboard থেকে** manually `is_approved = TRUE` করবেন
4. Dashboard-এ ঢুকলে প্রথমেই চেক হবে — `is_approved` TRUE না হলে "অপেক্ষা করুন, আপনার অ্যাকাউন্ট এখনো approve হয়নি" দেখাবে
5. Edge Functions-এও চেক থাকবে — unapproved ইউজার SMS পাঠাতে পারবে না

```sql
-- Edge Function-এ এই চেক থাকবে:
SELECT is_approved FROM public.profiles WHERE id = user_id;
-- FALSE হলে → 403 Forbidden response
```

### ভবিষ্যতে v2.0-তে:
- `is_approved` এর বদলে plan-based access হবে
- Payment করলে automatically approve হবে

---

## ৭. End-to-End কাজের ফ্লো

### ৭.১ প্রথমবার সেটআপ
```
1. ইউজার → ওয়েবসাইটে Signup (Email + Password)
2. আপনি → Supabase Dashboard-এ profiles টেবিলে is_approved = TRUE করবেন
3. ইউজার → Dashboard-এ login → "Generate API Key" ক্লিক
4. Dashboard → Edge Function call → API Key তৈরি → ইউজারকে দেখাবে (একবারই!)
5. Dashboard → QR Code জেনারেট করবে (API Key encode করা)
6. ইউজার → Android App ইন্সটল → QR Code স্ক্যান
7. Android App → Edge Function: register-device call → ডিভাইস রেজিস্টার
8. ✅ সেটআপ সম্পন্ন!
```

### ৭.২ SMS পাঠানোর ফ্লো
```
1. Third-party App → POST /functions/v1/send-sms (x-api-key সহ)
2. Edge Function → API Key verify → is_approved চেক → limit চেক
3. Edge Function → messages টেবিলে insert (status: 'queued')
4. Edge Function → FCM Push Notification → Android ডিভাইসে
5. Android App → FCM receive → pending messages fetch
6. Android App → SmsManager.sendTextMessage() → SMS পাঠাবে
7. Android App → Edge Function: update-message-status → status: 'sent'
8. Supabase Realtime → Dashboard-এ লাইভ আপডেট
9. (যদি webhook থাকে) Edge Function: fire-webhook → ইউজারের URL-এ POST
```

### ৭.৩ SMS রিসিভ করার ফ্লো
```
1. কেউ ইউজারের ফোনে SMS পাঠালো
2. Android App → BroadcastReceiver-এ SMS receive
3. Android App → Edge Function: receive-sms call
4. Edge Function → messages টেবিলে insert (direction: 'inbound')
5. Supabase Realtime → Dashboard-এ ইনকামিং SMS দেখাবে
6. (যদি webhook থাকে) → ইউজারের URL-এ POST
```

---

## ৮. Web Dashboard (Next.js) — পেজ তালিকা

### পাবলিক পেজ (লগইন ছাড়া):
| পেজ | রুট | বিবরণ |
|---|---|---|
| Landing Page | `/` | Hero, Features, How it works, FAQ |
| Login | `/login` | Supabase Auth login |
| Register | `/register` | Supabase Auth signup |

### প্রাইভেট পেজ (লগইন + Approved হলে):
| পেজ | রুট | বিবরণ |
|---|---|---|
| Dashboard Home | `/dashboard` | সামারি — আজকের SMS count, ডিভাইস স্ট্যাটাস, চার্ট |
| Devices | `/dashboard/devices` | ডিভাইস তালিকা, QR Code generate, Online/Offline |
| Send SMS | `/dashboard/send` | ম্যানুয়ালি SMS পাঠানোর ফর্ম (single + bulk) |
| Message Log | `/dashboard/messages` | সব SMS ইতিহাস, status filter, search |
| Received SMS | `/dashboard/inbox` | ইনকামিং SMS inbox |
| API Keys | `/dashboard/api-keys` | Key তৈরি/মুছে ফেলা/deactivate |
| Webhooks | `/dashboard/webhooks` | Webhook URL কনফিগার |
| Templates | `/dashboard/templates` | SMS Template CRUD |
| API Docs | `/dashboard/docs` | ইন্টারেক্টিভ API documentation |
| Settings | `/dashboard/settings` | প্রোফাইল, পাসওয়ার্ড পরিবর্তন |

---

## ৯. Android App — কম্পোনেন্ট ডিটেইল

### মূল স্ক্রিন:
| স্ক্রিন | কাজ |
|---|---|
| **Login Screen** | QR Code স্ক্যান বা API Key ম্যানুয়ালি paste |
| **Home Screen** | Gateway ON/OFF toggle, আজকের SMS count, connection status |
| **SMS Log** | পাঠানো ও রিসিভ করা SMS-এর তালিকা |
| **Settings** | Notification settings, battery optimization guide |

### ব্যাকগ্রাউন্ড কম্পোনেন্ট:
| কম্পোনেন্ট | টাইপ | কাজ |
|---|---|---|
| `SmsSenderService` | Foreground Service | ব্যাকগ্রাউন্ডে SMS পাঠানো, persistent notification |
| `FCMService` | FirebaseMessagingService | Server থেকে push notification receive |
| `SmsReceiver` | BroadcastReceiver | ইনকামিং SMS ক্যাপচার |
| `HeartbeatWorker` | WorkManager (Periodic) | প্রতি ৫ মিনিটে heartbeat |
| `StatusUpdateWorker` | WorkManager (OneTime) | SMS status সার্ভারে report |

### Android Permissions:
```xml
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### Battery Optimization (সবচেয়ে গুরুত্বপূর্ণ):
- **Foreground Service** + Persistent Notification → Android kill করবে না
- **WorkManager** → Guaranteed periodic execution
- **FCM** → ব্যাটারি-ফ্রেন্ডলি push (polling নয়)
- প্রথমবার চালু হলে → Battery Optimization exclude করতে prompt দেখাবে
- Boot complete receiver → ফোন restart হলে service অটো চালু হবে

---

## ১০. টেক স্ট্যাক সামারি (v1.0)

| লেয়ার | টেকনোলজি | খরচ |
|---|---|---|
| **Database + Auth + Backend Logic** | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) | **Free** |
| **Frontend** | Next.js 14, React, Tailwind CSS | **Free** (Vercel) |
| **Push Notification** | Firebase Cloud Messaging (FCM) | **Free** |
| **Android App** | Kotlin, Jetpack (WorkManager, Room), ZXing (QR) | **Free** |
| **Hosting** | Vercel (Frontend) + Supabase (Backend) | **Free** |
| **মোট খরচ** | | **৳০/মাস** |

---

## ১১. ফোল্ডার স্ট্রাকচার

```
Owntext/
├── web/                              # Next.js Frontend + Landing Page
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/            # Landing, Login, Register
│   │   │   │   ├── page.jsx         # Landing Page
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/           # Protected Dashboard Pages
│   │   │   │   ├── page.jsx         # Dashboard Home
│   │   │   │   ├── devices/
│   │   │   │   ├── send/
│   │   │   │   ├── messages/
│   │   │   │   ├── inbox/
│   │   │   │   ├── api-keys/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── templates/
│   │   │   │   ├── docs/
│   │   │   │   └── settings/
│   │   │   └── layout.jsx
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── dashboard/           # Dashboard-specific components
│   │   │   └── landing/             # Landing page sections
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.js        # Browser Supabase client
│   │   │   │   └── server.js        # Server-side Supabase client
│   │   │   └── utils.js
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── supabase/                         # Supabase Config + Edge Functions
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # সব টেবিল + RLS + Triggers
│   ├── functions/
│   │   ├── send-sms/
│   │   │   └── index.ts
│   │   ├── register-device/
│   │   │   └── index.ts
│   │   ├── update-message-status/
│   │   │   └── index.ts
│   │   ├── device-heartbeat/
│   │   │   └── index.ts
│   │   ├── receive-sms/
│   │   │   └── index.ts
│   │   ├── generate-api-key/
│   │   │   └── index.ts
│   │   └── _shared/
│   │       ├── supabase-client.ts   # Shared Supabase admin client
│   │       ├── fcm.ts              # Firebase FCM helper
│   │       └── api-key-auth.ts     # API key verification helper
│   └── config.toml
│
└── android/                          # Android App (পরে আলাদা repo হতে পারে)
    └── OwnTextGateway/
        ├── app/src/main/
        │   ├── java/.../
        │   │   ├── MainActivity.kt
        │   │   ├── services/
        │   │   │   ├── SmsSenderService.kt
        │   │   │   └── FCMService.kt
        │   │   ├── receivers/
        │   │   │   ├── SmsReceiver.kt
        │   │   │   └── BootReceiver.kt
        │   │   ├── workers/
        │   │   │   ├── HeartbeatWorker.kt
        │   │   │   └── StatusUpdateWorker.kt
        │   │   ├── api/
        │   │   │   └── OwnTextApi.kt
        │   │   ├── db/
        │   │   │   └── LocalDatabase.kt
        │   │   └── ui/
        │   │       ├── QrScanScreen.kt
        │   │       ├── HomeScreen.kt
        │   │       └── SmsLogScreen.kt
        │   ├── res/
        │   └── AndroidManifest.xml
        └── build.gradle
```

---

## ১২. ডেভেলপমেন্ট রোডম্যাপ (v1.0)

### ফেজ ১: Supabase Setup + Edge Functions (সপ্তাহ ১)
- [ ] Supabase প্রজেক্ট তৈরি
- [ ] সব টেবিল তৈরি (migration SQL)
- [ ] RLS policies সেট
- [ ] Auth trigger (auto profile creation)
- [ ] Edge Function: `generate-api-key`
- [ ] Edge Function: `register-device`
- [ ] Edge Function: `send-sms` + FCM integration
- [ ] Edge Function: `update-message-status`
- [ ] Edge Function: `device-heartbeat`
- [ ] Edge Function: `receive-sms`

### ফেজ ২: Web Dashboard (সপ্তাহ ১-২)
- [ ] Next.js প্রজেক্ট সেটআপ (Tailwind CSS)
- [ ] Landing Page (Hero, Features, How it works)
- [ ] Login / Register pages
- [ ] Approval check middleware
- [ ] Dashboard Home (summary stats, chart)
- [ ] Device management + QR Code generation
- [ ] Send SMS form (single + bulk)
- [ ] Message Log page (filter, search, pagination)
- [ ] Inbox page (received SMS)
- [ ] API Keys management
- [ ] Webhook configuration
- [ ] Settings page
- [ ] API Documentation page
- [ ] Dark mode

### ফেজ ৩: Android App (সপ্তাহ ২-৩)
- [ ] Kotlin প্রজেক্ট সেটআপ
- [ ] QR Code scanner (ZXing)
- [ ] FCM integration
- [ ] Foreground Service (SmsSenderService)
- [ ] SmsManager integration
- [ ] BroadcastReceiver (incoming SMS)
- [ ] WorkManager heartbeat
- [ ] Room DB (offline queue)
- [ ] Battery optimization prompt
- [ ] Boot receiver (auto restart)
- [ ] SMS delivery status tracking

### ফেজ ৪: Testing + Polish (সপ্তাহ ৩-৪)
- [ ] End-to-end testing (Web → Server → Android → SMS)
- [ ] Edge case handling (device offline, FCM fail, etc.)
- [ ] Error handling ও user-friendly messages
- [ ] Performance check
- [ ] APK build ও distribution
- [ ] Domain setup (যদি থাকে)
- [ ] Launch! 🚀

---

> [!IMPORTANT]
> ## বিল্ড শুরু করতে আপনার কাছ থেকে দরকার:
> 1. ✅ **Supabase প্রজেক্ট তৈরি** করুন → Project URL ও anon key দিন
> 2. ✅ **Firebase প্রজেক্ট তৈরি** করুন (FCM-এর জন্য) → Server key দিন
> 3. ✅ এই PRD **Approve** করুন
>
> তারপরই বিল্ড শুরু! ইনশাআল্লাহ 🚀
