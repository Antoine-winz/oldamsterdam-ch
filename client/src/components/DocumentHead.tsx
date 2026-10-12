import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const VALID_LANGUAGES = ['en', 'fr', 'de', 'it'] as const;
const BASE_URL = 'https://oldamsterdam.ch';
const OG_IMAGE = `${BASE_URL}/og-image.jpg`;

function setOrCreate(selector: string, attribute: string, value: string, createElement: () => HTMLElement) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = createElement();
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

function setMeta(name: string, content: string) {
  setOrCreate(`meta[name="${name}"]`, 'content', content, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  });
}

function setProperty(property: string, content: string) {
  setOrCreate(`meta[property="${property}"]`, 'content', content, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    return m;
  });
}

export default function DocumentHead() {
  const { language, t } = useLanguage();

  useEffect(() => {
    const meta = t.meta as { title: string; description: string; keywords: string };
    const currentUrl = `${BASE_URL}/${language}/`;

    document.title = meta.title;
    document.documentElement.lang = language;

    setMeta('description', meta.description);
    setMeta('keywords', meta.keywords);
    setMeta('robots', 'index, follow');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
    setMeta('twitter:image', OG_IMAGE);

    setProperty('og:type', 'website');
    setProperty('og:site_name', 'Old Amsterdam Switzerland');
    setProperty('og:title', meta.title);
    setProperty('og:description', meta.description);
    setProperty('og:url', currentUrl);
    setProperty('og:image', OG_IMAGE);
    setProperty('og:image:width', '1200');
    setProperty('og:image:height', '630');

    const localeMap: Record<string, string> = { en: 'en_GB', fr: 'fr_CH', de: 'de_CH', it: 'it_CH' };
    setProperty('og:locale', localeMap[language] ?? 'en_GB');

    const altLocales = VALID_LANGUAGES.filter(l => l !== language);
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el => el.remove());
    altLocales.forEach(lang => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:locale:alternate');
      m.setAttribute('content', localeMap[lang]);
      document.head.appendChild(m);
    });

    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    VALID_LANGUAGES.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = `${lang}-ch`;
      link.href = `${BASE_URL}/${lang}/`;
      document.head.appendChild(link);
    });
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = `${BASE_URL}/en/`;
    document.head.appendChild(xDefault);

    setOrCreate('link[rel="canonical"]', 'href', currentUrl, () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    });

  }, [language, t]);

  return null;
}
