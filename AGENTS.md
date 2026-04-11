# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->
## ⚠️ Next.js Version Warning

This project uses **Next.js 16.2.0** — this is NOT the Next.js you know from training data. APIs, conventions, and file structure may all differ. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript rules)
```

No test runner is configured.

## Architecture

**JugaadHub** is a campus peer-to-peer rental marketplace for USICT (GGSIPU) students, built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Recharts, and Lucide React.

### State Management

All application state lives in a single React context: `context/AppContext.tsx`. It exposes `AppProvider` and a `useApp()` hook that provides:
- `user` / `setUser` — authenticated user (in-memory; no backend)
- `items` / `addItem` — rental listings (seeded with `MOCK_ITEMS`; resets on page refresh)
- Modal visibility flags: `showLoginModal`, `showAddItemModal`, `checkoutItem`
- `toast` / `showToast` — ephemeral 4.5-second notification system
- `chatMessages` / `sendMessage` — chat state with a simulated auto-reply bot

**`AppProvider` must wrap all pages that call `useApp()`** — it is not yet added to `app/layout.tsx`.

### Pages

- `/` (`app/page.tsx`) — Currently the default Next.js scaffold. The marketplace components (`HeroSection`, `CategoryNav`, `MarketplaceFeed`, etc.) exist in `components/` but have not yet been wired into this page.
- `/admin` (`app/admin/page.tsx`) — Admin analytics dashboard with hardcoded mock metrics, a 30-day `AreaChart` (Recharts), and a transactions table. Standalone page with no `useApp()` dependency.
- `/chat` (`app/chat/page.tsx`) — Messaging UI. Uses `useApp()` for chat state. Includes regex-based privacy masking (`maskText`) that replaces Indian phone numbers and UPI IDs with a `🔒 [HIDDEN BY JUGAADHUB]` badge before rendering.

### Components

All components use `"use client"` and consume `useApp()`. Key flows:
- **`ProductCard`** → clicking "Rent Now" sets `checkoutItem` (triggers `CheckoutModal`), or opens `LoginModal` if unauthenticated.
- **`CheckoutModal`** — 3-state flow: `confirm` → `processing` (1.5s fake delay) → `success` (displays a randomly generated 4-digit OTP for in-person handover).
- **`LoginModal`** — Mock auth: validates `@std.ggsipu.ac.in` email domain only; password must be ≥6 chars. No backend call.
- **`AddItemModal`** — Enforces a business rule: security deposit is capped at 20× the daily rent.
- **`BottomNav`** — Mobile-only (`md:hidden`) fixed nav bar.

### Styling

Tailwind CSS v4 is used with the `@import "tailwindcss"` syntax (not v3's `@tailwind` directives). The `@/*` path alias maps to the repo root. Modal animations (`slideUp`, `slideInRight`) are referenced inline but are not yet defined in `app/globals.css` — they must be added there as `@keyframes` rules if needed.

### Auth

Authentication is entirely client-side and in-memory. User identity is derived from the email prefix (e.g. `vaibhav.0481@std.ggsipu.ac.in` → display name `Vaibhav 0481`). There is no session persistence, no backend, and no real password verification.
