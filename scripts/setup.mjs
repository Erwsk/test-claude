/**
 * Prépare l'environnement local avant `npm run dev` / `npm run build`.
 *
 * Sans cette étape, un clone neuf démarre sans DATABASE_URL ni base SQLite, et
 * chaque page renvoie une erreur Prisma : le premier lancement doit fonctionner
 * sans avoir à lire le README.
 *
 * Le script est idempotent et ne touche jamais à une base distante : il
 * s'interrompt dès que DATABASE_URL ne pointe pas vers un fichier SQLite local.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cheminEnv = resolve(racine, ".env");
const cheminExemple = resolve(racine, ".env.example");

function log(message) {
  console.log(`[setup] ${message}`);
}

if (!existsSync(cheminEnv)) {
  copyFileSync(cheminExemple, cheminEnv);
  log(".env créé à partir de .env.example");
}

/** Lit DATABASE_URL sans dépendre du chargement d'environnement de Next.js. */
function lireUrlBase() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const contenu = readFileSync(cheminEnv, "utf8");
  const ligne = contenu.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
  return ligne ? ligne[1].trim().replace(/^["']|["']$/g, "") : null;
}

const urlBase = lireUrlBase();

if (!urlBase) {
  console.error("[setup] DATABASE_URL est absent de .env — impossible de préparer la base.");
  process.exit(1);
}

// Une base distante (PostgreSQL en production) se migre explicitement, jamais ici.
if (!urlBase.startsWith("file:")) {
  log(`base distante détectée (${urlBase.split(":")[0]}) — synchronisation ignorée`);
  process.exit(0);
}

const cheminBase = resolve(racine, "prisma", urlBase.slice("file:".length));

if (existsSync(cheminBase)) {
  log("base SQLite déjà présente");
  process.exit(0);
}

log("création de la base SQLite locale…");
execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  cwd: racine,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: urlBase },
});
log("base prête. Jeu de démonstration : npm run db:seed");
