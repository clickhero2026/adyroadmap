// Leitura das views e escrita nas tabelas. Usado pelas telas, pelas server actions e pela API.
import { db } from "./db";
import { hashSenha } from "../../scripts/lib/senha.mjs";
import { STATUS_TAREFA, type StatusTarefa } from "./rotulos";

export type Area = { id: number; nome: string; ordem: number; icone: string | null; pct: number; objetivos: number; entregues: number };

export type Objetivo = {
  id: number;
  area_id: number;
  area_nome: string;
  area_ordem: number;
  area_icone: string | null;
  nome: string;
  tipo: string;
  prioridade: string;
  responsavel: string | null;
  inicio_previsto: string | null;
  prazo: string | null;
  iniciado_em: string | null;
  entregue_em: string | null;
  descricao_publica: string | null;
  beneficios: string | null;
  publico: boolean;
  marcacao: string | null;
  nota_interna: string | null;
  pct: number;
  pct_esperado: number | null;
  status: string;
  fase: string;
  tarefas_total: number;
  tarefas_concluidas: number;
  tarefas_atrasadas: number;
  tarefas_bloqueadas: number;
  tarefas_abertas: number;
  tarefas_novas: number;
};

export type Tarefa = {
  id: number;
  objetivo_id: number;
  objetivo_nome: string;
  titulo: string;
  status: StatusTarefa;
  peso: number;
  responsavel: string | null;
  prazo: string | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  link: string | null;
  situacao: string;
  sem_prazo: boolean;
};

export async function listarAreas() {
  return db()<Area[]>`SELECT v.*, a.icone FROM v_areas v JOIN areas a USING (id) ORDER BY v.ordem, v.nome`;
}

export async function listarObjetivos() {
  return db()<Objetivo[]>`
    SELECT o.*, a.icone AS area_icone, ob.beneficios
    FROM v_objetivos o JOIN areas a ON a.id = o.area_id JOIN objetivos ob ON ob.id = o.id
    ORDER BY o.area_ordem, o.prioridade, o.nome`;
}

/** Roadmap público: só o que está marcado como público, sem cancelados nem notas internas. */
export async function listarObjetivosPublicos() {
  return db()<
    Pick<Objetivo, "id" | "nome" | "tipo" | "area_nome" | "area_ordem" | "area_icone" | "descricao_publica" | "beneficios" | "fase" | "entregue_em">[]
  >`
    SELECT o.id, o.nome, o.tipo, o.area_nome, o.area_ordem, a.icone AS area_icone, o.descricao_publica, ob.beneficios, o.fase, o.entregue_em
    FROM v_objetivos o JOIN areas a ON a.id = o.area_id JOIN objetivos ob ON ob.id = o.id
    WHERE o.publico AND o.status <> 'cancelado'
    ORDER BY o.area_ordem, o.nome`;
}

export async function buscarObjetivo(id: number) {
  const [o] = await db()<Objetivo[]>`SELECT v.*, ob.beneficios FROM v_objetivos v JOIN objetivos ob ON ob.id = v.id WHERE v.id = ${id}`;
  return o ?? null;
}

export async function listarTarefas(filtro: { objetivoId?: number } = {}) {
  const sql = db();
  return sql<Tarefa[]>`
    SELECT t.id, t.objetivo_id, o.nome AS objetivo_nome, t.titulo, t.status, t.peso, t.responsavel,
           t.prazo, t.iniciada_em, t.concluida_em, t.link, t.situacao, t.sem_prazo
    FROM v_tarefas t JOIN objetivos o ON o.id = t.objetivo_id
    WHERE ${filtro.objetivoId ? sql`t.objetivo_id = ${filtro.objetivoId}` : sql`TRUE`}
    ORDER BY t.prazo NULLS LAST, t.id`;
}

export async function buscarTarefa(id: number) {
  const [t] = await db()<Tarefa[]>`
    SELECT t.id, t.objetivo_id, o.nome AS objetivo_nome, t.titulo, t.status, t.peso, t.responsavel,
           t.prazo, t.iniciada_em, t.concluida_em, t.link, t.situacao, t.sem_prazo
    FROM v_tarefas t JOIN objetivos o ON o.id = t.objetivo_id WHERE t.id = ${id}`;
  return t ?? null;
}

/** Concluídas e entregues nos últimos 7 dias (pauta da reunião de sexta). */
export async function novidadesDaSemana() {
  const sql = db();
  const tarefas = await sql<{ titulo: string; objetivo_nome: string; concluida_em: string }[]>`
    SELECT t.titulo, o.nome AS objetivo_nome, t.concluida_em
    FROM tarefas t JOIN objetivos o ON o.id = t.objetivo_id
    WHERE t.status = 'concluida' AND t.concluida_em > hoje() - 7
    ORDER BY t.concluida_em DESC`;
  const objetivos = await sql<{ nome: string; entregue_em: string }[]>`
    SELECT nome, entregue_em FROM v_objetivos
    WHERE status = 'entregue' AND entregue_em > hoje() - 7
    ORDER BY entregue_em DESC`;
  return { tarefas, objetivos };
}

