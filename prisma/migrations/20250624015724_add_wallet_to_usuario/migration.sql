/*
  Warnings:

  - A unique constraint covering the columns `[Wallet]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "Wallet" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_Wallet_key" ON "Usuario"("Wallet");
