// Gestão de usuários (só admin). Diretor vê apenas o roadmap interno e a visão dos diretores.
import { AbasConfiguracoes } from "@/components/Nav";
import { exigirAdmin } from "@/lib/auth";
import { listarUsuarios } from "@/lib/dados";
import { acaoAtualizarUsuario, acaoCriarUsuario, acaoExcluirUsuario } from "../actions";

const PAPEIS = [
  ["admin", "Admin (acesso total)"],
  ["diretor", "Diretor (só roadmap interno e Diretores)"],
] as const;

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const eu = await exigirAdmin();
  const { erro } = await searchParams;
  const usuarios = await listarUsuarios();
  return (
    <div className="wrap" style={{ maxWidth: 1000 }}>
      <AbasConfiguracoes />
      <header className="cabecalho">
        <div>
          <h1>Usuários</h1>
          <p>Admin vê e edita tudo. Diretor só consulta o roadmap interno e a visão dos diretores, sem editar nada.</p>
        </div>
      </header>
      {erro && <div className="erro">{erro}</div>}

      <section className="summary rolagem">
        <table className="tabela-usuarios">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil e senha</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.nome}
                  {u.id === eu.id && <span className="small muted"> (você)</span>}
                </td>
                <td className="small">{u.email}</td>
                <td>
                  <form action={acaoAtualizarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <select name="papel" defaultValue={u.papel} aria-label={`Perfil de ${u.nome}`}>
                      <option value="admin">Admin</option>
                      <option value="diretor">Diretor</option>
                    </select>
                    <input
                      name="senha"
                      type="password"
                      placeholder="Nova senha (opcional)"
                      autoComplete="new-password"
                      minLength={8}
                      aria-label={`Nova senha de ${u.nome}`}
                    />
                    <button type="submit">Salvar</button>
                  </form>
                </td>
                <td>
                  {u.id !== eu.id && (
                    <form action={acaoExcluirUsuario}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="link">
                        Remover acesso
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2>Novo usuário</h2>
      <form action={acaoCriarUsuario} className="form">
        <div className="linha">
          <label>
            Nome
            <input name="nome" required maxLength={100} />
          </label>
          <label>
            E-mail
            <input name="email" type="email" required autoComplete="off" />
          </label>
          <label>
            Senha inicial
            <input name="senha" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label>
            Perfil
            <select name="papel" defaultValue="diretor">
              {PAPEIS.map(([k, nome]) => (
                <option key={k} value={k}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="acoes">
          <button className="primario" type="submit">
            Criar usuário
          </button>
        </div>
      </form>
    </div>
  );
}
