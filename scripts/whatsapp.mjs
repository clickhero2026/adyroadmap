// Worker do WhatsApp: mantém a conexão (Baileys), mostra o QR na tela do painel e manda o resumo
// do roadmap para o grupo dos diretores a cada 3 dias úteis. Roda no mesmo container, iniciado por start.mjs.
//
// Fala com o app por dois caminhos:
//  - banco (tabela whatsapp): estado da conexão, QR, grupos e configuração escolhida na tela;
//  - HTTP só em 127.0.0.1 (WA_PORT): comandos da tela (conectar, desconectar, atualizar grupos, enviar agora).
// O texto da mensagem é montado pelo app (GET /api/interno/resumo), para existir uma única versão dele.
import { createHmac } from "node:crypto";
import http from "node:http";
import postgres from "postgres";
import pino from "pino";
import QRCode from "qrcode";
import makeWASocket, { Browsers, BufferJSON, DisconnectReason, initAuthCreds, proto } from "@whiskeysockets/baileys";

const url = process.env.DATABASE_URL;
const segredo = process.env.SESSION_SECRET;
const PORTA_APP = Number(process.env.PORT || 3000);
const PORTA_WA = Number(process.env.WA_PORT || 3100);
if (!url || !segredo) {
  console.error("[whatsapp] DATABASE_URL e SESSION_SECRET são obrigatórios");
  process.exit(1);
}
const TOKEN = createHmac("sha256", segredo).update("whatsapp-interno").digest("hex");
const sql = postgres(url, { max: 3, onnotice: () => {} });
const logger = pino({ level: process.env.WA_LOG || "warn" });
const log = (...a) => console.log("[whatsapp]", ...a);

// ---------- sessão no banco ----------

async function ler(chave) {
  const [r] = await sql`SELECT valor FROM whatsapp_auth WHERE chave = ${chave}`;
  return r ? JSON.parse(r.valor, BufferJSON.reviver) : null;
}
async function gravar(chave, valor) {
  const v = JSON.stringify(valor, BufferJSON.replacer);
  await sql`INSERT INTO whatsapp_auth (chave, valor) VALUES (${chave}, ${v})
            ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`;
}
async function apagar(chave) {
  await sql`DELETE FROM whatsapp_auth WHERE chave = ${chave}`;
}

async function estadoAuth() {
  const creds = (await ler("creds")) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (tipo, ids) => {
          const out = {};
          await Promise.all(
            ids.map(async (id) => {
              let v = await ler(`${tipo}-${id}`);
              if (tipo === "app-state-sync-key" && v) v = proto.Message.AppStateSyncKeyData.fromObject(v);
              out[id] = v;
            }),
          );
          return out;
        },
        set: async (dados) => {
          const tarefas = [];
          for (const tipo in dados) {
            for (const id in dados[tipo]) {
              const v = dados[tipo][id];
              tarefas.push(v ? gravar(`${tipo}-${id}`, v) : apagar(`${tipo}-${id}`));
            }
          }
          await Promise.all(tarefas);
        },
      },
    },
    salvar: () => gravar("creds", creds),
    registrado: !!creds.registered,
  };
}

async function marcar(campos) {
  await sql`UPDATE whatsapp SET ${sql(campos)}, atualizado_em = now() WHERE id = 1`;
}

// ---------- conexão ----------

let sock = null;
let querConectado = false;
let tentativas = 0;

