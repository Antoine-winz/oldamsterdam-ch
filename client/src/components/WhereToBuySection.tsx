import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Store, Search, MapPin, X, Navigation, Package, ShoppingCart, Info, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COOP_LANG_MAP: Record<string, string> = { en: 'de', fr: 'fr', de: 'de', it: 'it' };
function coopSearchUrl(language: string): string {
  const lang = COOP_LANG_MAP[language] || 'de';
  return `https://www.coop.ch/${lang}/search/?text=old+amsterdam`;
}

type RetailerFilter = 'all' | 'coop' | 'manor';

interface StoreResult {
  id: number;
  debitor: string | null;
  name: string;
  city: string;
  npa: string;
  address: string;
  full_address: string;
  phone: string | null;
  has_wedge_210g: boolean;
  has_slices_115g: boolean;
  retailer: string;
  availability_note: string | null;
  latitude: number;
  longitude: number;
  distance: number;
}

interface SearchResult {
  location: { lat: number; lon: number; label: string };
  stores: StoreResult[];
}

export default function WhereToBuySection() {
  const { t, language } = useLanguage();
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
      const resp = await fetch(
        `/api/stores/nearest?query=${encodeURIComponent(trimmed)}&retailer=${r}&limit=5`
      );
      if (resp.status === 404) {
        setError(tw.locationNotFound);
        setLoading(false);
        return;
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, retailer);
  };

  const handleFilterChange = (r: RetailerFilter) => {
    setRetailer(r);
    if (result) doSearch(query, r);
  };

  const closePanel = () => setPanelOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    if (panelOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const mapsUrl = (addr: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

  const filterButtons: { key: RetailerFilter; label: string }[] = [
    { key: 'all', label: tw.filterAll },
    { key: 'coop', label: tw.filterCoop },
    { key: 'manor', label: tw.filterManor },
  ];

  const storeKey = (store: StoreResult) => store.debitor ?? String(store.id);

  return (
    <section className="py-12 px-4 bg-black" id="where-to-buy">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h2
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 break-words hyphens-auto"
            data-testid="heading-where-to-buy"
          >
            {tw.title}
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-10 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-primary" />
            </div>
            <p className="font-body text-base md:text-lg text-white/90 mb-6" data-testid="text-stores-coming">
              {tw.comingSoon}
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tw.searchPlaceholder}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  data-testid="input-store-search"
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
                data-testid="button-geolocate"
              >
                {geoLoading
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <LocateFixed className="w-4 h-4" />}
              </button>
              <Button
                type="submit"
                disabled={loading || geoLoading || !query.trim()}
                className="shrink-0"
                data-testid="button-store-search"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : tw.searchButton}
              </Button>
            </form>

            {error && (
              <p className="mt-3 text-sm text-red-400 text-left" data-testid="text-search-error">
                {error}
              </p>
            )}

            <div className="mt-5 pt-5 border-t border-white/10">
              <a
                href={coopSearchUrl(language)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-buy-online"
              >
                <Button variant="outline" className="w-full gap-2 border-white/20 text-white/80">
                  <ShoppingCart className="w-4 h-4" />
                  {tw.buyOnline}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {panelOpen && result && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={closePanel}
            aria-hidden="true"
          />

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
                <p className="text-sm font-semibold text-primary font-body truncate" data-testid="text-resolved-location">
                  {result.location.label}
                </p>
              </div>
              <button
                onClick={closePanel}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-full hover-elevate"
                data-testid="button-close-panel"
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
                  data-testid={`button-filter-${fb.key}`}
                  className={[
                    'px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors',
                    retailer === fb.key
                      ? 'bg-primary text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/15',
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
                <p className="text-center text-white/50 py-8 text-sm font-body" data-testid="text-no-results">
                  {tw.noResults}
                </p>
              )}

              {!loading && result.stores.map((store, idx) => {
                const isCoop = store.retailer === 'Coop';
                const key = storeKey(store);
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 py-4 border-b border-white/5 last:border-0"
                    data-testid={`card-store-${key}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs font-body">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={[
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-body font-semibold shrink-0',
                              isCoop
                                ? 'bg-orange-600/90 text-white'
                                : 'bg-zinc-700 text-zinc-100',
                            ].join(' ')}
                            data-testid={`badge-retailer-${key}`}
                          >
                            {store.retailer}
                          </span>
                          <p className="font-semibold text-white text-sm font-body leading-tight truncate" data-testid={`text-store-name-${key}`}>
                            {store.name}
                          </p>
                        </div>
                        <span
                          className="text-primary font-bold text-sm font-body shrink-0"
                          data-testid={`text-distance-${key}`}
                        >
                          {store.distance.toFixed(1)} {tw.distance}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5 text-white/50">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <p className="text-xs font-body truncate" data-testid={`text-address-${key}`}>
                          {store.address}, {store.npa} {store.city}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2 items-center justify-between">
                        <div className="flex gap-1.5 flex-wrap items-center">
                          <>
                            {store.has_wedge_210g && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-body font-medium"
                                data-testid={`badge-wedge-${key}`}
                              >
                                <Package className="w-3 h-3" />
                                {tw.badgeWedge}
                              </span>
                            )}
                            {store.has_slices_115g && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-xs font-body font-medium"
                                data-testid={`badge-slices-${key}`}
                              >
                                <Package className="w-3 h-3" />
                                {tw.badgeSlices}
                              </span>
                            )}
                            {store.availability_note && (
                              <span
                                className="inline-flex items-center gap-1 text-xs text-white/40 font-body"
                                data-testid={`text-availability-${key}`}
                              >
                                <Info className="w-3 h-3 shrink-0" />
                                {store.availability_note}
                              </span>
                            )}
                          </>
                        </div>
                        <a
                          href={mapsUrl(store.full_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-primary transition-colors font-body shrink-0"
                          data-testid={`link-maps-${key}`}
                        >
                          <Navigation className="w-3 h-3" />
                          {tw.mapsLink}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-white/10 shrink-0">
              <p className="text-xs text-white/30 font-body leading-relaxed" data-testid="text-disclaimer">
                <Info className="w-3 h-3 inline mr-1 shrink-0" />
                {tw.disclaimer}
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
