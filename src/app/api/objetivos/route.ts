// GET /api/objetivos -> objetivos com % e status calculados, mais as áreas.
import { listarAreas, listarObjetivos } from "@/lib/dados";
import { rotaApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = rotaApi(async () => {
  const [areas, objetivos] = await Promise.all([listarAreas(), listarObjetivos()]);
  return { areas, objetivos };
});
