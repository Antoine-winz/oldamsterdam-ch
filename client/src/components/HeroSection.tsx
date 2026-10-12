import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, X, MapPin, Navigation, Package, Info, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import heroImage from '@assets/OA_Borrel_ass_herfst2018_stuk-e1665412319435-2560x1406-1_1761325518477.jpg';

interface StoreResult {
  id: number;
  debitor: string | null;
  name: string;
  city: string;
  npa: string;
  address: string;
  full_address: string;
  has_wedge_210g: boolean;
  has_slices_115g: boolean;
  retailer: string;
  availability_note: string | null;
  distance: number;
}

interface SearchResult {
  location: { lat: number; lon: number; label: string };
  stores: StoreResult[];
}

type RetailerFilter = 'all' | 'coop' | 'manor';

export default function HeroSection() {
  const { t } = useLanguage();
  const tw = t.whereToBuy as any;

  const [query, setQuery] = useState('');
  const [retailer, setRetailer] = useState<RetailerFilter>('all');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const doSearchByCoords = useCallback(async (lat: number, lon: number, r: RetailerFilter) => {
    setGeoLoading(true);
    setError('');
    try {
      const resp = await fetch(`/api/stores/nearest?lat=${lat}&lon=${lon}&retailer=${r}&limit=5`);
      if (!resp.ok) throw new Error();
      const data: SearchResult = await resp.json();
      setResult(data);
      setPanelOpen(true);
    } catch {
      setError(tw.errorFetching);
    } finally {
      setGeoLoading(false);
    }
  }, [tw]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setError(tw.locationDenied); return; }
    setGeoLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => doSearchByCoords(pos.coords.latitude, pos.coords.longitude, retailer),
      () => { setError(tw.locationDenied); setGeoLoading(false); },
      { timeout: 10000 }
    );
  }, [tw, retailer, doSearchByCoords]);

  const doSearch = useCallback(async (q: string, r: RetailerFilter) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`/api/stores/nearest?query=${encodeURIComponent(trimmed)}&retailer=${r}&limit=5`);
      if (resp.status === 404) { setError(tw.locationNotFound); setLoading(false); return; }
      if (!resp.ok) throw new Error();
      const data: SearchResult = await resp.json();
      setResult(data);
      setPanelOpen(true);
    } catch {
      setError(tw.errorFetching);
    } finally {
      setLoading(false);
    }
  }, [tw]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(query, retailer); };
  const handleFilterChange = (r: RetailerFilter) => { setRetailer(r); if (result) doSearch(query, r); };
  const closePanel = () => setPanelOpen(false);
  const mapsUrl = (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  const storeKey = (s: StoreResult) => s.debitor ?? String(s.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    if (panelOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const filterButtons: { key: RetailerFilter; label: string }[] = [
    { key: 'all', label: tw.filterAll },
    { key: 'coop', label: tw.filterCoop },
    { key: 'manor', label: tw.filterManor },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background image — eager, high priority, no lazy load */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/hero-mobile.webp" type="image/webp" />
          <source srcSet="/images/hero.webp" type="image/webp" />
          <img
            src={heroImage}
            alt="Old Amsterdam premium aged Gouda cheese board with wine and accompaniments"
            className="w-full h-full object-cover brightness-110"
            loading="eager"
            decoding="async"
            width={2560}
            height={1406}
            srcSet="/images/hero-mobile.webp 828w, /images/hero.webp 1920w"
            sizes="100vw"
            {...({ fetchpriority: 'high' } as Record<string, string>)}
          />
        </picture>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Hero text content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-20 md:py-28 lg:py-32">
        <div className="max-w-3xl bg-black/70 p-5 sm:p-6 md:p-8 lg:p-10 rounded-lg">
          <h1
            className="font-heading text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary mb-3 md:mb-6 leading-tight"
            data-testid="heading-hero-title"
          >
            <span className="block">{t.hero.seoTitleLine1}</span>
            <span className="block">{t.hero.seoTitleLine2}</span>
          </h1>
          <p className="font-body text-base sm:text-lg md:text-xl lg:text-2xl text-white leading-relaxed mb-3 md:mb-6 break-words">
            {t.hero.descriptionLine1}
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            {t.hero.descriptionLine2}
          </p>
          <p className="font-body text-sm sm:text-base md:text-lg text-white/90 leading-relaxed break-words">
            {t.hero.richText}
          </p>
        </div>
      </div>

      {/* Mobile-only compact store finder — sits at the base of the hero, visible without scrolling */}
      <div className="relative z-10 md:hidden px-4 pb-5">
        <div className="bg-black/80 rounded-lg border border-white/10 overflow-hidden" id="where-to-buy-mobile">
        <p className="text-center font-heading text-primary font-semibold text-base py-2 px-3 border-b border-white/10">
          {tw.title}
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center p-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tw.searchPlaceholder}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary"
              data-testid="input-store-search-hero"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading || loading}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-white/10 border border-white/20 text-white/60 hover:text-primary transition-colors disabled:opacity-50"
            aria-label={tw.useMyLocation}
            title={tw.useMyLocation}
            data-testid="button-geolocate-hero"
          >
            {geoLoading
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <LocateFixed className="w-4 h-4" />}
          </button>
          <Button
            type="submit"
            disabled={loading || geoLoading || !query.trim()}
            className="shrink-0"
            data-testid="button-store-search-hero"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : tw.searchButton}
          </Button>
        </form>
        {error && (
          <p className="text-xs text-red-400 px-3 pb-2" data-testid="text-search-error-hero">{error}</p>
        )}
        <p className="text-center font-heading font-bold text-primary text-sm py-2 px-3 border-t border-white/10">
          {tw.comingSoon}
        </p>
        </div>
      </div>

      {/* Results bottom sheet — fixed overlay, works from anywhere on page */}
      {panelOpen && result && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={closePanel} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tw.searchTitle}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-950 border border-b-0 border-white/10 rounded-t-2xl overflow-hidden"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide font-body">{tw.resolvedLocation}</p>
                <p className="text-sm font-semibold text-primary font-body truncate" data-testid="text-resolved-location-hero">
                  {result.location.label}
                </p>
              </div>
              <button
                onClick={closePanel}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-full hover-elevate"
                data-testid="button-close-panel-hero"
                aria-label={tw.closeSearch}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 px-4 py-3 shrink-0 border-b border-white/10">
              {filterButtons.map(fb => (
                <button
                  key={fb.key}
                  onClick={() => handleFilterChange(fb.key)}
                  data-testid={`button-filter-hero-${fb.key}`}
                  className={[
                    'px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors',
                    retailer === fb.key ? 'bg-primary text-black' : 'bg-white/10 text-white/70 hover:bg-white/15',
                  ].join(' ')}
                >
                  {fb.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && result.stores.length === 0 && (
                <p className="text-center text-white/50 py-8 text-sm font-body" data-testid="text-no-results-hero">
                  {tw.noResults}
                </p>
              )}
              {!loading && result.stores.map((store, idx) => {
                const isCoop = store.retailer === 'Coop';
                const key = storeKey(store);
                return (
                  <div key={key} className="flex items-start gap-3 py-4 border-b border-white/5 last:border-0" data-testid={`card-store-hero-${key}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs font-body">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={['inline-flex items-center px-2 py-0.5 rounded text-xs font-body font-semibold shrink-0', isCoop ? 'bg-orange-600/90 text-white' : 'bg-zinc-700 text-zinc-100'].join(' ')}
                            data-testid={`badge-retailer-hero-${key}`}
                          >
                            {store.retailer}
                          </span>
                          <p className="font-semibold text-white text-sm font-body leading-tight truncate" data-testid={`text-store-name-hero-${key}`}>
                            {store.name}
                          </p>
                        </div>
                        <span className="text-primary font-bold text-sm font-body shrink-0" data-testid={`text-distance-hero-${key}`}>
                          {store.distance.toFixed(1)} {tw.distance}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-white/50">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <p className="text-xs font-body truncate" data-testid={`text-address-hero-${key}`}>
                          {store.address}, {store.npa} {store.city}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center justify-between">
                        <div className="flex gap-1.5 flex-wrap items-center">
                          {store.has_wedge_210g && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-body font-medium" data-testid={`badge-wedge-hero-${key}`}>
                              <Package className="w-3 h-3" />{tw.badgeWedge}
                            </span>
                          )}
                          {store.has_slices_115g && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-xs font-body font-medium" data-testid={`badge-slices-hero-${key}`}>
                              <Package className="w-3 h-3" />{tw.badgeSlices}
                            </span>
                          )}
                          {store.availability_note && (
                            <span className="inline-flex items-center gap-1 text-xs text-white/40 font-body" data-testid={`text-availability-hero-${key}`}>
                              <Info className="w-3 h-3 shrink-0" />{store.availability_note}
                            </span>
                          )}
                        </div>
                        <a
                          href={mapsUrl(store.full_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Google Maps – ${store.name}`}
                          className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-primary transition-colors font-body shrink-0"
                          data-testid={`link-maps-hero-${key}`}
                        >
                          <Navigation className="w-3 h-3" aria-hidden="true" />{tw.mapsLink}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-white/10 shrink-0">
              <p className="text-xs text-white/30 font-body leading-relaxed" data-testid="text-disclaimer-hero">
                <Info className="w-3 h-3 inline mr-1 shrink-0" aria-hidden="true" />
                {tw.disclaimer}
              </p>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from { transform: translateX(-50%) translateY(100%); opacity: 0; }
              to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
          `}</style>
        </>
      )}
    </section>
  );
}
