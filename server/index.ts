import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

if (!process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is not set.");
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

app.use(compression());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.googlesyndication.com https://*.doubleclick.net https://connect.facebook.net https://snap.licdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://api3.geo.admin.ch https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://analytics.google.com https://www.facebook.com https://connect.facebook.net https://*.doubleclick.net https://*.googlesyndication.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.doubleclick.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.use((req, res, next) => {
  const referer = req.headers.referer || req.headers.referrer || '';
  if (referer.includes('mynectra.replit.app')) {
    if (req.path === '/' || req.path === '/gateway') {
      return res.redirect('/api/admin/sso-referer');
    }
  }
  next();
});

app.use((req, res, next) => {
  const p = req.path;
  
  if (p === '/sw.js') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  else if (p.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  else if (p.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  else if (p.match(/\.(png|jpg|jpeg|svg|webp|gif|js|css)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  else if (!p.startsWith('/api/')) {
    // SPA HTML pages must be public so search engines can index them.
    // Without this, Google Cloud defaults to Cache-Control: private which
    // Lighthouse 13 flags as "Page is blocked from indexing".
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number; statusCode?: number }).status || (err as { status?: number; statusCode?: number }).statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? "Internal Server Error" : (err as Error).message || "Internal Server Error";

    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
