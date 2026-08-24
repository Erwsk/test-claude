"use client";

/** Dernier recours : une erreur survenue dans le layout racine, hors de son arbre React. */
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "2.5rem 1.5rem",
          color: "#1b2029",
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>L&apos;application n&apos;a pas pu démarrer</h1>
        <p style={{ color: "#4c5567", fontSize: "0.875rem" }}>
          Vérifiez que la base est initialisée (<code>npm run setup</code>), puis relancez le serveur.
        </p>
        {error.digest && (
          <p style={{ color: "#8d96a8", fontSize: "0.75rem" }}>Référence : {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            background: "#e8791a",
            color: "white",
            border: 0,
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
