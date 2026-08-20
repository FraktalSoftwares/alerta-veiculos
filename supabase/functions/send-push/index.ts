// Edge function: drena a fila de vehicle_alerts (push_status='pending') e envia
// push via FCM HTTP v1 para os usuários que optaram por aquele alerta NAQUELE veículo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LABELS: Record<string, string> = {
  ignicao_ligada: "Ignição ligada",
  ignicao_desligada: "Ignição desligada",
  movimento: "Rastreador em movimento",
  limite_velocidade: "Limite de velocidade",
  cerca_violada: "Cerca violada",
  bateria_fraca: "Bateria fraca",
  desconectado: "Desconectado da energia",
};

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlStr = (str: string) => b64url(new TextEncoder().encode(str));

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8", der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
}

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64urlStr(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("Falha OAuth FCM: " + JSON.stringify(j));
  return j.access_token;
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT")!);
  const projectId = sa.project_id;
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // 1) pega um lote de alertas pendentes (a "fila")
  const { data: alerts, error } = await admin
    .from("vehicle_alerts")
    .select("id, vehicle_id, alert_type, created_at")
    .eq("push_status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) return new Response("erro fila: " + error.message, { status: 500 });
  if (!alerts?.length) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

  const token = await getAccessToken(sa);
  let sent = 0, skipped = 0;

  for (const a of alerts) {
    try {
      const col = a.alert_type; // colunas de vehicle_alert_preferences = mesmos nomes
      // veículo (placa/desc para a mensagem)
      const { data: v } = await admin.from("vehicles")
        .select("plate, brand, model").eq("id", a.vehicle_id).maybeSingle();
      // usuários que optaram por esse alerta NESTE veículo
      const { data: prefs } = await admin.from("vehicle_alert_preferences")
        .select("user_id").eq("vehicle_id", a.vehicle_id).eq(col, true);
      const userIds = (prefs ?? []).map((p: any) => p.user_id);
      if (!userIds.length) { await mark(admin, a.id, "skipped"); skipped++; continue; }
      const { data: profs } = await admin.from("profiles")
        .select("id, fcm_token").in("id", userIds).not("fcm_token", "is", null);
      const tokens = (profs ?? []).map((p: any) => p.fcm_token).filter(Boolean);
      if (!tokens.length) { await mark(admin, a.id, "skipped"); skipped++; continue; }

      const desc = [v?.brand, v?.model].filter(Boolean).join(" ").trim();
      const title = LABELS[a.alert_type] ?? "Alerta";
      const body = `${desc ? desc + " " : ""}placa ${v?.plate ?? "-"}`;

      for (const t of tokens) {
        const r = await fetch(fcmUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: {
            token: t,
            notification: { title, body },
            data: { alert_type: a.alert_type, vehicle_id: a.vehicle_id },
            apns: { headers: { "apns-priority": "10" } },
          }}),
        });
        if (r.status === 404) {
          // token inválido → limpa
          await admin.from("profiles").update({ fcm_token: null }).eq("fcm_token", t);
        }
      }
      await mark(admin, a.id, "sent");
      sent++;
    } catch (e) {
      await admin.from("vehicle_alerts")
        .update({ push_status: "failed", push_attempts: 1 }).eq("id", a.id);
    }
  }
  return new Response(JSON.stringify({ processed: alerts.length, sent, skipped }), {
    headers: { "Content-Type": "application/json" }, status: 200,
  });
});

async function mark(admin: any, id: string, status: string) {
  await admin.from("vehicle_alerts").update({ push_status: status }).eq("id", id);
}
