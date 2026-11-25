CREATE TYPE "public"."papel" AS ENUM('admin', 'diretor');--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "papel" "papel" DEFAULT 'diretor' NOT NULL;--> statement-breakpoint
-- Quem já existia antes dos perfis era sócio com acesso total.
UPDATE "usuarios" SET "papel" = 'admin';
