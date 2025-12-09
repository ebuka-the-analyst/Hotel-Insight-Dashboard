import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./emailAuth";

async function seedUser() {
  const email = "manager@hyattplace.com";
  const password = "manager123";
  const passwordHash = hashPassword(password);

  try {
    await db.insert(users).values({
      email,
      passwordHash,
      firstName: "Hotel",
      lastName: "Manager",
    }).onConflictDoNothing();

    console.log("Test user created successfully!");
    console.log("Email: manager@hyattplace.com");
    console.log("Password: manager123");
  } catch (error) {
    console.error("Error seeding user:", error);
  }
  
  process.exit(0);
}

seedUser();
