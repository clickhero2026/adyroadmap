"use server";
// Ações das telas internas. Cada uma confere o login antes de gravar.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import {
  ErroValidacao,
  atualizarTarefa,
  criarTarefa,
  excluirTarefa,
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
  await exigirUsuario();
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

export async function acaoSalvarTarefa(form: FormData) {
  const id = Number(form.get("id"));
  const { id: _id, _voltar, ...d } = campos(form);
  await tentar(destinoDe(form, `/app/tarefas/${id}`), () => atualizarTarefa(id, d));
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
  await exigirUsuario();
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
