import { NextResponse } from "next/server";
import { tokenApiValido } from "./auth";
import { ErroValidacao } from "./dados";

/** Envolve uma rota da API: confere o token e traduz erros de validação em 400. */
export function rotaApi<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<unknown>) {
  return async (req: Request, ...args: A) => {
    if (!tokenApiValido(req)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    try {
      const out = await fn(req, ...args);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof ErroValidacao) return NextResponse.json({ erro: e.message }, { status: 400 });
      if (e instanceof SyntaxError) return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
      throw e;
    }
  };
}
