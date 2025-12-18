// lib/prisma.ts
import { PrismaClient } from '@/generated/prisma';

declare global {
  // avoid re-instantiating in dev
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({ log: ['query'] });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
