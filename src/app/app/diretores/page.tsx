// Visão dos diretores: status por objetivo, sem tarefas. Serve de pauta para a reunião de sexta.
import Link from "next/link";
import { listarObjetivos, novidadesDaSemana, type Objetivo } from "@/lib/dados";
import { exigirUsuario } from "@/lib/auth";
import { STATUS_OBJETIVO, dataBR, hojeSP } from "@/lib/rotulos";

const ORDEM_STATUS: Record<string, number> = { atrasado: 0, em_risco: 1, em_dia: 2 };

export default async function Diretores() {
  const [objetivos, novidades, eu] = await Promise.all([listarObjetivos(), novidadesDaSemana(), exigirUsuario()]);
  const admin = eu.papel === "admin";
  const mes = hojeSP().slice(0, 7);
  // Em acompanhamento: começou ou tem prazo, e ainda não terminou.
  const ativos = objetivos
    .filter((o) => ["atrasado", "em_risco", "em_dia"].includes(o.status) && (o.fase === "em_andamento" || o.prazo))
    .sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));
  const conta = (s: string) => ativos.filter((o) => o.status === s).length;
  const entreguesMes = objetivos.filter((o) => o.status === "entregue" && (o.entregue_em ?? "").startsWith(mes)).length;
  const aguardandoValidacao = ativos.filter((o) => o.pct === 100);
  const semPrazo = ativos.filter((o) => !o.prazo);

  return (
    <div className="wrap">
      <header className="cabecalho">
        <div>
          <h1>Diretores</h1>
          <p>Objetivos em andamento ou com prazo. O % vem das tarefas concluídas, pesadas por tamanho.</p>
        </div>
      </header>

      <section className="summary">
        <div className="tiles">
          <div className="tile ok">
            <div className="n">{conta("em_dia")}</div>
            <div className="l">Em dia</div>
          </div>
          <div className="tile warn">
            <div className="n">{conta("em_risco")}</div>
            <div className="l">Em risco</div>
          </div>
          <div className="tile late">
            <div className="n">{conta("atrasado")}</div>
            <div className="l">Atrasados</div>
          </div>
          <div className="tile done">
            <div className="n">{entreguesMes}</div>
            <div className="l">Entregues no mês</div>
          </div>
        </div>
      </section>

      <div className="lista">
        {ativos.map((o) => (
          <LinhaObjetivo key={o.id} o={o} admin={admin} />
        ))}
        {!ativos.length && <div className="item muted">Nenhum objetivo em andamento.</div>}
      </div>

      {(aguardandoValidacao.length > 0 || semPrazo.length > 0) && (
        <section className="aviso">
          {aguardandoValidacao.length > 0 && (
            <div>
              <b>100% e aguardando validação:</b> {aguardandoValidacao.map((o) => o.nome).join(", ")}.
            </div>
          )}
          {semPrazo.length > 0 && (
            <div>
              <b>Em andamento sem prazo</b> (o status só vira &quot;atrasado&quot; com prazo):{" "}
              {semPrazo.map((o) => o.nome).join(", ")}.
            </div>
          )}
        </section>
      )}

      <section className="summary">
        <h2>Na última semana</h2>
        {novidades.objetivos.length === 0 && novidades.tarefas.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Nada concluído nos últimos 7 dias.
          </p>
        )}
        {novidades.objetivos.length > 0 && (
          <div>
            <b>Entregues:</b>
            <ul>
              {novidades.objetivos.map((o) => (
                <li key={o.nome}>
                  {o.nome} <span className="muted small">({dataBR(o.entregue_em)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {novidades.tarefas.length > 0 && (
          <div>
            <b>Tarefas concluídas:</b>
            <ul>
              {novidades.tarefas.map((t, i) => (
                <li key={i}>
                  {t.titulo} <span className="muted small">· {t.objetivo_nome} · {dataBR(t.concluida_em)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function LinhaObjetivo({ o, admin }: { o: Objetivo; admin: boolean }) {
  const s = STATUS_OBJETIVO[o.status];
  return (
    <div className="item">
      <div style={{ minWidth: 0 }}>
        {admin ? <Link href={`/app/objetivos/${o.id}`}>{o.nome}</Link> : <span style={{ fontWeight: 500 }}>{o.nome}</span>}
        <div className="small muted">
          {o.area_nome} · {o.prioridade}
          {o.tarefas_novas > 0 && ` · +${o.tarefas_novas} tarefas desde o início`}
        </div>
      </div>
      <div className="so-largo">
        <div className={`barra ${s.cor}`} title={`${o.pct}% feito${o.pct_esperado != null ? `, esperado ${o.pct_esperado}%` : ""}`}>
          <span style={{ width: `${o.pct}%` }} />
          {o.pct_esperado != null && <i style={{ left: `calc(${o.pct_esperado}% - 1px)` }} />}
        </div>
        <div className="small muted">
          {o.pct}%{o.pct_esperado != null && ` · esperado ${o.pct_esperado}%`}
        </div>
      </div>
      <div className="small so-largo">{o.prazo ? dataBR(o.prazo) : <span className="muted">sem prazo</span>}</div>
      <div>
        <span className={`badge ${s.cor}`}>{s.nome}</span>
      </div>
    </div>
  );
}
