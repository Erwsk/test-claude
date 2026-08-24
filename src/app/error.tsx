"use client";

import { useEffect } from "react";

/**
 * Filet de sécurité côté navigateur : sans lui, la moindre erreur serveur
 * affiche une page blanche ou une stack Prisma illisible pour un artisan.
 */
export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const baseAbsente =
    /DATABASE_URL|does not exist|Unable to open the database|PrismaClientInitializationError/i.test(
      error.message,
    );

  return (
    <div className="mx-auto max-w-xl py-10">
      <h1 className="text-xl font-semibold">Cette page n&apos;a pas pu s&apos;afficher</h1>

      {baseAbsente ? (
        <div className="mt-3 space-y-3 text-sm text-ardoise-600">
          <p>La base de données locale n&apos;est pas initialisée. Dans un terminal :</p>
          <pre className="overflow-x-auto rounded-lg bg-ardoise-900 p-3 text-xs text-white">
            npm run setup{"\n"}npm run db:seed <span className="text-ardoise-400"># optionnel</span>
          </pre>
          <p>Puis relancez le serveur avec <code className="rounded bg-ardoise-100 px-1">npm run dev</code>.</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ardoise-600">
          Une erreur inattendue s&apos;est produite. Le détail est disponible dans la console.
        </p>
      )}

      {error.digest && <p className="mt-3 text-xs text-ardoise-400">Référence : {error.digest}</p>}

      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-chantier-500 px-4 py-2 text-sm font-medium text-white hover:bg-chantier-600"
      >
        Réessayer
      </button>
    </div>
  );
}
