import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./emailAuth";

async function seedUser() {
  const email = "emma@demohotel.com";
  const password = "demo1234";
  const passwordHash = hashPassword(password);

  try {
    await db.insert(users).values({
      email,
      passwordHash,
      firstName: "Emma",
      lastName: "Manager",
    }).onConflictDoNothing();

    console.log("Test user created successfully!");
    console.log("Email: emma@demohotel.com");
    console.log("Password: demo1234");
  } catch (error) {
    console.error("Error seeding user:", error);
  }
  
  process.exit(0);
}

seedUser();
