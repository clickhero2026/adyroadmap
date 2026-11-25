import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const tipoObjetivo = pgEnum("tipo_objetivo", [
  "funcionalidade",
  "melhoria",
  "correcao",
]);
export const prioridade = pgEnum("prioridade", ["P1", "P2", "P3"]);
export const marcacao = pgEnum("marcacao", [
  "adiado",
  "a_confirmar",
  "a_rever",
  "cancelado",
]);
export const statusTarefa = pgEnum("status_tarefa", [
  "a_fazer",
  "fazendo",
  "em_validacao",
  "bloqueada",
  "concluida",
  "cancelada",
]);

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  ordem: integer("ordem").notNull().default(0),
});

export const objetivos = pgTable("objetivos", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id, { onDelete: "restrict" }),
  nome: text("nome").notNull(),
  tipo: tipoObjetivo("tipo").notNull().default("funcionalidade"),
  prioridade: prioridade("prioridade").notNull().default("P2"),
  responsavel: text("responsavel"),
  inicioPrevisto: date("inicio_previsto"),
  prazo: date("prazo"),
  // Preenchido quando o trabalho começa sem tarefas registradas (itens legados do roadmap).
  iniciadoEm: date("iniciado_em"),
  entregueEm: date("entregue_em"),
  descricaoPublica: text("descricao_publica"),
  // Novo objetivo nasce fora do roadmap público; aparecer lá é uma decisão explícita.
  publico: boolean("publico").notNull().default(false),
  marcacao: marcacao("marcacao"),
  notaInterna: text("nota_interna"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const tarefas = pgTable("tarefas", {
  id: serial("id").primaryKey(),
  objetivoId: integer("objetivo_id")
    .notNull()
    .references(() => objetivos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  status: statusTarefa("status").notNull().default("a_fazer"),
  peso: smallint("peso").notNull().default(2),
  responsavel: text("responsavel"),
  prazo: date("prazo"),
  iniciadaEm: date("iniciada_em"),
  concluidaEm: date("concluida_em"),
  link: text("link"),
  criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
});

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
