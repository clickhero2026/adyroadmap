import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "sessao";
const DURACAO_S = 60 * 60 * 24 * 30; // 30 dias

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET precisa ter 32 caracteres ou mais");
  return s;
}

function assinar(valor: string) {
  return createHmac("sha256", segredo()).update(valor).digest("base64url");
}

export async function criarSessao(usuarioId: number) {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_S;
  const valor = `${usuarioId}.${exp}`;
  (await cookies()).set(COOKIE, `${valor}.${assinar(valor)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_S,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

export type Usuario = { id: number; nome: string; email: string };

export async function usuarioAtual(): Promise<Usuario | null> {
  const bruto = (await cookies()).get(COOKIE)?.value;
  if (!bruto) return null;
  const [id, exp, sig] = bruto.split(".");
  if (!id || !exp || !sig) return null;
  const esperado = Buffer.from(assinar(`${id}.${exp}`));
  const recebido = Buffer.from(sig);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const [u] = await db()<Usuario[]>`SELECT id, nome, email FROM usuarios WHERE id = ${Number(id)}`;
  return u ?? null;
}

export async function exigirUsuario(): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect("/entrar");
  return u;
}

/** Token da API (Authorization: Bearer ...), para o Claude e scripts. */
export function tokenApiValido(req: Request) {
  const token = process.env.API_TOKEN;
  if (!token || token.length < 32) return false;
  const h = req.headers.get("authorization") ?? "";
  const recebido = Buffer.from(h.replace(/^Bearer\s+/i, ""));
  const esperado = Buffer.from(token);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
