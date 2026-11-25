import type { Area, Objetivo } from "@/lib/dados";
import { MARCACOES, TIPOS } from "@/lib/rotulos";
import { acaoSalvarObjetivo } from "@/app/app/actions";

export function FormObjetivo({ o, areas }: { o?: Objetivo | null; areas: Area[] }) {
  return (
    <form action={acaoSalvarObjetivo} className="form">
      {o && <input type="hidden" name="id" value={o.id} />}
      <label>
        Nome
        <input name="nome" defaultValue={o?.nome ?? ""} required maxLength={200} />
      </label>
      <div className="linha">
        <label>
          Área
          <select name="area_id" defaultValue={o?.area_id ?? ""} required>
            <option value="" disabled>
              Escolha…
            </option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select name="tipo" defaultValue={o?.tipo ?? "funcionalidade"}>
            {TIPOS.map(([k, nome]) => (
              <option key={k} value={k}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridade
          <select name="prioridade" defaultValue={o?.prioridade ?? "P2"}>
            <option>P1</option>
            <option>P2</option>
            <option>P3</option>
          </select>
        </label>
        <label>
          Responsável
          <input name="responsavel" defaultValue={o?.responsavel ?? ""} maxLength={100} />
        </label>
      </div>
      <div className="linha">
        <label>
          Início previsto
          <input name="inicio_previsto" type="date" defaultValue={o?.inicio_previsto ?? ""} />
        </label>
        <label>
          Prazo
          <input name="prazo" type="date" defaultValue={o?.prazo ?? ""} />
        </label>
        <label>
          Iniciado em (sem tarefas)
          <input name="iniciado_em" type="date" defaultValue={o?.iniciado_em ?? ""} />
        </label>
        <label>
          Entregue em
          <input name="entregue_em" type="date" defaultValue={o?.entregue_em ?? ""} />
        </label>
      </div>
      <label>
        Descrição pública (texto do roadmap público)
        <textarea name="descricao_publica" defaultValue={o?.descricao_publica ?? ""} maxLength={500} />
      </label>
      <div className="linha">
        <label className="check">
          <input type="checkbox" name="publico" defaultChecked={o?.publico ?? false} />
          Aparece no roadmap público
        </label>
        <label>
          Marcação manual
          <select name="marcacao" defaultValue={o?.marcacao ?? ""}>
            <option value="">Nenhuma</option>
            {MARCACOES.map(([k, nome]) => (
              <option key={k} value={k}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Nota interna
        <textarea name="nota_interna" defaultValue={o?.nota_interna ?? ""} maxLength={2000} />
      </label>
      <div className="acoes">
        <button className="primario" type="submit">
          {o ? "Salvar objetivo" : "Criar objetivo"}
        </button>
      </div>
    </form>
  );
}
