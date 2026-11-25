"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  ["/app/tarefas", "Tarefas", true],
  ["/app/diretores", "Diretores", false],
  ["/app/roadmap", "Roadmap interno", false],
  ["/app/usuarios", "Usuários", true],
] as const;

export function Nav({ admin }: { admin: boolean }) {
  const p = usePathname();
  return (
    <nav aria-label="Telas">
      {ITENS.filter(([, , soAdmin]) => admin || !soAdmin).map(([href, nome]) => (
        <Link key={href} href={href} aria-current={p.startsWith(href) ? "page" : undefined}>
          {nome}
        </Link>
      ))}
      <Link href="/" target="_blank">
        Roadmap público ↗
      </Link>
    </nav>
  );
}
