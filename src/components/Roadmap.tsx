import Link from "next/link";
import { FASES, STATUS_OBJETIVO, nomeMarcacao } from "@/lib/rotulos";

export type ItemRoadmap = {
  id: number;
  nome: string;
  area_nome: string;
  area_ordem: number;
  descricao_publica: string | null;
  fase: string;
  // só na visão interna
  status?: string;
  marcacao?: string | null;
  nota_interna?: string | null;
  pct?: number;
  publico?: boolean;
};

function Selos({ i }: { i: ItemRoadmap }) {
  if (!i.status) return null;
  const s = STATUS_OBJETIVO[i.status];
  const mostrarStatus = i.status === "atrasado" || i.status === "em_risco" || i.status === "adiado";
  const selos = [];
  if (mostrarStatus) selos.push(<span key="s" className={`badge ${s.cor}`}>{s.nome}</span>);
  if (i.marcacao && i.marcacao !== "adiado") selos.push(<span key="m" className="badge warn">{nomeMarcacao[i.marcacao]}</span>);
  if (i.fase === "em_andamento" && typeof i.pct === "number") selos.push(<span key="p" className="badge mute">{i.pct}%</span>);
  if (i.publico === false) selos.push(<span key="pub" className="badge mute">Fora do público</span>);
  return selos.length ? <div className="badges">{selos}</div> : null;
}

function Cartao({ i, interno }: { i: ItemRoadmap; interno: boolean }) {
  return (
    <article className="card">
      <span className="area">{i.area_nome}</span>
      <h4>{interno ? <Link href={`/app/objetivos/${i.id}`}>{i.nome}</Link> : i.nome}</h4>
      {i.descricao_publica && <p>{i.descricao_publica}</p>}
      {interno && <Selos i={i} />}
      {interno && i.nota_interna && (
        <div className="note">
          <b>Interno</b> · {i.nota_interna}
        </div>
      )}
    </article>
  );
}

export function Resumo({ itens, interno }: { itens: ItemRoadmap[]; interno: boolean }) {
  const fases = FASES[interno ? "interna" : "publica"];
  const n = (k: string) => itens.filter((i) => i.fase === k).length;
  const atrasados = itens.filter((i) => i.status === "atrasado").length;
  const emRisco = itens.filter((i) => i.status === "em_risco").length;
  return (
    <section className="summary" aria-label="Resumo">
      <h2>
        {n("entregue")} de {itens.length} funcionalidades já estão no ady
      </h2>
      <div className="bar" role="img" aria-label="Proporção por situação">
        {fases.map((f) => (
          <span key={f.k} className={`b-${f.k}`} style={{ flex: n(f.k) }} title={`${n(f.k)}`} />
        ))}
      </div>
      <div className="tiles">
        {fases.map((f, idx) => (
          <div key={f.k} className={`tile ${["done", "ok", "mute"][idx]}`}>
            <div className="n">{n(f.k)}</div>
            <div className="l">{f.nome}</div>
          </div>
        ))}
        {interno && (
          <>
            <div className="tile late">
              <div className="n">{atrasados}</div>
              <div className="l">Atrasados</div>
            </div>
            <div className="tile warn">
              <div className="n">{emRisco}</div>
              <div className="l">Em risco</div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function QuadroPorFase({ itens, interno }: { itens: ItemRoadmap[]; interno: boolean }) {
  const fases = FASES[interno ? "interna" : "publica"];
  return (
    <div className="board">
      {fases.map((f) => {
        const lista = itens.filter((i) => i.fase === f.k);
        return (
          <section key={f.k} className={`col ${f.k}`} aria-label={f.nome}>
            <div className="col-head">
              <h3>
                <span className={`dot ${f.k}`} />
                {f.nome}
              </h3>
              <span className="count">{lista.length}</span>
              <span className="sub">{f.sub}</span>
            </div>
            {lista.map((i) => (
              <Cartao key={i.id} i={i} interno={interno} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function QuadroPorArea({ itens, interno }: { itens: ItemRoadmap[]; interno: boolean }) {
  const fases = FASES[interno ? "interna" : "publica"];
  const nomeFase = Object.fromEntries(fases.map((f) => [f.k, f.nome]));
  const areas = [...new Map(itens.map((i) => [i.area_nome, i.area_ordem])).entries()].sort((a, b) => a[1] - b[1]);
  return (
    <div className="areas">
      {areas.map(([area]) => (
        <section key={area} className="area-card">
          <h3>{area}</h3>
          {itens
            .filter((i) => i.area_nome === area)
            .map((i) => (
              <div key={i.id} className="row">
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span className={`dot ${i.fase}`} style={{ marginTop: 7 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {interno ? <Link href={`/app/objetivos/${i.id}`}>{i.nome}</Link> : i.nome}
                    </div>
                    {i.descricao_publica && <div className="muted small">{i.descricao_publica}</div>}
                  </div>
                  <span className="muted small" style={{ whiteSpace: "nowrap" }}>
                    {nomeFase[i.fase]}
                  </span>
                </div>
                {interno && <Selos i={i} />}
                {interno && i.nota_interna && (
                  <div className="note">
                    <b>Interno</b> · {i.nota_interna}
                  </div>
                )}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
