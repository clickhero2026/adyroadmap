import { redirect } from "next/navigation";
import { criarSessao, usuarioAtual } from "@/lib/auth";
import { db } from "@/lib/db";
import { conferirSenha } from "../../../scripts/lib/senha.mjs";

export const dynamic = "force-dynamic";

async function entrar(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const [u] = await db()<{ id: number; senha_hash: string }[]>`
    SELECT id, senha_hash FROM usuarios WHERE email = ${email}`;
  if (!u || !conferirSenha(senha, u.senha_hash)) redirect("/entrar?erro=1");
  await criarSessao(u.id);
  redirect("/app");
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (await usuarioAtual()) redirect("/app");
  const { erro } = await searchParams;
  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1>Entrar</h1>
      <p className="muted">Área interna do roadmap do ady, só para os sócios.</p>
      {erro && <div className="erro">E-mail ou senha incorretos.</div>}
      <form action={entrar} className="form">
        <label>
          E-mail
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Senha
          <input name="senha" type="password" autoComplete="current-password" required />
        </label>
        <div className="acoes">
          <button className="primario" type="submit">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
