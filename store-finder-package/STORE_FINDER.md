# Store Finder — Self-Contained Copy Guide

A fully working nearest-store finder with text search, GPS geolocation, retailer filter, and a results bottom sheet. No third-party map library. No API key required.

---

## What you get

- Type a postcode or town → resolves via Swiss GeoAdmin → shows 5 nearest stores
- Tap the GPS button → uses device location → shows 5 nearest stores instantly
- Retailer filter (All / Coop / Manor Food)
- Distance in km, product badges, Google Maps link per store
- Slide-up bottom sheet, Escape to close, backdrop dismiss

---

## Files to copy

```
server/
  seed-stores.ts          ← creates the DB table and seeds store data on startup
  stores-data.json        ← 341 Coop stores with lat/lon (large file, copy as-is)
  manor-stores-geocoded.json  ← 23 Manor Food stores with lat/lon

client/src/components/
  WhereToBuySection.tsx   ← the complete UI component (search + results panel)
```

You also need three API routes from `server/routes.ts` and a few translation strings.

---

## 1. Database table

The seed file creates the table automatically on server startup. Copy `server/seed-stores.ts` as-is and call it once when your server starts:

```ts
// In your server entry point (e.g. server/index.ts or server/routes.ts):
import { seedStores } from "./seed-stores";
seedStores().catch(e => console.error("[stores] seed failed:", e));
```

The seed file uses a raw `pg` pool. If your app uses a different DB client, adapt the `pool.query()` calls. The table DDL is:

```sql
CREATE TABLE IF NOT EXISTS stores (
  id          SERIAL PRIMARY KEY,
  debitor     TEXT UNIQUE,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  region      TEXT,
  format      TEXT,
  npa         TEXT NOT NULL,
  address     TEXT NOT NULL,
  full_address TEXT NOT NULL,
  phone       TEXT,
  has_wedge_210g  BOOLEAN NOT NULL DEFAULT false,
  has_slices_115g BOOLEAN NOT NULL DEFAULT false,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  retailer    TEXT NOT NULL DEFAULT 'Coop',
  availability_note TEXT
);
```

---

## 2. Backend — three API routes

Add these to your Express app. They depend only on `pg` (the pool) and the `haversineKm` / `resolveLocationToCoords` helpers below.

```ts
// ── Helpers ───────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveLocationToCoords(
  query: string
): Promise<{ lat: number; lon: number; label: string } | null> {
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

// ── Routes ────────────────────────────────────────────────────────────────────

// List all stores
app.get("/api/stores/all", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM stores ORDER BY name ASC");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

// Resolve a text query to coordinates (used internally, exposed for debugging)
app.get("/api/location/resolve", async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (!query) return res.status(400).json({ error: "query is required" });
  const result = await resolveLocationToCoords(query);
  if (!result) return res.status(404).json({ error: "Location not found" });
  res.json(result);
});

// Find nearest stores — accepts text query OR lat/lon from browser GPS
// GET /api/stores/nearest?query=Zurich&retailer=all&limit=5
// GET /api/stores/nearest?lat=46.9&lon=7.4&retailer=coop&limit=5
app.get("/api/stores/nearest", async (req, res) => {
  try {
    const query       = String(req.query.query || "").trim();
    const latParam    = parseFloat(String(req.query.lat || ""));
    const lonParam    = parseFloat(String(req.query.lon || ""));
    const hasLatLon   = !isNaN(latParam) && !isNaN(lonParam)
      && latParam >= 45.0 && latParam <= 48.5   // Swiss bounding box
      && lonParam >=  5.5 && lonParam <= 11.0;
    const retailerParam = String(req.query.retailer || "all");
    const limit       = Math.min(parseInt(String(req.query.limit || "5"), 10), 20);

    if (!query && !hasLatLon) {
      return res.status(400).json({ error: "query or lat/lon is required" });
    }

    const VALID_RETAILERS = ["all", "coop", "manor"] as const;
    const retailer = VALID_RETAILERS.includes(retailerParam as any) ? retailerParam : "all";

    // Resolve coordinates
    let location: { lat: number; lon: number; label: string };
    if (hasLatLon) {
      location = { lat: latParam, lon: lonParam, label: "Your location" };
    } else {
      const resolved = await resolveLocationToCoords(query);
      if (!resolved) return res.status(404).json({ error: "Location not found" });
      location = resolved;
    }

    // Query stores
    let sql = "SELECT * FROM stores WHERE latitude IS NOT NULL AND longitude IS NOT NULL";
    const params: string[] = [];
    if (retailer === "coop")  { sql += " AND retailer = $1"; params.push("Coop"); }
    if (retailer === "manor") { sql += " AND retailer = $1"; params.push("Manor Food"); }

    const { rows } = await pool.query(sql, params);

    // Sort by distance
    const withDist = rows
      .map((s: any) => ({ ...s, distance: haversineKm(location.lat, location.lon, s.latitude, s.longitude) }))
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, limit);

    res.json({ location, stores: withDist });
  } catch {
    res.status(500).json({ error: "Failed to search stores" });
  }
});
```

