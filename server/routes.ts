import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";
import { storage } from "./storage";
import { seedStores } from "./seed-stores";
import { 
  insertContactInquirySchema,
  insertNewsletterSubscriberSchema
} from "@shared/schema";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveLocationToCoords(query: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const q = encodeURIComponent(query.trim());
  const isNpa = /^\d{4}$/.test(query.trim());
  const origins = isNpa ? "zipcode" : "zipcode,gg25,gazetteer";
  const url = `https://api3.geo.admin.ch/rest/services/ech/SearchServer?type=locations&origins=${origins}&searchText=${q}&sr=4326&lang=fr&limit=1`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json() as any;
    if (data?.results?.length > 0) {
      const r = data.results[0].attrs;
      const label = r.label?.replace(/<[^>]+>/g, "") || query;
      return { lat: r.lat, lon: r.lon, label };
    }
  } catch {}
  return null;
}

async function submitSitemapViaSearchConsole(): Promise<{ success: boolean; message: string }> {
  const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credsEnv) {
    const credPath = path.join(process.cwd(), "credentials.json");
    if (!fs.existsSync(credPath)) return { success: false, message: "No credentials found (set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS env var)" };
  }
  try {
    const { google } = await import("googleapis");
    const credentials = credsEnv ? JSON.parse(credsEnv) : JSON.parse(fs.readFileSync(path.join(process.cwd(), "credentials.json"), "utf-8"));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters"],
    });
    const webmasters = google.webmasters({ version: "v3", auth });
    const siteUrls = [
      "sc-domain:oldamsterdam.ch",
      "https://oldamsterdam.ch/",
      "https://oldamsterdam.ch",
    ];
    let lastErr = "";
    for (const siteUrl of siteUrls) {
      try {
        await webmasters.sitemaps.submit({
          siteUrl,
          feedpath: "https://oldamsterdam.ch/sitemap.xml",
        });
        return { success: true, message: "Sitemap submitted via Search Console API" };
      } catch (e: any) {
        lastErr = e.message || "Unknown error";
      }
    }
    return { success: false, message: lastErr };
  } catch (err: any) {
    return { success: false, message: err.message || "Search Console API error" };
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket.remoteAddress || 'unknown';
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: false,
  legacyHeaders: false,
});

function sanitizeString(val: unknown, maxLen: number): string | null {
  if (typeof val !== 'string') return null;
  return val.slice(0, maxLen).replace(/[<>]/g, '');
}

const storesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  seedStores().catch(e => console.error("[stores] seed failed:", e));

  const PgSession = connectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      pool: pool as any,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  }));

  app.post("/api/track", trackLimiter, async (req, res) => {
    try {
      const path = sanitizeString(req.body.path, 500) || '/';
      const language = sanitizeString(req.body.language, 5);
      const referrer = sanitizeString(req.body.referrer, 2000);
      const utmSource = sanitizeString(req.body.utmSource, 200) || null;
      const utmMedium = sanitizeString(req.body.utmMedium, 200) || null;
      const utmCampaign = sanitizeString(req.body.utmCampaign, 200) || null;
      const ipAddress = getClientIp(req);
      const userAgent = (req.headers['user-agent'] || '').slice(0, 500);

      const visit = await storage.createPageVisit({
        ipAddress, userAgent, path, language, referrer,
        country: null, city: null, utmSource, utmMedium, utmCampaign,
      });

      if (ipAddress && /^[\d.]+$/.test(ipAddress)) {
        fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city`, {
          signal: AbortSignal.timeout(4000),
        })
          .then(r => r.json())
          .then((geoData: any) => {
            if (geoData.status === 'success' && visit?.id) {
              pool.query(
                'UPDATE page_visits SET country = $1, city = $2 WHERE id = $3',
                [geoData.country || null, geoData.city || null, visit.id]
              ).catch(() => {});
            }
          })
          .catch(() => {});
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to track visit" });
    }
  });

  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    const { email, password, username } = req.body;

    if (email && password) {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          const nectraResponse = await fetch("https://my.nectra.ch/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (nectraResponse.ok) {
            const data = await nectraResponse.json() as any;
            if (data.token) {
              const decoded = jwt.verify(data.token, jwtSecret) as any;
              (req.session as any).isAdmin = true;
              (req.session as any).adminEmail = decoded.email || email;
              (req.session as any).ssoLogin = true;
              return res.json({ success: true, email: decoded.email || email });
            }
          }
        }
      } catch {
        // NECTRA SSO failed — fall through to local auth
      }
    }

    const loginUsername = username || email;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured" });
    }
    
    if (loginUsername === adminUsername && password === adminPassword) {
      (req.session as any).isAdmin = true;
      (req.session as any).adminEmail = null;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/me", (req, res) => {
    if ((req.session as any)?.isAdmin) {
      res.json({ authenticated: true, email: (req.session as any).adminEmail || null });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  app.get("/api/admin/sso-referer", (req, res) => {
    const referer = req.headers.referer || req.headers.referrer || '';
    if (!referer.includes('mynectra.replit.app')) {
      return res.redirect("/admin");
    }
    (req.session as any).isAdmin = true;
    (req.session as any).adminEmail = 'nectra@nectrafood.com';
    (req.session as any).ssoLogin = true;
    req.session.save(() => {
      res.redirect("/admin/dashboard");
    });
  });

  app.get("/api/admin/sso", (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.redirect("/admin?error=no_token");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.redirect("/admin?error=sso_not_configured");
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      (req.session as any).isAdmin = true;
      (req.session as any).adminEmail = decoded.email || decoded.sub || 'sso_user';
      (req.session as any).ssoLogin = true;
      req.session.save(() => {
        res.redirect("/admin/dashboard");
      });
    } catch {
      return res.redirect("/admin?error=invalid_token");
    }
  });

  app.get("/api/admin/subscribers", requireAdmin, async (_req, res) => {
    try {
      const subscribers = await storage.getAllNewsletterSubscribers();
      res.json(subscribers);
    } catch {
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.get("/api/admin/inquiries", requireAdmin, async (_req, res) => {
    try {
      const inquiries = await storage.getAllContactInquiries();
      res.json(inquiries);
    } catch {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/admin/visits", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 500, 5000);
      const visits = await storage.getAllPageVisits(limit);
      res.json(visits);
    } catch {
      res.status(500).json({ error: "Failed to fetch visits" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const stats = await storage.getPageVisitStats();
      const subscribers = await storage.getAllNewsletterSubscribers();
      const inquiries = await storage.getAllContactInquiries();
      res.json({
        ...stats,
        totalSubscribers: subscribers.length,
        totalInquiries: inquiries.length,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/contact", publicLimiter, async (req, res) => {
    try {
      const validatedData = insertContactInquirySchema.parse(req.body);
      const ipAddress = getClientIp(req);
      const language = sanitizeString(req.body.language, 5);
      const inquiry = await storage.createContactInquiry({ ...validatedData, ipAddress, language });
      res.status(201).json(inquiry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contact data" });
      }
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  let lastIndexNowPing = 0;
  app.post("/api/indexnow/ping", requireAdmin, async (_req, res) => {
    try {
      const now = Date.now();
      if (now - lastIndexNowPing < 3600000) {
        return res.status(429).json({ error: "IndexNow can only be pinged once per hour" });
      }

      const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
      if (!INDEXNOW_KEY) {
        return res.status(500).json({ error: "IndexNow key not configured" });
      }
      const HOST = "oldamsterdam.ch";
      const urls = [
        `https://${HOST}/en/`,
        `https://${HOST}/de/`,
        `https://${HOST}/fr/`,
        `https://${HOST}/it/`,
      ];

      const response = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: HOST,
          key: INDEXNOW_KEY,
          keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });

      lastIndexNowPing = now;
      res.json({ 
        status: response.status, 
        message: response.status === 200 || response.status === 202 
          ? "IndexNow ping sent successfully" 
          : "IndexNow ping returned unexpected status",
        urls 
      });
    } catch {
      res.status(500).json({ error: "Failed to ping IndexNow" });
    }
  });

  let lastSearchEnginePing = 0;

  app.post("/api/admin/ping-search-engines", requireAdmin, async (_req, res) => {
    try {
      const now = Date.now();
      if (now - lastSearchEnginePing < 3600000) {
        return res.status(429).json({ error: "Search engines can only be pinged once per hour" });
      }

      const HOST = "oldamsterdam.ch";
      const results: { engine: string; status: string; code?: number }[] = [];

      const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
      if (INDEXNOW_KEY) {
        const urls = [
          `https://${HOST}/en/`,
          `https://${HOST}/de/`,
          `https://${HOST}/fr/`,
          `https://${HOST}/it/`,
        ];
        const indexNowRes = await fetch("https://api.indexnow.org/IndexNow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: urls,
          }),
        });
        results.push({ 
          engine: "IndexNow (Bing/Yandex/DuckDuckGo)", 
          status: (indexNowRes.status === 200 || indexNowRes.status === 202) ? "Pinged successfully" : `HTTP ${indexNowRes.status}`,
          code: indexNowRes.status 
        });
        lastIndexNowPing = now;
      }

      const gscResult = await submitSitemapViaSearchConsole();
      if (gscResult.success || !gscResult.message.includes("No credentials")) {
        results.push({
          engine: "Google Search Console API",
          status: gscResult.success ? gscResult.message : `Error: ${gscResult.message}`,
          code: gscResult.success ? 200 : 0,
        });
      }

      lastSearchEnginePing = now;
      res.json({ message: "Search engine pings sent", results });
    } catch (err) {
      res.status(500).json({ error: "Failed to ping search engines" });
    }
  });

  app.post("/api/newsletter/subscribe", publicLimiter, async (req, res) => {
    try {
      const validatedData = insertNewsletterSubscriberSchema.parse(req.body);
      const ipAddress = getClientIp(req);
      const language = sanitizeString(req.body.language, 5);
      const subscriber = await storage.createNewsletterSubscriber({ ...validatedData, ipAddress, language });
      res.status(201).json(subscriber);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: "Email already subscribed" });
      }
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid email" });
      }
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.get("/api/admin/analytics", requireAdmin, async (_req, res) => {
    try {
      const visits = await storage.getAllPageVisits(10000);
      const subscribers = await storage.getAllNewsletterSubscribers();
      const inquiries = await storage.getAllContactInquiries();

      const dailyMap: Record<string, { total: number; uniqueIps: Set<string> }> = {};
      const hourlyMap: Record<number, number> = {};
      const languageMap: Record<string, number> = {};
      const referrerMap: Record<string, number> = {};
      const pathMap: Record<string, number> = {};
      const deviceMap: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
      const browserMap: Record<string, number> = {};
      const countryMap: Record<string, number> = {};
      const cityMap: Record<string, number> = {};
      const utmSourceMap: Record<string, number> = {};
      const utmMediumMap: Record<string, number> = {};
      const utmCampaignMap: Record<string, number> = {};
      const uniqueIpsAll = new Set<string>();
      const ipFirstSeen: Record<string, number> = {};

      for (const v of visits) {
        const date = new Date(v.createdAt as any);
        const dayKey = date.toISOString().split('T')[0];
        if (!dailyMap[dayKey]) dailyMap[dayKey] = { total: 0, uniqueIps: new Set() };
        dailyMap[dayKey].total++;
        if (v.ipAddress) {
          dailyMap[dayKey].uniqueIps.add(v.ipAddress);
          uniqueIpsAll.add(v.ipAddress);
          const ts = date.getTime();
          if (!ipFirstSeen[v.ipAddress] || ts < ipFirstSeen[v.ipAddress]) ipFirstSeen[v.ipAddress] = ts;
        }

        hourlyMap[date.getHours()] = (hourlyMap[date.getHours()] || 0) + 1;

        if (v.language) languageMap[v.language.toUpperCase()] = (languageMap[v.language.toUpperCase()] || 0) + 1;

        if (v.referrer) {
          try {
            const host = new URL(v.referrer).hostname.replace('www.', '');
            referrerMap[host] = (referrerMap[host] || 0) + 1;
          } catch {
            referrerMap[v.referrer.slice(0, 50)] = (referrerMap[v.referrer.slice(0, 50)] || 0) + 1;
          }
        } else {
          referrerMap['Direct'] = (referrerMap['Direct'] || 0) + 1;
        }

        if (v.path) pathMap[v.path] = (pathMap[v.path] || 0) + 1;

        const ua = (v.userAgent || '').toLowerCase();
        if (/mobile|android|iphone|ipod/.test(ua)) deviceMap['Mobile']++;
        else if (/ipad|tablet/.test(ua)) deviceMap['Tablet']++;
        else deviceMap['Desktop']++;

        if (/chrome/.test(ua) && !/edg/.test(ua)) browserMap['Chrome'] = (browserMap['Chrome'] || 0) + 1;
        else if (/safari/.test(ua) && !/chrome/.test(ua)) browserMap['Safari'] = (browserMap['Safari'] || 0) + 1;
        else if (/firefox/.test(ua)) browserMap['Firefox'] = (browserMap['Firefox'] || 0) + 1;
        else if (/edg/.test(ua)) browserMap['Edge'] = (browserMap['Edge'] || 0) + 1;
        else browserMap['Other'] = (browserMap['Other'] || 0) + 1;

        if (v.country) countryMap[v.country] = (countryMap[v.country] || 0) + 1;
        if (v.city) cityMap[v.city] = (cityMap[v.city] || 0) + 1;

        if (v.utmSource) utmSourceMap[v.utmSource] = (utmSourceMap[v.utmSource] || 0) + 1;
        if (v.utmMedium) utmMediumMap[v.utmMedium] = (utmMediumMap[v.utmMedium] || 0) + 1;
        if (v.utmCampaign) utmCampaignMap[v.utmCampaign] = (utmCampaignMap[v.utmCampaign] || 0) + 1;
      }

      let newVisitors = 0, returningVisitors = 0;
      for (const v of visits) {
        if (!v.ipAddress) continue;
        const ts = new Date(v.createdAt as any).getTime();
        if (ts === ipFirstSeen[v.ipAddress]) newVisitors++;
        else returningVisitors++;
      }

      const daily = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, views: data.total, visitors: data.uniqueIps.size }));

      const hourly = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        views: hourlyMap[i] || 0,
      }));

      const toSorted = (m: Record<string, number>, limit = 10) =>
        Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, limit).map(([name, count]) => ({ name, count }));

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const todayData = dailyMap[today];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      const yesterdayData = dailyMap[yesterday];
      const last7 = visits.filter(v => new Date(v.createdAt as any).getTime() > now.getTime() - 7 * 86400000).length;
      const last30 = visits.filter(v => new Date(v.createdAt as any).getTime() > now.getTime() - 30 * 86400000).length;

      const newsletterRate = uniqueIpsAll.size > 0 ? ((subscribers.length / uniqueIpsAll.size) * 100).toFixed(1) : "0";
      const contactRate = uniqueIpsAll.size > 0 ? ((inquiries.length / uniqueIpsAll.size) * 100).toFixed(1) : "0";

      res.json({
        summary: {
          totalViews: visits.length,
          uniqueVisitors: uniqueIpsAll.size,
          todayViews: todayData?.total || 0,
          todayVisitors: todayData?.uniqueIps.size || 0,
          yesterdayViews: yesterdayData?.total || 0,
          last7Views: last7,
          last30Views: last30,
          newsletterRate,
          contactRate,
          newVisitors,
          returningVisitors,
          totalSubscribers: subscribers.length,
          totalInquiries: inquiries.length,
        },
        daily,
        hourly,
        languages: toSorted(languageMap),
        referrers: toSorted(referrerMap),
        pages: toSorted(pathMap),
        devices: toSorted(deviceMap),
        browsers: toSorted(browserMap),
        countries: toSorted(countryMap),
        cities: toSorted(cityMap, 15),
        utmSources: toSorted(utmSourceMap),
        utmMediums: toSorted(utmMediumMap),
        utmCampaigns: toSorted(utmCampaignMap),
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/ip-lookup/:ip", requireAdmin, async (req, res) => {
    try {
      const ip = req.params.ip;
      if (!/^[\d.]+$/.test(ip)) return res.status(400).json({ error: "Invalid IP" });
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp`);
      const data = await response.json() as any;
      if (data.status === "success") {
        res.json({ country: data.country, city: data.city, region: data.regionName, isp: data.isp });
      } else {
        res.json({ country: "Unknown", city: "Unknown" });
      }
    } catch {
      res.json({ country: "Unknown", city: "Unknown" });
    }
  });

  app.get("/api/stores/all", storesLimiter, async (_req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM stores ORDER BY name ASC");
      res.json(rows);
    } catch {
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  app.get("/api/location/resolve", storesLimiter, async (req, res) => {
    const query = String(req.query.query || "").trim();
    if (!query) return res.status(400).json({ error: "query is required" });
    const result = await resolveLocationToCoords(query);
    if (!result) return res.status(404).json({ error: "Location not found" });
    res.json(result);
  });

  app.get("/api/stores/nearest", storesLimiter, async (req, res) => {
    try {
      const query = String(req.query.query || "").trim();
      const latParam = parseFloat(String(req.query.lat || ""));
      const lonParam = parseFloat(String(req.query.lon || ""));
      const hasLatLon = !isNaN(latParam) && !isNaN(lonParam)
        && latParam >= 45.0 && latParam <= 48.5
        && lonParam >= 5.5 && lonParam <= 11.0;
      const retailerParam = String(req.query.retailer || "all");
      const limit = Math.min(parseInt(String(req.query.limit || "5"), 10), 20);

      if (!query && !hasLatLon) return res.status(400).json({ error: "query or lat/lon is required" });

      const VALID_RETAILERS = ["all", "coop", "manor"] as const;
      const retailer = VALID_RETAILERS.includes(retailerParam as any) ? retailerParam : "all";

      let location: { lat: number; lon: number; label: string };
      if (hasLatLon) {
        location = { lat: latParam, lon: lonParam, label: "Your location" };
      } else {
        const resolved = await resolveLocationToCoords(query);
        if (!resolved) return res.status(404).json({ error: "Location not found" });
        location = resolved;
      }

      let sqlQuery = "SELECT * FROM stores WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
      const sqlParams: string[] = [];
      if (retailer === "coop") {
        sqlQuery += " AND retailer = $1";
        sqlParams.push("Coop");
      } else if (retailer === "manor") {
        sqlQuery += " AND retailer = $1";
        sqlParams.push("Manor Food");
      }

      const { rows } = await pool.query(sqlQuery, sqlParams);
      const withDist = rows.map((s: any) => ({
        ...s,
        distance: haversineKm(location.lat, location.lon, s.latitude, s.longitude),
      }));
      withDist.sort((a: any, b: any) => a.distance - b.distance);

      res.json({ location, stores: withDist.slice(0, limit) });
    } catch {
      res.status(500).json({ error: "Failed to search stores" });
    }
  });

  const CONTENT_LAST_MODIFIED = new Date().toISOString().split('T')[0];

  app.get("/sitemap.xml", (_req, res) => {
    const today = CONTENT_LAST_MODIFIED;
    const languages = ['en', 'de', 'fr', 'it'];
    const hreflangBlock = languages.map(lang =>
      `    <xhtml:link rel="alternate" hreflang="${lang}-ch" href="https://oldamsterdam.ch/${lang}/"/>`
    ).join('\n') + '\n    <xhtml:link rel="alternate" hreflang="x-default" href="https://oldamsterdam.ch/en/"/>';

    const urls = languages.map(lang => `
  <url>
    <loc>https://oldamsterdam.ch/${lang}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${hreflangBlock}
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  });

  app.get("/robots.txt", (_req, res) => {
    const robotsTxt = `# robots.txt for oldamsterdam.ch

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /gateway
Disallow: /gateway/

# Sitemap
Sitemap: https://oldamsterdam.ch/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(robotsTxt);
  });

  const httpServer = createServer(app);

  return httpServer;
}
