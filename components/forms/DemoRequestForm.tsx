"use client";

import { useId, useState } from "react";
import { profiles, validateDemoRequest, type FieldErrors } from "@/lib/demo-request";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

function Field({
  label,
  name,
  error,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.25em] text-bone/60">
        {label}
        {!required && <span className="normal-case tracking-normal text-bone/40"> (facultatif)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="border-b border-bone/25 bg-transparent py-3 text-lg text-bone outline-none transition-colors focus:border-bone"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-[#e8a48a]">
          {error}
        </p>
      )}
    </div>
  );
}

export function DemoRequestForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const profileId = useId();
  const messageId = useId();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, unknown>;
    payload.consent = form.get("consent") === "on";
    const { errors: found } = validateDemoRequest(payload);
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; errors?: FieldErrors };
      if (res.ok && json.ok) setStatus({ kind: "sent" });
      else {
        if (json.errors) setErrors(json.errors);
        setStatus({ kind: "error", message: json.error ?? "Vérifiez les champs signalés." });
      }
    } catch {
      setStatus({ kind: "error", message: "Connexion impossible. Merci de réessayer." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="border-t border-bone/15 pt-10">
        <p className="display text-4xl">Merci, votre demande est bien transmise.</p>
        <p className="mt-4 text-bone/65">Nous revenons vers vous pour organiser une démonstration adaptée à vos biens.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 md:grid-cols-2">
      <Field label="Nom" name="name" error={errors.name} autoComplete="name" />
      <Field label="Société" name="company" error={errors.company} autoComplete="organization" />
      <Field label="E-mail professionnel" name="email" type="email" error={errors.email} autoComplete="email" />
      <Field label="Téléphone" name="phone" type="tel" required={false} error={errors.phone} autoComplete="tel" />
      <div className="flex flex-col gap-2">
        <label htmlFor={profileId} className="text-xs uppercase tracking-[0.25em] text-bone/60">
          Activité
        </label>
        <select
          id={profileId}
          name="profile"
          defaultValue=""
          aria-invalid={!!errors.profile}
          className="border-b border-bone/25 bg-ink py-3 text-lg text-bone outline-none focus:border-bone"
        >
          <option value="" disabled>
            Sélectionnez…
          </option>
          {profiles.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        {errors.profile && <p className="text-sm text-[#e8a48a]">{errors.profile}</p>}
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <label htmlFor={messageId} className="text-xs uppercase tracking-[0.25em] text-bone/60">
          Vos biens et vos besoins <span className="normal-case tracking-normal text-bone/40">(facultatif)</span>
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={4}
          className="resize-none border-b border-bone/25 bg-transparent py-3 text-lg text-bone outline-none focus:border-bone"
        />
      </div>
      {/* Champ piège anti-robots */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Site web <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-bone/70 md:col-span-2">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[#f3eee6]" />
        J’accepte qu’IMERSA utilise ces informations pour me recontacter au sujet de ma demande.
      </label>
      {errors.consent && <p className="-mt-6 text-sm text-[#e8a48a] md:col-span-2">{errors.consent}</p>}
      <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center">
        <button type="submit" disabled={status.kind === "sending"} className="btn btn-solid disabled:opacity-60">
          {status.kind === "sending" ? "Envoi…" : "Envoyer la demande"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-[#e8a48a]">
          {status.kind === "error" ? status.message : ""}
        </p>
      </div>
    </form>
  );
}
