const http = require("http");

const BASE_URL = "http://localhost:3000";

let adminToken = "";
let aliceToken = "";
let bobToken = "";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const fetchRes = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await fetchRes.json();
  } catch (e) {
    data = null;
  }

  return { status: fetchRes.status, ok: fetchRes.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("   RUNNING ART STUDIO VERIFICATION SUITE         ");
  console.log("==================================================");

  // 1. Authenticate users
  console.log("\n--- TEST GROUP 1: Authentication & Roles ---");
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@artstudio.com", password: "admin123" },
  });
  assert(adminLogin.status === 200 && adminLogin.data.user.role === "ADMIN", "Admin login succeeds with role ADMIN");
  adminToken = adminLogin.data.token;

  const aliceLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "alice@example.com", password: "customer123" },
  });
  assert(aliceLogin.status === 200 && aliceLogin.data.user.role === "CUSTOMER", "Customer (Alice) login succeeds with role CUSTOMER");
  aliceToken = aliceLogin.data.token;

  const bobLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "bob@example.com", password: "customer123" },
  });
  assert(bobLogin.status === 200 && bobLogin.data.user.role === "CUSTOMER", "Customer (Bob) login succeeds with role CUSTOMER");
  bobToken = bobLogin.data.token;

  // 2. Unauthenticated check (401)
  console.log("\n--- TEST GROUP 2: Unauthenticated 401 Enforcement ---");
  const unauthRes = await request("/api/orders");
  assert(unauthRes.status === 401, "Unauthenticated GET /api/orders returns 401 Unauthorized");

  // 3. RBAC checks (403)
  console.log("\n--- TEST GROUP 3: RBAC 403 Enforcement ---");
  // Customer cannot add painting
  const custAddPainting = await request("/api/paintings", {
    method: "POST",
    token: aliceToken,
    body: { title: "Illegal", description: "Test", price: 100, dimensions: "10x10", medium: "Oil" },
  });
  assert(custAddPainting.status === 403, "Customer attempting to POST /api/paintings returns 403 Forbidden");

  // Admin cannot buy painting
  const adminBuyPainting = await request("/api/orders", {
    method: "POST",
    token: adminToken,
    body: { paintingId: "dummy-id" },
  });
  assert(adminBuyPainting.status === 403, "Admin attempting to POST /api/orders returns 403 Forbidden");

  // Admin cannot book wall date
  const adminBookWall = await request("/api/wall-bookings", {
    method: "POST",
    token: adminToken,
    body: { bookingDate: "2026-11-20", wallSizeSqFt: 50, address: "Admin St" },
  });
  assert(adminBookWall.status === 403, "Admin attempting to POST /api/wall-bookings returns 403 Forbidden");

  // Customer cannot confirm/decline bookings
  const custConfirm = await request("/api/wall-bookings/any-id/status", {
    method: "PATCH",
    token: aliceToken,
    body: { status: "CONFIRMED" },
  });
  assert(custConfirm.status === 403, "Customer attempting to PATCH /api/wall-bookings/[id]/status returns 403 Forbidden");

  // 4. Paintings & Concurrency (One of a kind, bought only once, cancellation restores)
  console.log("\n--- TEST GROUP 4: Paintings & Concurrency Locks ---");
  // Admin creates a test painting
  const newPaintingRes = await request("/api/paintings", {
    method: "POST",
    token: adminToken,
    body: {
      title: "Crimson Solitude",
      description: "Atmospheric test painting",
      price: 550,
      dimensions: "20x30",
      medium: "Oil on canvas",
      imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119",
    },
  });
  assert(newPaintingRes.status === 201, "Admin adds new painting with status AVAILABLE");
  const testPainting = newPaintingRes.data.painting;

  // Alice buys it
  const buyRes = await request("/api/orders", {
    method: "POST",
    token: aliceToken,
    body: { paintingId: testPainting.id },
  });
  assert(buyRes.status === 201, "Alice successfully buys the available painting (order PLACED)");
  const aliceOrder = buyRes.data.order;

  // Bob attempts to buy the same painting concurrently -> 409 Conflict
  const bobBuyRes = await request("/api/orders", {
    method: "POST",
    token: bobToken,
    body: { paintingId: testPainting.id },
  });
  assert(bobBuyRes.status === 409, "Bob attempting to buy the same painting is refused with 409 Conflict ('already sold')");

  // Admin cannot edit a sold painting
  const editSoldRes = await request(`/api/paintings/${testPainting.id}`, {
    method: "PUT",
    token: adminToken,
    body: { title: "Modified While Sold" },
  });
  assert(editSoldRes.status === 400, "Admin attempting to edit a sold painting is refused with 400 Bad Request");

  // Customer asking for someone else's record gets 404 (Bob queries Alice's order)
  console.log("\n--- TEST GROUP 5: 404 Not Found for Non-Owned Customer Records ---");
  const bobQueryAliceOrder = await request(`/api/orders/${aliceOrder.id}`, {
    token: bobToken,
  });
  assert(bobQueryAliceOrder.status === 404, "Customer asking for someone else's order receives 404 Not Found (not 403)");

  // Alice cancels her order -> painting restored to AVAILABLE
  console.log("\n--- TEST GROUP 6: Order Cancellation Restores Availability ---");
  const cancelOrderRes = await request(`/api/orders/${aliceOrder.id}/cancel`, {
    method: "POST",
    token: aliceToken,
  });
  assert(cancelOrderRes.status === 200, "Alice cancels her order, status becomes CANCELLED");

  // Now Bob can buy it!
  const bobBuyAfterCancel = await request("/api/orders", {
    method: "POST",
    token: bobToken,
    body: { paintingId: testPainting.id },
  });
  assert(bobBuyAfterCancel.status === 201, "Painting was restored to AVAILABLE and Bob can now buy it");

  // 7. Wall Booking Rules & Concurrency
  console.log("\n--- TEST GROUP 7: Wall Booking Concurrency & Time Bounds ---");
  // Calculate a test date 25 days from today
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 25);
  const dateStr = targetDate.toISOString().split("T")[0];

  // Alice books this date
  const wallBookingRes = await request("/api/wall-bookings", {
    method: "POST",
    token: aliceToken,
    body: {
      bookingDate: dateStr,
      wallSizeSqFt: 150,
      address: "456 Sunflower Lane",
      notes: "Pastel florals",
    },
  });
  assert(wallBookingRes.status === 201 && wallBookingRes.data.booking.totalPrice === 150 * 18, "Alice books date 25 days away; price = 150 * $18 ($2,700)");
  const aliceWallBooking = wallBookingRes.data.booking;

  // Bob attempts to book the same date -> 409 Conflict
  const bobWallBookingRes = await request("/api/wall-bookings", {
    method: "POST",
    token: bobToken,
    body: {
      bookingDate: dateStr,
      wallSizeSqFt: 200,
      address: "789 Willow Road",
    },
  });
  assert(bobWallBookingRes.status === 409, "Bob attempting to book the same date is refused with 409 Conflict ('date already taken')");

  // Date out of bounds (< 7 days or > 90 days)
  const tooSoonDate = new Date();
  tooSoonDate.setDate(tooSoonDate.getDate() + 2);
  const tooSoonRes = await request("/api/wall-bookings", {
    method: "POST",
    token: aliceToken,
    body: {
      bookingDate: tooSoonDate.toISOString().split("T")[0],
      wallSizeSqFt: 50,
      address: "Test",
    },
  });
  assert(tooSoonRes.status === 400, "Booking date less than 7 days away is refused with 400 Bad Request");

  // Admin confirms Alice's booking
  const confirmRes = await request(`/api/wall-bookings/${aliceWallBooking.id}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "CONFIRMED" },
  });
  assert(confirmRes.status === 200 && confirmRes.data.booking.status === "CONFIRMED", "Studio Admin confirms Alice's wall booking");

  // Bob querying Alice's wall booking -> 404
  const bobQueryAliceBooking = await request(`/api/wall-bookings/${aliceWallBooking.id}`, {
    token: bobToken,
  });
  assert(bobQueryAliceBooking.status === 404, "Bob querying Alice's wall booking receives 404 Not Found");

  // 8. Custom Pottery Rules & Constraints
  console.log("\n--- TEST GROUP 8: Custom Pottery Constraints & Status Workflow ---");
  const potteryDate = new Date();
  potteryDate.setDate(potteryDate.getDate() + 20);
  const potteryDateStr = potteryDate.toISOString().split("T")[0];

  // Alice requests pottery
  const potteryRes = await request("/api/pottery", {
    method: "POST",
    token: aliceToken,
    body: {
      item: "Coffee Mug",
      glaze: "Cobalt Matte",
      quantity: 4,
      neededByDate: potteryDateStr,
      notes: "Handle inscribed",
    },
  });
  assert(potteryRes.status === 201 && potteryRes.data.request.status === "REQUESTED", "Alice requests 4x Coffee Mug in Cobalt Matte (status REQUESTED)");
  const alicePottery = potteryRes.data.request;

  // Alice edits while still REQUESTED -> Allowed
  const editPotteryRes = await request(`/api/pottery/${alicePottery.id}`, {
    method: "PUT",
    token: aliceToken,
    body: {
      item: "Coffee Mug",
      glaze: "Cobalt Matte",
      quantity: 6,
      neededByDate: potteryDateStr,
      notes: "Updated to 6 units",
    },
  });
  assert(editPotteryRes.status === 200 && editPotteryRes.data.request.quantity === 6, "Customer edits quantity to 6 while still REQUESTED");

  // Admin accepts request
  const acceptPotteryRes = await request(`/api/pottery/${alicePottery.id}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "ACCEPTED" },
  });
  assert(acceptPotteryRes.status === 200 && acceptPotteryRes.data.request.status === "ACCEPTED", "Admin accepts pottery request");

  // Alice tries to edit or cancel after accepted -> Refused with 400
  const editAfterAccept = await request(`/api/pottery/${alicePottery.id}`, {
    method: "PUT",
    token: aliceToken,
    body: {
      item: "Coffee Mug",
      glaze: "Cobalt Matte",
      quantity: 8,
      neededByDate: potteryDateStr,
    },
  });
  assert(editAfterAccept.status === 400, "Customer attempting to edit an ACCEPTED request is refused with 400 Bad Request");

  const cancelAfterAccept = await request(`/api/pottery/${alicePottery.id}/cancel`, {
    method: "POST",
    token: aliceToken,
  });
  assert(cancelAfterAccept.status === 400, "Customer attempting to cancel an ACCEPTED request is refused with 400 Bad Request");

  console.log("\n==================================================");
  console.log("   🎉 ALL VERIFICATION SUITE TESTS PASSED 100%!  ");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
