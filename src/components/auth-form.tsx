"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { masuk, type FormState } from "@/app/auth/actions";

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20";

function Field(props: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        required
        className={inputClass}
      />
      {props.hint && <span className="mt-1 block text-xs text-muted">{props.hint}</span>}
    </label>
  );
}

function Message({ state, galat }: { state: FormState; galat?: string | null }) {
  const error = state.error ?? (galat === "konfirmasi" ? "Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Silakan masuk atau daftar ulang." : null);
  if (error)
    return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (state.info)
    return <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{state.info}</p>;
  return null;
}

const buttonClass =
  "brand-gradient w-full rounded-md px-4 py-3 font-semibold text-white disabled:opacity-60";

export function MasukForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(masuk, {});
  return (
    <form action={action} className="space-y-4">
      <Message state={state} galat={params.get("galat")} />
      <input type="hidden" name="lanjut" value={params.get("lanjut") ?? ""} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} />
      <Field label="Kata sandi" name="password" type="password" autoComplete="current-password" />
      <button disabled={pending} className={buttonClass}>{pending ? "Memproses…" : "Masuk"}</button>
      <p className="text-center text-sm text-muted">
        <Link href="/" className="font-semibold text-brand-orange">← Kembali ke katalog</Link>
      </p>
    </form>
  );
}
