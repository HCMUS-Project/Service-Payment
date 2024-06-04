-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_payment_method_fkey";

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_payment_method_fkey" FOREIGN KEY ("payment_method") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
