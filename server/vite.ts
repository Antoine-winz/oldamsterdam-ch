import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ─── SEO helpers ─────────────────────────────────────────────────────────────

const BASE_URL = "https://oldamsterdam.ch";

interface LangMeta {
  lang: string;
  locale: string;
  title: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBody: string;
  productsTitle: string;
  product1: string;
  product1Desc: string;
  product2: string;
  product2Desc: string;
  brandTitle: string;
  brandBody: string;
  whereToBuyTitle: string;
  whereToBuyBody: string;
}

const LANG_META: Record<string, LangMeta> = {
  en: {
    lang: "en",
    locale: "en_CH",
    title: "Old Amsterdam Switzerland – Find Your Nearest Coop or Manor Food Store | Gold WCA 2025",
    description: "Find Old Amsterdam premium aged Gouda near you. Available at 341 Coop stores and 23 Manor Food stores across Switzerland. Gold winner at World Cheese Awards 2025. Search by postal code or town to find your closest store.",
    heroTitle: "Old Amsterdam: Now in Switzerland!",
    heroSubtitle: "Mature in flavor, young at heart.",
    heroBody: "Old Amsterdam is a mature Premium Gouda offering a uniquely intense taste and characteristic ripening crystals. The iconic aged cheese from the Netherlands is now available at Coop and MANOR FOOD. Gold winner at the World Cheese Awards 2025 in Bern, Switzerland.",
    productsTitle: "Our Premium Gouda Cheese Range",
    product1: "Old Amsterdam Classic Wedge (210g)",
    product1Desc: "Premium aged Gouda cheese rich in characteristic crystals with a hint of sweetness. Sharp yet creamy flavor, smooth and easy to slice. Perfect for gourmet cheese boards and entertaining.",
    product2: "Old Amsterdam Slices (115g, 10 slices)",
    product2Desc: "Premium aged Gouda cheese in convenient pre-sliced format. Sharp flavor with a creamy texture and characteristic crystals. Ideal for sandwiches, burgers, and quick gourmet snacks.",
    brandTitle: "The Old Amsterdam Story",
    brandBody: "Old Amsterdam was officially introduced in 1985. This unique cheese quickly became a massive success among domestic and international cheese lovers. Our distinctive family recipe, combined with an 8-month maturation process on wooden shelves, creates the characteristic crunchy crystals and robust flavor that cheese connoisseurs love. Today, Westland Kaas Groep BV distributes Old Amsterdam to more than 60 countries worldwide. In Switzerland, this award-winning Dutch Gouda is exclusively available at Coop and MANOR FOOD.",
    whereToBuyTitle: "Where to Buy",
    whereToBuyBody: "Find Old Amsterdam at 341 Coop stores and 23 Manor Food stores across Switzerland. Search by postal code or town name to locate your nearest store.",
  },
  fr: {
    lang: "fr",
    locale: "fr_CH",
    title: "Old Amsterdam Suisse – Trouvez votre magasin Coop ou Manor Food le plus proche | Or WCA 2025",
    description: "Trouvez Old Amsterdam près de chez vous. Disponible dans 341 magasins Coop et 23 Manor Food en Suisse. Médaillé d'Or aux World Cheese Awards 2025 à Berne. Recherchez par NPA ou ville pour trouver le magasin le plus proche.",
    heroTitle: "Old Amsterdam : Désormais en Suisse !",
    heroSubtitle: "Mûr en saveur, jeune de cœur.",
    heroBody: "Old Amsterdam est un Gouda Premium affiné qui offre un goût unique intense et des cristaux de maturation caractéristiques. Le fromage affiné emblématique des Pays-Bas vous attend chez Coop et MANOR FOOD. Médaillé d'Or aux World Cheese Awards 2025 à Berne, Suisse.",
    productsTitle: "Notre Gamme de Fromage Gouda Premium",
    product1: "Old Amsterdam Classic Pointe (210g)",
    product1Desc: "Fromage Gouda affiné premium riche en cristaux caractéristiques avec une pointe de douceur. Saveur piquante et pourtant onctueuse, facile à trancher. Parfait pour les plateaux de fromages gastronomiques.",
    product2: "Old Amsterdam Tranches (115g, 10 tranches)",
    product2Desc: "Fromage Gouda affiné premium en format pratique pré-tranché. Saveur piquante avec une texture crémeuse et des cristaux caractéristiques. Idéal pour les sandwichs et les snacks gastronomiques rapides.",
    brandTitle: "L'Histoire d'Old Amsterdam",
    brandBody: "Old Amsterdam a été officiellement lancé en 1985. Ce fromage unique est rapidement devenu un grand succès auprès des amateurs de fromage dans le monde entier. Notre recette familiale distinctive, combinée à un processus de maturation de 8 mois sur des étagères en bois, crée les cristaux croquants caractéristiques et la saveur robuste que les connaisseurs adorent. Aujourd'hui disponible en Suisse exclusivement chez Coop et MANOR FOOD.",
    whereToBuyTitle: "Où Acheter",
    whereToBuyBody: "Trouvez Old Amsterdam dans 341 magasins Coop et 23 Manor Food en Suisse. Recherchez par NPA ou nom de ville pour trouver le magasin le plus proche.",
  },
  de: {
    lang: "de",
    locale: "de_CH",
    title: "Old Amsterdam Schweiz – Nächste Coop oder Manor Food Filiale finden | Gold WCA 2025",
    description: "Finden Sie Old Amsterdam in Ihrer Nähe. Erhältlich in 341 Coop-Filialen und 23 Manor Food-Geschäften in der Schweiz. Goldgewinner bei den World Cheese Awards 2025 in Bern. PLZ oder Ort eingeben und nächste Filiale finden.",
    heroTitle: "Old Amsterdam: Ab sofort in der Schweiz!",
    heroSubtitle: "Reif im Geschmack, jung im Herzen.",
    heroBody: "Old Amsterdam ist ein gereifter Premium Gouda mit einem einzigartig intensiven Geschmack und charakteristischen Reifekristallen. Der ikonische gereifte Käse aus den Niederlanden erwartet Sie bei Coop und MANOR FOOD. Goldgewinner bei den World Cheese Awards 2025 in Bern, Schweiz.",
    productsTitle: "Unser Premium Gouda Käse Sortiment",
    product1: "Old Amsterdam Classic Ecke (210g)",
    product1Desc: "Premium gereifter Gouda Käse reich an charakteristischen Kristallen mit einem Hauch von Süsse. Pikant und doch cremig, glatt und leicht zu schneiden. Perfekt für Gourmet-Käseplatten.",
    product2: "Old Amsterdam Scheiben (115g, 10 Scheiben)",
    product2Desc: "Premium gereifter Gouda Käse im praktischen vorgeschnittenen Format. Pikanter Geschmack mit cremiger Textur und charakteristischen Kristallen. Ideal für Sandwiches und schnelle Gourmet-Snacks.",
    brandTitle: "Die Geschichte von Old Amsterdam",
    brandBody: "Old Amsterdam wurde 1985 offiziell eingeführt. Dieser einzigartige Käse wurde schnell zu einem grossen Erfolg bei Käseliebhabern weltweit. Unser unverwechselbares Familienrezept, kombiniert mit einem 8-monatigen Reifeprozess auf Holzregalen, erzeugt die charakteristischen knackigen Kristalle und den kräftigen Geschmack. Heute in der Schweiz exklusiv erhältlich bei Coop und MANOR FOOD.",
    whereToBuyTitle: "Wo Kaufen",
    whereToBuyBody: "Finden Sie Old Amsterdam in 341 Coop-Filialen und 23 Manor Food-Geschäften in der Schweiz. PLZ oder Ortsname eingeben, um die nächste Filiale zu finden.",
  },
  it: {
    lang: "it",
    locale: "it_CH",
    title: "Old Amsterdam Svizzera – Trova il tuo Coop o Manor Food più vicino | Oro WCA 2025",
    description: "Trova Old Amsterdam vicino a te. Disponibile in 341 negozi Coop e 23 Manor Food in Svizzera. Oro ai World Cheese Awards 2025 a Berna. Cerca per CAP o città per trovare il negozio più vicino a te.",
    heroTitle: "Old Amsterdam: Ora in Svizzera!",
    heroSubtitle: "Maturo nel sapore, giovane di cuore.",
    heroBody: "Old Amsterdam è un Gouda Premium stagionato che offre un gusto unico e intenso e i caratteristici cristalli di maturazione. L'iconico formaggio stagionato dei Paesi Bassi ti aspetta da Coop e MANOR FOOD. Oro ai World Cheese Awards 2025 a Berna, Svizzera.",
    productsTitle: "La Nostra Gamma di Formaggio Gouda Premium",
    product1: "Old Amsterdam Classic Spicchio (210g)",
    product1Desc: "Formaggio Gouda stagionato premium ricco di cristalli caratteristici con un tocco di dolcezza. Sapore deciso eppure morbido, liscio e facile da affettare. Perfetto per taglieri di formaggi gourmet.",
    product2: "Old Amsterdam Fette (115g, 10 fette)",
    product2Desc: "Formaggio Gouda stagionato premium in pratico formato pre-affettato. Sapore deciso con una texture cremosa e cristalli caratteristici. Ideale per panini e snack gourmet veloci.",
    brandTitle: "La Storia di Old Amsterdam",
    brandBody: "Old Amsterdam è stato ufficialmente introdotto nel 1985. Questo formaggio unico è rapidamente diventato un grande successo tra gli amanti del formaggio in tutto il mondo. La nostra distintiva ricetta di famiglia, abbinata a un processo di maturazione di 8 mesi su scaffali in legno, crea i caratteristici cristalli croccanti e il sapore robusto. Oggi disponibile in Svizzera esclusivamente da Coop e MANOR FOOD.",
    whereToBuyTitle: "Dove Acquistare",
    whereToBuyBody: "Trova Old Amsterdam in 341 negozi Coop e 23 Manor Food in Svizzera. Cerca per CAP o nome della città per trovare il negozio più vicino.",
  },
};

