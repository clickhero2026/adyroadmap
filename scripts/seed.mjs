// Carga inicial. Só roda se o banco não tiver nenhuma área (não sobrescreve nada).
import postgres from "postgres";
import { AREAS, OBJETIVOS, TAREFAS } from "./seed-data.mjs";

// Tarefas da carga contam como escopo original (não como "tarefas novas").
const CRIADA_EM = "2026-11-23T12:00:00-03:00";

export async function seedSeVazio(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL não definida");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM areas`;
    if (n > 0) return false;
    await sql.begin(async (tx) => {
      const areaIds = [];
      for (const [i, nome] of AREAS.entries()) {
        const [a] = await tx`INSERT INTO areas (nome, ordem) VALUES (${nome}, ${i + 1}) RETURNING id`;
        areaIds.push(a.id);
      }
      for (const { area, ...o } of OBJETIVOS) {
        const [row] = await tx`INSERT INTO objetivos ${tx({ ...o, area_id: areaIds[area] })} RETURNING id`;
        for (const t of TAREFAS[o.nome] ?? []) {
          await tx`INSERT INTO tarefas ${tx({ ...t, objetivo_id: row.id, criada_em: CRIADA_EM })}`;
        }
      }
    });
    return true;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log((await seedSeVazio()) ? "Carga inicial feita." : "Banco já tem dados; nada foi alterado.");
}
