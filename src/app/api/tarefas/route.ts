// GET /api/tarefas[?objetivo_id=N] -> tarefas com situação calculada
// POST /api/tarefas {objetivo_id, titulo, peso?, prazo?, responsavel?, status?, link?} -> {id}
import { buscarTarefa, criarTarefa, listarTarefas } from "@/lib/dados";
import { rotaApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = rotaApi(async (req) => {
  const objetivoId = Number(new URL(req.url).searchParams.get("objetivo_id")) || undefined;
  return { tarefas: await listarTarefas({ objetivoId }) };
});

export const POST = rotaApi(async (req) => {
  const id = await criarTarefa(await req.json());
  return Response.json({ tarefa: await buscarTarefa(id) }, { status: 201 });
});
