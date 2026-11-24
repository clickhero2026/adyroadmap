import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarObjetivo, listarAreas, listarTarefas } from "@/lib/dados";
import { FASES, SITUACAO_TAREFA, STATUS_OBJETIVO, dataBR, letraPeso, nomeStatusTarefa } from "@/lib/rotulos";
import { FormObjetivo } from "@/components/FormObjetivo";
import { acaoCriarTarefa, acaoMarcarEntregue } from "../../actions";

export default async function VerObjetivo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const id = Number((await params).id);
  const { erro } = await searchParams;
  const [o, areas, tarefas] = await Promise.all([buscarObjetivo(id), listarAreas(), listarTarefas({ objetivoId: id })]);
  if (!o) notFound();
  const s = STATUS_OBJETIVO[o.status];
  const fase = FASES.interna.find((f) => f.k === o.fase)?.nome;
  const aqui = `/app/objetivos/${o.id}`;

  return (
    <div className="wrap" style={{ maxWidth: 1000 }}>
      <p className="small">
        <Link href="/app/roadmap">← Roadmap interno</Link> · {o.area_nome}
      </p>
      <header className="cabecalho">
        <div>
          <h1>{o.nome}</h1>
          <div className="badges" style={{ marginTop: 8 }}>
            <span className={`badge ${s.cor}`}>{s.nome}</span>
            <span className="badge mute">{fase}</span>
            <span className="small muted">
              {o.pct}% feito
              {o.pct_esperado != null && ` · esperado ${o.pct_esperado}%`}
              {o.prazo && ` · prazo ${dataBR(o.prazo)}`}
              {o.tarefas_novas > 0 && ` · +${o.tarefas_novas} tarefas desde o início`}
            </span>
          </div>
        </div>
        <form action={acaoMarcarEntregue}>
          <input type="hidden" name="id" value={o.id} />
          {o.entregue_em ? (
            <button type="submit" name="entregue" value="0">
              Desfazer entrega ({dataBR(o.entregue_em)})
            </button>
          ) : (
            <button
              type="submit"
              name="entregue"
              value="1"
              className="primario"
              disabled={o.tarefas_abertas > 0}
              title={o.tarefas_abertas > 0 ? "Ainda há tarefas abertas" : "Marcar como entregue hoje"}
            >
              Marcar como entregue
            </button>
          )}
        </form>
      </header>

      {erro && <div className="erro">{erro}</div>}

      <section className="summary">
        <div className="barra" style={{ height: 10 }}>
          <span style={{ width: `${o.pct}%` }} />
          {o.pct_esperado != null && <i style={{ left: `calc(${o.pct_esperado}% - 1px)` }} />}
        </div>
        <h2>
          Tarefas <span className="muted small">({o.tarefas_concluidas} de {o.tarefas_total} concluídas)</span>
        </h2>
        <div className="lista" style={{ border: 0 }}>
          {tarefas.map((t) => {
            const sit = SITUACAO_TAREFA[t.situacao];
            return (
              <div key={t.id} className="item" style={{ padding: "8px 0" }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/app/tarefas/${t.id}`}>{t.titulo}</Link>
                  <div className="small muted">
                    {nomeStatusTarefa[t.status]} · peso {letraPeso[t.peso]}
                    {t.responsavel && ` · ${t.responsavel}`}
                  </div>
                </div>
                <div className="small so-largo">{t.prazo ? dataBR(t.prazo) : <span className="muted">sem prazo</span>}</div>
                <div className="so-largo" />
                <div>
                  <span className={`badge ${sit.cor}`}>{sit.nome}</span>
                </div>
              </div>
            );
          })}
          {!tarefas.length && <p className="muted">Nenhuma tarefa ainda. O % fica em 0 até a primeira ser concluída.</p>}
        </div>
        <form action={acaoCriarTarefa} className="acoes">
          <input type="hidden" name="objetivo_id" value={o.id} />
          <input type="hidden" name="_voltar" value={aqui} />
          <input name="titulo" placeholder="Nova tarefa: verbo + o quê" required maxLength={300} style={{ flex: "2 1 260px", width: "auto" }} />
          <select name="peso" defaultValue="2" style={{ width: "auto" }} aria-label="Peso">
            <option value="1">P</option>
            <option value="2">M</option>
            <option value="3">G</option>
          </select>
          <input name="prazo" type="date" style={{ width: "auto" }} aria-label="Prazo" />
          <button type="submit">Adicionar</button>
        </form>
      </section>

      <h2>Dados do objetivo</h2>
      <FormObjetivo o={o} areas={areas} />
    </div>
  );
}
