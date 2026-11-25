// Texto curto para o grupo de diretores no WhatsApp. Puro (sem banco): recebe o resultado de resumoRoadmap().
import type { Resumo } from "./dados";
import { COR_SAUDE, dataBR, somarDias } from "./rotulos";

const MAX_ITENS = 5;

function lista(itens: string[]) {
  const mostra = itens.slice(0, MAX_ITENS).map((i) => `• ${i}`);
  if (itens.length > MAX_ITENS) mostra.push(`• … e mais ${itens.length - MAX_ITENS}`);
  return mostra.join("\n");
}

const curto = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Sprint da semana: segunda a sexta da semana de `hoje` (sábado e domingo ficam na semana que acabou). */
export function sprint(hoje: string): [string, string] {
  const dia = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const seg = somarDias(hoje, -((dia + 6) % 7));
  return [seg, somarDias(seg, 4)];
}

export function textoWhatsApp(r: Resumo, hoje: string, link?: string) {
  const s = r.saude;
  const cor = COR_SAUDE[s.cor];
  const partes: string[] = [];

  const [seg, sex] = sprint(hoje);
  partes.push(
    `🗺️ *ÚLTIMAS ATUALIZAÇÕES DO ROADMAP ady* · ${dataBR(hoje).slice(0, 5)}\nSprint do dia ${dataBR(seg).slice(0, 5)} a ${dataBR(sex).slice(0, 5)}`,
  );
  partes.push(
    `${cor.emoji} *${cor.frase}* · ${s.pct}% feito (${s.tarefas_concluidas} de ${s.tarefas} tarefas)`,
  );

  const prontos = [
    ...r.entregues.map((o) => `🎉 *${curto(o.nome)}* entregue`),
    ...r.concluidas.map((t) => `${curto(t.titulo, 50)} _(${curto(t.objetivo_nome, 32)})_`),
  ];
  partes.push(`✅ *Concluídos*\n${prontos.length ? lista(prontos) : "• Nada concluído no período"}`);

  if (r.fazendo.length) {
    partes.push(`🔨 *Em andamento*\n${lista(r.fazendo.map((f) => `${curto(f.objetivo_nome)} · ${f.pct}%`))}`);
  }
  if (r.validacao.length) {
    partes.push(`🧪 *Em testes*\n${lista(r.validacao.map((t) => `${curto(t.titulo, 50)} _(${curto(t.objetivo_nome, 32)})_`))}`);
  }
  if (r.atrasados.length) {
    partes.push(`⚠️ *Atrasados:* ${r.atrasados.slice(0, 3).map((o) => curto(o.nome, 40)).join(", ")}${r.atrasados.length > 3 ? ` e mais ${r.atrasados.length - 3}` : ""}`);
  }
  if (link) partes.push(`🔗 ${link}`);
  return partes.join("\n\n");
}
