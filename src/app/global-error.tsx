"use client";

/**
 * Dernier filet : capture les erreurs survenant dans le layout racine lui-même.
 * À ce niveau, ni les polices ni la feuille de style ne sont garanties, d'où
 * les styles en ligne et le HTML complet.
 */
export default function GlobalError({
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
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#F4F8FA",
          color: "#173B57",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
            GlucoApp est momentanément indisponible
          </h1>
          <p style={{ color: "#526A7B", lineHeight: 1.6, marginBottom: 24 }}>
            Une erreur a interrompu le chargement. Vos données enregistrées ne
            sont pas affectées.
          </p>
          {error.digest && (
            <p style={{ color: "#526A7B", fontSize: 12, marginBottom: 24 }}>
              Référence : {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              height: 56,
              border: "none",
              borderRadius: 14,
              background: "#173B57",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
