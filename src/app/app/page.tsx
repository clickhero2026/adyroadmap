import { redirect } from "next/navigation";
import { exigirUsuario, inicioDe } from "@/lib/auth";

export default async function App() {
  redirect(inicioDe(await exigirUsuario()));
}
