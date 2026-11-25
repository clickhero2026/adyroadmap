import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";

export default async function Configuracoes() {
  await exigirAdmin();
  redirect("/app/areas");
}
