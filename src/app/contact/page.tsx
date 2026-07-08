"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSending(false);
    if (res.ok) setDone(true);
    else setError("Une erreur est survenue, veuillez réessayer.");
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-2xl font-semibold mb-3">Message envoyé</p>
        <p className="text-gray-500">Nous vous répondrons dans les meilleurs délais.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-2">Contact</h1>
      <p className="text-gray-500 mb-10">Une question sur une machine, un projet ou une commande ? Écrivez-nous.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[{ label: "Nom *", name: "nom", required: true }, { label: "Email *", name: "email", required: true }].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.name === "email" ? "email" : "text"} name={f.name}
                value={form[f.name as keyof typeof form]} onChange={handleChange}
                required={f.required}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
          <input
            type="text" name="sujet" value={form.sujet} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea
            name="message" required rows={5} value={form.message} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit" disabled={sending}
          className="bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-3">Nous joindre directement</p>
        <p className="mb-1">
          <a href="mailto:contact@rmotion.fr" className="hover:text-gray-900">contact@rmotion.fr</a>
        </p>
        <p>
          <a href="tel:+33781492685" className="hover:text-gray-900">+33 7 81 49 26 85</a>
        </p>
      </div>
    </div>
  );
}
