"use client";
// Escolha do objetivo em dois passos: primeiro a área (poucas opções), depois só os objetivos dela.
import Link from "next/link";
import { useState } from "react";

export type OpcaoObjetivo = { id: number; nome: string; area_nome: string; area_ordem: number };
export type OpcaoArea = { id: number; nome: string; ordem: number };

export function EscolhaObjetivo({
  objetivos,
  inicial,
  nome = "objetivo_id",
  todasAreas = [],
}: {
  objetivos: OpcaoObjetivo[];
  inicial?: number;
  nome?: string;
  /** Todas as áreas, para aparecerem também as que ainda não têm objetivo. */
  todasAreas?: OpcaoArea[];
}) {
  const ordem = new Map<string, number>(objetivos.map((o) => [o.area_nome, o.area_ordem]));
  for (const a of todasAreas) ordem.set(a.nome, a.ordem);
  const areas = [...ordem.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "pt-BR")).map(([n]) => n);
  const idArea = (n: string) => todasAreas.find((a) => a.nome === n)?.id;
  const [area, setArea] = useState(objetivos.find((o) => o.id === inicial)?.area_nome ?? "");
  const [objetivo, setObjetivo] = useState(inicial ? String(inicial) : "");
  const daArea = objetivos.filter((o) => o.area_nome === area);

  return (
    <>
      <label>
        Área
        <select
          value={area}
          required
          onChange={(e) => {
            const a = e.currentTarget.value;
            setArea(a);
            const lista = objetivos.filter((o) => o.area_nome === a);
            // Área com um objetivo só: já escolhe.
            setObjetivo(lista.length === 1 ? String(lista[0].id) : "");
          }}
        >
          <option value="" disabled>
            Escolha a área…
          </option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a} ({objetivos.filter((o) => o.area_nome === a).length})
            </option>
          ))}
        </select>
      </label>
      <label>
        Objetivo
        <select name={nome} value={objetivo} required disabled={!area} onChange={(e) => setObjetivo(e.currentTarget.value)}>
          <option value="" disabled>
            {area ? "Escolha o objetivo…" : "Escolha a área antes"}
          </option>
          {daArea.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        {area && !daArea.length && (
          <span className="small muted">
            Esta área ainda não tem objetivos.{" "}
            <Link href={idArea(area) ? `/app/objetivos/novo?area=${idArea(area)}` : "/app/objetivos/novo"}>Criar o primeiro objetivo</Link>
          </span>
        )}
      </label>
    </>
  );
}
