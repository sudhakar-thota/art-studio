# 5-Minute Video Walkthrough Script & Demo Guide

This script is designed for your 5-minute video submission. Follow this sequence while sharing your screen to cover all required demonstration points smoothly.

---

## ⏱️ Video Timeline (Total: 4 min 45 sec)

### 0:00 – 0:30 | Introduction & Architecture
- **Voiceover**:
  > "Hello! Today I'm demonstrating the Atelier Solstice art studio web application. It is a full-stack platform built with Next.js 14, TypeScript, Tailwind CSS, and Prisma ORM with SQLite.
  > The platform enforces strict Role-Based Access Control between two roles: Customer and Studio Admin. I'll show sign-up, buying a painting, booking a wall date, requesting pottery, the studio reviewing commissions, and a short code walkthrough."
- **Screen**: Show homepage at `http://localhost:3000` with the **Interactive Role Switcher** at the top.

---

### 0:30 – 1:15 | Sign-Up & Buying a One-of-a-Kind Painting
- **Actions**:
  1. Click the **Register as Customer** button in the sign-in modal.
  2. Create an account (e.g. `clara@example.com`, Password: `customer123`).
  3. Browse the **Original Paintings** gallery. Notice that one painting is already marked `● SOLD`.
  4. Find an available painting (e.g. *"Solitude in Ochre"*). Click **Buy Painting**.
  5. The painting immediately transitions to `● SOLD` with an alert confirming the acquisition.
  6. Switch to **Bob** using the top switcher, and try to buy that same painting: show the **Refusal Message** (*"This painting has already been purchased and is no longer available"*).
- **Voiceover**:
  > "Here, I register a new customer account. In the gallery, each painting is one of a kind. When I purchase 'Solitude in Ochre', an atomic database transaction marks it SOLD. If another customer tries to purchase it, the server refuses with a 409 Conflict. Furthermore, if I go to 'My Orders' and cancel this order, the painting is automatically restored as AVAILABLE in the gallery."

---

### 1:15 – 2:15 | Booking a Wall Painting & Date Lock
- **Actions**:
  1. Click the **Wall Murals** tab.
  2. Explain the live price calculator: drag the wall size slider between 10 and 500 sq ft. Show the price updating dynamically based on the seed rate ($18/sq ft).
  3. Select a date (e.g. 20 days away) and enter an installation address. Click **Request Wall Booking**.
  4. Show the booking appear under "My Wall Murals" with status `REQUESTED`.
  5. Switch to **Bob** and try to pick the exact same date: show the **Refusal Message** (*"This date has already been booked by another client"*).
  6. Explain the cancellation rule: cancellation is allowed up to 3 days before the date.
- **Voiceover**:
  > "For wall paintings, customers can book a date between 7 and 90 days away. The system calculates the fee in real time using the seed rate of $18 per square foot. Each date can be reserved only once. Submitting a date locks it atomically. If another customer picks the same day, they are refused. Customers can cancel until 3 days before the scheduled date."

---

### 2:15 – 3:15 | Custom Pottery & Status Workflow
- **Actions**:
  1. Click the **Custom Pottery** tab.
  2. Show the seed catalog dropdowns: choose an item (e.g. *"Fluted Vase"*), a glaze finish (e.g. *"Celadon Gloss"*), quantity (e.g. 4), and a needed-by date at least 14 days away.
  3. Click **Submit Custom Request**. It shows in the list as `REQUESTED`.
  4. While it is `REQUESTED`, click **Edit**, change quantity to 6, and save.
  5. Switch to **Studio Admin** in the top bar.
  6. As Admin, view the studio queue and click **Accept Request**.
  7. Switch back to **Alice**: show that the request is now `ACCEPTED`, and the Edit and Cancel buttons are disabled with a clear explanation that processed requests cannot be modified.
- **Voiceover**:
  > "For custom pottery, items and glazes are validated against the studio's seed catalog. The needed-by date requires at least 14 days curing and firing lead time. While in REQUESTED status, the customer has the right to edit or cancel. Once the Studio Admin accepts or declines the commission, the status freezes."

---

### 3:15 – 4:00 | Studio Admin Controls & Privacy (404)
- **Actions**:
  1. Switch to **Studio Admin**.
  2. Go to **Wall Murals**: click **Confirm Booking** on Alice's wall request.
  3. Go to **Studio Vault & Orders**: show the unified audit overview of all customer purchases, wall murals, and pottery requests.
  4. Mention RBAC: show that Admin cannot buy paintings or book wall dates (403), and customers querying another customer's ID receive a **404 Not Found** to maintain complete privacy.
- **Voiceover**:
  > "Logging in as Studio Admin gives full oversight across all client commissions. The admin can confirm or decline wall mural dates and accept pottery requests. To uphold security and privacy, every API route validates roles on the server, and a customer attempting to access another customer's private record receives a 404 Not Found rather than a 403, preventing enumeration."

---

### 4:00 – 4:45 | Code Walkthrough (One Feature Behind the Scenes)
- **Actions**:
  1. Open your code editor and display `src/app/api/orders/route.ts` or `src/lib/auth.ts`.
  2. Point to the `prisma.$transaction`:
     - How `painting.status === 'AVAILABLE'` is checked.
     - How painting is marked `SOLD` and order is created atomically.
     - How the `requireRole(req, ["CUSTOMER"])` utility protects the endpoint.
- **Voiceover**:
  > "Behind the scenes, here is the order creation route in `src/app/api/orders/route.ts`. First, `requireRole` checks that the caller is authenticated and holds the CUSTOMER role, returning a 401 or 403 otherwise. Next, we use an atomic Prisma transaction: we read the painting, verify its status is AVAILABLE, set it to SOLD, and create the order in a single atomic operation. If two customers click Buy at the exact same millisecond, only the first transaction succeeds; the second receives a 409 Conflict.
  > All test cases are covered in our automated test suite `npm test`. Thank you!"

---

## 📌 Submission Checklist Before Uploading:
- [ ] Push code to a public GitHub repository.
- [ ] Verify `.env` is NOT in the repo, but `.env.example` is present.
- [ ] Record video (under 5 minutes) following this script.
- [ ] Upload video to Google Drive.
- [ ] Set Google Drive sharing settings to: **"Anyone with the link can view"**.
- [ ] Submit the GitHub repository link and Google Drive video link via the Google Form.
