# Atelier Solstice — System Design & Architecture (DESIGN.md)

This document provides concise architectural rationale and answers to the evaluation questions outlined in the submission brief.

---

### 1. How do login and the two roles work?

- **Authentication Mechanism**: Authentication uses JSON Web Tokens (JWT) signed with an HMAC secret (`HS256`). When a user logs in or registers, the server signs a payload containing `{ userId, email, role, name }` with a 7-day expiration. The token is transmitted both as an `httpOnly` secure cookie (`token`) and in the response body (allowing `Authorization: Bearer <token>` headers for API clients and automated tests).
- **Two Distinct Roles**:
  - `ADMIN` (Studio): Seeded administrator with authority to manage the catalog (add paintings, edit available paintings), review schedule commitments (confirm or decline wall mural requests), and manage workshop production (accept or decline custom pottery requests).
  - `CUSTOMER`: Public collector who can purchase original paintings, commission wall dates, and request custom pottery. Customers have access exclusively to records they own.
- **Strict Server-Side RBAC Enforcement**:
  - **401 Unauthorized**: Any request to a protected endpoint without a valid token is refused.
  - **403 Forbidden**: Requests made with the incorrect role (e.g., an Admin trying to buy a painting or a Customer trying to approve a wall booking) are refused.
  - **404 Not Found (Information Privacy)**: If a Customer queries, edits, or cancels an order, booking, or pottery request belonging to another customer by ID, the server returns a `404 Not Found` rather than a `403 Forbidden`. This strictly prevents malicious enumeration and privacy leakage of other users' records.

---

### 2. Which database did you choose, and why?

- **Database**: SQLite (via Prisma ORM), configured with a zero-friction migration and seed workflow (`prisma/schema.prisma`).
- **Rationale**:
  - **Zero-Setup & Clean Machine Portability**: The brief asks for a system that anyone can run on a clean machine without complex external setup. SQLite runs completely embedded in the application filesystem (`prisma/dev.db`), requiring zero database daemon installation, local user configuration, or network credentials.
  - **ACID Transactions & Strict Constraints**: SQLite natively supports ACID transactions (`BEGIN IMMEDIATE`) and foreign key constraints, which are critical for preventing race conditions and concurrency conflicts.
  - **Cloud Database Ready via Prisma**: Because data modeling and queries are abstracted via Prisma ORM, migrating to a cloud-hosted database (e.g. PostgreSQL on Supabase, Neon, AWS RDS, or PlanetScale) requires only changing the single `provider` line in `prisma/schema.prisma` and updating the `DATABASE_URL` in `.env`.

---

### 3. How do you stop two people from taking the same painting or date?

Concurrencies and double-booking races are resolved through atomic database transactions and strict conditional checks:

1. **One-of-a-Kind Paintings**:
   - Each painting has a status (`AVAILABLE` or `SOLD`).
   - The purchase endpoint (`POST /api/orders`) wraps the read and update inside an atomic `prisma.$transaction(async (tx) => ...)`:
     ```typescript
     const painting = await tx.painting.findUnique({ where: { id: paintingId } });
     if (!painting || painting.status !== "AVAILABLE") {
       return { error: "This painting has already been purchased and is no longer available.", status: 409 };
     }
     await tx.painting.update({ where: { id: paintingId }, data: { status: "SOLD" } });
     const order = await tx.order.create({ ... });
     ```
   - If two customers click "Buy" simultaneously, the first transaction executes and transitions the status to `SOLD`. The second transaction evaluates `painting.status !== "AVAILABLE"`, immediately halts, and returns a `409 Conflict` with a clear refusal message.
   - If an order is cancelled by the owner, another atomic transaction transitions the order to `CANCELLED` and restores the painting's status back to `AVAILABLE`.

2. **Exclusive Wall Painting Dates**:
   - Customers can pick a date 7 to 90 days away. Each date can be booked only once.
   - When a booking is submitted (`POST /api/wall-bookings`), an atomic transaction checks for any active booking on that normalized date:
     ```typescript
     const existing = await tx.wallBooking.findFirst({
       where: {
         bookingDate,
         status: { in: ["REQUESTED", "CONFIRMED"] },
       },
     });
     if (existing) {
       return { error: "This date has already been booked by another client.", status: 409 };
     }
     ```
   - If an active booking exists, a `409 Conflict` refusal is returned. If a previous booking for that date was `CANCELLED` or `DECLINED`, the date is automatically freed up for other clients to reserve.

---

### 4. What did you finish, what did you leave out, and what would you do next?

#### What Was Finished:
- **Feature 1 (Paintings)**: Studio adds/edits available paintings; customers purchase one-of-a-kind originals; customer order cancellation restores gallery availability; concurrency lock prevents double-sales.
- **Feature 2 (Wall Murals)**: Date selection constrained to 7–90 days away; wall size bounded to 10–500 sq ft; live price calculation (`size * rate`); single-booking date lock (409 on clash); Admin confirm/decline workflow; Customer cancellation enforced up to 3 days prior.
- **Feature 3 (Custom Pottery)**: Seed catalog item and glaze selection; quantity validation (1–12); needed-by date constrained to ≥ 14 days; Admin accept/decline; Customer edit and cancel enabled strictly while in `REQUESTED` status.
- **Security & RBAC Matrix**: 401 for unauthenticated requests; 403 for unauthorized roles; 404 for customer attempts to access other customers' records; complete password hashing via `bcryptjs`.
- **UI & States**: Loading, empty, and error states implemented for every data-fetching view; clear refusal messages for business rule violations; interactive top-bar role switcher for seamless testing.
- **Automated Verification Suite**: Full test suite (`scripts/test-suite.js` or `npm test`) asserting all 8 requirement groups.

#### What Was Left Out (Per Explicit Out-of-Scope Brief):
- Real payment processing (Stripe/PayPal webhooks) — orders transition directly to `PLACED`.
- Password reset, email verification, social OAuth logins, and studio signup.
- Reviews, discount coupons, shipping tracking, automated email/SMS dispatch.
- Direct binary image upload pipeline (curated high-res URLs used).
- CI/CD deployment pipelines and containerization.

#### What Would Be Done Next (Future Roadmap):
1. **Cloud Database Migration**: Deploy PostgreSQL on Supabase or Neon using Prisma's PostgreSQL adapter.
2. **Real-Time WebSockets / SSE**: Use Server-Sent Events to push instant gallery availability updates to all connected browser sessions when a painting is bought or cancelled.
3. **Payment Gateway Integration**: Integrate Stripe Elements with webhook idempotency keys to handle card payments, authorizations, and automated refunds upon eligible cancellations.
4. **Calendar Visualizer**: An interactive full-month calendar UI for wall murals visually rendering blacked-out booked dates and available slots.
