# Live Interview Preparation & Code Walkthrough Guide

If you are shortlisted for the interview, you will be asked to explain your code and decisions live without AI tools. This guide prepares you to answer every anticipated question with clarity and confidence.

---

## 🎯 1. High-Level Architecture Explanation
**Interviewer Question**: *"Can you walk us through the high-level architecture of your application?"*

**Your Answer**:
> "I built this as a full-stack Next.js 14 application using TypeScript, Tailwind CSS, and Prisma ORM.
> - **Frontend**: Built with React Server and Client Components. I implemented a global `AuthContext` to manage the authenticated session, and broken down the UI into modular sections: `PaintingsSection`, `WallBookingsSection`, `PotterySection`, and `DashboardSection`. Every screen handles Loading, Empty, and Error states, plus clear feedback alerts for business refusals.
> - **Backend API Routes**: Standard Next.js Route Handlers (`src/app/api/...`) that return JSON responses with explicit HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, and `409`.
> - **Database Layer**: Prisma ORM with SQLite for zero-setup execution, wrapped in an automated seed script that initializes catalog items, studio wall rates, admin accounts, and sample customers.
> - **Authentication & RBAC**: Stateless JWT signed with HMAC-SHA256, transmitted both via `httpOnly` secure cookies and standard `Authorization: Bearer` headers."

---

## 🔒 2. Authentication & Role-Based Access Control (RBAC)
**Interviewer Question**: *"How do login and the two roles work? How does the server enforce permissions?"*

**Your Answer**:
> "In `src/lib/auth.ts`, I created two reusable security functions:
> 1. `requireAuth(req)`: Extracts the JWT from either the `Authorization` header or the `httpOnly` cookie. If missing or invalid, it immediately halts execution and returns a `401 Unauthorized`.
> 2. `requireRole(req, allowedRoles)`: Calls `requireAuth`, then verifies that `user.role` matches one of the allowed roles. If not, it returns a `403 Forbidden`.
>
> On the client, the UI conditionally hides or disables buttons based on `user.role`. But more importantly, the server validates permissions on **every single endpoint** independently of the UI.
>
> For customer ownership, if Customer A tries to view, edit, or cancel a record belonging to Customer B by ID, the endpoint returns **`404 Not Found`**, not `403 Forbidden`. This is an intentional security design: returning 403 would reveal that a record with that ID exists. Returning 404 preserves privacy and prevents ID enumeration attacks."

---

## ⚡ 3. Concurrency & Race Condition Prevention
**Interviewer Question**: *"How do you prevent two customers from buying the same painting or booking the same wall date at the exact same millisecond?"*

**Your Answer**:
> "I used atomic database transactions via Prisma's `$transaction` API.
>
> **For Paintings (`src/app/api/orders/route.ts`)**:
> ```typescript
> const result = await prisma.$transaction(async (tx) => {
>   const painting = await tx.painting.findUnique({ where: { id: paintingId } });
>   if (!painting || painting.status !== 'AVAILABLE') {
>     return { error: 'Painting already sold', status: 409 };
>   }
>   await tx.painting.update({ where: { id: paintingId }, data: { status: 'SOLD' } });
>   const order = await tx.order.create({ ... });
>   return { order };
> });
> ```
> Inside the transaction, the read and write are executed sequentially in an isolated atomic boundary. If two requests arrive simultaneously, the first transaction updates the status to `SOLD`. When the second transaction executes, `painting.status !== 'AVAILABLE'` evaluates to true, immediately returning a `409 Conflict`.
>
> **For Wall Dates (`src/app/api/wall-bookings/route.ts`)**:
> Similarly, inside a transaction, we query:
> ```typescript
> const existing = await tx.wallBooking.findFirst({
>   where: {
>     bookingDate,
>     status: { in: ['REQUESTED', 'CONFIRMED'] }
>   }
> });
> if (existing) return { error: 'Date already booked', status: 409 };
> ```
> If an active booking exists for that date, a `409 Conflict` is returned. If a previous booking was `CANCELLED` or `DECLINED`, the date is automatically freed up."

---

## 📅 4. Date Validation & Cancellation Rules
**Interviewer Question**: *"How did you handle the date restrictions (7 to 90 days away, 3-day cancellation cutoff, and 14 days for pottery)?"*

**Your Answer**:
> "In `src/lib/utils.ts`, I created pure date helper functions using normalized UTC midnight arithmetic:
> ```typescript
> export function getDaysDifferenceFromToday(targetDateStr: string): number {
>   const todayStr = getTodayDateString();
>   const [tY, tM, tD] = todayStr.split('-').map(Number);
>   const [targetY, targetM, targetD] = targetDateStr.split('-').map(Number);
>   const d1 = Date.UTC(tY, tM - 1, tD);
>   const d2 = Date.UTC(targetY, targetM - 1, targetD);
>   return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
> }
> ```
> By splitting `YYYY-MM-DD` strings directly into UTC timestamps, we completely eliminate local time-zone shifts, daylight saving discrepancies, and midnight boundary errors.
>
> - **Wall Booking**: We ensure `daysDifference >= 7 && daysDifference <= 90`.
> - **Wall Cancellation**: `canCancelWallBooking` verifies `daysUntilBooking >= 3`. If fewer than 3 days remain, cancellation is refused (`400 Bad Request`).
> - **Pottery Commission**: We require `daysDifference >= 14`, reflecting the physical lead time for ceramic drying, bisque firing, glazing, and final kiln firing."

---

## 🗄️ 5. Database Selection & Trade-offs
**Interviewer Question**: *"Why did you choose SQLite with Prisma, and how would you scale it to production?"*

**Your Answer**:
> "I chose SQLite with Prisma ORM because:
> 1. **Zero-friction portability**: The evaluator can clone the repo and run `npm run db:setup` on any clean Windows, macOS, or Linux machine with no database server setup required.
> 2. **ACID compliance**: SQLite supports full ACID transactions and foreign keys.
> 3. **Clean upgrade path**: Because all queries are handled by Prisma ORM, upgrading to a cloud-hosted PostgreSQL database (such as Supabase, Neon, or AWS RDS) requires changing just **one line** in `prisma/schema.prisma` (`provider = "postgresql"`) and supplying the connection string in `.env`. The entire application code remains 100% unchanged."

---

## 🧪 6. Testing Strategy
**Interviewer Question**: *"How did you verify that your solution meets the requirements?"*

**Your Answer**:
> "I wrote an automated end-to-end integration test suite in `scripts/test-suite.js` (executable via `npm test`).
> It programmatically tests:
> 1. Authentication flow and token issuance.
> 2. Unauthenticated 401 refusals.
> 3. Role-based 403 refusals (Customer cannot create paintings; Admin cannot place orders).
> 4. Concurrency conflicts (409 Conflict when attempting to buy an already-sold painting or take an already-booked date).
> 5. Information privacy (404 Not Found when a customer accesses another customer's order).
> 6. Status transitions: order cancellation restoring painting availability, wall booking confirmation/cancellation, and pottery editing restrictions."

---

## 💡 Quick Tips for the Live Interview
1. **Be Honest & Clear**: State what you finished and what you left out (as documented in `DESIGN.md`).
2. **Point to the Code**: Open `src/app/api/orders/route.ts` or `src/lib/auth.ts` and explain the exact lines.
3. **Show the Automated Test**: Running `npm test` live in your terminal and seeing all green checkmarks is a very strong proof of quality!
