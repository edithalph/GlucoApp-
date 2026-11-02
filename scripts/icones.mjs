#!/usr/bin/env node
/**
 * Recense les icônes Material Symbols réellement utilisées, puis régénère le
 * sous-ensemble auto-hébergé.
 *
 * Pourquoi ce script : la police n'embarque que les glyphes demandés. Une
 * icône employée dans le code mais absente du sous-ensemble ne déclenche
 * aucune erreur — le navigateur affiche simplement son nom en toutes lettres.
 * C'est exactement ce qui est arrivé à `visibility`, référencée via une
 * expression ternaire qu'une recherche sur `name="…"` ne voyait pas.
 *
 * Méthode : on relève TOUTES les chaînes en minuscules-souligné du code source,
 * puis on ne garde que celles qui figurent dans la liste officielle des
 * glyphes. Aucune heuristique sur la forme de l'appel, donc rien à oublier.
 *
 *   node scripts/icones.mjs --liste     affiche les icônes détectées
 *   node scripts/icones.mjs --verifier  échoue si le sous-ensemble est périmé
 *   node scripts/icones.mjs             régénère la police
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";

const RACINE = "src";
const CODEPOINTS = "scripts/material-symbols.codepoints";
const POLICE = "public/fonts/material-symbols-subset.woff2";
const MANIFESTE = "scripts/icones-utilisees.json";
const CSS = "src/app/globals.css";
const LAYOUT = "src/app/layout.tsx";

/**
 * L'URL de la police porte une empreinte de son contenu.
 *
 * Sans cela, un visiteur ayant déjà chargé une version antérieure conserve son
 * exemplaire en cache : toute icône ajoutée ensuite s'affiche chez lui en
 * toutes lettres, alors que le fichier sur le serveur est correct. Vérifié en
 * navigateur — police fraîche : glyphe rendu ; police en cache : texte brut.
 */
function empreinte(buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 8);
}

function reecrireUrlPolice(hash) {
  for (const fichier of [CSS, LAYOUT]) {
    const avant = readFileSync(fichier, "utf8");
    const apres = avant.replace(
      /\/fonts\/material-symbols-subset\.woff2(\?v=[a-f0-9]+)?/g,
      `/fonts/material-symbols-subset.woff2?v=${hash}`,
    );
    if (avant !== apres) writeFileSync(fichier, apres);
  }
}

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return [".ts", ".tsx"].includes(extname(chemin)) ? [chemin] : [];
  });
}

/** Noms de glyphes officiels, pour écarter les faux positifs. */
const officiels = new Set(
  readFileSync(CODEPOINTS, "utf8")
    .split("\n")
    .map((l) => l.split(" ")[0])
    .filter(Boolean),
);

// Toute chaîne littérale du code, quelle que soit la façon dont elle est passée.
const candidates = new Set();
for (const f of fichiers(RACINE)) {
  const source = readFileSync(f, "utf8");
  for (const m of source.matchAll(/["'`]([a-z][a-z0-9_]{2,40})["'`]/g)) {
    if (officiels.has(m[1])) candidates.add(m[1]);
  }
}

const utilisees = [...candidates].sort();

if (process.argv.includes("--liste")) {
  console.log(`${utilisees.length} icônes détectées :`);
  console.log(utilisees.join(", "));
  process.exit(0);
}

if (process.argv.includes("--verifier")) {
  let precedent = [];
  try {
    precedent = JSON.parse(readFileSync(MANIFESTE, "utf8")).icones;
  } catch {
    console.error("Manifeste absent : lancez `node scripts/icones.mjs`.");
    process.exit(1);
  }
  const hashAttendu = JSON.parse(readFileSync(MANIFESTE, "utf8")).empreinte;
  const hashReel = empreinte(readFileSync(POLICE));
  if (hashAttendu !== hashReel) {
    console.error("La police ne correspond pas au manifeste. Lancez `node scripts/icones.mjs`.");
    process.exit(1);
  }
  if (!readFileSync(CSS, "utf8").includes(`?v=${hashReel}`)) {
    console.error("L'URL de la police dans globals.css ne porte pas l'empreinte courante.");
    process.exit(1);
  }

  const manquantes = utilisees.filter((i) => !precedent.includes(i));
  if (manquantes.length > 0) {
    console.error(
      `Sous-ensemble périmé. Icônes utilisées mais absentes : ${manquantes.join(", ")}`,
    );
    console.error("Corrigez avec : node scripts/icones.mjs");
    process.exit(1);
  }
  console.log(`Sous-ensemble à jour (${utilisees.length} icônes).`);
  process.exit(0);
}

// --- Régénération ----------------------------------------------------------
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const axes =
  "opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
const url =
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:${axes}` +
  `&icon_names=${utilisees.join(",")}&display=block`;

const css = await fetch(url, { headers: { "User-Agent": UA } }).then((r) =>
  r.text(),
);
const urlPolice = css.match(/https:\/\/fonts\.gstatic\.com[^)]*/)?.[0];
if (!urlPolice) {
  console.error("Impossible d'obtenir l'URL de la police :\n", css.slice(0, 300));
  process.exit(1);
}

const woff2 = Buffer.from(
  await fetch(urlPolice, { headers: { "User-Agent": UA } }).then((r) =>
    r.arrayBuffer(),
  ),
);
if (woff2.length < 20000) {
  console.error(`Police suspecte (${woff2.length} octets).`);
  process.exit(1);
}

const hash = empreinte(woff2);
writeFileSync(POLICE, woff2);
reecrireUrlPolice(hash);
writeFileSync(
  MANIFESTE,
  JSON.stringify(
    { icones: utilisees, octets: woff2.length, empreinte: hash },
    null,
    2,
  ) + "\n",
);
console.log(
  `${utilisees.length} icônes · ${(woff2.length / 1024).toFixed(0)} Ko · empreinte ${hash}`,
);
