import { exigirAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarTarefa, listarObjetivos } from "@/lib/dados";
import { PESOS, SITUACAO_TAREFA, STATUS_TAREFA, dataBR } from "@/lib/rotulos";
import { EscolhaObjetivo } from "@/components/EscolhaObjetivo";
import { acaoExcluirTarefa, acaoSalvarTarefa } from "../../actions";

export default async function EditarTarefa({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; voltar?: string }>;
}) {
  await exigirAdmin();
  const id = Number((await params).id);
  const { erro, voltar: v } = await searchParams;
  // Volta para o quadro (com o filtro que estava) ou para o objetivo de onde veio.
  const voltar = v && v.startsWith("/app/") ? v : "/app/tarefas";
  const [t, objetivos] = await Promise.all([buscarTarefa(id), listarObjetivos()]);
  if (!t) notFound();
  const sit = SITUACAO_TAREFA[t.situacao];
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <p className="small">
        <Link href={voltar}>← Tarefas</Link> · <Link href={`/app/objetivos/${t.objetivo_id}`}>{t.objetivo_nome}</Link>
      </p>
      <header className="cabecalho">
        <h1>{t.titulo}</h1>
        <div className="badges">
          <span className={`badge ${sit.cor}`}>{sit.nome}</span>
          {t.iniciada_em && <span className="small muted">iniciada {dataBR(t.iniciada_em)}</span>}
          {t.concluida_em && <span className="small muted">concluída {dataBR(t.concluida_em)}</span>}
        </div>
      </header>
      {erro && <div className="erro">{erro}</div>}
      <form action={acaoSalvarTarefa} className="form">
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="_voltar" value={voltar} />
        <label>
          Título
          <input name="titulo" defaultValue={t.titulo} required maxLength={300} />
        </label>
        <div className="linha">
          <EscolhaObjetivo objetivos={objetivos.filter((o) => o.status !== "cancelado" || o.id === t.objetivo_id)} inicial={t.objetivo_id} />
          <label>
            Status
            <select name="status" defaultValue={t.status}>
              {STATUS_TAREFA.map(([k, nome]) => (
                <option key={k} value={k}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="linha">
          <label>
            Peso
            <select name="peso" defaultValue={t.peso}>
              {PESOS.map(([k, nome]) => (
                <option key={k} value={k}>
                  {nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo
            <input name="prazo" type="date" defaultValue={t.prazo ?? ""} />
          </label>
          <label>
            Responsável
            <input name="responsavel" defaultValue={t.responsavel ?? ""} maxLength={100} />
          </label>
        </div>
        <label>
          Link (PR, commit ou documento)
          <input name="link" type="url" defaultValue={t.link ?? ""} placeholder="https://" />
        </label>
        <div className="acoes">
          <button className="primario" type="submit">
            Salvar
          </button>
          {t.link && /^https?:\/\//i.test(t.link) && (
            <a className="btn" href={t.link} target="_blank" rel="noreferrer">
              Abrir link ↗
            </a>
          )}
        </div>
      </form>
      <form action={acaoExcluirTarefa}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="_voltar" value={voltar} />
        <button type="submit" className="link">
          Excluir tarefa (para tirar da conta sem apagar, use o status Cancelada)
        </button>
      </form>
    </div>
  );
}