// ---------- validação e escrita ----------

export class ErroValidacao extends Error {}

const STATUS_VALIDOS = new Set<string>(STATUS_TAREFA.map(([k]) => k));
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function data(v: unknown, campo: string): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !DATA.test(v) || Number.isNaN(Date.parse(v))) {
    throw new ErroValidacao(`${campo}: use o formato AAAA-MM-DD`);
  }
  return v;
}
function texto(v: unknown, max = 500): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}
function link(v: unknown): string | null {
  const s = texto(v, 1000);
  if (s && !/^https?:\/\//i.test(s)) throw new ErroValidacao("Link: use um endereço http(s)");
  return s;
}

export type DadosTarefa = {
  objetivo_id?: unknown;
  titulo?: unknown;
  status?: unknown;
  peso?: unknown;
  responsavel?: unknown;
  prazo?: unknown;
  link?: unknown;
};

function normalizarTarefa(d: DadosTarefa, parcial: boolean) {
  const out: Record<string, unknown> = {};
  if (!parcial || d.objetivo_id !== undefined) {
    const id = Number(d.objetivo_id);
    if (!Number.isInteger(id) || id <= 0) throw new ErroValidacao("Escolha o objetivo da tarefa");
    out.objetivo_id = id;
  }
  if (!parcial || d.titulo !== undefined) {
    const t = texto(d.titulo, 300);
    if (!t) throw new ErroValidacao("A tarefa precisa de um título");
    out.titulo = t;
  }
  if (d.status !== undefined) {
    if (!STATUS_VALIDOS.has(String(d.status))) throw new ErroValidacao("Status inválido");
    out.status = String(d.status);
  }
  if (d.peso !== undefined) {
    const p = Number(d.peso);
    if (![1, 2, 3].includes(p)) throw new ErroValidacao("Peso deve ser 1 (P), 2 (M) ou 3 (G)");
    out.peso = p;
  }
  if (d.responsavel !== undefined) out.responsavel = texto(d.responsavel, 100);
  if (d.prazo !== undefined) out.prazo = data(d.prazo, "Prazo");
  if (d.link !== undefined) out.link = link(d.link);
  return out;
}

/** Prazo é obrigatório a partir de "Fazendo" (regra aprovada na proposta). */
function conferirPrazo(status: string, prazo: unknown) {
  if (!["a_fazer", "concluida", "cancelada"].includes(status) && !prazo) {
    throw new ErroValidacao("Defina o prazo antes de mover a tarefa para esse status");
  }
}

// Datas de início e conclusão acompanham o status.
const DATAS_POR_STATUS = (s: string) => db()`
  iniciada_em = CASE WHEN ${s} NOT IN ('a_fazer', 'cancelada') THEN COALESCE(iniciada_em, hoje()) ELSE iniciada_em END,
  concluida_em = CASE WHEN ${s} = 'concluida' THEN COALESCE(concluida_em, hoje()) ELSE NULL END`;

export async function criarTarefa(d: DadosTarefa) {
  const v = normalizarTarefa(d, false);
  const status = (v.status as string) ?? "a_fazer";
  conferirPrazo(status, v.prazo);
  const sql = db();
  const [row] = await sql<{ id: number }[]>`INSERT INTO tarefas ${sql({ ...v, status })} RETURNING id`;
  await sql`UPDATE tarefas SET ${DATAS_POR_STATUS(status)} WHERE id = ${row.id}`;
  return row.id;
}

export async function atualizarTarefa(id: number, d: DadosTarefa) {
  const v = normalizarTarefa(d, true);
  const atual = await buscarTarefa(id);
  if (!atual) throw new ErroValidacao("Tarefa não encontrada");
  const status = (v.status as string) ?? atual.status;
  conferirPrazo(status, "prazo" in v ? v.prazo : atual.prazo);
  const sql = db();
  if (Object.keys(v).length) await sql`UPDATE tarefas SET ${sql(v)} WHERE id = ${id}`;
  await sql`UPDATE tarefas SET ${DATAS_POR_STATUS(status)} WHERE id = ${id}`;
}

export async function excluirTarefa(id: number) {
  await db()`DELETE FROM tarefas WHERE id = ${id}`;
}

export type DadosObjetivo = Record<string, unknown>;

export async function salvarObjetivo(id: number | null, d: DadosObjetivo) {
  const area = Number(d.area_id);
  if (!Number.isInteger(area) || area <= 0) throw new ErroValidacao("Escolha a área");
  const nome = texto(d.nome, 200);
  if (!nome) throw new ErroValidacao("O objetivo precisa de um nome");
  const tipo = String(d.tipo ?? "funcionalidade");
  if (!["funcionalidade", "melhoria", "correcao"].includes(tipo)) throw new ErroValidacao("Tipo inválido");
  const prioridade = String(d.prioridade ?? "P2");
  if (!["P1", "P2", "P3"].includes(prioridade)) throw new ErroValidacao("Prioridade inválida");
  const marcacao = d.marcacao ? String(d.marcacao) : null;
  if (marcacao && !["adiado", "a_confirmar", "a_rever", "cancelado"].includes(marcacao)) {
    throw new ErroValidacao("Marcação inválida");
  }
  const v = {
    area_id: area,
    nome,
    tipo,
    prioridade,
    responsavel: texto(d.responsavel, 100),
    inicio_previsto: data(d.inicio_previsto, "Início previsto"),
    prazo: data(d.prazo, "Prazo"),
    iniciado_em: data(d.iniciado_em, "Iniciado em"),
    entregue_em: data(d.entregue_em, "Entregue em"),
    descricao_publica: texto(d.descricao_publica, 500),
    beneficios: beneficios(d.beneficios),
    publico: d.publico === true || d.publico === "on" || d.publico === "true",
    marcacao,
    nota_interna: texto(d.nota_interna, 2000),
  };
  if (v.inicio_previsto && v.prazo && v.prazo < v.inicio_previsto) {
    throw new ErroValidacao("O prazo não pode ser antes do início previsto");
  }
  const sql = db();
  if (id) {
    await sql`UPDATE objetivos SET ${sql(v)} WHERE id = ${id}`;
    return id;
  }
  const [row] = await sql<{ id: number }[]>`INSERT INTO objetivos ${sql(v)} RETURNING id`;
  return row.id;
}

/** Até 3 benefícios, um por linha, sem marcadores digitados (•, -, *). */
function beneficios(v: unknown) {
  const linhas = String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[•\-*·]\s*/, "").trim())
    .filter(Boolean);
  if (linhas.length > 3) throw new ErroValidacao("Use no máximo 3 benefícios, um por linha");
  if (linhas.some((l) => l.length > 100)) throw new ErroValidacao("Cada benefício pode ter até 100 caracteres");
  return linhas.length ? linhas.join("\n") : null;
}