async function conectar() {
  querConectado = true;
  if (sock) return;
  const auth = await estadoAuth();
  if (!auth.registrado) await marcar({ status: "aguardando_qr", qr: null, erro: null });
  log(auth.registrado ? "reconectando sessão salva" : "nova conexão, aguardando QR");
  const s = makeWASocket({
    auth: auth.state,
    logger,
    browser: Browsers.ubuntu("ady roadmap"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
  });
  sock = s;
  s.ev.on("creds.update", auth.salvar);
  s.ev.on("connection.update", async (u) => {
    try {
      if (u.qr) {
        await marcar({ status: "aguardando_qr", qr: await QRCode.toDataURL(u.qr, { margin: 1, width: 320 }) });
      }
      if (u.connection === "open") {
        tentativas = 0;
        const numero = (s.user?.id ?? "").split(":")[0].split("@")[0];
        await marcar({ status: "conectado", qr: null, numero, erro: null });
        log("conectado", numero);
        await atualizarGrupos();
      }
      if (u.connection === "close") {
        if (sock === s) sock = null;
        const codigo = u.lastDisconnect?.error?.output?.statusCode;
        if (codigo === DisconnectReason.loggedOut) {
          log("sessão encerrada no celular; limpando");
          await sql`DELETE FROM whatsapp_auth`;
          await marcar({ status: "desconectado", qr: null, numero: null, erro: "A conexão foi encerrada pelo celular. Conecte de novo." });
          querConectado = false;
          return;
        }
        if (!querConectado) {
          await marcar({ status: "desconectado", qr: null });
          return;
        }
        // QR expirado sem leitura várias vezes: para de tentar e espera novo clique em Conectar.
        tentativas++;
        if (!auth.registrado && tentativas > 4) {
          log("QR não foi lido; parando");
          querConectado = false;
          tentativas = 0;
          await marcar({
            status: "desconectado",
            qr: null,
            erro: codigo === 408
              ? "Não consegui falar com os servidores do WhatsApp. Tente de novo em alguns minutos."
              : "O QR code expirou sem ser lido. Clique em Conectar para gerar outro.",
          });
          return;
        }
        const espera = Math.min(60, 3 * tentativas) * 1000;
        log(`conexão caiu (código ${codigo}); tentando de novo em ${espera / 1000}s`);
        setTimeout(() => conectar().catch((e) => log("erro ao reconectar", e.message)), espera);
      }
    } catch (e) {
      log("erro no connection.update", e.message);
    }
  });
}

async function desconectar() {
  querConectado = false;
  const s = sock;
  sock = null;
  if (s) await s.logout().catch(() => s.end(undefined));
  await sql`DELETE FROM whatsapp_auth`;
  await marcar({ status: "desconectado", qr: null, numero: null, grupos: sql.json([]) });
}

async function atualizarGrupos() {
  if (!sock) throw new Error("WhatsApp não está conectado");
  const todos = await sock.groupFetchAllParticipating();
  const grupos = Object.values(todos)
    .map((g) => ({ id: g.id, nome: g.subject || g.id }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  await marcar({ grupos: sql.json(grupos) });
  return grupos.length;
}

// ---------- envio ----------

/** Data de corte: do último envio que deu certo (inclui o próprio dia) ou 3 dias úteis atrás. */
async function desdeAgora() {
  const [r] = await sql`
    SELECT COALESCE(
      (SELECT max((enviado_em AT TIME ZONE 'America/Sao_Paulo')::date) - 1 FROM whatsapp_envios WHERE ok),
      (SELECT d FROM generate_series(hoje() - 10, hoje() - 1, interval '1 day') AS g(d)
        WHERE dias_uteis(d::date, hoje()) = 3 ORDER BY d DESC LIMIT 1)::date
    )::text AS desde`;
  return r.desde;
}

async function enviar(manual) {
  const [cfg] = await sql`SELECT grupo_id FROM whatsapp WHERE id = 1`;
  if (!sock) throw new Error("WhatsApp não está conectado");
  if (!cfg?.grupo_id) throw new Error("Escolha o grupo dos diretores antes de enviar");
  const desde = await desdeAgora();
  const r = await fetch(`http://127.0.0.1:${PORTA_APP}/api/interno/resumo?desde=${desde}`, {
    headers: { "x-interno": TOKEN },
  });
  if (!r.ok) throw new Error(`Não consegui montar o resumo (HTTP ${r.status})`);
  const { texto } = await r.json();
  try {
    await sock.sendMessage(cfg.grupo_id, { text: texto });
    await sql`INSERT INTO whatsapp_envios (desde, texto, ok, manual) VALUES (${desde}, ${texto}, true, ${manual})`;
    log(manual ? "resumo enviado (manual)" : "resumo enviado (automático)");
  } catch (e) {
    await sql`INSERT INTO whatsapp_envios (desde, texto, ok, erro, manual) VALUES (${desde}, ${texto}, false, ${e.message}, ${manual})`;
    throw e;
  }
}

/** Automático: dia útil, depois da hora marcada, e 3 dias úteis desde o último envio que deu certo. */
async function talvezEnviar() {
  const [c] = await sql`
    SELECT w.ativo, w.grupo_id, w.status,
      extract(isodow FROM hoje()) < 6 AS dia_util,
      extract(hour FROM now() AT TIME ZONE 'America/Sao_Paulo') >= w.hora AS passou_hora,
      (SELECT max((enviado_em AT TIME ZONE 'America/Sao_Paulo')::date) FROM whatsapp_envios WHERE ok AND NOT manual) AS ultimo_auto,
      (SELECT max((enviado_em AT TIME ZONE 'America/Sao_Paulo')::date) FROM whatsapp_envios WHERE ok) AS ultimo,
      (SELECT count(*) FROM whatsapp_envios WHERE NOT ok AND (enviado_em AT TIME ZONE 'America/Sao_Paulo')::date = hoje())::int AS falhas_hoje
    FROM whatsapp w WHERE w.id = 1`;
  if (!c?.ativo || !c.grupo_id || c.status !== "conectado" || !sock || !c.dia_util || !c.passou_hora) return;
  if (c.falhas_hoje >= 3) return;
  if (c.ultimo) {
    const [{ n }] = await sql`SELECT dias_uteis(${c.ultimo}::date, hoje()) AS n`;
    if (n < 3) return;
  }
  await enviar(false).catch((e) => log("falha no envio automático:", e.message));
}

// ---------- comandos da tela ----------

const COMANDOS = {
  "/conectar": async () => {
    tentativas = 0;
    await conectar();
  },
  "/desconectar": desconectar,
  "/grupos": async () => ({ grupos: await atualizarGrupos() }),
  "/enviar": () => enviar(true),
};

http
  .createServer(async (req, res) => {
    const responder = (status, corpo) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(corpo));
    };
    if (req.headers["x-interno"] !== TOKEN) return responder(401, { erro: "não autorizado" });
    const fn = req.method === "POST" && COMANDOS[req.url ?? ""];
    if (!fn) return responder(404, { erro: "comando desconhecido" });
    try {
      responder(200, (await fn()) ?? { ok: true });
    } catch (e) {
      responder(400, { erro: e.message });
    }
  })
  .listen(PORTA_WA, "127.0.0.1", () => log(`ouvindo comandos em 127.0.0.1:${PORTA_WA}`));

// ---------- início ----------

// Só reconecta sozinho se já houve leitura do QR (sessão registrada).
if ((await ler("creds"))?.registered) {
  await conectar().catch((e) => log("erro ao conectar", e.message));
} else {
  await marcar({ status: "desconectado", qr: null });
}
setInterval(() => talvezEnviar().catch((e) => log("erro no agendador", e.message)), 5 * 60 * 1000);
setTimeout(() => talvezEnviar().catch(() => {}), 60 * 1000);
