// Roadmap público no formato "Novidades": cartões limpos, etiqueta do tipo e 2 ou 3 benefícios diretos.
import type { ReactNode } from "react";
import { IconeArea } from "./Icones";

export type ItemNovidade = {
  id: number;
  nome: string;
  tipo: string;
  area_nome: string;
  area_icone?: string | null;
  descricao_publica: string | null;
  beneficios: string | null;
  fase: string;
  entregue_em: string | null;
};

const Brilho = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </svg>
);
const Subindo = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);
const Chave = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
  </svg>
);

const TAG: Record<string, { nome: string; classe: string; icone: ReactNode }> =
  {
    funcionalidade: { nome: "Novidade", classe: "novidade", icone: <Brilho /> },
    melhoria: { nome: "Melhoria", classe: "melhoria", icone: <Subindo /> },
    correcao: { nome: "Correção", classe: "correcao", icone: <Chave /> },
  };

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const mesDe = (d: string) => {
  const m = MESES[Number(d.slice(5, 7)) - 1];
  return `${m[0].toUpperCase()}${m.slice(1)} de ${d.slice(0, 4)}`;
};

export function Etiqueta({ tipo }: { tipo: string }) {
  const t = TAG[tipo] ?? TAG.funcionalidade;
  return (
    <span className={`etiqueta ${t.classe}`}>
      {t.icone}
      {t.nome}
    </span>
  );
}

/** Benefícios (um por linha) em tópicos; sem benefícios, mostra a descrição. */
export function Beneficios({
  beneficios,
  descricao,
}: {
  beneficios: string | null;
  descricao: string | null;
}) {
  const linhas = (beneficios ?? "").split("\n").filter(Boolean);
  if (linhas.length)
    return (
      <ul className="beneficios">
        {linhas.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    );
  return descricao ? <p className="nov-desc">{descricao}</p> : null;
}

function Cartao({ i }: { i: ItemNovidade }) {
  return (
    <article className={`nov-card fase-${i.fase}`}>
      <div className="nov-topo">
        <Etiqueta tipo={i.tipo} />
        <span className="nov-area">
          <IconeArea area={i.area_nome} icone={i.area_icone} size={13} />
          {i.area_nome}
        </span>
      </div>
      <h3>{i.nome}</h3>
      <Beneficios beneficios={i.beneficios} descricao={i.descricao_publica} />
    </article>
  );
}

function Grade({ itens }: { itens: ItemNovidade[] }) {
  return (
    <div className="nov-grade">
      {itens.map((i) => (
        <Cartao key={i.id} i={i} />
      ))}
    </div>
  );
}

export function Novidades({ itens }: { itens: ItemNovidade[] }) {
  const entregues = itens
    .filter((i) => i.fase === "entregue")
    .sort((a, b) => (b.entregue_em ?? "").localeCompare(a.entregue_em ?? ""));
  const construindo = itens.filter((i) => i.fase === "em_andamento");
  const breve = itens.filter((i) => i.fase === "previsto");

  // Entregues agrupados por mês, do mais recente para o mais antigo.
  const meses = new Map<string, ItemNovidade[]>();
  for (const i of entregues) {
    const k = i.entregue_em ? mesDe(i.entregue_em) : "Já disponível";
    meses.set(k, [...(meses.get(k) ?? []), i]);
  }

  return (
    <div className="novidades">
      {entregues.length > 0 && (
        <section>
          <h2 className="nov-secao">
            <span className="dot entregue" /> Já entregamos
          </h2>
          {[...meses.entries()].map(([mes, lista]) => (
            <div key={mes} className="nov-mes">
              <div className="nov-data">{mes}</div>
              <Grade itens={lista} />
            </div>
          ))}
        </section>
      )}
      {construindo.length > 0 && (
        <section>
          <h2 className="nov-secao">
            <span className="dot em_andamento" /> Estamos construindo
          </h2>
          <Grade itens={construindo} />
        </section>
      )}
      {breve.length > 0 && (
        <section>
          <h2 className="nov-secao">
            <span className="dot previsto" /> Em breve
          </h2>
          <Grade itens={breve} />
        </section>
      )}
    </div>
  );
}
