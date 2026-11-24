// Hash de senha com scrypt (nativo do Node), formato "scrypt$salt$hash" em base64.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashSenha(senha) {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function conferirSenha(senha, guardado) {
  const [alg, salt, hash] = String(guardado).split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const calculado = scryptSync(senha, Buffer.from(salt, "base64"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}
