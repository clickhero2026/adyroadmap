import { encerrarSessao } from "@/lib/auth";

export async function POST() {
  await encerrarSessao();
  // Location relativo: atrás do proxy do Easypanel o req.url é http://0.0.0.0:3000.
  return new Response(null, { status: 303, headers: { Location: "/entrar" } });
}
