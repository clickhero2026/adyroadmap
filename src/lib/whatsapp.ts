// Ponte entre as telas e o worker do WhatsApp (scripts/whatsapp.mjs), que roda no mesmo container.
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export function tokenInterno() {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "").update("whatsapp-interno").digest("hex");
}

export function pedidoInternoValido(req: Request) {
  const recebido = Buffer.from(req.headers.get("x-interno") ?? "");
  const esperado = Buffer.from(tokenInterno());
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

/** Manda um comando ao worker. Devolve o erro em texto, se houver. */
export async function comandoWhatsApp(caminho: "/conectar" | "/desconectar" | "/grupos" | "/enviar") {
  const porta = Number(process.env.WA_PORT || 3100);
  try {
    const r = await fetch(`http://127.0.0.1:${porta}${caminho}`, {
      method: "POST",
      headers: { "x-interno": tokenInterno() },
      signal: AbortSignal.timeout(30000),
    });
    const corpo = (await r.json().catch(() => ({}))) as { erro?: string };
    return r.ok ? null : (corpo.erro ?? `Erro ${r.status}`);
  } catch {
    return "O serviço do WhatsApp não respondeu. Ele reinicia sozinho; tente de novo em 1 minuto.";
  }
}

export type EstadoWhatsApp = {
  status: "desconectado" | "aguardando_qr" | "conectado";
  qr: string | null;
  numero: string | null;
  erro: string | null;
  grupos: { id: string; nome: string }[];
  grupo_id: string | null;
  grupo_nome: string | null;
  ativo: boolean;
  hora: number;
  atualizado_em: string;
};

export async function estadoWhatsApp() {
  const [e] = await db()<EstadoWhatsApp[]>`SELECT *, atualizado_em::text FROM whatsapp WHERE id = 1`;
  return e;
}

export type Envio = { id: number; enviado_em: string; desde: string; texto: string; ok: boolean; erro: string | null; manual: boolean };

export async function ultimosEnvios(n = 10) {
  return db()<Envio[]>`
    SELECT id, to_char(enviado_em AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') AS enviado_em,
      desde::text, texto, ok, erro, manual
    FROM whatsapp_envios ORDER BY id DESC LIMIT ${n}`;
}

/** Próximo envio automático: primeiro dia útil com 3 dias úteis desde o último envio que deu certo. */
export async function proximoEnvio() {
  const [r] = await db()<{ data: string | null }[]>`
    WITH u AS (SELECT max((enviado_em AT TIME ZONE 'America/Sao_Paulo')::date) AS d FROM whatsapp_envios WHERE ok)
    SELECT CASE
      WHEN (SELECT d FROM u) IS NULL THEN
        (SELECT min(g)::date::text FROM generate_series(hoje(), hoje() + 7, interval '1 day') g WHERE extract(isodow FROM g) < 6)
      ELSE
        (SELECT min(g)::date::text FROM generate_series((SELECT d FROM u) + 1, (SELECT d FROM u) + 10, interval '1 day') g
          WHERE dias_uteis((SELECT d FROM u), g::date) >= 3 AND extract(isodow FROM g) < 6)
    END AS data`;
  return r.data;
}

/** Data de corte do próximo resumo (mesma regra do worker). */
export async function desdeProximo() {
  const [r] = await db()<{ desde: string }[]>`
    SELECT COALESCE(
      (SELECT max((enviado_em AT TIME ZONE 'America/Sao_Paulo')::date) - 1 FROM whatsapp_envios WHERE ok),
      (SELECT d FROM generate_series(hoje() - 10, hoje() - 1, interval '1 day') AS g(d)
        WHERE dias_uteis(d::date, hoje()) = 3 ORDER BY d DESC LIMIT 1)::date
    )::text AS desde`;
  return r.desde;
}

export async function salvarConfigWhatsApp(d: { grupo_id: string; ativo: boolean; hora: number }) {
  const e = await estadoWhatsApp();
  const grupo = e.grupos.find((g) => g.id === d.grupo_id);
  const hora = Math.min(20, Math.max(7, Math.round(d.hora)));
  await db()`UPDATE whatsapp SET grupo_id = ${grupo?.id ?? null}, grupo_nome = ${grupo?.nome ?? null},
    ativo = ${d.ativo && !!grupo}, hora = ${hora}, atualizado_em = now() WHERE id = 1`;
}
