ALTER TABLE "areas" ADD COLUMN "icone" text;--> statement-breakpoint
UPDATE "areas" SET "icone" = "nome";
