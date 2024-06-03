/*
  Warnings:

  - A unique constraint covering the columns `[bill_id]` on the table `Transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transactions_bill_id_key" ON "Transactions"("bill_id");
