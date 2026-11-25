import { exigirUsuario } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  return (
    <>
      <header className="topbar">
        <div className="inner">
          <span className="marca">ady · roadmap</span>
          <Nav />
          <div className="usuario">
            {u.nome}
            <form action="/sair" method="post">
              <button className="link" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
