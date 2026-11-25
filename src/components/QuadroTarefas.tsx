"use client";
// Quadro de tarefas: arrastar o cartão entre colunas ou trocar no menu muda o status na hora.
// O banco continua sendo a fonte da verdade: depois de salvar, a tela recarrega os dados.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Tarefa } from "@/lib/dados";
import { SITUACAO_TAREFA, STATUS_TAREFA, dataBR, letraPeso, nomeStatusTarefa } from "@/lib/rotulos";
import { acaoMoverTarefa } from "@/app/app/actions";

export function QuadroTarefas({ tarefas, colunas, voltar }: { tarefas: Tarefa[]; colunas: readonly string[]; voltar: string }) {
  const router = useRouter();
  const [lista, setLista] = useState(tarefas);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  useEffect(() => setLista(tarefas), [tarefas]);

  function mover(id: number, status: string) {
    const antes = lista.find((t) => t.id === id);
    if (!antes || antes.status === status) return;
    setErro(null);
    setLista((l) => l.map((t) => (t.id === id ? { ...t, status: status as Tarefa["status"] } : t)));
    iniciar(async () => {
      const r = await acaoMoverTarefa(id, status);
      if (r.erro) {
        setLista((l) => l.map((t) => (t.id === id ? antes : t)));
        setErro(`“${antes.titulo}”: ${r.erro}`);
      }
      router.refresh();
    });
  }

  return (
    <>
      {erro && (
        <div className="erro" role="alert">
          {erro}{" "}
          <button type="button" className="link" onClick={() => setErro(null)}>
            Fechar
          </button>
        </div>
      )}
      <div className="board" style={{ ["--cols" as string]: colunas.length }}>
        {colunas.map((col) => {
          const doStatus = lista.filter((t) => t.status === col);
          return (
            <section
              key={col}
              className={`col${alvo === col ? " alvo" : ""}`}
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
                <h3>{nomeStatusTarefa[col as Tarefa["status"]]}</h3>
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
  return (
    <article
      className={`card arrastavel${arrastando ? " arrastando" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        e.dataTransfer.effectAllowed = "move";
        onArrastar(true);
      }}
      onDragEnd={() => onArrastar(false)}
    >
      <span className="area">{t.objetivo_nome}</span>
      <h4>
        <Link href={href} draggable={false}>
          {t.titulo}
        </Link>
      </h4>
      <div className="badges">
        {t.situacao !== "em_dia" && t.situacao !== "concluida" && <span className={`badge ${sit.cor}`}>{sit.nome}</span>}
        {t.sem_prazo && <span className="badge warn">Sem prazo</span>}
        <span className="badge mute" title="Peso">
          {letraPeso[t.peso]}
        </span>
        {t.prazo && <span className="small muted">prazo {dataBR(t.prazo)}</span>}
        {t.status === "concluida" && t.concluida_em && <span className="small muted">concluída {dataBR(t.concluida_em)}</span>}
      </div>
      {t.responsavel && <span className="small muted">{t.responsavel}</span>}
      <select value={t.status} aria-label="Mudar status" onChange={(e) => onMudar(e.currentTarget.value)}>
        {STATUS_TAREFA.map(([k, nome]) => (
          <option key={k} value={k}>
            {nome}
          </option>
        ))}
      </select>
    </article>
  );
}
