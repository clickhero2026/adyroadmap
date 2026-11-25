"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Telas reunidas em Configurações (só admin). */
export const CONFIGURACOES = [
  ["/app/areas", "Áreas e objetivos"],
  ["/app/whatsapp", "WhatsApp"],
  ["/app/usuarios", "Usuários"],
] as const;

const ITENS = [
  ["/app/tarefas", "Tarefas", true],
  ["/app/diretores", "Diretores", false],
  ["/app/roadmap", "Roadmap interno", false],
] as const;

export function Nav({ admin }: { admin: boolean }) {
  const p = usePathname();
  const emConfig = CONFIGURACOES.some(([href]) => p.startsWith(href));
  return (
    <nav aria-label="Telas">
      {ITENS.filter(([, , soAdmin]) => admin || !soAdmin).map(([href, nome]) => (
        <Link key={href} href={href} aria-current={p.startsWith(href) ? "page" : undefined}>
          {nome}
        </Link>
      ))}
      {admin && (
        <Link href="/app/configuracoes" aria-current={emConfig ? "page" : undefined}>
          Configurações
        </Link>
      )}
      <Link href="/" target="_blank">
        Roadmap público ↗
      </Link>
    </nav>
  );
}

/** Abas no topo das telas de Configurações. */
export function AbasConfiguracoes() {
  const p = usePathname();
  return (
    <nav className="filtros abas-config" aria-label="Configurações">
      {CONFIGURACOES.map(([href, nome]) => (
        <Link key={href} href={href} aria-current={p.startsWith(href)}>
          {nome}
        </Link>
      ))}
    </nav>
  );
}
