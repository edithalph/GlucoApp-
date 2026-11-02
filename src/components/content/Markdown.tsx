import type { ReactNode } from "react";

/**
 * Rendu Markdown minimal, suffisant pour les articles de la bibliothèque
 * (titres, paragraphes, listes, citations, gras).
 *
 * Le texte est rendu via des nœuds React, jamais via `dangerouslySetInnerHTML` :
 * même si le contenu vient de notre propre seed aujourd'hui, un article édité
 * plus tard ne pourra pas injecter de HTML.
 */

/** Découpe une ligne en segments, en traitant `**gras**`. */
function inline(texte: string): ReactNode[] {
  return texte.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**") ? (
      <strong key={i} className="font-semibold text-on-surface">
        {seg.slice(2, -2)}
      </strong>
    ) : (
      seg
    ),
  );
}

export function Markdown({ source }: { source: string }) {
  const lignes = source.split("\n");
  const blocs: ReactNode[] = [];

  let listeEnCours: string[] = [];
  let paragrapheEnCours: string[] = [];

  function viderListe() {
    if (listeEnCours.length === 0) return;
    blocs.push(
      <ul
        key={`ul-${blocs.length}`}
        className="flex list-disc flex-col gap-2 pl-5 font-body-lg text-body-lg text-on-surface-variant"
      >
        {listeEnCours.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    listeEnCours = [];
  }

  function viderParagraphe() {
    if (paragrapheEnCours.length === 0) return;
    blocs.push(
      <p
        key={`p-${blocs.length}`}
        className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant"
      >
        {inline(paragrapheEnCours.join(" "))}
      </p>,
    );
    paragrapheEnCours = [];
  }

  for (const ligne of lignes) {
    const l = ligne.trim();

    if (l === "") {
      viderListe();
      viderParagraphe();
      continue;
    }

    if (l.startsWith("### ")) {
      viderListe();
      viderParagraphe();
      blocs.push(
        <h3
          key={`h3-${blocs.length}`}
          className="mt-stack-md font-title-lg text-title-lg text-on-background"
        >
          {inline(l.slice(4))}
        </h3>,
      );
      continue;
    }

    if (l.startsWith("## ")) {
      viderListe();
      viderParagraphe();
      blocs.push(
        <h2
          key={`h2-${blocs.length}`}
          className="mt-stack-lg font-headline-md text-headline-md text-on-background"
        >
          {inline(l.slice(3))}
        </h2>,
      );
      continue;
    }

    if (l.startsWith("> ")) {
      viderListe();
      viderParagraphe();
      blocs.push(
        <blockquote
          key={`bq-${blocs.length}`}
          className="rounded-xl border-l-4 border-primary-fixed-dim bg-surface-container-low p-4 font-body-md text-body-md italic text-on-surface-variant"
        >
          {inline(l.slice(2))}
        </blockquote>,
      );
      continue;
    }

    if (l.startsWith("- ")) {
      viderParagraphe();
      listeEnCours.push(l.slice(2));
      continue;
    }

    viderListe();
    paragrapheEnCours.push(l);
  }

  viderListe();
  viderParagraphe();

  return <div className="flex flex-col gap-stack-md">{blocs}</div>;
}
