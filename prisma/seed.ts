import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { hash } from "bcryptjs";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚂 Seeding Southzone Railway database...\n");

  // ── Users ──────────────────────────────────────────────
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@southzone.in" },
    update: {},
    create: {
      fullName: "Vignesh Kumar",
      email: "admin@southzone.in",
      username: "admin",
      password: adminPassword,
      phone: "9999999999",
      gender: "Male",
      state: "Tamil Nadu",
      city: "Chennai",
      role: "ADMIN",
      plan: "FREE",
    },
  });
  console.log("✅ Admin created:", admin.email, "(password: admin123)");

  const userPassword = await hash("user123", 12);
  const demoUsers = [
    { fullName: "Rila Kumar", email: "rila@example.com", username: "rila", phone: "9876543210", gender: "Female", state: "Karnataka", city: "Bangalore" },
    { fullName: "Arjun Sharma", email: "arjun@example.com", username: "arjun", phone: "9876543211", gender: "Male", state: "Tamil Nadu", city: "Coimbatore" },
    { fullName: "Priya Nair", email: "priya@example.com", username: "priya", phone: "9876543212", gender: "Female", state: "Kerala", city: "Kochi" },
    { fullName: "Karthik Reddy", email: "karthik@example.com", username: "karthik", phone: "9876543213", gender: "Male", state: "Telangana", city: "Hyderabad" },
    { fullName: "Deepa Mohan", email: "deepa@example.com", username: "deepa", phone: "9876543214", gender: "Female", state: "Tamil Nadu", city: "Madurai" },
  ];

  const createdUsers = [];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: userPassword, role: "USER", plan: "FREE" },
    });
    createdUsers.push(user);
    console.log("✅ User created:", user.email, "(password: user123)");
  }

  // ── Trains ─────────────────────────────────────────────
  const trains = [
    {
      trainNumber: "12951",
      title: "Mumbai Rajdhani Express — Schedule Update",
      fromStation: "Mumbai Central",
      toStation: "New Delhi",
      description:
        "The Mumbai Rajdhani Express (12951) runs daily between Mumbai Central and New Delhi. Platform changed to Platform 5 effective from April 1st, 2026. Passengers are advised to arrive 30 minutes early. Catering services have been upgraded with a new menu featuring regional cuisines.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "12001",
      title: "Shatabdi Express — Timing Change",
      fromStation: "Bhopal Junction",
      toStation: "New Delhi",
      description:
        "Revised departure time from Bhopal effective 1st April 2026. New departure: 06:00 AM (earlier: 06:15 AM). Arrives New Delhi at 12:30 PM. AC Chair Car fully restored. Meal service included in fare.",
      scheduleType: "Weekly",
      scheduleDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
      isPremium: false,
      scheduleBadgeText: "Mon–Sat",
      scheduleBadgeColor: "blue",
      nextRunDate: "Tomorrow",
    },
    {
      trainNumber: "16101",
      title: "Chennai Express — Route Diversion",
      fromStation: "Chennai Central",
      toStation: "Mumbai CST",
      description:
        "Temporary route diversion via Pune due to track maintenance between Sholapur and Daund. Expected delay of 45–60 minutes on all trips until April 30th. Regular route resumes from May 1st. Please check updated timetable.",
      scheduleType: "CustomDays",
      scheduleDays: JSON.stringify(["Tue", "Thu", "Sat"]),
      isPremium: false,
      scheduleBadgeText: "Tue, Thu, Sat",
      scheduleBadgeColor: "violet",
      nextRunDate: "Apr 10",
    },
    {
      trainNumber: "12627",
      title: "Karnataka Express — Festival Special Coaches",
      fromStation: "Bangalore City",
      toStation: "New Delhi",
      description:
        "Additional 3 AC coaches added for Ugadi and summer rush. Extra technical halts at Hyderabad (10 min) and Nagpur (15 min) for crew change. Runs with 24 coaches instead of regular 21.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "12221",
      title: "Duronto Express — New Premium Service",
      fromStation: "Mumbai CST",
      toStation: "Pune Junction",
      description:
        "Duronto Express launches new premium non-stop service. AC First Class coaches with reclining seats, meals, and WiFi. Average journey time: 2h 45m. Limited seats available — book early.",
      scheduleType: "DateRange",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-06-30"),
      isPremium: false,
      scheduleBadgeText: "Apr–Jun",
      scheduleBadgeColor: "cyan",
      nextRunDate: "Apr 1",
    },
    {
      trainNumber: "22691",
      title: "Rajdhani Express — Bangalore to Delhi",
      fromStation: "Bangalore City",
      toStation: "H. Nizamuddin",
      description:
        "Weekly Rajdhani service with LHB coaches. Enhanced pantry car with South Indian breakfast options. Departs 8:20 PM, arrives 5:55 AM (2nd day). Bedding and meals included.",
      scheduleType: "Weekly",
      scheduleDays: JSON.stringify(["Mon", "Wed", "Fri"]),
      isPremium: false,
      scheduleBadgeText: "Mon, Wed, Fri",
      scheduleBadgeColor: "blue",
      nextRunDate: "Apr 9",
    },
    {
      trainNumber: "12245",
      title: "Duronto Howrah — Speed Upgrade",
      fromStation: "Howrah Junction",
      toStation: "New Delhi",
      description:
        "Speed increased to 130 km/h on Howrah–Delhi section. Journey time reduced by 45 minutes. New expected arrival: 9:45 AM. AC 3-Tier Economy class added.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "12633",
      title: "Kanyakumari Express — Extended Route",
      fromStation: "Chennai Egmore",
      toStation: "Kanyakumari",
      description:
        "Route extended to start from Tambaram. New stops: Chengalpattu, Villupuram, and Mayiladuthurai. General class coaches increased from 5 to 8.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "12657",
      title: "Chennai–Bangalore Mail — Platform Change",
      fromStation: "Chennai Central",
      toStation: "Bangalore City",
      description:
        "Departure platform changed to Platform 9 from April 5th. Timing remains same — departs 11:10 PM, arrives 6:00 AM. SLR coach position shifted to rear.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "16525",
      title: "Bangalore–Kannur Express — New Service",
      fromStation: "Bangalore City",
      toStation: "Kannur",
      description:
        "Brand new express service launched connecting Bangalore to Kannur via Mysore and Kozhikode. Fully AC train with vistadome coach for Western Ghats section. Inaugural run on April 15th.",
      scheduleType: "OneTime",
      startDate: new Date("2026-04-15"),
      isPremium: false,
      scheduleBadgeText: "Apr 15 Launch",
      scheduleBadgeColor: "orange",
      nextRunDate: "Apr 15",
    },
    {
      trainNumber: "20601",
      title: "Vande Bharat — Chennai to Coimbatore",
      fromStation: "Chennai Central",
      toStation: "Coimbatore Junction",
      description:
        "India's semi-high-speed Vande Bharat Express now connects Chennai and Coimbatore in just 5 hours. Max speed 160 km/h. Rotating chairs, WiFi, bio-vacuum toilets, and onboard infotainment.",
      scheduleType: "Daily",
      isPremium: false,
      scheduleBadgeText: "Runs Daily",
      scheduleBadgeColor: "green",
      nextRunDate: "Today",
    },
    {
      trainNumber: "12839",
      title: "Chennai Mail — Temporary Cancellation",
      fromStation: "Howrah Junction",
      toStation: "Chennai Central",
      description:
        "Train cancelled from April 12th to April 18th due to signal upgradation work between Vijayawada and Chennai. Passengers with confirmed tickets will receive full refund. Alternative: Train 12841.",
      scheduleType: "DateRange",
      startDate: new Date("2026-04-12"),
      endDate: new Date("2026-04-18"),
      isPremium: false,
      scheduleBadgeText: "Apr 12–18 Cancelled",
      scheduleBadgeColor: "red",
      nextRunDate: "Cancelled",
    },
  ];

  for (const train of trains) {
    await prisma.train.upsert({
      where: { trainNumber: train.trainNumber },
      update: {},
      create: train,
    });
  }
  console.log(`✅ Seeded ${trains.length} trains`);

  // ── Alerts for demo users ──────────────────────────────
  const seededTrains = await prisma.train.findMany();
  const trainMap = new Map(seededTrains.map((t) => [t.trainNumber, t]));

  const alertData = [
    { user: createdUsers[0], trainNo: "12951", date: new Date("2026-04-15") },
    { user: createdUsers[0], trainNo: "16101", date: new Date("2026-04-20") },
    { user: createdUsers[1], trainNo: "12627", date: new Date("2026-04-12") },
    { user: createdUsers[2], trainNo: "22691", date: new Date("2026-04-14") },
    { user: createdUsers[3], trainNo: "12001", date: new Date("2026-04-18") },
    { user: createdUsers[4], trainNo: "12633", date: null },
  ];

  for (const a of alertData) {
    const train = trainMap.get(a.trainNo);
    if (!train) continue;
    const exists = await prisma.alert.findFirst({
      where: { userId: a.user.id, trainId: train.id, isActive: true },
    });
    if (!exists) {
      await prisma.alert.create({
        data: {
          userId: a.user.id,
          trainId: train.id,
          trainNumber: train.trainNumber,
          trainName: train.title,
          travelDate: a.date,
        },
      });
    }
  }
  console.log(`✅ Seeded ${alertData.length} alerts`);

  // ── Notifications ──────────────────────────────────────
  for (const user of createdUsers) {
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          title: "Welcome to Southzone Railway!",
          message: `Hi ${user.fullName}, your free account is now active. Start tracking trains and set alerts.`,
          type: "SUCCESS",
        },
        {
          userId: user.id,
          title: "New Train Updates Available",
          message: "12 new train schedule updates have been posted. Check the latest changes for your routes.",
          type: "INFO",
        },
      ],
    });
  }

  // Admin notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: "System Ready",
        message: "Southzone Railway Update admin panel is configured and ready. You can start adding train updates.",
        type: "SUCCESS",
      },
      {
        userId: admin.id,
        title: "5 New Users Registered",
        message: "5 demo users have been created during seeding. Check the Users section for details.",
        type: "INFO",
      },
    ],
  });
  console.log("✅ Seeded notifications");

  console.log("\n🎉 Seeding complete!");
  console.log("──────────────────────────────");
  console.log("Admin login: admin / admin123");
  console.log("User login:  rila / user123  (or arjun, priya, karthik, deepa)");
  console.log("──────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
