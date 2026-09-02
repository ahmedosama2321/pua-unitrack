import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ==========================================
  // ADMIN CONFIG
  // ==========================================

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
    );
  }

  if (adminPassword.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 8 characters."
    );
  }

  const normalizedEmail = adminEmail
    .trim()
    .toLowerCase();

  const passwordHash = await bcrypt.hash(
    adminPassword,
    12
  );

  // ==========================================
  // CREATE OR UPDATE ADMIN
  // ==========================================

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  let admin;

  if (existingAdmin) {
    admin = await prisma.user.update({
      where: {
        email: normalizedEmail
      },

      data: {
        name: "PUA UniTrack Admin",
        passwordHash,
        role: "ADMIN",
        approval: "APPROVED"
      }
    });

    console.log("✅ Existing admin account updated.");
  } else {
    admin = await prisma.user.create({
      data: {
        name: "PUA UniTrack Admin",
        email: normalizedEmail,
        passwordHash,
        role: "ADMIN",
        approval: "APPROVED"
      }
    });

    console.log("✅ Admin account created.");
  }

  // ==========================================
  // OPTIONAL DEMO DATA
  // ==========================================

  // Subject examples
  const subjects = [
    {
      name: "Artificial Intelligence",
      code: "AI101",
      level: 1
    },
    {
      name: "Database Systems",
      code: "DB201",
      level: 2
    },
    {
      name: "Web Development",
      code: "WEB301",
      level: 3
    }
  ];

  console.log("ℹ️ Admin:", admin.email);
  console.log(
    `ℹ️ Demo subjects prepared: ${subjects.length}`
  );

  console.log("🎉 Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });