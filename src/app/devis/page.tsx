"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function DevisForm() {
  const params = useSearchParams();
  const router = useRouter();
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
      body: JSON.stringify({ ...form, machine_id: machineId || null }),
    });
    setSending(false);
    if (res.ok) setDone(true);
    else setError("Une erreur est survenue, veuillez réessayer.");
  };

  if (done) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl font-semibold mb-3">Demande envoyée</p>
        <p className="text-gray-500 mb-8">Nous vous recontacterons dans les 24h.</p>
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-900">← Retour à l&apos;accueil</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Field label="Nom *" name="nom" value={form.nom} onChange={handleChange} required />
        <Field label="Société" name="societe" value={form.societe} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Field label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
      </div>
      <Field label="Machine concernée" name="machine_name" value={form.machine_name} onChange={handleChange} placeholder="ex. LaserPro 6040 ou laissez vide" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea
          name="message" required rows={5} value={form.message} onChange={handleChange}
          placeholder="Décrivez votre besoin, matériaux à travailler, volumes envisagés…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit" disabled={sending}
        className="bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {sending ? "Envoi…" : "Envoyer la demande"}
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
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Demande de devis</h1>
      <p className="text-gray-500 mb-10">Remplissez ce formulaire et nous vous recontactons sous 24h avec une proposition adaptée à votre budget.</p>
      <Suspense><DevisForm /></Suspense>
    </div>
  );
}
