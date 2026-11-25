// Entrada de produção: migrations -> carga inicial -> primeiro usuário -> servidor Next.
import { spawn } from "node:child_process";
import postgres from "postgres";
import { runMigrations } from "./migrate.mjs";
import { seedSeVazio } from "./seed.mjs";
import { salvarUsuario } from "./add-user.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida");
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET precisa ter 32 caracteres ou mais");
}

// Espera o Postgres aceitar conexões (no boot da VPS o app pode subir antes do banco).
async function esperarBanco(tentativas = 30) {
  for (let i = 1; ; i++) {
    const c = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
    try {
      await c`SELECT 1`;
      return;
    } catch (e) {
      if (i >= tentativas) throw e;
      console.log(`Banco ainda não respondeu (${i}/${tentativas}): ${e.code ?? e.message}. Tentando de novo em 2 s…`);
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      await c.end({ timeout: 1 }).catch(() => {});
    }
  }
}

await esperarBanco();
await runMigrations(url);
if (await seedSeVazio(url)) console.log("Carga inicial feita.");

// Primeiro acesso: cria o usuário de ADMIN_EMAIL/ADMIN_PASSWORD se ainda não existe ninguém.
const sql = postgres(url, { max: 1, onnotice: () => {} });
const [{ n }] = await sql`SELECT count(*)::int AS n FROM usuarios`;
await sql.end();
if (n === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  await salvarUsuario(url, process.env.ADMIN_EMAIL, process.env.ADMIN_NAME || "Rafael", process.env.ADMIN_PASSWORD);
  console.log(`Usuário inicial ${process.env.ADMIN_EMAIL} criado.`);
}

const port = process.env.PORT || "3000";
const child = spawn("node_modules/.bin/next", ["start", "-p", port, "-H", "0.0.0.0"], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => child.kill(sig));
