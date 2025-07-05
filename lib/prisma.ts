// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // tránh tạo PrismaClient nhiều lần trong môi trường watch/dev
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],          // bật log để debug SQL
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
