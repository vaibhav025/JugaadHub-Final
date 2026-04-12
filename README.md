# JugaadHub

Campus-first peer-to-peer rental marketplace for students to list, discover, rent, and safely return gear inside a trusted college community.

JugaadHub is built around a simple idea: students should not have to buy expensive items for short-term needs. Instead, they can borrow from verified peers, while lenders stay protected through escrow, OTP handover, chat, KYC, and photo-proof based returns.

## Highlights

- Campus-only access using `@std.ggsipu.ac.in` email authentication
- Browse and search listings across categories like videography, lab gear, electronics, books, tools, and music
- List items with images, pricing, deposit amount, and maximum rental duration
- Checkout flow with wallet payments or Razorpay
- Built-in price negotiation before payment
- Escrow-style deposit locking during active rentals
- Handover OTP generation for safer in-person exchange
- In-app messaging between renter and owner
- DigiLocker-style KYC verification flow for trusted users
- Before/after live camera proof uploads to reduce damage disputes
- Wallet balance, withdrawal simulation, and rental history
- Admin dashboard with platform metrics and rental activity trends
- Login alert API that stores login metadata and can send Telegram notifications

## Problem It Solves

Students often need access to cameras, calculators, lab kits, speakers, books, or tools for a few hours or days. Buying these items is expensive and wasteful. JugaadHub turns unused student-owned gear into a campus utility network:

- Rent what you need, only when you need it
- Earn from items that would otherwise sit idle
- Keep both sides safer with verification, escrow, chat, and proof capture

## Product Flow

1. A student signs in using a campus email or Google OAuth.
2. The user lists an item with price, deposit, category, max days, and image.
3. Another student discovers the item, optionally negotiates the rent, and checks out.
4. Payment is secured through wallet or Razorpay and a handover OTP is generated.
5. Owner and renter coordinate through in-app chat.
6. Before and after proof images are captured using the device camera.
7. Once both proofs are present, the rental is settled, the item becomes available again, and the deposit refund is triggered.

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide React
- Recharts

### Backend and Services

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Storage
- Supabase RPC for wallet operations
- Cloudinary for item image uploads
- Razorpay for checkout
- Telegram Bot API for login alerts

## Project Structure

```text
JugaadHub/
|-- app/
|   |-- admin/              # Admin analytics dashboard
|   |-- chat/               # Messaging UI
|   |-- wallet/             # Wallet, proof uploads, transaction history
|   |-- api/notify/         # Login logging + Telegram alert endpoint
|   `-- api/items/[id]/     # Item deletion endpoint
|-- components/             # Marketplace UI, auth, checkout, proof, modals
|-- context/                # Global app state and Supabase-backed actions
|-- lib/                    # Supabase client
|-- public/                 # Static assets
|-- next.config.ts
|-- tailwind.config.js
`-- package.json
```

## Core Modules

- `context/AppContext.tsx`: central state for auth, items, chat, unread counts, checkout, and toasts
- `components/CheckoutModal.tsx`: rental confirmation, negotiation, wallet deduction, Razorpay, OTP creation
- `components/LiveCameraProof.tsx`: live camera capture, watermarking, proof upload, settlement logic
- `app/chat/page.tsx`: realtime messaging with masking for phone numbers and UPI IDs
- `app/wallet/page.tsx`: wallet balance, escrow view, proof actions, withdrawals, transaction history
- `app/admin/page.tsx`: role-gated admin dashboard with analytics and charts

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### What Each Variable Is Used For

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public client key for auth, reads, writes allowed by your RLS policies
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key used in API routes for privileged operations
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay checkout key used in the browser
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary account name for item photo uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: unsigned upload preset for listing images
- `TELEGRAM_BOT_TOKEN`: bot token for login alert messages
- `TELEGRAM_CHAT_ID`: destination chat/channel for alert delivery

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd JugaadHub
npm install
```

### 2. Add environment variables

Create `.env.local` using the template above.

### 3. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Requirements

This app expects a Supabase project with at least these tables, a storage bucket, and one RPC function.

### Suggested tables

- `profiles`
  - `id`
  - `wallet_balance`
  - `role`
  - `is_verified`
  - `full_name` or `name`
  - `email`

- `items`
  - `id`
  - `title`
  - `category`
  - `description`
  - `dailyRent`
  - `deposit`
  - `owner`
  - `owner_id`
  - `owner_name`
  - `image`
  - `is_available`
  - `max_days`
  - `rentals_count`
  - `last_rental_days`
  - `created_at`

- `messages`
  - `id`
  - `sender_id`
  - `receiver_id`
  - `sender_name`
  - `text`
  - `is_read`
  - `created_at`

- `rentals`
  - `id`
  - `product_id`
  - `owner_id`
  - `renter_id`
  - `renter_name`
  - `rental_days`
  - `total_rent`
  - `deposit`
  - `total_amount`
  - `platform_fee`
  - `otp`
  - `payment_method`
  - `status`
  - `offer_status`
  - `offered_price`
  - `before_image`
  - `after_image`
  - `started_at`
  - `expected_return_at`
  - `created_at`

- `logins`
  - `id`
  - `email`
  - `ip`
  - `user_agent`
  - `created_at`

### Suggested storage bucket

- `handover_images`

### Suggested RPC

- `add_to_wallet(target_user_id uuid, amount numeric)`

This function is used when crediting owners and refunding renter deposits.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deployment Notes

- Deploy on Vercel or any Next.js-compatible host
- Add all environment variables before building
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only
- Configure Supabase Auth redirect URLs for local and production domains
- If using Google OAuth, enable the provider in Supabase
- If using Razorpay in production, verify the payment flow end-to-end

## Current Product Notes

- DigiLocker verification is currently a demo-style flow with a fixed OTP in the UI
- Wallet withdrawal is simulated in the frontend and then stored in Supabase
- Item image uploads use Cloudinary, while handover proof images use Supabase Storage
- Chat includes privacy masking for phone numbers and common UPI IDs

## Team

- Vaibhav Singla: https://github.com/vaibhav025
- Bhavya Bansal: https://github.com/Bhavya080507
- Rohan Garg: https://github.com/RohanGarg1818
- Aryan Kumar Srivastava: https://github.com/Aryan-sri19

## Why JugaadHub Matters

JugaadHub is a trust layer for campus sharing. It combines marketplace convenience with the safety systems that matter in real student exchanges: identity checks, escrow, OTP-based handover, chat, and return-proof capture.
