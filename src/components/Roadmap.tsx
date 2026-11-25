import Link from "next/link";
import { FASES, STATUS_OBJETIVO, nomeMarcacao } from "@/lib/rotulos";
import { IconeArea } from "./Icones";

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

const ORDEM_FASES = ["entregue", "em_andamento", "previsto"] as const;

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function contar(itens: ItemRoadmap[]) {
  const c = { entregue: 0, em_andamento: 0, previsto: 0 } as Record<(typeof ORDEM_FASES)[number], number>;
  for (const i of itens) if (i.fase in c) c[i.fase as keyof typeof c]++;
  return c;
}

function areasDe(itens: ItemRoadmap[]) {
  return [...new Map(itens.map((i) => [i.area_nome, i.area_ordem])).entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([nome]) => nome);
}

// ---------- pedaços visuais ----------

/** Barra segmentada entregue / em andamento / previsto. */
function BarraFases({ itens, alta = false }: { itens: ItemRoadmap[]; alta?: boolean }) {
  const c = contar(itens);
  return (
    <div className={`bar${alta ? "" : " fina"}`} role="img" aria-label={`${c.entregue} entregues, ${c.em_andamento} em andamento, ${c.previsto} previstos`}>
      {ORDEM_FASES.map((k) => (c[k] ? <span key={k} className={`b-${k}`} style={{ flex: c[k] }} /> : null))}
    </div>
  );
}

function Selos({ i }: { i: ItemRoadmap }) {
  if (!i.status) return null;
  const s = STATUS_OBJETIVO[i.status];
  const mostrarStatus = i.status === "atrasado" || i.status === "em_risco" || i.status === "adiado";
  const selos = [];
  if (mostrarStatus) selos.push(<span key="s" className={`badge ${s.cor}`}>{s.nome}</span>);
  if (i.marcacao && i.marcacao !== "adiado") selos.push(<span key="m" className="badge warn">{nomeMarcacao[i.marcacao]}</span>);
  if (i.fase === "em_andamento" && typeof i.pct === "number") selos.push(<span key="p" className="badge mute">{i.pct}%</span>);
  if (i.publico === false) selos.push(<span key="pub" className="badge mute">Só interno</span>);
  return selos.length ? <div className="badges">{selos}</div> : null;
}

function Cartao({ i, interno }: { i: ItemRoadmap; interno: boolean }) {
  return (
    <article className={`card fase-${i.fase}`}>
      <span className="area">
        <IconeArea area={i.area_nome} size={15} />
        {i.area_nome}
      </span>
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

// ---------- blocos da página ----------

export function Resumo({ itens, interno }: { itens: ItemRoadmap[]; interno: boolean }) {
  const fases = FASES[interno ? "interna" : "publica"];
  const c = contar(itens);
  const atrasados = itens.filter((i) => i.status === "atrasado").length;
  const emRisco = itens.filter((i) => i.status === "em_risco").length;
  return (
    <section className="summary" aria-label="Resumo">
      <h2>
        {c.entregue} de {itens.length} funcionalidades já estão no ady
      </h2>
      <BarraFases itens={itens} alta />
      <div className="tiles">
        {fases.map((f) => (
          <div key={f.k} className={`tile fase-${f.k}`}>
            <div className="n">{c[f.k as keyof typeof c]}</div>
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

/** Uma ficha por área: ícone, quantas já estão disponíveis e a barra das fases. */
export function Panorama({ itens, interno }: { itens: ItemRoadmap[]; interno: boolean }) {
  const base = interno ? "/app/roadmap" : "/";
  return (
    <section aria-label="Panorama por área">
      <h2 className="secao">Por área</h2>
      <div className="panorama">
        {areasDe(itens).map((area) => {
          const lista = itens.filter((i) => i.area_nome === area);
          const c = contar(lista);
          return (
            <Link key={area} href={`${base}?por=area#${slug(area)}`} className="area-tile">
              <span className="area-icone">
                <IconeArea area={area} />
              </span>
              <span className="area-nome">{area}</span>
              <span className="area-conta">
                <b>{c.entregue}</b> de {lista.length} {interno ? "entregues" : "disponíveis"}
              </span>
              <BarraFases itens={lista} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function Legenda({ interno }: { interno: boolean }) {
  return (
    <div className="legenda" aria-hidden="true">
      {FASES[interno ? "interna" : "publica"].map((f) => (
        <span key={f.k}>
          <span className={`dot ${f.k}`} /> {f.nome}
        </span>
      ))}
    </div>
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
  return (
    <div className="areas">
      {areasDe(itens).map((area) => {
        const lista = itens.filter((i) => i.area_nome === area);
        const c = contar(lista);
        return (
          <section key={area} id={slug(area)} className="area-card">
            <div className="area-card-head">
              <span className="area-icone">
                <IconeArea area={area} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{area}</h3>
                <span className="small muted">
                  {c.entregue} de {lista.length} {interno ? "entregues" : "disponíveis"}
                </span>
              </div>
            </div>
            <BarraFases itens={lista} />
            {lista.map((i) => (
              <div key={i.id} className="row">
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span className={`dot ${i.fase}`} style={{ marginTop: 7 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {interno ? <Link href={`/app/objetivos/${i.id}`}>{i.nome}</Link> : i.nome}
                    </div>
                    {i.descricao_publica && <div className="muted small">{i.descricao_publica}</div>}
                  </div>
                  <span className={`pill fase-${i.fase}`}>{nomeFase[i.fase]}</span>
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
        );
      })}
    </div>
  );
}
