import Link from "next/link";
import type { Metadata } from "next";
import { doSignup } from "../actions";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Ouvrir un compte professionnel", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-2">Ouvrir un compte professionnel</h1>
      <p className="text-gray-500 text-sm mb-6">Boutique réservée aux entreprises. Chaque demande est vérifiée par notre équipe (généralement sous 24 h ouvrées).</p>
      {sp.ok ? (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-4 text-green-800">
          Demande envoyée ! Vous recevrez un email dès l&apos;ouverture de votre compte.
          <div className="mt-2"><Link className="underline" href="/outils">Parcourir le catalogue en attendant</Link></div>
        </div>
      ) : (
        <>
          {sp.err && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.err}</p>}
          <SignupForm action={doSignup} />
          <p className="mt-6 text-sm text-gray-500">Déjà client ? <Link href="/compte/connexion" className="underline">Se connecter</Link></p>
        </>
      )}
    </div>
  );
}
