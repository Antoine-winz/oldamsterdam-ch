import { Language } from './i18n';

/**
 * Converts oldamsterdam.com URLs to the correct localized version
 * 
 * As of November 2025, oldamsterdam.com has changed their language system:
 * - English: oldamsterdam.com (main site)
 * - German: oldamsterdam.de (separate domain)
 * - French: NOT AVAILABLE - links to English oldamsterdam.com
 * - Italian: NOT AVAILABLE - links to English oldamsterdam.com
 */
export function getLocalizedUrl(url: string, language: Language): string {
  // English, French, and Italian all use the main English site
  // (French and Italian are no longer available on oldamsterdam.com)
  if (language === 'en' || language === 'fr' || language === 'it') {
    return url;
  }
  
  // German uses a separate domain: oldamsterdam.de
  if (language === 'de') {
    // Parse the URL and change domain to oldamsterdam.de
    const urlObj = new URL(url);
    urlObj.hostname = 'oldamsterdam.de';
    return urlObj.toString();
  }
  
  return url;
}
