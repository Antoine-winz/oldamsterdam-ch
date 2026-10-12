import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { NewsletterSubscriber, ContactInquiry, PageVisit } from "@shared/schema";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

interface IpGeoData { country: string; city: string; region?: string; isp?: string; }
const ipCache: Record<string, IpGeoData | null> = {};

function IpCell({ ip }: { ip: string | null }) {
  const [geo, setGeo] = useState<IpGeoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lookup = useCallback(async () => {
    if (!ip || ip === "—" || ip === "unknown") return;
    if (ipCache[ip] !== undefined) { setGeo(ipCache[ip]); return; }
    setLoading(true);
    try { const res = await fetch(`/api/admin/ip-lookup/${ip}`); const data = await res.json(); ipCache[ip] = data; setGeo(data); } catch { ipCache[ip] = null; }
    setLoading(false);
  }, [ip]);
  const handleEnter = () => { timeoutRef.current = setTimeout(() => { setShow(true); lookup(); }, 200); };
  const handleLeave = () => { clearTimeout(timeoutRef.current); setShow(false); };
  return (
    <span className="relative cursor-help" onMouseEnter={handleEnter} onMouseLeave={handleLeave} data-testid={`ip-cell-${ip}`}>
      {ip || "—"}
      <span className="absolute z-50 left-0 bottom-full mb-1 rounded-md bg-neutral-800 border border-white/20 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap pointer-events-none transition-opacity" style={{ visibility: show ? "visible" : "hidden", opacity: show ? 1 : 0 }}>
        {loading ? "Loading..." : geo ? (<><span className="text-primary font-semibold">{geo.city}, {geo.country}</span>{geo.region && <span className="text-white/50 ml-1">({geo.region})</span>}{geo.isp && <><br /><span className="text-white/40">{geo.isp}</span></>}</>) : "No data"}
      </span>
    </span>
  );
}

function CountryCell({ ip }: { ip: string | null }) {
  const [geo, setGeo] = useState<IpGeoData | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!ip || ip === "—" || ip === "unknown") return;
    if (ipCache[ip] !== undefined) { setGeo(ipCache[ip]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try { const res = await fetch(`/api/admin/ip-lookup/${ip}`); const data = await res.json(); ipCache[ip] = data; setGeo(data); } catch { ipCache[ip] = null; }
      setLoading(false);
    }, Math.random() * 300);
    return () => clearTimeout(timer);
  }, [ip]);
  if (!ip || ip === "—" || ip === "unknown") return <span className="text-white/30">—</span>;
  if (loading) return <span className="text-white/30">...</span>;
  if (!geo) return <span className="text-white/30">—</span>;
  return <span className="text-white/60" data-testid={`country-${ip}`}>{geo.city ? `${geo.city}, ${geo.country}` : geo.country}</span>;
}

type Tab = "overview" | "analytics" | "subscribers" | "inquiries" | "visits";
type SortDir = "asc" | "desc";

interface Stats {
  totalVisits: number; uniqueIps: number; totalSubscribers: number; totalInquiries: number;
  topPaths: { path: string; count: number }[]; topCountries: { country: string; count: number }[];
}

interface AnalyticsData {
  summary: {
    totalViews: number; uniqueVisitors: number; todayViews: number; todayVisitors: number;
    yesterdayViews: number; last7Views: number; last30Views: number;
  };
  daily: { date: string; views: number; visitors: number }[];
  hourly: { hour: string; views: number }[];
  languages: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  pages: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
}

