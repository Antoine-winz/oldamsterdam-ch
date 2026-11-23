// Lien vers la recherche « Old Amsterdam » sur coop.ch.
// coop.ch existe en 4 langues : on suit la langue du site, qui suit celle du navigateur.
const COOP_LANGS = ['en', 'fr', 'de', 'it'];

export function coopSearchUrl(language: string): string {
  const lang = COOP_LANGS.includes(language) ? language : 'en';
  return `https://www.coop.ch/${lang}/search/?text=Old+Amsterdam`;
}
