#!/usr/bin/env node
/**
 * Refuse un build de production si un serveur de développement occupe le port.
 *
 * `next dev` et `next build` écrivent dans le même dossier `.next`. Lancer le
 * second pendant que le premier tourne corrompt le cache : le serveur de dev
 * se met alors à servir des pages sans CSS, puis échoue sur des modules
 * introuvables. Il faut le relancer pour s'en sortir.
 */
import { createConnection } from "node:net";

const PORT = Number(process.env.PORT ?? 3000);

const libre = await new Promise((resolve) => {
  const socket = createConnection({ port: PORT, host: "127.0.0.1" });
  socket.setTimeout(700);
  socket.on("connect", () => { socket.destroy(); resolve(false); });
  socket.on("timeout", () => { socket.destroy(); resolve(true); });
  socket.on("error", () => resolve(true));
});

if (!libre) {
  console.error(
    `\nUn serveur écoute déjà sur le port ${PORT}.\n` +
      `Un build pendant que \`npm run dev\` tourne corrompt le dossier .next.\n\n` +
      `Arrêtez le serveur (Ctrl+C) puis relancez le build,\n` +
      `ou utilisez un autre port : PORT=3001 npm run build\n`,
  );
  process.exit(1);
}
