import { NextResponse } from "next/server";
import { validateDemoRequest } from "@/lib/demo-request";

/**
 * Réception des demandes de démonstration.
 *
 * La transmission est déléguée à un webhook configurable
 * (DEMO_REQUEST_WEBHOOK_URL : CRM, automatisation, messagerie…).
 * Sans configuration, la demande n'est pas perdue silencieusement :
 * l'API répond 503 et l'interface propose un autre moyen de contact.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // Champ piège anti-robots : invisible pour les visiteurs.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const { data, errors } = validateDemoRequest(body);
  if (!data) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const webhook = process.env.DEMO_REQUEST_WEBHOOK_URL;
  if (!webhook) {
    console.error("[demo-request] DEMO_REQUEST_WEBHOOK_URL n'est pas configurée : demande non transmise.");
    return NextResponse.json(
      { ok: false, error: "Le service de demande de démonstration n’est pas encore configuré." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "demo-request", receivedAt: new Date().toISOString(), ...data }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Webhook ${res.status}`);
  } catch (error) {
    console.error("[demo-request] Échec de transmission", error);
    return NextResponse.json(
      { ok: false, error: "La demande n’a pas pu être transmise. Merci de réessayer." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
