"use client";
// Recarrega os dados da tela a cada poucos segundos (usado enquanto o QR do WhatsApp aguarda leitura).
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AtualizarSozinho({ segundos = 3 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}
