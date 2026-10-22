# Atelier Solstice — Art Studio Web Application

A full-stack web application for an art studio built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** with **SQLite**.

The platform supports two distinct roles (**Customer** and **Studio Admin**) across three core studio operations:
1. **Original Paintings**: Buy one-of-a-kind original paintings with atomic race-condition prevention; order cancellation restores paintings to the gallery.
2. **Wall Mural Bookings**: Reserve installation dates (7 to 90 days away) with live price calculation ($18/sq ft); dates can be booked only once; Studio confirms/declines; cancellations permitted until 3 days before date.
3. **Custom Pottery Commissions**: Choose items and glazes from the studio catalog, quantity (1 to 12 pieces), and needed-by date (≥ 14 days); Studio accepts/declines; customers can edit or cancel requests while in `REQUESTED` status.

---

## ⚡ Quick Start (Run on a Clean Machine)

### Prerequisites
- **Node.js** (v18.x or newer, tested on Node v20/v24)
- **npm** (v9.x or newer)

### 1. Clone the Repository & Navigate to Directory
```bash
git clone https://github.com/<your-username>/art-studio.git
cd art-studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Linux / macOS:
cp .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

### 4. Initialize Database & Seed Demo Data
This runs Prisma schema synchronization, generates the Prisma client, and seeds users, catalog items, wall rates, and initial paintings:
```bash
npm run db:setup
```

### 5. Launch Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Demo Accounts & Pre-Seeded Logins

For convenience during evaluation, an **Interactive Role Switcher Bar** is pinned to the top of every screen. You can switch between roles with a single click, or use standard sign-in:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Studio Admin** | `admin@artstudio.com` | `admin123` | Add/edit paintings, confirm/decline wall bookings, accept/decline pottery requests, see all records. |
| **Customer (Alice)** | `alice@example.com` | `customer123` | Buy paintings, book wall dates, request pottery, cancel own orders/bookings, see own records. |
| **Customer (Bob)** | `bob@example.com` | `customer123` | Secondary customer to test concurrency locks, 404 access restrictions, and double-booking prevention. |

*You can also register a brand-new Customer account using the "Register as Customer" modal.*

---

## 🧪 Automated Verification Suite

An automated end-to-end test suite is included to verify all business rules, role-based access control, date calculation constraints, and atomic concurrency handling:

```bash
# In one terminal, ensure the server is running:
npm run dev

# In another terminal, run the test suite:
npm test
```

### What `npm test` Verifies:
- ✅ **Authentication**: Admin and Customer login JWT generation.
- ✅ **Unauthenticated Refusal (401)**: Refusal on protected endpoints.
- ✅ **RBAC Refusal (403)**: Customer cannot add paintings; Admin cannot place orders/bookings; Customer cannot approve requests.
- ✅ **Information Privacy (404)**: Customer requesting another customer's order or booking by ID receives `404 Not Found` (never revealing existence via 403).
- ✅ **Painting Race Conditions (409)**: Alice buys a painting; Bob trying to buy the same painting is refused with `409 Conflict`.
- ✅ **Order Cancellation**: Alice cancels order; painting status atomically reverts to `AVAILABLE`; Bob can now purchase it.
- ✅ **Wall Date Concurrency (409)**: Double-booking prevention on the same calendar day.
- ✅ **Wall Booking Rules**: Date bounds (7–90 days), wall size bounds (10–500 sq ft), and price calculation.
- ✅ **Pottery Workflow**: Customer can edit quantity while `REQUESTED`; Admin accepts request; customer attempting to edit or cancel an `ACCEPTED` request is refused (`400 Bad Request`).

---

## 🏗️ Architecture & RBAC Matrix

| Action | Customer | Studio Admin | HTTP Codes |
| :--- | :---: | :---: | :--- |
| **Browse Paintings** | Yes | Yes | 200 |
| **Add / Edit Painting** | No | Yes (available only) | 201 / 400 (if sold) / 403 |
| **Buy Painting** | Yes | No | 201 / 403 / 409 (if sold) |
| **Book Wall Mural Date** | Yes | No | 201 / 400 / 403 / 409 (if date taken) |
| **Request Custom Pottery** | Yes | No | 201 / 400 / 403 |
| **View Orders / Bookings** | Yes (own only) | All | 200 / 401 / 404 (if not owner) |
| **Confirm / Decline Booking** | No | Yes | 200 / 400 / 403 |
| **Accept / Decline Pottery** | No | Yes | 200 / 400 / 403 |
| **Cancel Order** | Yes (own only) | No | 200 / 400 / 403 / 404 |
| **Cancel Wall Booking** | Yes (≥3 days prior) | No | 200 / 400 (<3 days) / 403 / 404 |
| **Edit / Cancel Pottery** | Yes (while REQUESTED) | No | 200 / 400 (if processed) / 403 / 404 |

---

## 📁 Project Structure

```
art-studio/
├── DESIGN.md                   # Architectural explanations for evaluation questions
├── README.md                   # Setup guide and documentation
├── DEMO_GUIDE.md               # 5-minute video walkthrough guide
├── .env.example                # Environment variable template
├── package.json                # Dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
├── tailwind.config.ts          # Tailwind CSS theme configuration
├── prisma/
│   ├── schema.prisma           # Prisma data models & SQLite datasource
│   └── seed.js                 # Database seed script
├── scripts/
│   └── test-suite.js           # Automated integration test suite
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/           # Login, signup, me, logout endpoints
    │   │   ├── paintings/      # Gallery listing, add, edit endpoints
    │   │   ├── orders/         # Painting purchase, lookup, cancel endpoints
    │   │   ├── wall-bookings/  # Mural booking, rate, status, cancel endpoints
    │   │   └── pottery/        # Ceramics request, catalog, edit, status endpoints
    │   ├── globals.css         # Styling directives
    │   ├── layout.tsx          # Root layout with AuthProvider
    │   └── page.tsx            # Main tabbed interface
    ├── components/
    │   ├── Navbar.tsx          # Navigation header with role badge
    │   ├── DemoSwitcher.tsx    # Quick 1-click role switcher
    │   ├── AuthModal.tsx       # Sign-in & registration dialog
    │   ├── LoadingState.tsx    # Loading state indicator
    │   ├── EmptyState.tsx      # Empty state indicator
    │   ├── ErrorState.tsx      # Error state with retry
    │   ├── AlertBanner.tsx     # Feedback & refusal banner
    │   ├── PaintingsSection.tsx# Feature 1: Paintings gallery
    │   ├── WallBookingsSection.tsx # Feature 2: Wall mural commissions
    │   ├── PotterySection.tsx  # Feature 3: Custom ceramics commissions
    │   └── DashboardSection.tsx# Orders, bookings & request audit
    ├── context/
    │   └── AuthContext.tsx     # Client auth state & role management
    └── lib/
        ├── auth.ts             # JWT signing, verification & RBAC helpers
        ├── prisma.ts           # Prisma singleton client
        ├── types.ts            # TypeScript interfaces & enums
        └── utils.ts            # Business rules & date validation utilities
```

---

## 🔒 Security Best Practices Implemented
- Passwords securely hashed with `bcryptjs` (salt rounds: 10).
- Tokens signed with HMAC-SHA256 (`jsonwebtoken`) with `httpOnly`, `sameSite: "lax"`, and expiration.
- Atomic Prisma database transactions prevent race conditions on single-quantity paintings and unique wall dates.
- Zero credential exposure: `.env` is ignored by `.gitignore`; `.env.example` contains placeholders.
