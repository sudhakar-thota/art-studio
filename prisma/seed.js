const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clean existing data in reverse dependency order
  await prisma.potteryRequest.deleteMany();
  await prisma.wallBooking.deleteMany();
  await prisma.order.deleteMany();
  await prisma.painting.deleteMany();
  await prisma.potterySeedGlaze.deleteMany();
  await prisma.potterySeedItem.deleteMany();
  await prisma.wallRate.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating default users...");
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const customerPasswordHash = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@artstudio.com",
      name: "Studio Admin (Atelier)",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      name: "Alice Walker",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      name: "Bob Vance",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  console.log("Seeding Wall Painting rate...");
  await prisma.wallRate.create({
    data: {
      ratePerSqFt: 18.0,
      isActive: true,
    },
  });

  console.log("Seeding Pottery catalog (Items and Glazes)...");
  const potteryItems = [
    { name: "Coffee Mug", description: "Wheel-thrown ergonomic ceramic mug (12oz)", basePrice: 28 },
    { name: "Fluted Vase", description: "Sculptural ribbed floral vase (10 inches)", basePrice: 65 },
    { name: "Ramen Bowl", description: "Deep stoneware dining bowl with chopsticks notch", basePrice: 38 },
    { name: "Planter Pot", description: "Cylindrical botanical planter with matching saucer", basePrice: 44 },
    { name: "Artisan Teapot", description: "Hand-poured teapot with fine mesh interior strainer", basePrice: 85 },
    { name: "Serving Platter", description: "Wide organic-rim stoneware dinner platter", basePrice: 72 },
  ];

  for (const item of potteryItems) {
    await prisma.potterySeedItem.create({ data: item });
  }

  const potteryGlazes = [
    { name: "Cobalt Matte", hexColor: "#1E3A8A", finish: "Matte mineral finish" },
    { name: "Celadon Gloss", hexColor: "#8FB9AA", finish: "Smooth translucent glass finish" },
    { name: "Speckled Sand", hexColor: "#D8C7B0", finish: "Textured satin natural grain" },
    { name: "Terracotta Earth", hexColor: "#C06C4E", finish: "Warm raw clay texture" },
    { name: "Obsidian Night", hexColor: "#1A1A1A", finish: "Deep metallic satin luster" },
    { name: "Sage Mist", hexColor: "#9CAF88", finish: "Earthy soft-touch satin" },
  ];

  for (const glaze of potteryGlazes) {
    await prisma.potterySeedGlaze.create({ data: glaze });
  }

  console.log("Seeding Paintings...");
  const paintingsData = [
    {
      title: "Solitude in Ochre",
      description: "A textured study of evening light across brutalist architecture and arid hills.",
      price: 650,
      dimensions: "30 x 40 inches",
      medium: "Oil and cold wax on linen",
      imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      status: "AVAILABLE",
    },
    {
      title: "Ephemeral Tide",
      description: "Layered indigo and sea salt washes capturing rhythmic coastal swell.",
      price: 480,
      dimensions: "24 x 36 inches",
      medium: "Acrylic and mineral pigment on raw canvas",
      imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
      status: "AVAILABLE",
    },
    {
      title: "Botanical Reverie No. 4",
      description: "Delicate botanical silhouettes submerged in warm umber and bone white tones.",
      price: 520,
      dimensions: "20 x 30 inches",
      medium: "Mixed media and pressed botanical dyes",
      imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80",
      status: "AVAILABLE",
    },
    {
      title: "Fragments of Dawn",
      description: "Geometric abstraction meditating on first morning reflections on calm lake water.",
      price: 780,
      dimensions: "36 x 48 inches",
      medium: "Oil on cradled birch panel",
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
      status: "AVAILABLE",
    },
    {
      title: "Silent Monolith",
      description: "Heavy impasto charcoal strokes exploring weight and permanence.",
      price: 390,
      dimensions: "18 x 24 inches",
      medium: "Charcoal, plaster and oil stick on canvas",
      imageUrl: "https://images.unsplash.com/photo-1582561121116-44470d027732?auto=format&fit=crop&w=800&q=80",
      status: "AVAILABLE",
    },
    {
      title: "Resonance in Vermilion",
      description: "Vibrant chromatic interplay with layered glaze technique.",
      price: 590,
      dimensions: "24 x 24 inches",
      medium: "Encaustic and oil on wood",
      imageUrl: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=80",
      status: "SOLD",
    },
  ];

  const createdPaintings = [];
  for (const p of paintingsData) {
    const created = await prisma.painting.create({ data: p });
    createdPaintings.push(created);
  }

  console.log("Seeding initial order for sold painting...");
  const soldPainting = createdPaintings.find((p) => p.status === "SOLD");
  if (soldPainting) {
    await prisma.order.create({
      data: {
        userId: alice.id,
        paintingId: soldPainting.id,
        amount: soldPainting.price,
        status: "PLACED",
      },
    });
  }

  console.log("Seeding sample Wall Bookings...");
  // Date calculation helpers
  const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Alice: Booking in 20 days (status REQUESTED)
  await prisma.wallBooking.create({
    data: {
      userId: alice.id,
      bookingDate: addDays(20),
      wallSizeSqFt: 120,
      ratePerSqFt: 18.0,
      totalPrice: 120 * 18.0,
      address: "742 Evergreen Terrace, Springfield",
      notes: "Feature wall in living room with high ceiling. Prefers nature/forest theme.",
      status: "REQUESTED",
    },
  });

  // Bob: Booking in 45 days (status CONFIRMED)
  await prisma.wallBooking.create({
    data: {
      userId: bob.id,
      bookingDate: addDays(45),
      wallSizeSqFt: 250,
      ratePerSqFt: 18.0,
      totalPrice: 250 * 18.0,
      address: "100 Industrial Parkway, Suite 4B",
      notes: "Office reception wall. Modern geometric mural.",
      status: "CONFIRMED",
    },
  });

  console.log("Seeding sample Pottery Requests...");
  // Alice: Pottery request in 25 days (REQUESTED)
  await prisma.potteryRequest.create({
    data: {
      userId: alice.id,
      item: "Coffee Mug",
      glaze: "Cobalt Matte",
      quantity: 4,
      neededByDate: addDays(25),
      notes: "Custom engraved initials 'A&W' on bottom if possible.",
      status: "REQUESTED",
    },
  });

  // Bob: Pottery request in 30 days (ACCEPTED)
  await prisma.potteryRequest.create({
    data: {
      userId: bob.id,
      item: "Planter Pot",
      glaze: "Terracotta Earth",
      quantity: 2,
      neededByDate: addDays(30),
      notes: "Extra large drainage hole needed for bonsai trees.",
      status: "ACCEPTED",
    },
  });

  console.log("Database seeded successfully!");
  console.log("------------------------------------------");
  console.log("Default Admin Account:");
  console.log("  Email:    admin@artstudio.com");
  console.log("  Password: admin123");
  console.log("  Role:     ADMIN (Studio)");
  console.log("------------------------------------------");
  console.log("Default Customer Accounts:");
  console.log("  Email:    alice@example.com / bob@example.com");
  console.log("  Password: customer123");
  console.log("  Role:     CUSTOMER");
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
