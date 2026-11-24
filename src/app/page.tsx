// Roadmap público (vitrine de roadmap.useady.com.br). Sem login, sem atrasos, sem notas internas.
import Link from "next/link";
import { listarObjetivosPublicos } from "@/lib/dados";
import { QuadroPorArea, QuadroPorFase, Resumo } from "@/components/Roadmap";

export const dynamic = "force-dynamic";

export default async function RoadmapPublico({
  searchParams,
}: {
  searchParams: Promise<{ por?: string }>;
}) {
  const { por } = await searchParams;
  const itens = await listarObjetivosPublicos();
  const porArea = por === "area";
  return (
    <div className="wrap">
      <header className="cabecalho">
        <div>
          <h1>Roadmap do ady</h1>
          <p>Tudo o que o ady já faz e o que vem por aí.</p>
        </div>
        <div className="filtros" aria-label="Organização">
          <Link href="/" aria-current={!porArea}>
            Por situação
          </Link>
          <Link href="/?por=area" aria-current={porArea}>
            Por área
          </Link>
        </div>
      </header>
      <Resumo itens={itens} interno={false} />
      {porArea ? <QuadroPorArea itens={itens} interno={false} /> : <QuadroPorFase itens={itens} interno={false} />}
      <footer>
        Este roadmap mostra a direção do produto e pode mudar. Datas e ordem dependem do andamento do
        desenvolvimento.
      </footer>
    </div>
  );
}