> **Rate limiting** (recommended): wrap each route with `express-rate-limit` — 60 req/min is what the original uses.

---

## 3. Frontend component

Copy `client/src/components/WhereToBuySection.tsx` as-is.

**Dependencies it uses:**
- `lucide-react` — icons (`Store`, `Search`, `MapPin`, `X`, `Navigation`, `Package`, `ShoppingCart`, `Info`, `LocateFixed`)
- `@/components/ui/button` and `@/components/ui/input` — shadcn/ui components
- A language/translation context — see section 4 below

**If your app has no i18n system**, replace `useLanguage()` with a plain object:

```ts
// Replace the top of the component:
// const { t, language } = useLanguage();
// const tw = t.whereToBuy as any;

const language = "en";
const tw = {
  title: "Where to Buy",
  comingSoon: "Find our cheese at Coop and MANOR FOOD",
  searchTitle: "Find a store near you",
  searchPlaceholder: "Enter your postal code or town",
  searchButton: "Search",
  filterAll: "All stores",
  filterCoop: "Coop",
  filterManor: "Manor Food",
  resolvedLocation: "Showing stores near",
  distance: "km",
  mapsLink: "Get directions",
  noResults: "No stores found for this filter.",
  locationNotFound: "Location not found. Try a Swiss postal code or town.",
  errorFetching: "An error occurred. Please try again.",
  closeSearch: "Close",
  buyOnline: "Buy online on Coop.ch",
  badgeWedge: "Wedge 210g",
  badgeSlices: "Slices 115g",
  disclaimer: "Availability based on latest information. Please check with the store.",
  useMyLocation: "Use my location",
  locating: "Locating...",
  locationDenied: "Location access denied. Please enter your postal code.",
};
```

Also remove the `coopSearchUrl(language)` helper if you don't need the "Buy online" button, or hard-code the URL.

---

## 4. Translation strings (if you have i18n)

Add a `whereToBuy` block to each language in your translations file:

```ts
whereToBuy: {
  title: "Where to Buy",
  comingSoon: "Find Old Amsterdam at Coop and MANOR FOOD",
  searchTitle: "Find Old Amsterdam near you",
  searchPlaceholder: "Enter your postal code or town",
  searchButton: "Search",
  filterAll: "All stores",
  filterCoop: "Coop",
  filterManor: "Manor Food",
  resolvedLocation: "Showing stores near",
  distance: "km",
  mapsLink: "Get directions",
  noResults: "No stores found for this filter near your location.",
  locationNotFound: "Location not found. Please try a Swiss postal code or town name.",
  errorFetching: "An error occurred. Please try again.",
  openSearch: "Find a store near you",
  closeSearch: "Close",
  storeCount: "5 nearest stores",
  buyOnline: "Buy online on Coop.ch",
  availabilityNote: "Availability to be confirmed with the store",
  badgeWedge: "Wedge 210g",
  badgeSlices: "Slices 115g",
  disclaimer: "Availability based on latest available information. For exact shelf availability, please check directly with the store.",
  useMyLocation: "Use my location",
  locating: "Locating...",
  locationDenied: "Location access denied. Please enter your postal code.",
},
```

---

## 5. npm packages needed

```bash
# Backend (if not already installed)
npm install pg express-rate-limit

# Frontend (if not already installed)
npm install lucide-react
```

shadcn/ui `Button` and `Input` — install via the shadcn CLI or replace with your own styled equivalents.

---

## 6. Adapting for different store data

The component expects each store object to have these fields:

| Field | Type | Notes |
|---|---|---|
| `id` | number | primary key |
| `debitor` | string \| null | unique store code (used as React key) |
| `name` | string | display name |
| `city` | string | |
| `npa` | string | postcode |
| `address` | string | street address |
| `full_address` | string | used for Google Maps link |
| `has_wedge_210g` | boolean | shows product badge |
| `has_slices_115g` | boolean | shows product badge |
| `retailer` | string | `"Coop"` or `"Manor Food"` |
| `availability_note` | string \| null | shown as a note if set |
| `latitude` | number | |
| `longitude` | number | |
| `distance` | number | added by the API (km) |

To use with your own stores, just make sure your JSON data and DB columns match these names. The retailer badge colouring is: `Coop` → orange, anything else → grey.

---

## 7. Geocoding note

The location resolver calls the **Swiss GeoAdmin API** — free, no key, supports Swiss postcodes (NPA) and town names. If your stores are outside Switzerland, replace `resolveLocationToCoords()` with a call to Google Maps Geocoding API, Nominatim (OpenStreetMap), or whatever geocoder covers your region.

---

## Quick checklist

- [ ] Copy `server/seed-stores.ts`, `stores-data.json`, `manor-stores-geocoded.json`
- [ ] Call `seedStores()` on server startup
- [ ] Add the 3 routes + 2 helpers to your Express app
- [ ] Copy `WhereToBuySection.tsx` to your components folder
- [ ] Register it on a page (e.g. `<WhereToBuySection />`)
- [ ] Add `whereToBuy` keys to your i18n (or swap in the plain object)
- [ ] Install missing npm packages
