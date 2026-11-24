// Roadmap interno: mesmo quadro do público, com status calculado, marcações e notas internas.
import Link from "next/link";
import { listarObjetivos } from "@/lib/dados";
import { QuadroPorArea, QuadroPorFase, Resumo } from "@/components/Roadmap";

export default async function RoadmapInterno({ searchParams }: { searchParams: Promise<{ por?: string }> }) {
  const { por } = await searchParams;
  const porArea = por === "area";
  const itens = (await listarObjetivos()).filter((o) => o.status !== "cancelado");
  return (
    <div className="wrap">
      <header className="cabecalho">
        <div>
          <h1>Roadmap interno</h1>
          <p>Situação real de cada objetivo, com atrasos e notas internas. Não compartilhar com usuários.</p>
        </div>
        <div className="acoes">
          <div className="filtros">
            <Link href="/app/roadmap" aria-current={!porArea}>
              Por situação
            </Link>
            <Link href="/app/roadmap?por=area" aria-current={porArea}>
              Por área
            </Link>
          </div>
          <Link className="btn primario" href="/app/objetivos/novo">
            Novo objetivo
          </Link>
        </div>
      </header>
      <Resumo itens={itens} interno />
      {porArea ? <QuadroPorArea itens={itens} interno /> : <QuadroPorFase itens={itens} interno />}
    </div>
  );
}
