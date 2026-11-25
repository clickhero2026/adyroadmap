// Ícones simples (traço) para cada área do roadmap. Área sem ícone usa um círculo.
const PATHS: Record<string, React.ReactNode> = {
  "Criação com IA": (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z" />
      <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  "Campanhas de anúncios": (
    <>
      <path d="M3 10.5v3a1 1 0 001 1h2.5L12 19V5L6.5 9.5H4a1 1 0 00-1 1z" />
      <path d="M15.5 9a3.5 3.5 0 010 6" />
      <path d="M18 6a7.5 7.5 0 010 12" />
    </>
  ),
  "Redes sociais": (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </>
  ),
  "Clientes e vendas": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <path d="M16 4.6a3.5 3.5 0 010 6.8" />
      <path d="M18 14.2a6 6 0 013.5 5.8" />
    </>
  ),
  Desempenho: (
    <>
      <path d="M4 20v-8" />
      <path d="M10 20V5" />
      <path d="M16 20v-6" />
      <path d="M21 20H3" />
    </>
  ),
  "Marca e identidade": (
    <>
      <path d="M12 3a9 9 0 100 18c.9 0 1.5-.7 1.5-1.5 0-1-1-1.4-1-2.3 0-.8.7-1.3 1.5-1.3H16a5 5 0 005-5C21 6.6 17 3 12 3z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
  "Google e presença online": (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20.5 20.5L16 16" />
    </>
  ),
  "Assistente do ady": <path d="M21 12a8.5 8.5 0 01-12.3 7.6L3.5 21l1.3-4.8A8.5 8.5 0 1121 12z" />,
  "Parceiros e várias marcas": (
    <>
      <path d="M9 12h6" />
      <path d="M8 7.5H6.5a4.5 4.5 0 000 9H8" />
      <path d="M16 7.5h1.5a4.5 4.5 0 010 9H16" />
    </>
  ),
  "Conta, planos e pagamentos": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6.5 15h3" />
    </>
  ),
  "Experiência do app": (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  "Comercial e operação": (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A2.5 2.5 0 0111.5 3h1A2.5 2.5 0 0115 5.5V7" />
      <path d="M3 12.5h18" />
    </>
  ),
};

export function IconeArea({ area, size = 22 }: { area: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[area] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
