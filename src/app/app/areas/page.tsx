// Áreas do roadmap (só admin): criar, renomear, mudar ordem e ícone, excluir área vazia.
// Objetivos de cada área aparecem aqui, com links para editar e para criar um novo já na área.
import { AbasConfiguracoes } from "@/components/Nav";
import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { listarAreas, listarObjetivos } from "@/lib/dados";
import { STATUS_OBJETIVO } from "@/lib/rotulos";
import { ICONES, IconeArea } from "@/components/Icones";
import { acaoAtualizarArea, acaoCriarArea, acaoExcluirArea } from "../actions";

function OpcoesIcone() {
  return ICONES.map((k) => (
    <option key={k} value={k}>
      {k}
    </option>
  ));
}

export default async function Areas({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await exigirAdmin();
  const { erro } = await searchParams;
  const [areas, objetivos] = await Promise.all([listarAreas(), listarObjetivos()]);
  const daArea = (id: number) => objetivos.filter((o) => o.area_id === id);
  const total = (id: number) => daArea(id).length;
  const proximaOrdem = Math.max(0, ...areas.map((a) => a.ordem)) + 1;

  return (
    <div className="wrap" style={{ maxWidth: 1000 }}>
      <AbasConfiguracoes />
      <header className="cabecalho">
        <div>
          <h1>Áreas e objetivos</h1>
          <p>
            Clique em “objetivos” numa área para ver, editar ou criar objetivos dela. Clique no nome de um objetivo para
            editar ou excluir.
          </p>
        </div>
      </header>
      {erro && <div className="erro">{erro}</div>}

      <section className="summary rolagem">
        <table className="tabela-usuarios">
          <thead>
            <tr>
              <th />
              <th>Nome, ordem e ícone</th>
              <th>Objetivos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id}>
                <td style={{ width: 36 }}>
                  <span className="area-icone">
                    <IconeArea area={a.nome} icone={a.icone} />
                  </span>
                </td>
                <td>
                  <form action={acaoAtualizarArea}>
                    <input type="hidden" name="id" value={a.id} />
                    <input name="nome" defaultValue={a.nome} required maxLength={80} aria-label="Nome" style={{ minWidth: 200 }} />
                    <input name="ordem" type="number" min={0} max={999} defaultValue={a.ordem} aria-label="Ordem" style={{ width: 70 }} />
                    <select name="icone" defaultValue={a.icone ?? a.nome} aria-label="Ícone">
                      <OpcoesIcone />
                    </select>
                    <button type="submit">Salvar</button>
                  </form>
                </td>
                <td className="small" style={{ minWidth: 240 }}>
                  <details className="objetivos-area">
                    <summary>
                      {total(a.id)} {total(a.id) === 1 ? "objetivo" : "objetivos"}
                    </summary>
                    <ul>
                      {daArea(a.id).map((o) => (
                        <li key={o.id}>
                          <Link href={`/app/objetivos/${o.id}`}>{o.nome}</Link>{" "}
                          <span className={`badge ${STATUS_OBJETIVO[o.status].cor}`}>{STATUS_OBJETIVO[o.status].nome}</span>
                        </li>
                      ))}
                    </ul>
                    <Link className="btn" href={`/app/objetivos/novo?area=${a.id}`}>
                      + Novo objetivo nesta área
                    </Link>
                  </details>
                </td>
                <td>
                  {total(a.id) === 0 && (
                    <form action={acaoExcluirArea}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="link">
                        Excluir
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 10 }}>
          A ordem define a sequência no roadmap (menor primeiro). Só dá para excluir área sem objetivos.
        </p>
      </section>

      <p>
        <Link className="btn primario" href="/app/objetivos/novo">
          + Novo objetivo
        </Link>
      </p>

      <h2>Nova área</h2>
      <form action={acaoCriarArea} className="form">
        <div className="linha">
          <label>
            Nome
            <input name="nome" required maxLength={80} placeholder="Ex.: Segurança" />
          </label>
          <label>
            Ordem
            <input name="ordem" type="number" min={0} max={999} defaultValue={proximaOrdem} />
          </label>
          <label>
            Ícone
            <select name="icone" defaultValue="Geral">
              <OpcoesIcone />
            </select>
          </label>
        </div>
        <div className="acoes">
          <button className="primario" type="submit">
            Criar área
          </button>
        </div>
      </form>
    </div>
  );
}
