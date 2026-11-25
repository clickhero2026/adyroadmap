"use server";
// Ações das telas internas. Cada uma confere se quem pede é admin antes de gravar.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { comandoWhatsApp, salvarConfigWhatsApp } from "@/lib/whatsapp";
import {
  ErroValidacao,
  atualizarTarefa,
  criarTarefa,
  atualizarArea,
  atualizarUsuario,
  criarArea,
  criarUsuario,
  excluirArea,
  excluirObjetivo,
  excluirTarefa,
  excluirUsuario,
  marcarEntregue,
  salvarObjetivo,
} from "@/lib/dados";

function voltar(destino: string, erro?: string): never {
  revalidatePath("/", "layout");
  if (!erro) redirect(destino);
  const url = new URL(destino, "http://x");
  url.searchParams.set("erro", erro);
  redirect(url.pathname + url.search);
}

async function tentar(destino: string, fn: () => Promise<unknown>) {
  await exigirAdmin();
  try {
    await fn();
  } catch (e) {
    if (e instanceof ErroValidacao) voltar(destino, e.message);
    throw e;
  }
  voltar(destino);
}

const campos = (form: FormData) => Object.fromEntries(form.entries());
const destinoDe = (form: FormData, padrao: string) => {
  const d = String(form.get("_voltar") ?? "");
  return d.startsWith("/app") ? d : padrao;
};

export async function acaoCriarTarefa(form: FormData) {
  const { _voltar, ...d } = campos(form);
  await tentar(destinoDe(form, "/app/tarefas"), () => criarTarefa(d));
}

export async function acaoMudarStatus(form: FormData) {
  const id = Number(form.get("id"));
  await tentar(destinoDe(form, "/app/tarefas"), () => atualizarTarefa(id, { status: form.get("status") }));
}

/** Usado pelo quadro de tarefas (arrastar ou trocar no menu): responde sem redirecionar. */
export async function acaoMoverTarefa(id: number, status: string, prazo?: string): Promise<{ erro?: string }> {
  await exigirAdmin();
  try {
    await atualizarTarefa(id, prazo ? { status, prazo } : { status });
  } catch (e) {
    if (e instanceof ErroValidacao) return { erro: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return {};
}

export async function acaoSalvarTarefa(form: FormData) {
  const id = Number(form.get("id"));
  const { id: _id, _voltar, ...d } = campos(form);
  await exigirAdmin();
  try {
    await atualizarTarefa(id, d);
  } catch (e) {
    // Erro: fica na tela da tarefa para corrigir.
    if (e instanceof ErroValidacao) {
      voltar(`/app/tarefas/${id}?voltar=${encodeURIComponent(destinoDe(form, "/app/tarefas"))}`, e.message);
    }
    throw e;
  }
  // Salvou: volta para o quadro (ou para onde a pessoa estava).
  voltar(destinoDe(form, "/app/tarefas"));
}

export async function acaoExcluirTarefa(form: FormData) {
  const id = Number(form.get("id"));
  await tentar(destinoDe(form, "/app/tarefas"), () => excluirTarefa(id));
}

export async function acaoSalvarObjetivo(form: FormData) {
  const idBruto = Number(form.get("id"));
  const id = Number.isInteger(idBruto) && idBruto > 0 ? idBruto : null;
  const d = campos(form);
  d.publico = form.get("publico") ?? "";
  await exigirAdmin();
  let novoId = id;
  try {
    novoId = await salvarObjetivo(id, d);
  } catch (e) {
    if (e instanceof ErroValidacao) voltar(id ? `/app/objetivos/${id}` : "/app/objetivos/novo", e.message);
    throw e;
  }
  voltar(`/app/objetivos/${novoId}`);
}

export async function acaoMarcarEntregue(form: FormData) {
  const id = Number(form.get("id"));
  const entregue = form.get("entregue") === "1";
  await tentar(`/app/objetivos/${id}`, () => marcarEntregue(id, entregue));
}

export async function acaoExcluirObjetivo(form: FormData) {
  const id = Number(form.get("id"));
  if (form.get("confirmo") !== "sim") voltar(`/app/objetivos/${id}`, "Marque a confirmação para excluir o objetivo");
  await tentar("/app/roadmap", () => excluirObjetivo(id));
}

export async function acaoCriarUsuario(form: FormData) {
  await tentar("/app/usuarios", () => criarUsuario(campos(form)));
}

export async function acaoAtualizarUsuario(form: FormData) {
  const id = Number(form.get("id"));
  await tentar("/app/usuarios", () => atualizarUsuario(id, campos(form)));
}

export async function acaoExcluirUsuario(form: FormData) {
  const id = Number(form.get("id"));
  const eu = await exigirAdmin();
  await tentar("/app/usuarios", () => excluirUsuario(id, eu.id));
}

export async function acaoCriarArea(form: FormData) {
  await tentar("/app/areas", () => criarArea(campos(form)));
}

export async function acaoAtualizarArea(form: FormData) {
  const id = Number(form.get("id"));
  await tentar("/app/areas", () => atualizarArea(id, campos(form)));
}

export async function acaoExcluirArea(form: FormData) {
  const id = Number(form.get("id"));
  await tentar("/app/areas", () => excluirArea(id));
}

// ---------- WhatsApp ----------

async function comandoTela(caminho: "/conectar" | "/desconectar" | "/grupos" | "/enviar", ok: string) {
  await exigirAdmin();
  const erro = await comandoWhatsApp(caminho);
  revalidatePath("/app/whatsapp");
  redirect(erro ? `/app/whatsapp?erro=${encodeURIComponent(erro)}` : `/app/whatsapp?ok=${encodeURIComponent(ok)}`);
}

export async function acaoWhatsAppConectar() {
  await comandoTela("/conectar", "Gerando o QR code…");
}
export async function acaoWhatsAppDesconectar() {
  await comandoTela("/desconectar", "WhatsApp desconectado");
}
export async function acaoWhatsAppGrupos() {
  await comandoTela("/grupos", "Lista de grupos atualizada");
}
export async function acaoWhatsAppEnviar() {
  await comandoTela("/enviar", "Resumo enviado para o grupo");
}
export async function acaoWhatsAppSalvar(form: FormData) {
  await exigirAdmin();
  await salvarConfigWhatsApp({
    grupo_id: String(form.get("grupo_id") ?? ""),
    ativo: form.get("ativo") === "on",
    hora: Number(form.get("hora") ?? 9),
  });
  revalidatePath("/app/whatsapp");
  redirect("/app/whatsapp?ok=" + encodeURIComponent("Configuração salva"));
}
