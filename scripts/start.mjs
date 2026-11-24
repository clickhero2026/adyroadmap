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
