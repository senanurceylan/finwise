-- PaymentSource + CardType enums, payment_cards table, FK columns on expenses / regular_payments / user_investments

CREATE TYPE "payment_source" AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'bank_account',
  'transfer_eft',
  'automatic_payment',
  'investment_platform',
  'other'
);

CREATE TYPE "card_type" AS ENUM ('credit', 'debit', 'commercial');

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

CREATE INDEX "payment_cards_user_id_idx" ON "payment_cards"("user_id");

ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD COLUMN "payment_source" "payment_source" NOT NULL DEFAULT 'cash';
ALTER TABLE "expenses" ADD COLUMN "card_id" TEXT;

CREATE INDEX "expenses_card_id_idx" ON "expenses"("card_id");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "regular_payments" ADD COLUMN "payment_source" "payment_source" NOT NULL DEFAULT 'automatic_payment';
ALTER TABLE "regular_payments" ADD COLUMN "card_id" TEXT;

CREATE INDEX "regular_payments_card_id_idx" ON "regular_payments"("card_id");

ALTER TABLE "regular_payments" ADD CONSTRAINT "regular_payments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_investments" ADD COLUMN "payment_source" "payment_source" NOT NULL DEFAULT 'investment_platform';
ALTER TABLE "user_investments" ADD COLUMN "card_id" TEXT;
ALTER TABLE "user_investments" ADD COLUMN "source_label" VARCHAR(120);

CREATE INDEX "user_investments_card_id_idx" ON "user_investments"("card_id");

ALTER TABLE "user_investments" ADD CONSTRAINT "user_investments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
