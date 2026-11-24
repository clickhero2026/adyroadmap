import Link from "next/link";
import { listarAreas } from "@/lib/dados";
import { FormObjetivo } from "@/components/FormObjetivo";

export default async function NovoObjetivo({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const areas = await listarAreas();
  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <p className="small">
        <Link href="/app/roadmap">← Roadmap interno</Link>
      </p>
      <h1>Novo objetivo</h1>
      {erro && <div className="erro">{erro}</div>}
      <FormObjetivo areas={areas} />
    </div>
  );
}