// Known SPA paths — everything else returns 404 status (HTML still served for client-side routing)
const KNOWN_SPA_PATHS = new Set([
  "/",
  "/en", "/en/",
  "/fr", "/fr/",
  "/de", "/de/",
  "/it", "/it/",
  "/admin", "/admin/",
  "/admin/dashboard", "/admin/dashboard/",
  "/gateway", "/gateway/",
]);

function isKnownSpaPath(reqPath: string): boolean {
  return KNOWN_SPA_PATHS.has(reqPath);
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getLangFromPath(reqPath: string): string | null {
  const m = reqPath.match(/^\/(en|fr|de|it)(\/)?$/);
  return m ? m[1] : null;
}

function buildStaticBody(meta: LangMeta, lang: string): string {
  const otherLinks = (["en", "fr", "de", "it"] as const)
    .map((l) => `<a href="${BASE_URL}/${l}/" hreflang="${l}-ch">${l.toUpperCase()}</a>`)
    .join(" | ");

  return `<div id="seo-prerender">
      <main>
        <article>
          <h1>${escText(meta.heroTitle)}</h1>
          <p>${escText(meta.heroSubtitle)}</p>
          <p>${escText(meta.heroBody)}</p>
        </article>
        <section>
          <h2>${escText(meta.productsTitle)}</h2>
          <div>
            <h3>${escText(meta.product1)}</h3>
            <p>${escText(meta.product1Desc)}</p>
          </div>
          <div>
            <h3>${escText(meta.product2)}</h3>
            <p>${escText(meta.product2Desc)}</p>
          </div>
        </section>
        <section>
          <h2>${escText(meta.brandTitle)}</h2>
          <p>${escText(meta.brandBody)}</p>
        </section>
        <section>
          <h2>${escText(meta.whereToBuyTitle)}</h2>
          <p>${escText(meta.whereToBuyBody)}</p>
        </section>
        <nav aria-label="Language selection">
          ${otherLinks}
        </nav>
      </main>
    </div>
    <script>var _s=document.getElementById('seo-prerender');if(_s)_s.style.display='none';</script>`;
}

function injectLangMeta(html: string, lang: string): string {
  const meta = LANG_META[lang];
  if (!meta) return html;

  const url = `${BASE_URL}/${lang}/`;

  // 1. <html lang>
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${meta.lang}"`);

  // 2. <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(meta.title)}</title>`);

  // 3. <meta name="title">
  html = html.replace(
    /<meta name="title" content="[^"]*"\s*\/>/,
    `<meta name="title" content="${escAttr(meta.title)}" />`
  );

  // 4. <meta name="description">
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escAttr(meta.description)}" />`
  );

  // 5. canonical (inject where the placeholder comment is)
  html = html.replace(
    /<!-- Canonical URL - Set dynamically by DocumentHead\.tsx based on current language route -->/,
    `<!-- Canonical URL -->\n    <link rel="canonical" href="${url}" />`
  );

  // 6. og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`
  );

  // 7. og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escAttr(meta.title)}" />`
  );

  // 8. og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escAttr(meta.description)}" />`
  );

  // 9. og:locale (only the primary one, not alternates)
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"\s*\/>/,
    `<meta property="og:locale" content="${meta.locale}" />`
  );

  // 10. twitter:url
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/>/,
    `<meta name="twitter:url" content="${url}" />`
  );

  // 11. twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escAttr(meta.title)}" />`
  );

  // 12. twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escAttr(meta.description)}" />`
  );

  // 13. Inject static crawlable body content before <div id="root">
  const staticBody = buildStaticBody(meta, lang);
  html = html.replace('<div id="root"></div>', `${staticBody}\n    <div id="root"></div>`);

  return html;
}