const CHART_COLORS = ["hsl(41, 58%, 63%)", "#60a5fa", "#34d399", "#f472b6", "#a78bfa", "#fb923c", "#facc15", "#e879f9"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-5">
      <p className="text-white/50 text-xs font-body mb-1">{label}</p>
      <p className="text-2xl font-heading text-primary" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs font-body mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-5">
      <h3 className="text-sm font-heading text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}

function RankingList({ items, color }: { items: { name: string; count: number }[]; color?: string }) {
  const max = items[0]?.count || 1;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-white/30 text-xs font-mono w-4 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-white/80 font-body text-xs truncate">{item.name}</span>
              <span className="text-primary font-body text-xs font-semibold shrink-0">{item.count}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color || "hsl(41, 58%, 63%)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-white/20 rounded-md px-3 py-2 text-xs shadow-lg">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-CH", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function SortHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: string; sortField: string; sortDir: SortDir; onSort: (field: string) => void;
}) {
  const active = sortField === field;
  return (
    <th className="text-left px-4 py-3 text-white/50 font-body font-normal cursor-pointer select-none hover:text-white/80 transition-colors" onClick={() => onSort(field)} data-testid={`sort-${field}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-xs" style={{ visibility: active ? "visible" : "hidden" }}>{sortDir === "asc" ? "▲" : "▼"}</span>
      </span>
    </th>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4">
      <input type="text" placeholder="Search..." value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-sm px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white font-body text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"
        data-testid="input-search" />
    </div>
  );
}

function useSortAndFilter<T extends Record<string, any>>(data: T[] | undefined, defaultSort: string, defaultDir: SortDir, searchFields: string[]) {
  const [sortField, setSortField] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);
  const [search, setSearch] = useState("");
  const onSort = useCallback((field: string) => {
    if (sortField === field) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortField(field); setSortDir("asc"); }
  }, [sortField]);
  const filtered = useMemo(() => {
    if (!data) return [];
    let items = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(item => searchFields.some(f => { const val = item[f]; return val && String(val).toLowerCase().includes(q); }));
    }
    items.sort((a, b) => {
      let aVal = a[sortField], bVal = b[sortField];
      if (sortField === "createdAt" || sortField === "subscribedAt") { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
      if (aVal == null) return 1; if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [data, sortField, sortDir, search, searchFields]);
  return { sortField, sortDir, search, setSearch, onSort, filtered };
}

function SEOTools() {
  const [pinging, setPinging] = useState(false);
  const [pingResults, setPingResults] = useState<{ engine: string; status: string }[] | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [lastPinged, setLastPinged] = useState<string | null>(null);

  const handlePing = async () => {
    setPinging(true);
    setPingError(null);
    setPingResults(null);
    try {
      const res = await apiRequest("POST", "/api/admin/ping-search-engines");
      const data = await res.json();
      if (res.ok) {
        setPingResults(data.results);
        setLastPinged(new Date().toLocaleString());
      } else {
        setPingError(data.error || "Failed to ping");
      }
    } catch {
      setPingError("Network error");
    }
    setPinging(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-6">
      <h3 className="text-lg font-heading text-primary mb-4" data-testid="text-seo-tools-title">SEO Tools</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-white/70 font-body text-sm mb-2">Notify search engines to recrawl your sitemap. Uses IndexNow (Bing/Yandex/DuckDuckGo) and Google Search Console API (when credentials are configured). Limited to once per hour.</p>
            <button
              onClick={handlePing}
              disabled={pinging}
              className="px-4 py-2 bg-primary text-black font-body text-sm font-semibold rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50"
              data-testid="button-ping-search-engines"
            >
              {pinging ? "Pinging..." : "Ping Search Engines"}
            </button>
            {lastPinged && <p className="text-white/30 font-body text-xs mt-2">Last pinged: {lastPinged}</p>}
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-white/50 font-body text-xs mb-1">Quick Links</p>
            <div className="space-y-1">
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="block text-primary/80 hover:text-primary text-sm font-body" data-testid="link-google-search-console">Google Search Console</a>
              <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="block text-primary/80 hover:text-primary text-sm font-body" data-testid="link-bing-webmaster">Bing Webmaster Tools</a>
              <a href="/sitemap.xml" target="_blank" className="block text-white/50 hover:text-white/80 text-sm font-body" data-testid="link-view-sitemap">View Sitemap</a>
              <a href="/robots.txt" target="_blank" className="block text-white/50 hover:text-white/80 text-sm font-body" data-testid="link-view-robots">View robots.txt</a>
            </div>
          </div>
        </div>
        {pingError && <p className="text-red-400 font-body text-sm" data-testid="text-ping-error">{pingError}</p>}
        {pingResults && (
          <div className="space-y-1 mt-2" data-testid="ping-results">
            {pingResults.map((r) => (
              <div key={r.engine} className="flex items-center gap-2 text-sm font-body">
                <span className={r.status.includes("successfully") || r.status.includes("submitted") ? "text-green-400" : "text-yellow-400"}>
                  {r.status.includes("successfully") || r.status.includes("submitted") ? "\u2713" : "\u2717"}
                </span>
                <span className="text-white/70">{r.engine}:</span>
                <span className={r.status.includes("successfully") || r.status.includes("submitted") ? "text-green-400" : "text-yellow-400"}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [, setLocation] = useLocation();

  const authQuery = useQuery<{ authenticated: boolean; email?: string } | null>({
    queryKey: ["/api/admin/me"], queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const statsQuery = useQuery<Stats>({
    queryKey: ["/api/admin/stats"], queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authQuery.data?.authenticated,
  });
  const analyticsQuery = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"], queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: tab === "analytics" && !!authQuery.data?.authenticated,
  });
  const subscribersQuery = useQuery<NewsletterSubscriber[]>({
    queryKey: ["/api/admin/subscribers"], queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: tab === "subscribers" && !!authQuery.data?.authenticated,
  });
  const inquiriesQuery = useQuery<ContactInquiry[]>({
    queryKey: ["/api/admin/inquiries"], queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: tab === "inquiries" && !!authQuery.data?.authenticated,
  });
  const visitsQuery = useQuery<PageVisit[]>({
    queryKey: ["/api/admin/visits"], queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: tab === "visits" && !!authQuery.data?.authenticated,
  });

  const [countryVersion, setCountryVersion] = useState(0);
  const cityAliases: Record<string, string[]> = useMemo(() => ({
    "Geneva": ["Genève", "Geneve", "Genf", "Ginevra"],
    "Zurich": ["Zürich", "Zuerich"],
    "Bern": ["Berne", "Berna"],
    "Basel": ["Bâle", "Basle", "Basilea"],
    "Lausanne": ["Losanna"],
    "Lucerne": ["Luzern", "Lucerna"],
    "Lugano": [],
    "St. Gallen": ["Saint-Gall", "San Gallo", "Sankt Gallen"],
    "Fribourg": ["Freiburg", "Friburgo", "Friburg"],
    "Neuchâtel": ["Neuchatel", "Neuenburg"],
    "Sion": ["Sitten", "Seduno"],
    "Thun": ["Thoune", "Thuno"],
    "Winterthur": ["Winterthour", "Winterthur"],
    "Biel": ["Bienne", "Biel/Bienne"],
    "Munich": ["München", "Muenchen", "Monaco di Baviera"],
    "Cologne": ["Köln", "Koeln", "Colonia"],
    "Lyon": ["Lione"],
    "Milan": ["Milano", "Mailand"],
    "Rome": ["Roma", "Rom"],
    "Paris": ["Parigi"],
    "Vienna": ["Wien", "Vienne"],
    "Brussels": ["Bruxelles", "Brüssel", "Brussel"],
    "Madrid": [],
    "Barcelona": ["Barcelone", "Barcellona"],
    "Lisbon": ["Lisboa", "Lissabon", "Lisbona"],
    "Amsterdam": [],
    "The Hague": ["Den Haag", "La Haye", "L'Aia"],
    "Frankfurt": ["Francfort", "Francoforte"],
    "Berlin": ["Berlino"],
    "Hamburg": ["Hambourg", "Amburgo"],
    "London": ["Londres", "Londra"],
  }), []);
  const visitsWithCountry = useMemo(() => {
    void countryVersion;
    const visits = visitsQuery.data;
    if (!visits) return [];
    return visits.map(v => {
      const geo = ipCache[v.ipAddress || ""];
      if (!geo) return { ...v, _country: "" };
      const display = geo.city ? `${geo.city}, ${geo.country}` : geo.country;
      const aliases = geo.city ? (cityAliases[geo.city] || []) : [];
      const searchable = aliases.length > 0 ? `${display}||${aliases.join(" ")}` : display;
      return { ...v, _country: searchable };
    });
  }, [visitsQuery.data, countryVersion, cityAliases]);
  useEffect(() => {
    const visits = visitsQuery.data;
    if (!visits) return;
    const uniqueIps = [...new Set(visits.map(v => v.ipAddress).filter(Boolean))] as string[];
    const unresolvedIps = uniqueIps.filter(ip => ipCache[ip] === undefined);
    if (unresolvedIps.length === 0) return;
    let cancelled = false;
    const batch = async (ips: string[]) => {
      await Promise.all(ips.map(async (ip) => {
        if (cancelled) return;
        try { const res = await fetch(`/api/admin/ip-lookup/${ip}`); const data = await res.json(); ipCache[ip] = data; } catch { ipCache[ip] = null; }
      }));
      if (!cancelled) setCountryVersion(v => v + 1);
    };
    const chunks: string[][] = [];
    for (let i = 0; i < unresolvedIps.length; i += 5) chunks.push(unresolvedIps.slice(i, i + 5));
    (async () => { for (const chunk of chunks) { if (cancelled) break; await batch(chunk); } })();
    return () => { cancelled = true; };
  }, [visitsQuery.data]);
  const visitsSF = useSortAndFilter(visitsWithCountry, "createdAt", "desc", ["ipAddress", "_country", "path", "language", "referrer", "userAgent"]);
  const subsSF = useSortAndFilter(subscribersQuery.data, "createdAt", "desc", ["email", "ipAddress", "language"]);
  const inqSF = useSortAndFilter(inquiriesQuery.data, "createdAt", "desc", ["name", "email", "company", "message", "ipAddress"]);

  useEffect(() => {
    if (authQuery.isSuccess && !authQuery.data?.authenticated) setLocation("/admin");
  }, [authQuery.isSuccess, authQuery.data]);

  const handleLogout = async () => { await apiRequest("POST", "/api/admin/logout"); setLocation("/admin"); };

  if (authQuery.isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white/50 font-body">Loading...</p></div>;
  if (!authQuery.data?.authenticated) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "analytics", label: "Analytics" },
    { key: "subscribers", label: "Subscribers" },
    { key: "inquiries", label: "Inquiries" },
    { key: "visits", label: "Visits" },
  ];

  const analytics = analyticsQuery.data;

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-heading text-primary" data-testid="text-dashboard-title">Old Amsterdam Admin</h1>
        <div className="flex items-center gap-4 flex-wrap">
          {authQuery.data?.email && <span className="text-white/40 text-sm font-body" data-testid="text-admin-email">{authQuery.data.email}</span>}
          <a href="/" className="text-white/50 hover:text-primary transition-colors text-sm font-body" data-testid="link-view-site">View Site</a>
          <button onClick={handleLogout} className="text-white/50 hover:text-red-400 transition-colors text-sm font-body" data-testid="button-logout">Logout</button>
        </div>
      </header>

      <nav className="border-b border-white/10 px-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-body transition-colors whitespace-nowrap ${tab === t.key ? "text-primary border-b-2 border-primary" : "text-white/50 hover:text-white/80"}`}
            data-testid={`tab-${t.key}`}>{t.label}</button>
        ))}
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Page Visits" value={statsQuery.data?.totalVisits ?? "—"} />
              <StatCard label="Unique Visitors" value={statsQuery.data?.uniqueIps ?? "—"} />
              <StatCard label="Newsletter Subscribers" value={statsQuery.data?.totalSubscribers ?? "—"} />
              <StatCard label="Contact Inquiries" value={statsQuery.data?.totalInquiries ?? "—"} />
            </div>
            {statsQuery.data?.topPaths && statsQuery.data.topPaths.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-md p-6">
                <h3 className="text-lg font-heading text-primary mb-4">Top Pages</h3>
                <div className="space-y-2">
                  {statsQuery.data.topPaths.map((p) => (
                    <div key={p.path} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/80 font-body text-sm">{p.path}</span>
                      <span className="text-primary font-body text-sm font-semibold">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {statsQuery.data?.topCountries && statsQuery.data.topCountries.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-md p-6">
                <h3 className="text-lg font-heading text-primary mb-4">Top Countries</h3>
                <div className="space-y-2">
                  {statsQuery.data.topCountries.map((c) => (
                    <div key={c.country} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/80 font-body text-sm">{c.country}</span>
                      <span className="text-primary font-body text-sm font-semibold">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <SEOTools />
          </div>
        )}

        {tab === "analytics" && (
          analyticsQuery.isLoading ? (
            <div className="flex items-center justify-center py-20"><p className="text-white/30 font-body">Loading analytics...</p></div>
          ) : !analytics ? (
            <div className="flex items-center justify-center py-20"><p className="text-white/30 font-body">No data available</p></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Today" value={analytics.summary.todayViews} sub={`${analytics.summary.todayVisitors} visitors`} />
                <StatCard label="Yesterday" value={analytics.summary.yesterdayViews} />
                <StatCard label="Last 7 Days" value={analytics.summary.last7Views} />
                <StatCard label="Last 30 Days" value={analytics.summary.last30Views} />
                <StatCard label="Total Views" value={analytics.summary.totalViews} />
                <StatCard label="Unique Visitors" value={analytics.summary.uniqueVisitors} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Newsletter Rate" value={`${analytics.summary.newsletterRate}%`} sub={`${analytics.summary.totalSubscribers} subscribers`} />
                <StatCard label="Contact Rate" value={`${analytics.summary.contactRate}%`} sub={`${analytics.summary.totalInquiries} inquiries`} />
                <StatCard label="New Visitors" value={analytics.summary.newVisitors} />
                <StatCard label="Returning Visitors" value={analytics.summary.returningVisitors} />
              </div>

              <ChartCard title="Traffic Over Time">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.daily} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(41, 58%, 63%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(41, 58%, 63%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} width={35} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="views" name="Page Views" stroke="hsl(41, 58%, 63%)" fill="url(#colorViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#60a5fa" fill="url(#colorVisitors)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Visits by Hour of Day">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.hourly} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="views" name="Views" fill="hsl(41, 58%, 63%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="New vs Returning">
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={[{ name: "New", count: analytics.summary.newVisitors }, { name: "Returning", count: analytics.summary.returningVisitors }]} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                          <Cell fill="#34d399" />
                          <Cell fill="#60a5fa" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#34d399" }} />
                        <span className="text-white/70 text-xs font-body flex-1">New</span>
                        <span className="text-white/50 text-xs font-body">{analytics.summary.newVisitors}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#60a5fa" }} />
                        <span className="text-white/70 text-xs font-body flex-1">Returning</span>
                        <span className="text-white/50 text-xs font-body">{analytics.summary.returningVisitors}</span>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Devices">
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={analytics.devices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                          {analytics.devices.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {analytics.devices.map((d: any, i: number) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-white/70 text-xs font-body flex-1">{d.name}</span>
                          <span className="text-white/50 text-xs font-body">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title="Browsers">
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={analytics.browsers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                          {analytics.browsers.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {analytics.browsers.map((b: any, i: number) => (
                        <div key={b.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                          <span className="text-white/70 text-xs font-body flex-1">{b.name}</span>
                          <span className="text-white/50 text-xs font-body">{b.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top Countries">
                  {analytics.countries?.length > 0 ? <RankingList items={analytics.countries} color="#f59e0b" /> : <p className="text-white/30 text-sm font-body">No country data yet</p>}
                </ChartCard>

                <ChartCard title="Top Cities">
                  {analytics.cities?.length > 0 ? <RankingList items={analytics.cities} color="#a78bfa" /> : <p className="text-white/30 text-sm font-body">No city data yet</p>}
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Languages">
                  <RankingList items={analytics.languages} color="#60a5fa" />
                </ChartCard>

                <ChartCard title="Top Referrers">
                  <RankingList items={analytics.referrers} color="#34d399" />
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Top Pages">
                  <RankingList items={analytics.pages} />
                </ChartCard>

                {(analytics.utmCampaigns?.length > 0 || analytics.utmSources?.length > 0) && (
                  <ChartCard title="UTM Campaigns">
                    {analytics.utmCampaigns?.length > 0 ? (
                      <div className="space-y-4">
                        <RankingList items={analytics.utmCampaigns} color="#f472b6" />
                        {analytics.utmSources?.length > 0 && (
                          <div className="border-t border-white/10 pt-3">
                            <p className="text-white/40 text-xs font-body mb-2">Sources</p>
                            <RankingList items={analytics.utmSources} color="#fb923c" />
                          </div>
                        )}
                        {analytics.utmMediums?.length > 0 && (
                          <div className="border-t border-white/10 pt-3">
                            <p className="text-white/40 text-xs font-body mb-2">Mediums</p>
                            <RankingList items={analytics.utmMediums} color="#38bdf8" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white/40 text-xs font-body">Sources</p>
                        <RankingList items={analytics.utmSources} color="#fb923c" />
                      </div>
                    )}
                  </ChartCard>
                )}
              </div>

              {!analytics.utmCampaigns?.length && !analytics.utmSources?.length && (
                <div className="bg-white/5 border border-white/10 rounded-md p-6">
                  <h3 className="text-sm font-heading text-primary mb-2">UTM Tracking</h3>
                  <p className="text-white/40 text-xs font-body">No campaign data yet. Add UTM parameters to your links to track marketing campaigns:</p>
                  <p className="text-white/50 text-xs font-body font-mono mt-2 bg-white/5 rounded px-3 py-2">oldamsterdam.ch/?utm_source=instagram&utm_medium=social&utm_campaign=spring2026</p>
                </div>
              )}
            </div>
          )
        )}

        {tab === "subscribers" && (
          <>
            <SearchBar value={subsSF.search} onChange={subsSF.setSearch} />
            <div className="bg-white/5 border border-white/10 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <SortHeader label="Email" field="email" sortField={subsSF.sortField} sortDir={subsSF.sortDir} onSort={subsSF.onSort} />
                      <SortHeader label="IP Address" field="ipAddress" sortField={subsSF.sortField} sortDir={subsSF.sortDir} onSort={subsSF.onSort} />
                      <SortHeader label="Language" field="language" sortField={subsSF.sortField} sortDir={subsSF.sortDir} onSort={subsSF.onSort} />
                      <SortHeader label="Date" field="createdAt" sortField={subsSF.sortField} sortDir={subsSF.sortDir} onSort={subsSF.onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {subscribersQuery.isLoading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30 font-body">Loading...</td></tr>
                    ) : !subsSF.filtered.length ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30 font-body">{subsSF.search ? "No results" : "No subscribers yet"}</td></tr>
                    ) : (
                      subsSF.filtered.map((s) => (
                        <tr key={s.id} className="border-b border-white/5" data-testid={`row-subscriber-${s.id}`}>
                          <td className="px-4 py-3 text-white font-body">{s.email}</td>
                          <td className="px-4 py-3 text-white/60 font-body font-mono text-xs"><IpCell ip={s.ipAddress || null} /></td>
                          <td className="px-4 py-3 text-white/60 font-body uppercase">{s.language || "—"}</td>
                          <td className="px-4 py-3 text-white/60 font-body">{formatDate(s.createdAt as any)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {subsSF.filtered.length > 0 && <p className="text-white/30 text-xs font-body mt-2">{subsSF.filtered.length} result{subsSF.filtered.length !== 1 ? "s" : ""}</p>}
          </>
        )}

        {tab === "inquiries" && (
          <>
            <SearchBar value={inqSF.search} onChange={inqSF.setSearch} />
            <div className="space-y-4">
              {inquiriesQuery.isLoading ? (
                <p className="text-center text-white/30 font-body py-8">Loading...</p>
              ) : !inqSF.filtered.length ? (
                <p className="text-center text-white/30 font-body py-8">{inqSF.search ? "No results" : "No inquiries yet"}</p>
              ) : (
                inqSF.filtered.map((inq) => (
                  <div key={inq.id} className="bg-white/5 border border-white/10 rounded-md p-6" data-testid={`card-inquiry-${inq.id}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <h3 className="text-white font-body font-semibold">{inq.name}</h3>
                        <p className="text-white/60 font-body text-sm">{inq.email} {inq.company ? `• ${inq.company}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 font-body text-xs">{formatDate(inq.createdAt as any)}</p>
                        <p className="text-white/40 font-body font-mono text-xs mt-1">IP: <IpCell ip={inq.ipAddress || null} /></p>
                      </div>
                    </div>
                    <p className="text-white/80 font-body text-sm leading-relaxed">{inq.message}</p>
                  </div>
                ))
              )}
            </div>
            {inqSF.filtered.length > 0 && <p className="text-white/30 text-xs font-body mt-2">{inqSF.filtered.length} result{inqSF.filtered.length !== 1 ? "s" : ""}</p>}
          </>
        )}

        {tab === "visits" && (
          <>
            <SearchBar value={visitsSF.search} onChange={visitsSF.setSearch} />
            <div className="bg-white/5 border border-white/10 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <SortHeader label="IP Address" field="ipAddress" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="Country" field="_country" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="Path" field="path" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="Language" field="language" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="Referrer" field="referrer" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="User Agent" field="userAgent" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                      <SortHeader label="Date" field="createdAt" sortField={visitsSF.sortField} sortDir={visitsSF.sortDir} onSort={visitsSF.onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {visitsQuery.isLoading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 font-body">Loading...</td></tr>
                    ) : !visitsSF.filtered.length ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 font-body">{visitsSF.search ? "No results" : "No visits tracked yet"}</td></tr>
                    ) : (
                      visitsSF.filtered.map((v) => (
                        <tr key={v.id} className="border-b border-white/5" data-testid={`row-visit-${v.id}`}>
                          <td className="px-4 py-3 text-white/60 font-body font-mono text-xs"><IpCell ip={v.ipAddress || null} /></td>
                          <td className="px-4 py-3 text-white/60 font-body text-xs">{v._country ? v._country.split("||")[0] : <span className="text-white/30">...</span>}</td>
                          <td className="px-4 py-3 text-white font-body">{v.path}</td>
                          <td className="px-4 py-3 text-white/60 font-body uppercase">{v.language || "—"}</td>
                          <td className="px-4 py-3 text-white/60 font-body text-xs max-w-[200px] truncate">{v.referrer || "—"}</td>
                          <td className="px-4 py-3 text-white/60 font-body text-xs max-w-[200px] truncate">{v.userAgent || "—"}</td>
                          <td className="px-4 py-3 text-white/60 font-body text-xs whitespace-nowrap">{formatDate(v.createdAt as any)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {visitsSF.filtered.length > 0 && <p className="text-white/30 text-xs font-body mt-2">{visitsSF.filtered.length} result{visitsSF.filtered.length !== 1 ? "s" : ""}</p>}
          </>
        )}
      </main>
    </div>
  );
}
