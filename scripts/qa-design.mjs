import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium, webkit } from "playwright";

// Sans compte ni écriture en base : vérifie les ressources et l'hydratation
// sur les deux moteurs, notamment HTTPS forcé par Safari sur localhost.
const base = process.env.GLUCO_QA_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname));
const output = await fs.mkdtemp(path.join(os.tmpdir(), "gluco-design-"));
console.log(`Captures : ${output}`);

for (const engine of [webkit, chromium]) {
  const browser = await engine.launch({
    headless: true,
    ...(engine === chromium ? { channel: "chrome" } : {}),
  });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const failures = [];
      page.on("requestfailed", (request) => {
        if (["stylesheet", "font", "script"].includes(request.resourceType()))
          failures.push(`${request.url()}: ${request.failure()?.errorText}`);
      });
      page.on("pageerror", (error) => failures.push(error.message));
      for (const route of ["/inscription", "/connexion"]) {
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const styles = await page.evaluate(() => ({
          background: getComputedStyle(document.body).backgroundColor,
          font: getComputedStyle(document.body).fontFamily,
          icons: document.fonts.check('24px "Material Symbols Outlined"'),
          overflow: document.documentElement.scrollWidth > innerWidth,
          button: getComputedStyle(document.querySelector('button[type="submit"]')).backgroundColor,
        }));
        await page.screenshot({
          path: path.join(output, `${engine.name()}-${width}-${route.slice(1)}.png`),
          fullPage: true,
        });
        assert.deepEqual(failures, [], "Ressources bloquées ou erreur JavaScript");
        assert.equal(styles.background, "rgb(244, 248, 250)");
        assert.match(styles.font, /Inter/);
        assert.equal(styles.icons, true);
        assert.equal(styles.overflow, false);
        assert.equal(styles.button, "rgb(23, 59, 87)");
        await page.getByRole("button", { name: /Afficher le mot de passe/i }).click();
        assert.equal(await page.locator('input[name="password"]').getAttribute("type"), "text");
        console.log(`OK ${engine.name()} ${width}px ${route}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