export async function marcarEntregue(id: number, entregue: boolean) {
  await db()`UPDATE objetivos SET entregue_em = ${entregue ? db()`hoje()` : null} WHERE id = ${id}`;
}

/** Apaga o objetivo e todas as tarefas dele (cascade). */
export async function excluirObjetivo(id: number) {
  await db()`DELETE FROM objetivos WHERE id = ${id}`;
}

// ---------- usuários ----------

export type Papel = "admin" | "diretor";
export type UsuarioLista = { id: number; nome: string; email: string; papel: Papel; criado_em: string };

export async function listarUsuarios() {
  return db()<UsuarioLista[]>`SELECT id, nome, email, papel, criado_em::text FROM usuarios ORDER BY papel, nome`;
}

function papelValido(p: unknown): Papel {
  if (p !== "admin" && p !== "diretor") throw new ErroValidacao("Perfil inválido");
  return p;
}

export async function criarUsuario(d: Record<string, unknown>) {
  const nome = texto(d.nome, 100);
  const email = String(d.email ?? "").trim().toLowerCase();
  const senha = String(d.senha ?? "");
  const papel = papelValido(d.papel);
  if (!nome) throw new ErroValidacao("Informe o nome");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErroValidacao("E-mail inválido");
  if (senha.length < 8) throw new ErroValidacao("A senha precisa ter 8 caracteres ou mais");
  const [existe] = await db()`SELECT 1 FROM usuarios WHERE email = ${email}`;
  if (existe) throw new ErroValidacao("Já existe um usuário com esse e-mail");
  await db()`INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (${nome}, ${email}, ${hashSenha(senha)}, ${papel})`;
}

/** Muda perfil e, se vier preenchida, a senha. Não deixa o sistema sem nenhum admin. */
export async function atualizarUsuario(id: number, d: Record<string, unknown>) {
  const papel = papelValido(d.papel);
  const senha = String(d.senha ?? "");
  if (senha && senha.length < 8) throw new ErroValidacao("A senha precisa ter 8 caracteres ou mais");
  const sql = db();
  await sql.begin(async (tx) => {
    await tx`UPDATE usuarios SET papel = ${papel} WHERE id = ${id}`;
    if (senha) await tx`UPDATE usuarios SET senha_hash = ${hashSenha(senha)} WHERE id = ${id}`;
    const [{ n }] = await tx<{ n: number }[]>`SELECT count(*)::int AS n FROM usuarios WHERE papel = 'admin'`;
    if (n === 0) throw new ErroValidacao("O sistema precisa de pelo menos um admin");
  });
}

