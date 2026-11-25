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
          <Nav admin={u.papel === "admin"} />
          <div className="usuario">
            {u.nome}
            {u.papel === "diretor" && <span className="badge mute">Diretor</span>}
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
