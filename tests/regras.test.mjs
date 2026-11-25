// Testes das regras de % e status (drizzle/0001_regras.sql).
// Precisa de um Postgres vazio em TEST_DATABASE_URL; o banco é recriado do zero a cada execução.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { runMigrations } from "../scripts/migrate.mjs";

const url = process.env.TEST_DATABASE_URL;
const HOJE = "2026-11-24"; // terça-feira

let sql;

before(async () => {
  if (!url) throw new Error("Defina TEST_DATABASE_URL para rodar os testes");
  const admin = postgres(url, { max: 1, onnotice: () => {} });
  await admin.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await admin.end();
  await runMigrations(url);
  sql = postgres(url, { max: 1, onnotice: () => {}, connection: { "app.hoje": HOJE } });
  await sql`INSERT INTO areas (id, nome, ordem) VALUES (1, 'Teste', 1)`;
});

after(async () => {
  await sql?.end();
});

let seq = 0;
async function objetivo(campos = {}) {
  const o = { nome: `Objetivo ${++seq}`, area_id: 1, ...campos };
  const [row] = await sql`INSERT INTO objetivos ${sql(o)} RETURNING id`;
  return row.id;
}
async function tarefa(objetivoId, campos = {}) {
  const t = { titulo: `Tarefa ${++seq}`, objetivo_id: objetivoId, ...campos };
  const [row] = await sql`INSERT INTO tarefas ${sql(t)} RETURNING id`;
  return row.id;
}
async function obj(id) {
  const [row] = await sql`SELECT * FROM v_objetivos WHERE id = ${id}`;
  return row;
}
async function situacao(id) {
  const [row] = await sql`SELECT situacao, sem_prazo FROM v_tarefas WHERE id = ${id}`;
  return row;
}

test("hoje() respeita a data fixada", async () => {
  const [{ hoje }] = await sql`SELECT hoje()::text AS hoje`;
  assert.equal(hoje, HOJE);
});

test("% ponderado: só concluída soma; em validação conta 0; cancelada sai da conta", async () => {
  const o = await objetivo();
  await tarefa(o, { peso: 3, status: "concluida" });
  await tarefa(o, { peso: 1, status: "em_validacao" });
  await tarefa(o, { peso: 2, status: "a_fazer" });
  await tarefa(o, { peso: 3, status: "cancelada" });
  const r = await obj(o);
  assert.equal(r.peso_total, 6);
  assert.equal(r.pct, 50);
});

test("objetivo sem tarefas: 0% e fase previsto", async () => {
  const r = await obj(await objetivo());
  assert.equal(r.pct, 0);
  assert.equal(r.fase, "previsto");
  assert.equal(r.status, "em_dia");
});

test("item legado entregue sem tarefas: 100% e entregue", async () => {
  const r = await obj(await objetivo({ entregue_em: "2026-10-01" }));
  assert.equal(r.pct, 100);
  assert.equal(r.status, "entregue");
  assert.equal(r.fase, "entregue");
});

test("entregue_em com tarefa aberta não conta como entregue", async () => {
  const o = await objetivo({ entregue_em: "2026-11-20" });
  await tarefa(o, { status: "fazendo", prazo: "2026-12-10" });
  const r = await obj(o);
  assert.notEqual(r.status, "entregue");
  assert.equal(r.fase, "em_andamento");
});

test("tarefa: atrasada quando passou do prazo", async () => {
  const o = await objetivo();
  assert.equal((await situacao(await tarefa(o, { prazo: "2026-11-23", status: "fazendo" }))).situacao, "atrasada");
});

test("tarefa: em risco quando bloqueada ou a 2 dias úteis ainda em A fazer", async () => {
  const o = await objetivo();
  assert.equal((await situacao(await tarefa(o, { status: "bloqueada", prazo: "2026-12-31" }))).situacao, "em_risco");
  // 24/11 (ter) -> 26/11 (qui) = 2 dias úteis
  assert.equal((await situacao(await tarefa(o, { prazo: "2026-11-26" }))).situacao, "em_risco");
  // 3 dias úteis: em dia
  assert.equal((await situacao(await tarefa(o, { prazo: "2026-11-27" }))).situacao, "em_dia");
  // mesmo prazo curto, se já começou, está em dia
  assert.equal((await situacao(await tarefa(o, { prazo: "2026-11-25", status: "fazendo" }))).situacao, "em_dia");
});

test("dias úteis pulam o fim de semana", async () => {
  const [{ n }] = await sql`SELECT dias_uteis('2026-11-27', '2026-12-01') AS n`; // sex -> ter
  assert.equal(n, 2);
});

test("tarefa sem prazo é sinalizada; concluída não", async () => {
  const o = await objetivo();
  assert.equal((await situacao(await tarefa(o))).sem_prazo, true);
  const c = await situacao(await tarefa(o, { status: "concluida" }));
  assert.equal(c.sem_prazo, false);
  assert.equal(c.situacao, "concluida");
});

