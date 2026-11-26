// Roadmap público (vitrine de roadmap.useady.com.br) no formato de "Novidades". Sem login, sem atrasos,
// sem notas internas e sem itens marcados como só internos (onboarding, planos, pagamentos etc.).
import { listarObjetivosPublicos } from "@/lib/dados";
import { Resumo } from "@/components/Roadmap";
import { Novidades } from "@/components/Novidades";

export const dynamic = "force-dynamic";

export default async function RoadmapPublico() {
  const itens = await listarObjetivosPublicos();
  return (
    <div className="wrap" style={{ maxWidth: 1080 }}>
      <header className="cabecalho">
        <div>
          <h1>Novidades do ady</h1>
          <p>O que já entregamos e o que vem por aí.</p>
        </div>
      </header>
      <Resumo itens={itens} interno={false} />
      <Novidades itens={itens} />
      <footer>
        Este roadmap mostra a direção do produto e pode mudar. Datas e ordem dependem do andamento do
        desenvolvimento.
      </footer>
    </div>
  );
}
