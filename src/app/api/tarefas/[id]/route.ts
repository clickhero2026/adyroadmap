// GET / PATCH / DELETE /api/tarefas/:id
import { NextResponse } from "next/server";
import { atualizarTarefa, buscarTarefa, excluirTarefa } from "@/lib/dados";
import { rotaApi } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function idDe(ctx: Ctx) {
  return Number((await ctx.params).id);
}

export const GET = rotaApi(async (_req, ctx: Ctx) => {
  const t = await buscarTarefa(await idDe(ctx));
  return t ? { tarefa: t } : NextResponse.json({ erro: "não encontrada" }, { status: 404 });
});

export const PATCH = rotaApi(async (req, ctx: Ctx) => {
  const id = await idDe(ctx);
  await atualizarTarefa(id, await req.json());
  return { tarefa: await buscarTarefa(id) };
});

export const DELETE = rotaApi(async (_req, ctx: Ctx) => {
  await excluirTarefa(await idDe(ctx));
  return { ok: true };
});
