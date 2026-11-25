// Visão dos diretores: status por objetivo, sem tarefas. Serve de pauta para a reunião de sexta.
import Link from "next/link";
import { buscarSaude, listarObjetivos, novidadesDaSemana, resumoRoadmap, type Objetivo, type Saude } from "@/lib/dados";
import { exigirUsuario } from "@/lib/auth";
import { COR_SAUDE, STATUS_OBJETIVO, dataBR, diasUteisAtras, hojeSP, somarDias } from "@/lib/rotulos";
import { textoWhatsApp } from "@/lib/resumo";
import { BotaoCopiar } from "@/components/BotaoCopiar";

const ORDEM_STATUS: Record<string, number> = { atrasado: 0, em_risco: 1, em_dia: 2 };

export default async function Diretores() {
  const hoje = hojeSP();
  const [objetivos, novidades, eu, saude, resumo] = await Promise.all([
    listarObjetivos(),
    novidadesDaSemana(),
    exigirUsuario(),
    buscarSaude(),
    resumoRoadmap(diasUteisAtras(hoje, 3)),
  ]);
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

      <PainelSaude s={saude} entreguesMes={entreguesMes} />

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

      <section className="summary semana">
        <h2>Na última semana</h2>
        {novidades.objetivos.length === 0 && novidades.tarefas.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Nada concluído nos últimos 7 dias.
          </p>
        )}
        {novidades.objetivos.length > 0 && (
          <ul className="checks entregas">
            {novidades.objetivos.map((o) => (
              <li key={o.nome}>
                <Check />
                <div>
                  <b>{o.nome}</b> <span className="selo-entregue">Entregue</span>
                  <div className="small muted">{dataBR(o.entregue_em)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {novidades.tarefas.length > 0 && (
          <>
            <h3 className="small muted" style={{ margin: "14px 0 6px" }}>
              {novidades.tarefas.length} {novidades.tarefas.length === 1 ? "tarefa concluída" : "tarefas concluídas"}
            </h3>
            <ul className="checks">
              {novidades.tarefas.map((t, i) => (
                <li key={i}>
                  <Check />
                  <div>
                    {t.titulo}
                    <div className="small muted">
                      {t.objetivo_nome} · {dataBR(t.concluida_em)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {admin && (
        <section className="summary">
          <div className="cabecalho" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Resumo para o WhatsApp</h2>
            <BotaoCopiar texto={textoWhatsApp(resumo, hoje)} />
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>
            Concluídos nos últimos 3 dias úteis (desde {dataBR(somarDias(resumo.desde, 1))}). É a mensagem que irá para o grupo dos diretores.
          </p>
          <pre className="whats">{textoWhatsApp(resumo, hoje)}</pre>
        </section>
      )}
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

function Check() {
  return (
    <svg className="check-ico" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" />
      <path d="M5.5 10.3l3 3 6-6.3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Saúde geral: cor, % feito x esperado, tarefas e a régua dos objetivos por situação. */
function PainelSaude({ s, entreguesMes }: { s: Saude; entreguesMes: number }) {
  const cor = COR_SAUDE[s.cor];
  const pctObj = (n: number) => (s.objetivos ? Math.round((100 * n) / s.objetivos) : 0);
  const segmentos = [
    ["ok", s.em_dia, "Em dia"],
    ["warn", s.em_risco, "Em risco"],
    ["late", s.atrasados, "Atrasados"],
  ] as const;
  return (
    <section className={`summary saude saude-${s.cor}`} aria-label="Saúde do roadmap">
      <div className="saude-topo">
        <div className="saude-selo">
          <span className="saude-luz" aria-hidden="true" />
          <div>
            <div className="saude-nome">{cor.nome}</div>
            <div className="small muted">{cor.frase}</div>
          </div>
        </div>
        <div className="saude-numeros">
          <div>
            <div className="n">{s.pct}%</div>
            <div className="l">
              feito · {s.tarefas_concluidas} de {s.tarefas} tarefas
            </div>
          </div>
          {s.pct_esperado != null && s.pct_real_com_prazo != null && (
            <div title="Só objetivos com início previsto e prazo: quanto já foi feito e quanto o calendário pede até hoje">
              <div className={`n${s.pct_real_com_prazo < s.pct_esperado ? " txt-late" : ""}`}>
                {s.pct_real_com_prazo}% <small className="muted">/ {s.pct_esperado}%</small>
              </div>
              <div className="l">no ritmo (feito / esperado)</div>
            </div>
          )}
          <div>
            <div className={`n${s.tarefas_atrasadas ? " txt-late" : ""}`}>{s.tarefas_atrasadas}</div>
            <div className="l">tarefas atrasadas</div>
          </div>
        </div>
      </div>
      <div className="barra alta" title={`${s.pct}% das tarefas feito`}>
        <span style={{ width: `${s.pct}%` }} />
      </div>

      <h3 className="small muted" style={{ margin: "18px 0 6px" }}>
        {s.objetivos} objetivos em acompanhamento
      </h3>
      <div className="bar" role="img" aria-label={segmentos.map(([, n, nome]) => `${n} ${nome.toLowerCase()}`).join(", ")}>
        {segmentos.map(([k, n]) => (n ? <span key={k} className={`b-${k}`} style={{ flex: n }} /> : null))}
      </div>
      <div className="tiles" style={{ marginTop: 12 }}>
        {segmentos.map(([k, n, nome]) => (
          <div key={k} className={`tile ${k}`}>
            <div className="n">
              {n} <small>{pctObj(n)}%</small>
            </div>
            <div className="l">{nome}</div>
          </div>
        ))}
        <div className="tile done">
          <div className="n">{entreguesMes}</div>
          <div className="l">Entregues no mês</div>
        </div>
      </div>
    </section>
  );
}
