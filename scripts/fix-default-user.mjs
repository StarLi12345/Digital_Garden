// Fix the default user password after migration
// The migration created a user with a placeholder hash — this replaces it with a real one.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultUser = await prisma.user.findUnique({ where: { username: "Star.Li" } });
  if (!defaultUser) {
    console.log("Default user not found, skipping.");
    return;
  }

  const hashed = await bcrypt.hash("123456", 12);
  await prisma.user.update({
    where: { id: defaultUser.id },
    data: { passwordHash: hashed },
  });
  console.log("Default user password has been set. Username: Star.Li, Password: 123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
