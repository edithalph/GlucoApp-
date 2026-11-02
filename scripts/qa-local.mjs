import fs from "node:fs";
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
if (!process.argv[2]) {
  console.log(
    "Usage: npm run qa:local -- signup|onboard|screens|actions|regressions|routing|public|performance|account",
  );
  console.log(
    "Les tests utilisent un compte dédié et des données de démonstration. Voir docs/TESTS-LOCAUX.md.",
  );
  process.exit(0);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir =
  process.env.GLUCO_QA_OUTPUT || path.join(os.tmpdir(), "glucoapp-qa");
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const accountPath = dir + "/account.json";
const account = fs.existsSync(accountPath)
  ? JSON.parse(fs.readFileSync(accountPath))
  : {
      email:
        "gluco.test." +
        new Date().toISOString().slice(0, 10).replaceAll("-", "") +
        "." +
        crypto.randomBytes(3).toString("hex") +
        "@example.com",
      password: "Gluco!" + crypto.randomBytes(12).toString("base64url") + "9a",
    };
fs.writeFileSync(accountPath, JSON.stringify(account), { mode: 0o600 });
const env = Object.fromEntries(
  fs
    .readFileSync(root + "/.env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
const base = process.env.GLUCO_QA_URL || "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname))
  throw new Error("Ce script est réservé aux tests locaux.");
const stage = process.argv[2] || "signup";
const results = [];
const nameFilter = process.env.GLUCO_QA_FILTER;
let browser, context, page;
let pageErrors = [];
let serverErrors = [];
function save() {
  fs.writeFileSync(
    dir + "/results-" + stage + (nameFilter ? "-filtered" : "") + ".json",
    JSON.stringify({ results, pageErrors, serverErrors }, null, 2),
  );
}
async function check(name, fn) {
  if (nameFilter && !name.includes(nameFilter)) return;
  const start = performance.now();
  try {
    const detail = await fn();
    const result = {
      name,
      pass: true,
      ms: Math.round(performance.now() - start),
      detail,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (e) {
    const result = {
      name,
      pass: false,
      ms: Math.round(performance.now() - start),
      error: e.message.slice(0, 700),
    };
    results.push(result);
    console.log(JSON.stringify(result));
    await page
      .screenshot({
        path: dir + "/failure-" + results.length + ".png",
        fullPage: true,
      })
      .catch(() => {});
  }
  save();
}
function assert(value, message) {
  if (!value) throw new Error(message);
}
async function go(path) {
  const r = await page.goto(base + path);
  assert(r.status() < 400, "HTTP " + r.status());
  await page.locator("main[aria-busy=true]").waitFor({ state: "hidden" });
  await page.locator("main:not([aria-busy])").waitFor();
  return r;
}
async function clickURL(button, pattern) {
  await button.click();
  await page.waitForURL(pattern, { timeout: 20000 });
}
async function ready() {
  await page.evaluate(() => document.fonts.ready);
}
async function init(storage) {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.GLUCO_QA_BROWSER === "chromium"
      ? {}
      : { channel: "chrome" }),
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...(storage && fs.existsSync(dir + "/storage.json")
      ? { storageState: dir + "/storage.json" }
      : {}),
  });
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Content Security Policy|Hydration failed|Minified React error/i.test(
        message.text(),
      )
    )
      pageErrors.push(message.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 500)
      serverErrors.push({ url: new URL(r.url()).pathname, status: r.status() });
  });
  if (storage && stage !== "public") {
    await login();
    await context.storageState({ path: dir + "/storage.json" });
  }
}
async function login() {
  await go("/connexion?suivant=/tableau-de-bord");
  await page.locator("[name=email]").fill(account.email);
  await page.locator("[name=password]").fill(account.password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL(
    (u) =>
      u.pathname.includes("tableau-de-bord") ||
      u.pathname.includes("profil-medical"),
    { timeout: 25000 },
  );
}
(async () => {
  if (stage === "account") {
    console.log(JSON.stringify({ email: account.email, path: accountPath }));
    return;
  }
  await init(stage !== "signup" && stage !== "onboard");
  if (stage === "signup") {
    await check("Inscription : validation et création du compte", async () => {
      await go("/inscription");
      assert(
        (await page
          .getByRole("button", { name: "Créer mon compte", exact: true })
          .count()) === 1,
        "Submit missing",
      );
      await page.locator("[name=email]").fill(account.email);
      await page.locator("[name=password]").fill(account.password);
      await page
        .getByRole("button", { name: "Afficher le mot de passe" })
        .click();
      assert(
        (await page.locator("[name=password]").getAttribute("type")) === "text",
        "Reveal not working",
      );
      await page
        .getByRole("button", { name: "Masquer le mot de passe" })
        .click();
      await page
        .getByRole("button", { name: "Créer mon compte", exact: true })
        .click();
      await Promise.race([
        page.getByText(/Compte créé/).waitFor({ timeout: 20000 }),
        page.waitForURL("**/onboarding/profil-medical/etape-1", {
          timeout: 20000,
        }),
      ]);
      return "Compte créé ; redirection ou confirmation vérifiée ; visibilité du mot de passe vérifiée";
    });
    console.log("ACCOUNT_EMAIL=" + account.email);
  }
  if (stage === "onboard") {
    await check("Connexion du nouveau compte", async () => {
      await login();
      return new URL(page.url()).pathname;
    });
    await check("Profil initial : champs, âge et sexe", async () => {
      await page.waitForURL("**/onboarding/profil-medical/etape-1");
      await page.locator("[name=first_name]").fill("Compte Test");
      await page.getByRole("button", { name: "Augmenter l'âge" }).click();
      assert(
        (await page.locator("[name=age]").inputValue()) === "46",
        "Age increase failed",
      );
      await page.getByRole("button", { name: "Diminuer l'âge" }).click();
      await page.getByRole("button", { name: "Homme", exact: true }).click();
      await page.getByRole("button", { name: "Femme", exact: true }).click();
      await page.locator("[name=weight_kg]").fill("72");
      await page.locator("[name=height_cm]").fill("168");
      await page.getByText(/Votre IMC/).waitFor();
      await clickURL(
        page.getByRole("button", { name: "Continuer" }),
        "**/etape-2",
      );
    });
    await check("Profil médical et ouverture du tableau de bord", async () => {
      await page.getByRole("radio", { name: /En prévention/ }).click();
      await clickURL(
        page.getByRole("button", { name: "Continuer" }),
        "**/tableau-de-bord",
      );
      await page
        .getByRole("heading", { name: /Bonjour, Compte Test/ })
        .waitFor();
      await context.storageState({ path: dir + "/storage.json" });
    });
  }
  if (stage === "screens") {
    const paths = [
      "/tableau-de-bord",
      "/glycemie",
      "/glycemie/saisie",
      "/poids/saisie",
      "/repas",
      "/repas/composer",
      "/the",
      "/the/session/nouvelle",
      "/conseils",
      "/profil",
      "/profil/rappels",
    ];
    for (const width of [1440, 390, 320, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths)
        await check("Écran " + path + " à " + width + "px", async () => {
          const start = performance.now();
          await go(path);
          await ready();
          const loaded = Math.round(performance.now() - start);
          assert(!page.url().includes("/connexion"), "Redirected to login");
          assert(
            !(await page
              .getByRole("heading", {
                name: /Une erreur|momentanément indisponible/,
              })
              .count()),
            "Error screen",
          );
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          );
          if (overflow) {
            const els = await page.evaluate(() =>
              [...document.querySelectorAll("main *")]
                .filter((e) => e.getBoundingClientRect().right > innerWidth + 2)
                .slice(0, 5)
                .map((e) => ({
                  tag: e.tagName,
                  text: e.textContent?.slice(0, 45),
                })),
            );
            throw new Error("Débordement horizontal : " + JSON.stringify(els));
          }
          await page.screenshot({
            path:
              dir +
              "/screen-" +
              path.replaceAll("/", "-") +
              "-" +
              width +
              ".png",
            fullPage: true,
          });
          return { loadMs: loaded };
        });
    }
  }
  if (stage === "actions") {
    await page.setViewportSize({ width: 390, height: 844 });
    const key = (name) => page.getByRole("button", { name, exact: true });
    async function digits(value) {
      for (const digit of value) await key(digit).click();
    }
    async function clearDigits() {
      for (let i = 0; i < 5; i++)
        await key("Effacer le dernier caractère").click();
    }
    await check(
      "Mesure : validation, effacement, contexte et journal enrichi",
      async () => {
        await go("/glycemie/saisie");
        assert(
          await key("Enregistrer la mesure").isDisabled(),
          "Empty value accepted",
        );
        await digits("0.1");
        assert(
          await key("Enregistrer la mesure").isDisabled(),
          "Out of range accepted",
        );
        await clearDigits();
        await digits("0.5");
        await page
          .getByRole("alert")
          .filter({ hasText: "Valeur très basse" })
          .waitFor();
        await clearDigits();
        await digits("2.5");
        await page
          .getByRole("alert")
          .filter({ hasText: "Valeur élevée" })
          .waitFor();
        await clearDigits();
        await digits("1.2");
        await key("Après repas").click();
        await key("Ajouter une note").click();
        await page
          .locator("[name=note]")
          .fill(
            "QA : mesure de démonstration, pas une donnée médicale réelle.",
          );
        await key("Ajouter du contexte").click();
        await page.locator("[name=activity_minutes]").fill("20");
        await page.locator("[name=sleep_hours]").fill("7.5");
        await page.locator("[name=stress_level]").selectOption("2");
        await page.locator("[name=medication_taken]").check();
        await page.locator("[name=symptoms]").fill("Aucun — test");
        const t = performance.now();
        await clickURL(key("Enregistrer la mesure"), "**/glycemie");
        await page
          .locator("main li")
          .first()
          .getByText("1,20", { exact: false })
          .waitFor();
        return { saveMs: Math.round(performance.now() - t) };
      },
    );
    for (const period of ["Aujourd'hui", "7 jours", "30 jours", "3 mois"])
      await check("Filtre glycémie : " + period, async () => {
        const nav = page.getByRole("navigation", { name: "Période" });
        await nav.getByRole("link", { name: period, exact: true }).click();
        await page.waitForFunction(
          (label) =>
            [...document.querySelectorAll('nav[aria-label="Période"] a')].some(
              (e) =>
                e.textContent.trim() === label &&
                e.getAttribute("aria-current") === "page",
            ),
          period,
        );
      });
    await check("Suppression mesure : annuler puis confirmer", async () => {
      await go("/glycemie");
      const before = await page
        .getByRole("button", { name: /^Supprimer le relevé/ })
        .count();
      assert(before > 0, "No reading");
      await page
        .getByRole("button", { name: /^Supprimer le relevé/ })
        .first()
        .click();
      await key("Annuler la suppression").click();
      assert(
        (await page
          .getByRole("button", { name: /^Supprimer le relevé/ })
          .count()) === before,
        "Cancellation removed data",
      );
      await page
        .getByRole("button", { name: /^Supprimer le relevé/ })
        .first()
        .click();
      await page
        .getByRole("button", { name: /^Confirmer la suppression/ })
        .click();
      await page.waitForFunction(
        (n) =>
          document.querySelectorAll('button[aria-label^="Supprimer le relevé"]')
            .length === n,
        before - 1,
      );
    });
    await check("Poids : saisie et mise à jour du profil", async () => {
      await go("/poids/saisie");
      await page.locator("[name=weight_kg]").fill("71.5");
      await clickURL(key("Enregistrer la pesée"), "**/tableau-de-bord");
      await go("/profil");
      await page.getByText("71.5 kg", { exact: true }).waitFor();
    });
    await check("Repas : recherche, portions et création", async () => {
      await go("/repas/composer");
      const input = page.getByRole("searchbox");
      await input.fill("introuvableqaz");
      await page.getByText(/Aucun aliment ne correspond/).waitFor();
      const t = performance.now();
      await input.fill("riz");
      const result = page
        .getByRole("button")
        .filter({ hasText: /Riz basmati/ })
        .first();
      await result.waitFor();
      const searchMs = Math.round(performance.now() - t);
      await result.click();
      await page.getByRole("button", { name: /Augmenter la quantité/ }).click();
      await page.getByText("125 g", { exact: true }).waitFor();
      await page.getByRole("button", { name: /Réduire la quantité/ }).click();
      await page.getByText("100 g", { exact: true }).waitFor();
      await input.fill("poulet");
      await page
        .getByRole("button")
        .filter({ hasText: /poulet/i })
        .first()
        .click();
      const start = performance.now();
      await clickURL(key("Voir l'impact"), "**/impact");
      account.mealId = new URL(page.url()).pathname.split("/")[2];
      fs.writeFileSync(accountPath, JSON.stringify(account), { mode: 0o600 });
      await page
        .getByRole("heading", { name: "Composition", exact: true })
        .waitFor();
      return { searchMs, saveMs: Math.round(performance.now() - start) };
    });
    await check("Repas : stratégies, retour et mesure liée", async () => {
      assert(account.mealId, "No meal ID");
      await go("/repas/" + account.mealId + "/compensation");
      await go("/repas/" + account.mealId + "/impact");
      await page.getByRole("link", { name: "Ajouter une mesure liée" }).click();
      await page.waitForURL("**/glycemie/saisie?mealId=*");
      await digits("1.4");
      const t = performance.now();
      await clickURL(key("Enregistrer la mesure"), "**/glycemie");
      return { saveMs: Math.round(performance.now() - t) };
    });
    await check("Repas : favori puis retrait", async () => {
      await go("/repas");
      await key("Ajouter aux favoris").first().click();
      await key("Retirer des favoris").first().waitFor();
      await key("Retirer des favoris").first().click();
      await key("Ajouter aux favoris").first().waitFor();
    });
    await check("Repas : duplication et suppression de la copie", async () => {
      await go("/repas");
      await clickURL(key("Dupliquer ce repas").first(), "**/impact");
      const duplicateId = new URL(page.url()).pathname.split("/")[2];
      assert(duplicateId !== account.mealId, "Same ID");
      await go("/repas");
      const row = page.locator("li").filter({
        has: page.locator('a[href="/repas/' + duplicateId + '/impact"]'),
      });
      await row.getByRole("button", { name: /^Supprimer/ }).click();
      await row.getByRole("button", { name: /^Confirmer/ }).click();
      await row.waitFor({ state: "detached" });
    });
    await check("Rappels : création, désactivation, réactivation", async () => {
      await go("/profil/rappels");
      await page.locator("[name=label]").fill("QA — mesure du matin");
      await page.locator("[name=kind]").selectOption("glucose");
      await page.locator("[name=time_of_day]").fill("07:30");
      await key("Ajouter").click();
      const row = page
        .locator("li")
        .filter({ hasText: "QA — mesure du matin" })
        .last();
      await row.waitFor();
      await row.getByRole("button", { name: "Actif", exact: true }).click();
      await row.getByRole("button", { name: "Inactif", exact: true }).waitFor();
      await row.getByRole("button", { name: "Inactif", exact: true }).click();
      await row.getByRole("button", { name: "Actif", exact: true }).waitFor();
    });
    await check("Unités : mg/dL, mmol/L, retour g/L", async () => {
      await go("/profil");
      const group = page.getByRole("radiogroup", {
        name: "Unité d'affichage de la glycémie",
      });
      for (const unit of ["mg/dL", "mmol/L", "g/L"]) {
        await group.getByRole("radio", { name: unit, exact: true }).click();
        await page.waitForFunction(
          (u) =>
            [...document.querySelectorAll("[role=radio]")].some(
              (e) =>
                e.textContent.trim() === u &&
                e.getAttribute("aria-checked") === "true",
            ),
          unit,
        );
      }
    });
    await check(
      "Conseils : filtres et lecture de tous les articles",
      async () => {
        await go("/conseils");
        const nav = page.getByRole("navigation", { name: "Catégories" });
        const hrefs = await nav
          .getByRole("link")
          .evaluateAll((a) => a.map((l) => l.getAttribute("href")));
        for (const href of hrefs) await go(href);
        await go("/conseils");
        const articles = await page
          .locator('main a[href^="/conseils/"]')
          .evaluateAll((a) => [
            ...new Set(a.map((l) => l.getAttribute("href"))),
          ]);
        assert(articles.length > 0, "No articles");
        for (const href of articles) {
          await go(href);
          assert(await page.locator("article").innerText(), "Empty article");
        }
        return { articles: articles.length };
      },
    );
    await check(
      "Thé : démarrer, marquer la prise et les trois mesures",
      async () => {
        await go("/the/session/nouvelle");
        await page.getByRole("radio").first().click();
        await page.locator("#champ-baseline_mgdl").fill("1.3");
        await clickURL(
          key("Démarrer la session"),
          /\/the\/session\/[a-f0-9-]+$/,
        );
        account.sessionId = new URL(page.url()).pathname.split("/")[3];
        fs.writeFileSync(accountPath, JSON.stringify(account), { mode: 0o600 });
        await key("J'ai bu mon thé").click();
        await page.locator("#champ-value_mgdl").waitFor();
        for (const [i, value] of ["1.25", "1.20", "1.15"].entries()) {
          await page.locator("#champ-value_mgdl").fill(value);
          await key("Enregistrer ma mesure").click();
          if (i < 2)
            await page
              .getByRole("status")
              .filter({
                hasText: "Mesure à +" + [30, 60][i] + " min enregistrée",
              })
              .waitFor();
          else await page.waitForURL("**/resume");
        }
        await page
          .getByRole("link", { name: /Retour/ })
          .first()
          .waitFor();
        return "Session complète ; saisies anticipées explicitement permises par l’interface";
      },
    );
    await check("Thé : supprimer la session terminée", async () => {
      await go("/the");
      const row = page.locator("li").filter({
        has: page.locator(
          'a[href="/the/session/' + account.sessionId + '/resume"]',
        ),
      });
      assert((await row.count()) > 0, "Completed session missing");
      await row.getByRole("button", { name: /^Supprimer/ }).click();
      await row.getByRole("button", { name: /^Confirmer/ }).click();
      await row.waitFor({ state: "detached" });
    });
    await check("Thé : terminer une session sans mesure", async () => {
      await go("/the/session/nouvelle");
      await page.getByRole("radio").first().click();
      await page.locator("#champ-baseline_mgdl").fill("1.3");
      await clickURL(key("Démarrer la session"), /\/the\/session\/[a-f0-9-]+$/);
      await clickURL(key("Terminer la session"), "**/the");
    });
    await context.storageState({ path: dir + "/storage.json" });
  }
  if (stage === "regressions") {
    await page.setViewportSize({ width: 390, height: 844 });
    const { createClient } = await import("@supabase/supabase-js");
    const api = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const auth = await api.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    assert(!auth.error, "Test login failed");
    const userId = auth.data.user.id;
    await check("Lien repas conservé sans ouvrir le contexte", async () => {
      await go("/glycemie/saisie?mealId=" + account.mealId);
      assert(
        (await page.locator("[name=meal_id]").inputValue()) === account.mealId,
        "Meal missing from form",
      );
      assert(
        (await page.locator("[name=context]").inputValue()) === "post_meal",
        "Wrong meal context",
      );
      for (const char of "1.4")
        await page.getByRole("button", { name: char, exact: true }).click();
      await clickURL(
        page.getByRole("button", {
          name: "Enregistrer la mesure",
          exact: true,
        }),
        "**/glycemie",
      );
      const { data, error } = await api
        .from("glucose_readings")
        .select("meal_id,context")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      assert(
        !error &&
          data.meal_id === account.mealId &&
          data.context === "post_meal",
        "Link not persisted",
      );
    });
    await check(
      "Contexte enrichi conservé après fermeture du panneau",
      async () => {
        await go("/glycemie/saisie");
        await page.getByRole("button", { name: "Ajouter du contexte" }).click();
        await page.locator("[name=activity_minutes]").fill("25");
        await page.locator("[name=sleep_hours]").fill("7.5");
        await page.locator("[name=stress_level]").selectOption("3");
        await page.locator("[name=symptoms]").fill("QA sans symptômes");
        await page.getByRole("button", { name: "Ajouter du contexte" }).click();
        for (const char of "1.1")
          await page.getByRole("button", { name: char, exact: true }).click();
        await clickURL(
          page.getByRole("button", {
            name: "Enregistrer la mesure",
            exact: true,
          }),
          "**/glycemie",
        );
        const { data, error } = await api
          .from("glucose_readings")
          .select("activity_minutes,sleep_hours,stress_level,symptoms")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        assert(
          !error &&
            data.activity_minutes === 25 &&
            Number(data.sleep_hours) === 7.5 &&
            data.stress_level === 3,
          "Context not saved",
        );
      },
    );
    for (const period of ["Aujourd'hui", "7 jours", "30 jours", "3 mois"])
      await check("Période actualisée : " + period, async () => {
        await go("/glycemie");
        const link = page
          .getByRole("navigation", { name: "Période" })
          .getByRole("link", { name: period, exact: true });
        await link.click();
        await page.waitForFunction(
          (label) =>
            [...document.querySelectorAll('nav[aria-label="Période"] a')].some(
              (e) =>
                e.textContent.trim() === label &&
                e.getAttribute("aria-current") === "page",
            ),
          period,
        );
      });
    await check(
      "Modification profil : informations conservées et enregistrées",
      async () => {
        await page.goto(base + "/onboarding/profil-medical/etape-1");
        await page.locator("[name=weight_kg]").waitFor();
        assert(
          (await page.locator("[name=weight_kg]").inputValue()) === "71.5",
          "Existing weight lost",
        );
        assert(
          (await page.locator("[name=height_cm]").inputValue()) === "168",
          "Existing height lost",
        );
        const expectedAge =
          Number(await page.locator("[name=age]").inputValue()) + 1;
        await page.getByRole("button", { name: "Augmenter l'âge" }).click();
        await page.getByRole("button", { name: "Continuer" }).click();
        await page.waitForURL("**/etape-2");
        assert(
          (await page
            .getByRole("radio", { name: /En prévention/ })
            .getAttribute("aria-checked")) === "true",
          "Existing condition lost",
        );
        await clickURL(
          page.getByRole("button", { name: "Continuer" }),
          "**/tableau-de-bord",
        );
        await page.goto(base + "/onboarding/profil-medical/etape-1");
        assert(
          Number(await page.locator("[name=age]").inputValue()) === expectedAge,
          "Saved age lost",
        );
        await page
          .getByRole("button", { name: "Ignorer", exact: true })
          .click();
        await page.waitForURL("**/tableau-de-bord");
      },
    );
    await check(
      "Protection RLS : aucune ligne appartenant à autrui",
      async () => {
        const tables = [
          "profiles",
          "glucose_readings",
          "weight_entries",
          "meals",
          "favorite_meals",
          "tea_sessions",
          "reminders",
        ];
        for (const table of tables) {
          const field = table === "profiles" ? "id" : "user_id";
          const { data, error } = await api
            .from(table)
            .select(field)
            .neq(field, userId)
            .limit(1);
          assert(!error && data.length === 0, "Foreign row exposed: " + table);
        }
        return tables.length + " tables vérifiées avec le jeton du compte test";
      },
    );
    await check("Petits écrans : champs thé et journal repas", async () => {
      await page.setViewportSize({ width: 320, height: 844 });
      for (const path of ["/the/session/nouvelle", "/repas", "/glycemie"]) {
        await go(path);
        assert(
          !(await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )),
          "Overflow " + path,
        );
      }
    });
    await check(
      "Navigation principale : 5 destinations mobile et ordinateur",
      async () => {
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await go("/tableau-de-bord");
          for (const name of [
            "Glycémie",
            "Repas",
            "Thé",
            "Profil",
            "Accueil",
          ]) {
            await page
              .getByRole("navigation", { name: "Navigation principale" })
              .getByRole("link", { name, exact: true })
              .filter({ visible: true })
              .click();
            await page
              .locator("main[aria-busy=true]")
              .waitFor({ state: "hidden" });
            assert(!page.url().includes("/connexion"), "Nav lost session");
          }
        }
      },
    );
    await context.storageState({ path: dir + "/storage.json" });
  }
  if (stage === "public") {
    await context.clearCookies();
    await check("Lancement public : splash puis introduction", async () => {
      await page.goto(base + "/");
      await page.waitForURL("**/onboarding");
    });
    await check(
      "Connexion sociale : boutons conformes aux fournisseurs activés",
      async () => {
        const response = await fetch(
          env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/settings",
          { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY } },
        );
        const settings = await response.json();
        await go("/connexion");
        for (const [provider, label] of [
          ["google", "Continuer avec Google"],
          ["apple", "Continuer avec Apple"],
        ]) {
          assert(
            (await page
              .getByRole("button", { name: label, exact: true })
              .count()) === (settings.external?.[provider] === true ? 1 : 0),
            "Provider button inconsistent: " + provider,
          );
        }
      },
    );
    await check("Protection des écrans privés sans connexion", async () => {
      for (const route of [
        "/tableau-de-bord",
        "/glycemie",
        "/repas",
        "/the",
        "/profil",
      ]) {
        await page.goto(base + route);
        assert(
          new URL(page.url()).pathname === "/connexion",
          "Private route exposed " + route,
        );
      }
    });
    await check("Introduction : Suivant, Commencer et Passer", async () => {
      await page.goto(base + "/onboarding");
      await page.getByRole("button", { name: "Suivant" }).click();
      await page
        .getByRole("heading", { name: "Construisez votre repas" })
        .waitFor();
      await page.getByRole("button", { name: "Suivant" }).click();
      await page
        .getByRole("heading", { name: "Mesurez l'effet de votre thé" })
        .waitFor();
      await clickURL(
        page.getByRole("button", { name: "Commencer" }),
        "**/inscription",
      );
      await page.goto(base + "/onboarding");
      await clickURL(
        page.getByRole("button", { name: "Passer", exact: true }),
        "**/inscription",
      );
      await page.goto(base + "/onboarding");
      await clickURL(
        page.getByRole("link", { name: "J'ai déjà un compte" }),
        "**/connexion",
      );
    });
    await check(
      "Connexion : validation, mot de passe erroné, connexion valide",
      async () => {
        await page.locator("[name=email]").fill(account.email);
        await page.locator("[name=password]").fill("Incorrect-Test-123!");
        await page
          .getByRole("button", { name: "Se connecter", exact: true })
          .click();
        await page.getByRole("alert").waitFor();
        await page.waitForFunction(() =>
          [...document.querySelectorAll("button")].some(
            (b) => b.textContent.trim() === "Se connecter" && !b.disabled,
          ),
        );
        await page.locator("[name=password]").fill(account.password);
        await clickURL(
          page.getByRole("button", { name: "Se connecter", exact: true }),
          "**/tableau-de-bord",
        );
      },
    );
    await check("Déconnexion et retour à la connexion", async () => {
      await go("/profil");
      await clickURL(
        page.getByRole("button", { name: "Se déconnecter" }),
        "**/connexion",
      );
      await page.goto(base + "/glycemie");
      assert(
        new URL(page.url()).pathname === "/connexion",
        "Session not ended",
      );
    });
  }
  if (stage === "performance") {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (let round = 0; round < 3; round++)
        for (const route of [
          "/tableau-de-bord",
          "/glycemie",
          "/repas",
          "/the",
          "/profil",
          "/profil/rappels",
        ])
          await check(
            "Navigation " + route + " " + width + "px tour " + (round + 1),
            async () => {
              await go(route);
              await ready();
              return await page.evaluate(() => {
                const n = performance.getEntriesByType("navigation")[0];
                const fcp = performance.getEntriesByName(
                  "first-contentful-paint",
                )[0];
                return {
                  ttfbMs: Math.round(n.responseStart),
                  domReadyMs: Math.round(n.domContentLoadedEventEnd),
                  fcpMs: fcp ? Math.round(fcp.startTime) : null,
                };
              });
            },
          );
    }
    await check("Réactivité locale du pavé numérique (10 clics)", async () => {
      await go("/glycemie/saisie");
      const times = [];
      for (let i = 0; i < 10; i++) {
        const value = await page.evaluate(async () => {
          const start = performance.now();
          document.querySelector('button[aria-label="1"]').click();
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          );
          return performance.now() - start;
        });
        times.push(Math.round(value));
        await page
          .getByRole("button", { name: "Effacer le dernier caractère" })
          .click();
      }
      return {
        valuesMs: times,
        medianMs: [...times].sort((a, b) => a - b)[5],
        maxMs: Math.max(...times),
      };
    });
    await check(
      "Bouton d'enregistrement : retour immédiat et blocage des doubles clics",
      async () => {
        await go("/poids/saisie");
        await page.locator("[name=weight_kg]").fill("71.5");
        const start = performance.now();
        await page
          .getByRole("button", { name: "Enregistrer la pesée", exact: true })
          .click();
        const pending = page.getByRole("button", {
          name: "Enregistrement…",
          exact: true,
        });
        await pending.waitFor();
        assert(await pending.isDisabled(), "Saving button still clickable");
        const feedbackMs = Math.round(performance.now() - start);
        await page.waitForURL("**/tableau-de-bord");
        await page
          .getByRole("heading", { name: /Bonjour, Compte Test/ })
          .waitFor();
        return {
          feedbackMs,
          completedMs: Math.round(performance.now() - start),
        };
      },
    );
  }
  if (stage === "routing") {
    await check(
      "Pages introuvables : repas, session et article inexistants",
      async () => {
        for (const route of [
          "/repas/00000000-0000-4000-8000-000000000001/impact",
          "/the/session/00000000-0000-4000-8000-000000000001",
          "/conseils/article-qa-inexistant",
        ]) {
          await page.goto(base + route);
          await page
            .getByRole("heading", { name: "Page introuvable", exact: true })
            .waitFor();
          await clickURL(
            page.getByRole("link", { name: "Retour à l'accueil", exact: true }),
            "**/tableau-de-bord",
          );
        }
      },
    );
    await check(
      "Retour OAuth incomplet : redirection propre vers la connexion",
      async () => {
        await page.goto(base + "/auth/callback");
        assert(
          new URL(page.url()).pathname === "/connexion",
          "Missing OAuth callback not handled",
        );
      },
    );
  }
  await browser.close();
  save();
  assert(!results.some((r) => !r.pass), "Some checks failed");
  assert(
    pageErrors.length === 0 && serverErrors.length === 0,
    "Browser or server errors detected",
  );
})().catch((e) => {
  console.error(e.message);
  save();
  browser?.close().finally(() => process.exit(1));
});
