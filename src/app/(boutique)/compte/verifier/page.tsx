import type { Metadata } from "next";
import { verifyLink } from "../actions";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

// Page intermédiaire : le jeton n'est consommé qu'au clic (POST), pour que les
// antivirus de messagerie qui pré-ouvrent les liens ne le « brûlent » pas.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-6">Connexion à votre espace</h1>
      <form action={verifyLink}>
        <input type="hidden" name="token" value={sp.token || ""} />
        <input type="hidden" name="next" value={sp.next || "/compte"} />
        <button className="rounded bg-gray-900 px-8 py-3 text-white hover:bg-gray-700">Se connecter</button>
      </form>
    </div>
  );
}