test("objetivo atrasado: passou do prazo", async () => {
  const o = await objetivo({ prazo: "2026-11-20" });
  await tarefa(o, { status: "fazendo" });
  assert.equal((await obj(o)).status, "atrasado");
});

test("objetivo atrasado pelo ritmo: mais de 25 pontos abaixo do esperado", async () => {
  // início 14/11, prazo 04/12: hoje (24/11) é 50% do caminho
  const o = await objetivo({ inicio_previsto: "2026-11-14", prazo: "2026-12-04" });
  await tarefa(o, { peso: 1, status: "concluida" });
  await tarefa(o, { peso: 3, status: "fazendo", prazo: "2026-12-04" }); // 25%: 25 abaixo -> em risco
  let r = await obj(o);
  assert.equal(r.pct_esperado, 50);
  assert.equal(r.pct, 25);
  assert.equal(r.status, "em_risco");
  await tarefa(o, { peso: 3, status: "a_fazer", prazo: "2026-12-04" }); // 14%: 36 abaixo -> atrasado
  r = await obj(o);
  assert.equal(r.status, "atrasado");
});

test("objetivo em risco: tarefa atrasada ou bloqueada", async () => {
  const o = await objetivo({ prazo: "2026-12-31" });
  await tarefa(o, { status: "bloqueada", prazo: "2026-12-20" });
  assert.equal((await obj(o)).status, "em_risco");
  const o2 = await objetivo({ prazo: "2026-12-31" });
  await tarefa(o2, { status: "fazendo", prazo: "2026-11-01" });
  assert.equal((await obj(o2)).status, "em_risco");
});

test("objetivo em dia dentro do ritmo", async () => {
  const o = await objetivo({ inicio_previsto: "2026-11-14", prazo: "2026-12-04" });
  await tarefa(o, { peso: 2, status: "concluida" });
  await tarefa(o, { peso: 2, status: "fazendo", prazo: "2026-12-04" });
  const r = await obj(o);
  assert.equal(r.status, "em_dia");
  assert.equal(r.fase, "em_andamento");
});

test("marcações manuais vencem o cálculo", async () => {
  const adiado = await objetivo({ prazo: "2026-10-01", marcacao: "adiado" });
  assert.equal((await obj(adiado)).status, "adiado");
  const cancelado = await objetivo({ prazo: "2026-10-01", marcacao: "cancelado" });
  assert.equal((await obj(cancelado)).status, "cancelado");
  const confirmar = await objetivo({ prazo: "2026-10-01", marcacao: "a_confirmar" });
  assert.equal((await obj(confirmar)).status, "atrasado");
});

test("fase em andamento por iniciado_em (legado) ou por tarefa iniciada", async () => {
  assert.equal((await obj(await objetivo({ iniciado_em: "2026-11-01" }))).fase, "em_andamento");
  const o = await objetivo();
  await tarefa(o, { status: "a_fazer" });
  assert.equal((await obj(o)).fase, "previsto");
  await tarefa(o, { status: "em_validacao" });
  assert.equal((await obj(o)).fase, "em_andamento");
});

test("tarefas novas: criadas depois do início do objetivo", async () => {
  const o = await objetivo({ iniciado_em: "2026-11-01" });
  await tarefa(o, { criada_em: "2026-10-30T12:00:00Z" });
  await tarefa(o, { criada_em: "2026-11-10T12:00:00Z" });
  await tarefa(o, { criada_em: "2026-11-20T12:00:00Z" });
  assert.equal((await obj(o)).tarefas_novas, 2);
});

test("% da área pondera pelo peso das tarefas", async () => {
  await sql`INSERT INTO areas (id, nome, ordem) VALUES (2, 'Área 2', 2)`;
  const a = await objetivo({ area_id: 2 });
  await tarefa(a, { peso: 3, status: "concluida" });
  await tarefa(a, { peso: 3, status: "concluida" }); // 100%, peso 6
  const b = await objetivo({ area_id: 2 });
  await tarefa(b, { peso: 2, status: "a_fazer" }); // 0%, peso 2
  await objetivo({ area_id: 2, marcacao: "cancelado" }); // fora da conta
  const [r] = await sql`SELECT * FROM v_areas WHERE id = 2`;
  assert.equal(r.pct, 75);
  assert.equal(r.objetivos, 2);
});

test("usuário novo nasce diretor; excluir objetivo leva as tarefas junto", async () => {
  await sql`INSERT INTO usuarios (nome, email, senha_hash) VALUES ('Fulano', 'fulano@teste.com', 'x')`;
  const [{ papel }] = await sql`SELECT papel FROM usuarios WHERE email = 'fulano@teste.com'`;
  assert.equal(papel, "diretor");
  const o = await objetivo();
  await tarefa(o);
  await sql`DELETE FROM objetivos WHERE id = ${o}`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM tarefas WHERE objetivo_id = ${o}`;
  assert.equal(n, 0);
});
