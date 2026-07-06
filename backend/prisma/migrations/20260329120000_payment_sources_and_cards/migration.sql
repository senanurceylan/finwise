-- CreateEnum
CREATE TYPE "regular_payment_status" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "payment_source" AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_account', 'transfer_eft', 'automatic_payment', 'investment_platform', 'other');

-- CreateEnum
CREATE TYPE "card_type" AS ENUM ('credit', 'debit', 'commercial');

-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE 'TEKNOLOJIK_ALET';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "card_id" TEXT,
ADD COLUMN     "payment_source" "payment_source" NOT NULL DEFAULT 'cash';

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "monthly_limit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_name" VARCHAR(80) NOT NULL,
    "bank_name" VARCHAR(80) NOT NULL,
    "card_type" "card_type" NOT NULL,
    "last_4_digits" VARCHAR(4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regular_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_day" INTEGER NOT NULL,
    "reminder_days_before" INTEGER NOT NULL DEFAULT 1,
    "status" "regular_payment_status" NOT NULL DEFAULT 'pending',
    "last_paid_at" TIMESTAMP(3),
    "next_due_date" DATE,
    "next_reminder_at" TIMESTAMP(3),
    "last_reminded_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_source" "payment_source" NOT NULL DEFAULT 'automatic_payment',
    "card_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regular_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_investments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "asset_type" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "buy_price_try" DECIMAL(18,4) NOT NULL,
    "note" VARCHAR(300),
    "payment_source" "payment_source" NOT NULL DEFAULT 'investment_platform',
    "card_id" TEXT,
    "source_label" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" VARCHAR(255),
    "text_length" INTEGER NOT NULL,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statement_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_chunks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statement_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_key" ON "budgets"("user_id", "category");

-- CreateIndex
CREATE INDEX "payment_cards_user_id_idx" ON "payment_cards"("user_id");

-- CreateIndex
CREATE INDEX "regular_payments_user_id_idx" ON "regular_payments"("user_id");

-- CreateIndex
CREATE INDEX "regular_payments_card_id_idx" ON "regular_payments"("card_id");

-- CreateIndex
CREATE INDEX "user_investments_user_id_idx" ON "user_investments"("user_id");

-- CreateIndex
CREATE INDEX "user_investments_symbol_idx" ON "user_investments"("symbol");

-- CreateIndex
CREATE INDEX "user_investments_card_id_idx" ON "user_investments"("card_id");

-- CreateIndex
CREATE INDEX "statement_documents_user_id_idx" ON "statement_documents"("user_id");

-- CreateIndex
CREATE INDEX "statement_chunks_user_id_idx" ON "statement_chunks"("user_id");

-- CreateIndex
CREATE INDEX "statement_chunks_document_id_idx" ON "statement_chunks"("document_id");

-- CreateIndex
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "expenses_card_id_idx" ON "expenses"("card_id");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_payments" ADD CONSTRAINT "regular_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_payments" ADD CONSTRAINT "regular_payments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_investments" ADD CONSTRAINT "user_investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_investments" ADD CONSTRAINT "user_investments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_documents" ADD CONSTRAINT "statement_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_chunks" ADD CONSTRAINT "statement_chunks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_chunks" ADD CONSTRAINT "statement_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "statement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
