"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  ["/app/tarefas", "Tarefas"],
  ["/app/diretores", "Diretores"],
  ["/app/roadmap", "Roadmap interno"],
] as const;

export function Nav() {
  const p = usePathname();
  return (
    <nav aria-label="Telas">
      {ITENS.map(([href, nome]) => (
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

/** Select que salva assim que muda (usado no quadro de tarefas). */
export function SelectAutoEnvio(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
