"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { localeFromPathname, localizeHref } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pixelTrack } from "@/lib/pixel";

// Coordonnées encodées en base64 : jamais en clair dans le HTML, décodées
// côté client uniquement après montage (invisibles pour les scrapers/SSR).
const EMAIL_B64 = "Y29udGFjdEBybW90aW9uLmZy";
const TEL_B64 = "KzMzNzgxNDkyNjg1";
const decode = (s: string) =>
  typeof window === "undefined" ? "" : window.atob(s);
// "+33781492685" -> "07 81 49 26 85" (affichage FR local, sans le +33)
const formatTel = (raw: string) => {
  const local = raw.replace(/^\+33/, "0");
  return local.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

function ContactBlock() {
  const t = getDictionary(localeFromPathname(usePathname())).devis;
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null; // rien à scraper dans le HTML serveur

  const email = decode(EMAIL_B64);
  const tel = decode(TEL_B64);
  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    window.location.href = href; // href construit au clic, jamais dans le DOM
  };

  return (
    <div className="mb-12 pb-8 border-b border-gray-200">
      <p className="text-3xl font-semibold text-gray-900 mb-4">{t.contactHeading}</p>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">{t.contactEmailLabel}</span>
          <a
            href="#"
            onClick={(e) => go(e, "mailto:" + email)}
            className="text-gray-900 underline underline-offset-2 hover:text-gray-600"
          >
            {email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">{t.contactPhoneLabel}</span>
          <a
            href="#"
            onClick={(e) => go(e, "tel:" + tel)}
            className="text-gray-900 underline underline-offset-2 hover:text-gray-600"
          >
            {formatTel(tel)}
          </a>
        </div>
      </div>
    </div>
  );
}

function DevisForm() {
  const params = useSearchParams();
  const router = useRouter();
  const locale = localeFromPathname(usePathname());
  const t = getDictionary(locale).devis;
  const machineId = params.get("machine") || "";
  const machineName = params.get("nom") || "";

  const [form, setForm] = useState({
    nom: "", societe: "", email: "", telephone: "",
    machine_name: machineName, message: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, machine_id: machineId || null, locale }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      pixelTrack("Lead", { content_name: form.machine_name || undefined });
    } else setError(t.error);
  };

  if (done) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl font-semibold mb-3">{t.successTitle}</p>
        <p className="text-gray-500 mb-8">{t.successText}</p>
        <button onClick={() => router.push(localizeHref("/", locale))} className="text-sm text-gray-500 hover:text-gray-900">{t.backHome}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={t.name} name="nom" value={form.nom} onChange={handleChange} required />
        <Field label={t.company} name="societe" value={form.societe} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={t.email} name="email" type="email" value={form.email} onChange={handleChange} required />
        <Field label={t.phone} name="telephone" value={form.telephone} onChange={handleChange} />
      </div>
      <Field label={t.machine} name="machine_name" value={form.machine_name} onChange={handleChange} placeholder={t.machinePlaceholder} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.message}</label>
        <textarea
          name="message" required rows={5} value={form.message} onChange={handleChange}
          placeholder={t.messagePlaceholder}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit" disabled={sending}
        className="bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {sending ? t.sending : t.send}
      </button>
    </form>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  );
}

export default function DevisPage() {
  const t = getDictionary(localeFromPathname(usePathname())).devis;
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <ContactBlock />
      <h1 className="text-3xl font-semibold mb-2">{t.title}</h1>
      <p className="text-gray-500 mb-10">{t.subtitle}</p>
      <Suspense><DevisForm /></Suspense>
    </div>
  );
}
