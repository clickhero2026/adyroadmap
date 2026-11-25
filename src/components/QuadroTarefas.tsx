"use client";
// Quadro de tarefas: arrastar o cartão entre colunas ou trocar no menu muda o status na hora.
// O banco continua sendo a fonte da verdade: depois de salvar, a tela recarrega os dados.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Tarefa } from "@/lib/dados";
import { SITUACAO_TAREFA, STATUS_TAREFA, dataBR, hojeSP, letraPeso, nomeStatusTarefa, somarDias } from "@/lib/rotulos";
import { acaoMoverTarefa } from "@/app/app/actions";

// Mesma regra do servidor (src/lib/dados.ts, conferirPrazo): a partir de "Fazendo" a tarefa precisa de prazo.
const PEDE_PRAZO = new Set(["fazendo", "em_validacao", "bloqueada"]);

type Pedido = { id: number; status: string; titulo: string };

export function QuadroTarefas({ tarefas, colunas, voltar }: { tarefas: Tarefa[]; colunas: readonly string[]; voltar: string }) {
  const router = useRouter();
  const [lista, setLista] = useState(tarefas);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [, iniciar] = useTransition();

  useEffect(() => setLista(tarefas), [tarefas]);

  function mover(id: number, status: string, prazo?: string) {
    const antes = lista.find((t) => t.id === id);
    if (!antes || antes.status === status) return;
    setErro(null);
    // Sem prazo: pergunta o prazo aqui mesmo em vez de recusar.
    if (PEDE_PRAZO.has(status) && !antes.prazo && !prazo) {
      setPedido({ id, status, titulo: antes.titulo });
      return;
    }
    setLista((l) =>
      l.map((t) =>
        t.id === id ? { ...t, status: status as Tarefa["status"], ...(prazo ? { prazo, sem_prazo: false } : {}) } : t,
      ),
    );
    iniciar(async () => {
      const r = await acaoMoverTarefa(id, status, prazo);
      if (r.erro) {
        setLista((l) => l.map((t) => (t.id === id ? antes : t)));
        setErro(`“${antes.titulo}”: ${r.erro}`);
      }
      router.refresh();
    });
  }

  return (
    <>
      {pedido && (
        <JanelaPrazo
          pedido={pedido}
          onCancelar={() => setPedido(null)}
          onConfirmar={(prazo) => {
            setPedido(null);
            mover(pedido.id, pedido.status, prazo);
          }}
        />
      )}
      {erro && (
        <div className="erro" role="alert">
          {erro}{" "}
          <button type="button" className="link" onClick={() => setErro(null)}>
            Fechar
          </button>
        </div>
      )}
      <div className="board quadro" style={{ ["--cols" as string]: colunas.length }}>
        {colunas.map((col) => {
          const doStatus = lista.filter((t) => t.status === col);
          return (
            <section
              key={col}
              className={`col st-${col}${alvo === col ? " alvo" : ""}`}
              aria-label={nomeStatusTarefa[col as Tarefa["status"]]}
              onDragOver={(e) => {
                if (arrastando === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (alvo !== col) setAlvo(col);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setAlvo(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = Number(e.dataTransfer.getData("text/plain"));
                setAlvo(null);
                setArrastando(null);
                if (id) mover(id, col);
              }}
            >
              <div className="col-head">
                <h3>
                  <span className="ponto" aria-hidden />
                  {nomeStatusTarefa[col as Tarefa["status"]]}
                </h3>
                <span className="count">{doStatus.length}</span>
              </div>
              {doStatus.map((t) => (
                <CartaoTarefa
                  key={t.id}
                  t={t}
                  href={`/app/tarefas/${t.id}?voltar=${encodeURIComponent(voltar)}`}
                  arrastando={arrastando === t.id}
                  onArrastar={(ativo) => setArrastando(ativo ? t.id : null)}
                  onMudar={(s) => mover(t.id, s)}
                />
              ))}
              {!doStatus.length && <div className="vazio-col">Arraste uma tarefa para cá</div>}
            </section>
          );
        })}
      </div>
    </>
  );
}

function CartaoTarefa({
  t,
  href,
  arrastando,
  onArrastar,
  onMudar,
}: {
  t: Tarefa;
  href: string;
  arrastando: boolean;
  onArrastar: (ativo: boolean) => void;
  onMudar: (status: string) => void;
}) {
  const sit = SITUACAO_TAREFA[t.situacao];
  const concluida = t.status === "concluida";
  const destaque = concluida ? "concluida" : t.situacao === "atrasada" || t.situacao === "em_risco" ? t.situacao : t.status;
  const faltam = t.prazo && !concluida ? diasAte(t.prazo) : null;
  return (
    <article
      className={`card tarefa sit-${destaque}${arrastando ? " arrastando" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        e.dataTransfer.effectAllowed = "move";
        onArrastar(true);
      }}
      onDragEnd={() => onArrastar(false)}
    >
      <div className="tarefa-topo">
        <span className="objetivo" title={t.objetivo_nome}>
          {t.objetivo_nome}
        </span>
        <span className={`peso p${t.peso}`} title={`Peso ${letraPeso[t.peso]}`}>
          {letraPeso[t.peso]}
        </span>
      </div>
      <h4>
        <Link href={href} draggable={false}>
          {t.titulo}
        </Link>
      </h4>
      {(t.situacao === "atrasada" || t.situacao === "em_risco" || t.sem_prazo) && !concluida && (
        <div className="badges">
          {(t.situacao === "atrasada" || t.situacao === "em_risco") && <span className={`badge forte ${sit.cor}`}>{sit.nome}</span>}
          {t.sem_prazo && <span className="badge forte warn">Sem prazo</span>}
        </div>
      )}
      <div className="tarefa-meta">
        {concluida && t.concluida_em ? (
          <span className="data done">✓ {dataBR(t.concluida_em)}</span>
        ) : t.prazo ? (
          <span className={`data ${sit.cor}`}>
            📅 {dataBR(t.prazo)}
            {faltam !== null && <b> · {faltam < 0 ? `${-faltam}d atrasada` : faltam === 0 ? "hoje" : faltam === 1 ? "amanhã" : `${faltam} dias`}</b>}
          </span>
        ) : (
          <span />
        )}
        {t.responsavel && (
          <span className="pessoa" title={t.responsavel}>
            <span className="avatar">{t.responsavel.trim().charAt(0).toUpperCase()}</span>
            {t.responsavel}
          </span>
        )}
      </div>
      <select className="mudar-status" value={t.status} aria-label="Mudar status" onChange={(e) => onMudar(e.currentTarget.value)}>
        {STATUS_TAREFA.map(([k, nome]) => (
          <option key={k} value={k}>
            {nome}
          </option>
        ))}
      </select>
    </article>
  );
}

/** Dias corridos de hoje (São Paulo) até a data, só para exibição. */
function diasAte(data: string) {
  const [a, b] = [hojeSP(), data.slice(0, 10)].map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)));
  return Math.round((b - a) / 86400000);
}

/** Janela que pede o prazo quando a tarefa sai de "A fazer" sem prazo definido. */
function JanelaPrazo({
  pedido,
  onCancelar,
  onConfirmar,
}: {
  pedido: Pedido;
  onCancelar: () => void;
  onConfirmar: (prazo: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const hoje = hojeSP();
  const [prazo, setPrazo] = useState(somarDias(hoje, 7));

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={ref} className="janela" onCancel={onCancelar} aria-labelledby="janela-prazo-titulo">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (prazo) onConfirmar(prazo);
        }}
      >
        <h3 id="janela-prazo-titulo">Qual o prazo desta tarefa?</h3>
        <p className="small muted">
          “{pedido.titulo}” vai para <b>{nomeStatusTarefa[pedido.status as Tarefa["status"]]}</b>. A partir daí toda tarefa
          precisa de prazo.
        </p>
        <label>
          Prazo
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.currentTarget.value)} required autoFocus />
        </label>
        <div className="atalhos">
          {[
            ["Amanhã", 1],
            ["3 dias", 3],
            ["1 semana", 7],
            ["2 semanas", 14],
          ].map(([nome, dias]) => (
            <button key={nome} type="button" className="chip" onClick={() => setPrazo(somarDias(hoje, dias as number))}>
              {nome}
            </button>
          ))}
        </div>
        <div className="acoes">
          <button type="submit" className="primario">
            Salvar prazo e mover
          </button>
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );
}
