import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const store = getStore("escalas");

  // Leitura: qualquer pessoa pode ver a escala
  if (req.method === "GET") {
    return json((await store.get("config", { type: "json" })) || {});
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return json({ error: "método não permitido" }, 405);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: "json inválido" }, 400); }

  // A senha é conferida AQUI, no servidor (variável de ambiente EDIT_PASSWORD)
  const expected = (Netlify.env.get("EDIT_PASSWORD") || "").trim();
  if (!expected || String(body.password || "").trim() !== expected) {
    // "configured" só diz se a variável existe (não revela a senha)
    return json({ error: "senha incorreta", configured: !!expected }, 401);
  }

  // POST = só confere a senha
  if (req.method === "POST") return json({ ok: true });

  // PUT = grava a configuração
  const cfg = body.config;
  if (!cfg || typeof cfg !== "object" || JSON.stringify(cfg).length > 200000) {
    return json({ error: "dados inválidos" }, 400);
  }
  await store.setJSON("config", cfg);
  return json({ ok: true });
};

export const config = { path: "/api/escalas" };
