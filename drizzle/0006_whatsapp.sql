CREATE TABLE "whatsapp" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'desconectado' NOT NULL,
	"qr" text,
	"numero" text,
	"erro" text,
	"grupos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grupo_id" text,
	"grupo_nome" text,
	"ativo" boolean DEFAULT false NOT NULL,
	"hora" integer DEFAULT 9 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_auth" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_envios" (
	"id" serial PRIMARY KEY NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"desde" date NOT NULL,
	"texto" text NOT NULL,
	"ok" boolean NOT NULL,
	"erro" text,
	"manual" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO "whatsapp" ("id") VALUES (1) ON CONFLICT DO NOTHING;
