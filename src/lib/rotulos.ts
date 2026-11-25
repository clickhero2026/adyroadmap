// Nomes e cores exibidos nas telas. Os valores vêm das views do banco.

export const STATUS_TAREFA = [
  ["a_fazer", "A fazer"],
  ["fazendo", "Fazendo"],
  ["em_validacao", "Em validação"],
  ["bloqueada", "Bloqueada"],
  ["concluida", "Concluída"],
  ["cancelada", "Cancelada"],
] as const;
export type StatusTarefa = (typeof STATUS_TAREFA)[number][0];
export const nomeStatusTarefa = Object.fromEntries(STATUS_TAREFA) as Record<StatusTarefa, string>;

export const SITUACAO_TAREFA: Record<string, { nome: string; cor: string }> = {
  em_dia: { nome: "Em dia", cor: "ok" },
  em_risco: { nome: "Em risco", cor: "warn" },
  atrasada: { nome: "Atrasada", cor: "late" },
  concluida: { nome: "Concluída", cor: "done" },
  cancelada: { nome: "Cancelada", cor: "mute" },
};

export const STATUS_OBJETIVO: Record<string, { nome: string; cor: string }> = {
  em_dia: { nome: "Em dia", cor: "ok" },
  em_risco: { nome: "Em risco", cor: "warn" },
  atrasado: { nome: "Atrasado", cor: "late" },
  entregue: { nome: "Entregue", cor: "done" },
  adiado: { nome: "Adiado", cor: "mute" },
  cancelado: { nome: "Cancelado", cor: "mute" },
};

export const FASES = {
  interna: [
    { k: "entregue", nome: "Entregue", sub: "Já está no produto" },
    { k: "em_andamento", nome: "Em andamento", sub: "Sendo construído ou validado" },
    { k: "previsto", nome: "Previsto", sub: "Ainda não começou" },
  ],
  publica: [
    { k: "entregue", nome: "Disponível agora", sub: "Você já pode usar" },
    { k: "em_andamento", nome: "Em construção", sub: "Estamos trabalhando nisso" },
    { k: "previsto", nome: "Em breve", sub: "No nosso plano" },
  ],
} as const;

export const MARCACOES = [
  ["adiado", "Adiado"],
  ["a_confirmar", "A confirmar"],
  ["a_rever", "A rever"],
  ["cancelado", "Cancelado"],
] as const;
export const nomeMarcacao = Object.fromEntries(MARCACOES) as Record<string, string>;

export const TIPOS = [
  ["funcionalidade", "Funcionalidade nova"],
  ["melhoria", "Melhoria"],
  ["correcao", "Correção ou dívida técnica"],
] as const;

export const PESOS = [
  [1, "P (pequena)"],
  [2, "M (média)"],
  [3, "G (grande)"],
] as const;
export const letraPeso: Record<number, string> = { 1: "P", 2: "M", 3: "G" };

export function dataBR(d: string | null | undefined) {
  if (!d) return "";
  const [a, m, dia] = d.slice(0, 10).split("-");
  return `${dia}/${m}/${a}`;
}

/** Data de hoje (AAAA-MM-DD) no fuso de São Paulo, igual à função hoje() do banco. */
export function hojeSP(base = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(base);
}

export function somarDias(d: string, n: number) {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Data de n dias úteis antes (seg a sex), em AAAA-MM-DD. */
export function diasUteisAtras(d: string, n: number) {
  let atual = d;
  let faltam = n;
  while (faltam > 0) {
    atual = somarDias(atual, -1);
    const dia = new Date(`${atual}T12:00:00Z`).getUTCDay();
    if (dia !== 0 && dia !== 6) faltam--;
  }
  return atual;
}

export const COR_SAUDE: Record<string, { nome: string; emoji: string; frase: string }> = {
  verde: { nome: "Saudável", emoji: "🟢", frase: "Roadmap em dia" },
  amarelo: { nome: "Atenção", emoji: "🟡", frase: "Roadmap pede atenção" },
  vermelho: { nome: "Crítico", emoji: "🔴", frase: "Roadmap com atrasos importantes" },
};
