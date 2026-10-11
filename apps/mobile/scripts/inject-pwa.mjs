// Post-build step for the Expo web export.
// Injects the PWA manifest link, theme/apple/favicon tags, and the service
// worker registration into dist/index.html. Idempotent via a marker.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve(process.cwd(), "dist");
const indexPath = path.join(dist, "index.html");
const MARKER = "vyn-pwa-injected";

const headTags = `    <!-- ${MARKER} -->
    <meta name="theme-color" content="#006857" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Vyn Therapy" />`;

const swScript = `    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
          navigator.serviceWorker.register("/sw.js").catch(function (err) {
            console.warn("SW registration failed:", err);
          });
        });
      }
    </script>`;

async function main() {
  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch {
    throw new Error(
      `dist/index.html not found — run "expo export -p web" first`,
    );
  }

  if (html.includes(MARKER)) {
    console.log("PWA tags already present — skipping");
    return;
  }

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${headTags}\n  </head>`);
  } else {
    console.warn("no </head> found — manifest link not injected");
  }

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${swScript}\n  </body>`);
  } else if (html.includes("</html>")) {
    html = html.replace("</html>", `${swScript}\n</html>`);
  } else {
    html += swScript;
  }

  await writeFile(indexPath, html, "utf8");
  console.log("Injected PWA manifest + service worker into dist/index.html");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
