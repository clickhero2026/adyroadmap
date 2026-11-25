// Visão do dev: quadro de tarefas por status, com filtros e criação rápida.
import { exigirAdmin } from "@/lib/auth";
import Link from "next/link";
import { listarObjetivos, listarTarefas, type Tarefa } from "@/lib/dados";
import { hojeSP, somarDias } from "@/lib/rotulos";
import { QuadroTarefas } from "@/components/QuadroTarefas";
import { EscolhaObjetivo } from "@/components/EscolhaObjetivo";
import { acaoCriarTarefa } from "../actions";

const COLUNAS = ["a_fazer", "fazendo", "em_validacao", "bloqueada", "concluida"] as const;

const FILTROS = {
  todas: { nome: "Todas", f: (_: Tarefa) => true },
  atrasadas: { nome: "Atrasadas", f: (t: Tarefa) => t.situacao === "atrasada" },
  risco: { nome: "Em risco", f: (t: Tarefa) => t.situacao === "em_risco" },
  semana: { nome: "Vencem em 7 dias", f: (t: Tarefa, hoje = hojeSP()) => !!t.prazo && t.prazo >= hoje && t.prazo <= somarDias(hoje, 7) && !["concluida", "cancelada"].includes(t.status) },
  bloqueadas: { nome: "Bloqueadas", f: (t: Tarefa) => t.status === "bloqueada" },
  sem_prazo: { nome: "Sem prazo", f: (t: Tarefa) => t.sem_prazo },
} as const;
type ChaveFiltro = keyof typeof FILTROS;

export default async function Tarefas({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; o?: string; erro?: string }>;
}) {
  const eu = await exigirAdmin();
  const sp = await searchParams;
  const filtro: ChaveFiltro = sp.f && sp.f in FILTROS ? (sp.f as ChaveFiltro) : "todas";
  const objetivoId = Number(sp.o) || undefined;
  const [todas, objetivos] = await Promise.all([listarTarefas({ objetivoId }), listarObjetivos()]);
  const hoje = hojeSP();
  const limiteConcluidas = somarDias(hoje, -14);
  const visiveis = todas.filter(
    (t) =>
      t.status !== "cancelada" &&
      FILTROS[filtro].f(t) &&
      (t.status !== "concluida" || (t.concluida_em ?? "") >= limiteConcluidas),
  );
  const abertas = todas.filter((t) => !["concluida", "cancelada"].includes(t.status));
  const conta = (k: ChaveFiltro) => abertas.filter((t) => FILTROS[k].f(t)).length;
  const objetivosAbertos = objetivos.filter((o) => !["entregue", "cancelado"].includes(o.status));
  const qs = (f: string) => {
    const p = new URLSearchParams();
    if (f !== "todas") p.set("f", f);
    if (objetivoId) p.set("o", String(objetivoId));
    const s = p.toString();
    return s ? `/app/tarefas?${s}` : "/app/tarefas";
  };
  const voltarPara = qs(filtro);
  const objetivoAtual = objetivos.find((o) => o.id === objetivoId);

  return (
    <div className="wrap">
      <header className="cabecalho">
        <div>
          <h1>Tarefas</h1>
          <p>
            {objetivoAtual ? (
              <>
                Só do objetivo <Link href={`/app/objetivos/${objetivoAtual.id}`}>{objetivoAtual.nome}</Link> ·{" "}
                <Link href={filtro === "todas" ? "/app/tarefas" : `/app/tarefas?f=${filtro}`}>ver todas</Link>
              </>
            ) : (
              "Toda tarefa pertence a um objetivo. Concluídas somem do quadro depois de 14 dias."
            )}
          </p>
        </div>
      </header>

      {sp.erro && <div className="erro">{sp.erro}</div>}

      <section className="summary">
        <div className="tiles">
          <Link className="tile late" href={qs("atrasadas")}>
            <div className="n">{conta("atrasadas")}</div>
            <div className="l">Atrasadas</div>
          </Link>
          <Link className="tile warn" href={qs("risco")}>
            <div className="n">{conta("risco")}</div>
            <div className="l">Em risco</div>
          </Link>
          <Link className="tile ok" href={qs("semana")}>
            <div className="n">{conta("semana")}</div>
            <div className="l">Vencem em 7 dias</div>
          </Link>
          <Link className="tile mute" href={qs("sem_prazo")}>
            <div className="n">{conta("sem_prazo")}</div>
            <div className="l">Sem prazo</div>
          </Link>
          <div className="tile done">
            <div className="n">{abertas.length}</div>
            <div className="l">Abertas no total</div>
          </div>
        </div>
      </section>

      <details className="form">
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Nova tarefa</summary>
        <form action={acaoCriarTarefa} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input type="hidden" name="_voltar" value={voltarPara} />
          <label>
            Título
            <input name="titulo" required maxLength={300} placeholder="Verbo + o quê" />
          </label>
          <div className="linha">
            <EscolhaObjetivo objetivos={objetivosAbertos} inicial={objetivoId} />
            <label>
              Peso
              <select name="peso" defaultValue="2">
                <option value="1">P (pequena)</option>
                <option value="2">M (média)</option>
                <option value="3">G (grande)</option>
              </select>
            </label>
            <label>
              Prazo
              <input name="prazo" type="date" />
            </label>
            <label>
              Responsável
              <input name="responsavel" defaultValue={eu.nome.split(" ")[0]} maxLength={100} />
            </label>
          </div>
          <div className="acoes">
            <button className="primario" type="submit">
              Criar tarefa
            </button>
          </div>
        </form>
      </details>

      <nav className="filtros" aria-label="Filtros">
        {(Object.keys(FILTROS) as ChaveFiltro[]).map((k) => (
          <Link key={k} href={qs(k)} aria-current={filtro === k}>
            {FILTROS[k].nome}
          </Link>
        ))}
      </nav>

      <QuadroTarefas tarefas={visiveis} colunas={COLUNAS} voltar={voltarPara} />
    </div>
  );
}
