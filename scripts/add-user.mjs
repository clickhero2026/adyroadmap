// Cria ou atualiza um usuário. Uso: npm run user:add -- email@exemplo.com "Nome" "senha"
import postgres from "postgres";
import { hashSenha } from "./lib/senha.mjs";

export async function salvarUsuario(url, email, nome, senha) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql`
      INSERT INTO usuarios (email, nome, senha_hash)
      VALUES (${email.toLowerCase()}, ${nome}, ${hashSenha(senha)})
      ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, senha_hash = EXCLUDED.senha_hash`;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [email, nome, senha] = process.argv.slice(2);
  if (!email || !nome || !senha || senha.length < 8) {
    console.error('Uso: npm run user:add -- email "Nome" "senha com 8+ caracteres"');
    process.exit(1);
  }
  await salvarUsuario(process.env.DATABASE_URL, email, nome, senha);
  console.log(`Usuário ${email} salvo.`);
}
