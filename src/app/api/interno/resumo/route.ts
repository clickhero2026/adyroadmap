// Usado só pelo worker do WhatsApp (mesmo container): devolve o texto do resumo.
import { NextResponse } from "next/server";
import { resumoRoadmap } from "@/lib/dados";
import { textoWhatsApp } from "@/lib/resumo";
import { hojeSP } from "@/lib/rotulos";
import { pedidoInternoValido } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!pedidoInternoValido(req)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const desde = new URL(req.url).searchParams.get("desde") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return NextResponse.json({ erro: "desde inválido" }, { status: 400 });
  const base = (process.env.APP_URL || "https://roadmap.useady.com.br").replace(/\/$/, "");
  const link = `${base}/app/diretores`;
  return NextResponse.json({ texto: textoWhatsApp(await resumoRoadmap(desde), hojeSP(), link) });
}