export async function excluirUsuario(id: number, quemPede: number) {
  if (id === quemPede) throw new ErroValidacao("Você não pode excluir o próprio usuário");
  const sql = db();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM usuarios WHERE id = ${id}`;
    const [{ n }] = await tx<{ n: number }[]>`SELECT count(*)::int AS n FROM usuarios WHERE papel = 'admin'`;
    if (n === 0) throw new ErroValidacao("O sistema precisa de pelo menos um admin");
  });
}

// ---------- áreas ----------

function dadosArea(d: Record<string, unknown>) {
  const nome = texto(d.nome, 80);
  if (!nome) throw new ErroValidacao("A área precisa de um nome");
  const ordem = Number(d.ordem ?? 0);
  if (!Number.isInteger(ordem) || ordem < 0 || ordem > 999) throw new ErroValidacao("Ordem deve ser um número de 0 a 999");
  return { nome, ordem, icone: texto(d.icone, 60) };
}

async function nomeLivre(nome: string, id: number | null) {
  const [r] = await db()`SELECT 1 FROM areas WHERE lower(nome) = lower(${nome}) AND id <> ${id ?? 0}`;
  if (r) throw new ErroValidacao(`Já existe uma área chamada ${nome}`);
}

export async function criarArea(d: Record<string, unknown>) {
  const v = dadosArea(d);
  await nomeLivre(v.nome, null);
  const sql = db();
  await sql`INSERT INTO areas ${sql(v)}`;
}

export async function atualizarArea(id: number, d: Record<string, unknown>) {
  const v = dadosArea(d);
  await nomeLivre(v.nome, id);
  const sql = db();
  await sql`UPDATE areas SET ${sql(v)} WHERE id = ${id}`;
}

/** Só apaga área vazia; objetivos precisam ser movidos ou excluídos antes. */
export async function excluirArea(id: number) {
  const [{ n }] = await db()<{ n: number }[]>`SELECT count(*)::int AS n FROM objetivos WHERE area_id = ${id}`;
  if (n > 0) throw new ErroValidacao(`A área ainda tem ${n} objetivo(s). Mova ou exclua os objetivos antes.`);
  await db()`DELETE FROM areas WHERE id = ${id}`;
}

// ---------- saúde e resumo ----------

export type Saude = {
  objetivos: number;
  em_dia: number;
  em_risco: number;
  atrasados: number;
  atrasados_p1: number;
  tarefas: number;
  tarefas_concluidas: number;
  tarefas_atrasadas: number;
  pct: number;
  pct_esperado: number | null;
  pct_real_com_prazo: number | null;
  cor: "verde" | "amarelo" | "vermelho";
};

export async function buscarSaude() {
  const [s] = await db()<Saude[]>`SELECT * FROM v_saude`;
  return s;
}

export type ItemResumo = { titulo: string; objetivo_nome: string; data?: string | null };

/** Dados do resumo: o que está sendo feito, em testes e o que terminou desde `desde`. */
export async function resumoRoadmap(desde: string) {
  const sql = db();
  const [saude, fazendo, validacao, concluidas, entregues, atrasados] = await Promise.all([
    buscarSaude(),
    sql<{ objetivo_nome: string; pct: number; tarefas: number }[]>`
      SELECT o.nome AS objetivo_nome, o.pct, count(*)::integer AS tarefas
      FROM tarefas t JOIN v_objetivos o ON o.id = t.objetivo_id
      WHERE t.status = 'fazendo'
      GROUP BY o.id, o.nome, o.pct, o.prioridade
      ORDER BY o.prioridade, o.nome`,
    sql<ItemResumo[]>`
      SELECT t.titulo, o.nome AS objetivo_nome
      FROM tarefas t JOIN objetivos o ON o.id = t.objetivo_id
      WHERE t.status = 'em_validacao'
      ORDER BY o.nome, t.titulo`,
    sql<ItemResumo[]>`
      SELECT t.titulo, o.nome AS objetivo_nome, t.concluida_em AS data
      FROM tarefas t JOIN objetivos o ON o.id = t.objetivo_id
      WHERE t.status = 'concluida' AND t.concluida_em > ${desde}::date
      ORDER BY t.concluida_em DESC, o.nome`,
    sql<{ nome: string; entregue_em: string }[]>`
      SELECT nome, entregue_em FROM v_objetivos
      WHERE status = 'entregue' AND entregue_em > ${desde}::date
      ORDER BY entregue_em DESC`,
    sql<{ nome: string }[]>`SELECT nome FROM v_objetivos WHERE status = 'atrasado' ORDER BY prioridade, nome`,
  ]);
  return { desde, saude, fazendo, validacao, concluidas, entregues, atrasados };
}
export type Resumo = Awaited<ReturnType<typeof resumoRoadmap>>;
