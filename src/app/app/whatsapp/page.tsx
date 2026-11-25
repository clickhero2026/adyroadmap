// Conexão do WhatsApp e resumo automático para o grupo dos diretores (só admin).
import { AbasConfiguracoes } from "@/components/Nav";
import { exigirAdmin } from "@/lib/auth";
import { resumoRoadmap } from "@/lib/dados";
import { textoWhatsApp } from "@/lib/resumo";
import { dataBR, hojeSP, somarDias } from "@/lib/rotulos";
import { desdeProximo, estadoWhatsApp, proximoEnvio, ultimosEnvios } from "@/lib/whatsapp";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import {
  acaoWhatsAppConectar,
  acaoWhatsAppDesconectar,
  acaoWhatsAppEnviar,
  acaoWhatsAppGrupos,
  acaoWhatsAppSalvar,
} from "../actions";

export const dynamic = "force-dynamic";

const NOME_STATUS = {
  desconectado: { nome: "Desconectado", cor: "mute" },
  aguardando_qr: { nome: "Aguardando leitura do QR", cor: "warn" },
  conectado: { nome: "Conectado", cor: "done" },
} as const;

export default async function WhatsApp({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  await exigirAdmin();
  const { erro, ok } = await searchParams;
  const hoje = hojeSP();
  const [e, envios, proximo, desde] = await Promise.all([estadoWhatsApp(), ultimosEnvios(), proximoEnvio(), desdeProximo()]);
  const previa = textoWhatsApp(await resumoRoadmap(desde), hoje);
  const st = NOME_STATUS[e.status] ?? NOME_STATUS.desconectado;

  return (
    <div className="wrap" style={{ maxWidth: 1000 }}>
      {e.status === "aguardando_qr" && <AtualizarSozinho />}
      <AbasConfiguracoes />
      <header className="cabecalho">
        <div>
          <h1>WhatsApp</h1>
          <p>Resumo do roadmap no grupo dos diretores a cada 3 dias úteis: o que está em andamento, o que ficou pronto e o que está em testes.</p>
        </div>
      </header>
      {erro && <div className="erro">{erro}</div>}
      {ok && !erro && <div className="ok-msg">{ok}</div>}

      <section className="summary">
        <div className="cabecalho" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Conexão</h2>
          <span className={`badge ${st.cor}`}>{st.nome}</span>
        </div>

        {e.status === "desconectado" && (
          <>
            {e.erro && <div className="erro" style={{ marginBottom: 12 }}>{e.erro}</div>}
            <p className="muted" style={{ marginTop: 0 }}>
              O painel entra como um aparelho conectado ao seu WhatsApp, igual ao WhatsApp Web. Ele só envia o resumo no grupo
              escolhido e não lê suas conversas.
            </p>
            <form action={acaoWhatsAppConectar}>
              <button className="primario" type="submit">
                Conectar WhatsApp
              </button>
            </form>
          </>
        )}

        {e.status === "aguardando_qr" && (
          <div className="qr-bloco">
            {e.qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.qr} alt="QR code para conectar o WhatsApp" width={260} height={260} />
            ) : (
              <p className="muted">Gerando o QR code…</p>
            )}
            <ol>
              <li>Abra o WhatsApp no celular.</li>
              <li>
                Toque em <b>Configurações → Aparelhos conectados → Conectar um aparelho</b>.
              </li>
              <li>Aponte a câmera para este QR. A tela atualiza sozinha quando conectar.</li>
            </ol>
          </div>
        )}

        {e.status === "conectado" && (
          <>
            <p style={{ marginTop: 0 }}>
              Número conectado: <b>+{e.numero}</b>
            </p>
            <form action={acaoWhatsAppSalvar} className="form" style={{ padding: 0, border: 0 }}>
              <div className="linha">
                <label>
                  Grupo dos diretores
                  <select name="grupo_id" defaultValue={e.grupo_id ?? ""} required>
                    <option value="" disabled>
                      Escolha o grupo…
                    </option>
                    {e.grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Horário do envio
                  <select name="hora" defaultValue={e.hora}>
                    {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={h}>
                        {h}h
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="check">
                <input type="checkbox" name="ativo" defaultChecked={e.ativo} /> Enviar automaticamente a cada 3 dias úteis
              </label>
              <div className="acoes">
                <button className="primario" type="submit">
                  Salvar
                </button>
              </div>
            </form>
            <div className="acoes" style={{ marginTop: 12 }}>
              <form action={acaoWhatsAppEnviar}>
                <button type="submit" disabled={!e.grupo_id}>
                  Enviar agora
                </button>
              </form>
              <form action={acaoWhatsAppGrupos}>
                <button type="submit">Atualizar lista de grupos</button>
              </form>
              <form action={acaoWhatsAppDesconectar}>
                <button type="submit" className="link">
                  Desconectar
                </button>
              </form>
            </div>
            <p className="small muted" style={{ marginBottom: 0 }}>
              {e.ativo && e.grupo_id && proximo
                ? `Próximo envio automático: ${dataBR(proximo)}, a partir das ${e.hora}h, no grupo ${e.grupo_nome}.`
                : "Envio automático desligado."}
            </p>
          </>
        )}
      </section>

      <section className="summary">
        <h2>Prévia da próxima mensagem</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          Concluídos desde {dataBR(somarDias(desde, 1))}. A mensagem é montada na hora do envio, então pode mudar até lá.
        </p>
        <pre className="whats">{previa}</pre>
      </section>

      <section className="summary">
        <h2>Últimos envios</h2>
        {!envios.length && <p className="muted" style={{ margin: 0 }}>Nenhum envio ainda.</p>}
        <ul className="checks">
          {envios.map((v) => (
            <li key={v.id}>
              <span className={`badge ${v.ok ? "done" : "late"}`}>{v.ok ? "Enviado" : "Falhou"}</span>
              <div>
                {v.enviado_em} · {v.manual ? "manual" : "automático"}
                {v.erro && <div className="small txt-late">{v.erro}</div>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
