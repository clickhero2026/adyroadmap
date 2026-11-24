CREATE TYPE "public"."marcacao" AS ENUM('adiado', 'a_confirmar', 'a_rever', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."prioridade" AS ENUM('P1', 'P2', 'P3');--> statement-breakpoint
CREATE TYPE "public"."status_tarefa" AS ENUM('a_fazer', 'fazendo', 'em_validacao', 'bloqueada', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tipo_objetivo" AS ENUM('funcionalidade', 'melhoria', 'correcao');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "areas_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "objetivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"area_id" integer NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_objetivo" DEFAULT 'funcionalidade' NOT NULL,
	"prioridade" "prioridade" DEFAULT 'P2' NOT NULL,
	"responsavel" text,
	"inicio_previsto" date,
	"prazo" date,
	"iniciado_em" date,
	"entregue_em" date,
	"descricao_publica" text,
	"publico" boolean DEFAULT true NOT NULL,
	"marcacao" "marcacao",
	"nota_interna" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" serial PRIMARY KEY NOT NULL,
	"objetivo_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"status" "status_tarefa" DEFAULT 'a_fazer' NOT NULL,
	"peso" smallint DEFAULT 2 NOT NULL,
	"responsavel" text,
	"prazo" date,
	"iniciada_em" date,
	"concluida_em" date,
	"link" text,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_objetivo_id_objetivos_id_fk" FOREIGN KEY ("objetivo_id") REFERENCES "public"."objetivos"("id") ON DELETE cascade ON UPDATE no action;