import Link from "next/link";
import type { Metadata } from "next";
import { requestLink } from "../actions";
import TurnstileField from "../TurnstileField";

export const metadata: Metadata = { title: "Connexion espace pro", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Espace professionnel</h1>
      <p className="text-gray-500 mb-6 text-sm">Pas de mot de passe : saisissez votre email, nous vous envoyons un lien de connexion sécurisé.</p>
      {sp.err && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.err}</p>}
      {sp.envoye ? (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Si un compte existe pour cette adresse, un lien de connexion vient d&apos;être envoyé. Il est valable 20 minutes. Pensez à vérifier vos indésirables.
          <div className="mt-2"><Link href="/compte/connexion" className="underline">Renvoyer un lien</Link></div>
        </div>
      ) : (
        <form action={requestLink} className="space-y-3">
          <input type="hidden" name="next" value={sp.next || "/compte"} />
          <input name="email" type="email" required autoComplete="email" placeholder="vous@societe.fr" className="w-full rounded border border-gray-300 px-3 py-2" />
          <TurnstileField />
          <button className="w-full rounded bg-gray-900 py-2 text-white hover:bg-gray-700">Recevoir mon lien de connexion</button>
        </form>
      )}
      <p className="mt-8 text-sm text-gray-500">Pas encore client ? <Link href="/compte/inscription" className="underline">Ouvrir un compte professionnel</Link></p>
    </div>
  );
}