// ─── Vite dev setup ───────────────────────────────────────────────────────────

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    // req.path inside app.use("*") is always "/" because Express strips the matched wildcard.
    // Use req.originalUrl (stripping query string) to get the real path.
    const url = req.originalUrl;
    const reqPath = url.split("?")[0].split("#")[0];

    // Issue 1: Server-side redirect for bare domain
    if (reqPath === "/") {
      return res.redirect(301, "/en/");
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);

      // Issue 4 + 3: Inject per-language metadata and static content
      const lang = getLangFromPath(reqPath);
      if (lang) {
        page = injectLangMeta(page, lang);
      }

      // Issue 2: Return 404 status for unknown public paths
      const statusCode = isKnownSpaPath(reqPath) ? 200 : 404;
      res.status(statusCode).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// ─── Production static serving ────────────────────────────────────────────────

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Issue 1: Server-side redirect for bare domain — must be before express.static
  // so that static's default index.html serving for "/" doesn't intercept first.
  app.get("/", (_req, res) => {
    res.redirect(301, "/en/");
  });

  app.use(express.static(distPath));

  // SPA fallback: serve index.html with language metadata injected where appropriate
  // Note: req.path inside app.use("*") is always "/" — use req.originalUrl instead.
  app.use("*", (req, res) => {
    const reqPath = req.originalUrl.split("?")[0].split("#")[0];
    const indexPath = path.resolve(distPath, "index.html");

    let html = fs.readFileSync(indexPath, "utf-8");

    // Issue 4 + 3: Inject per-language metadata and static content
    const lang = getLangFromPath(reqPath);
    if (lang) {
      html = injectLangMeta(html, lang);
    }

    // Issue 2: Return 404 status for unknown public paths
    const statusCode = isKnownSpaPath(reqPath) ? 200 : 404;
    res.status(statusCode).set("Content-Type", "text/html").send(html);
  });
}
