import { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedUrl } from '@/lib/localeLinks';
import { Menu, X } from 'lucide-react';
import logoImage from '@assets/image_1761325096941.png';

const languageFlags = {
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹'
};

export default function Header() {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, navigateToLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: 'en' | 'fr' | 'de' | 'it') => {
    navigateToLanguage(lang);
    setLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <nav className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link href={`/${language}/`} data-testid="link-home">
              <div className="flex items-center cursor-pointer hover-elevate active-elevate-2 rounded-md p-1 -ml-1">
                <img 
                  src={logoImage} 
                  alt="Old Amsterdam" 
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 lg:hidden">
            {/* Language switcher for mobile */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                data-testid="button-language-toggle-mobile"
                className="text-xs font-body text-white hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="text-sm">{languageFlags[language]}</span>
                <span className="uppercase font-semibold">{language}</span>
              </button>
              
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-popover border border-popover-border rounded-lg shadow-lg overflow-hidden z-50">
                  {(['en', 'fr', 'de', 'it'] as const).map((lang) => (
                    <a
                      key={lang}
                      href={`/${lang}/`}
                      lang={lang}
                      hrefLang={`${lang}-CH`}
                      onClick={(e) => { e.preventDefault(); handleLanguageChange(lang); }}
                      data-testid={`button-lang-mobile-${lang}`}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover-elevate ${
                        language === lang ? 'bg-accent' : ''
                      }`}
                    >
                      <span className="text-sm">{languageFlags[lang]}</span>
                      <span className="uppercase font-medium">{lang}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="text-white hover:text-primary transition-colors p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Navigation menu on the right (desktop) */}
          <div className="hidden lg:flex items-center gap-6">
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/giftshop/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-giftshop"
            >
              {t.nav.giftshop}
            </a>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/about-old-amsterdam/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-about"
            >
              {t.nav.about}
            </a>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/product-range/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-product-range"
            >
              {t.nav.productRange}
            </a>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/recipes/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-recipes"
            >
              {t.nav.recipes}
            </a>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/news/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-news"
            >
              {t.nav.news}
            </a>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/cheese-tasting/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-cheese-tasting"
            >
              {t.nav.cheeseTasting}
            </a>
            
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/business/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-body text-white hover:text-primary transition-colors"
              data-testid="link-nav-business"
            >
              {t.nav.business}
            </a>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                data-testid="button-language-toggle"
                className="text-xs font-body text-white hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="text-sm">{languageFlags[language]}</span>
                <span className="uppercase font-semibold">{language}</span>
              </button>
              
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-popover border border-popover-border rounded-lg shadow-lg overflow-hidden">
                  {(['en', 'fr', 'de', 'it'] as const).map((lang) => (
                    <a
                      key={lang}
                      href={`/${lang}/`}
                      lang={lang}
                      hrefLang={`${lang}-CH`}
                      onClick={(e) => { e.preventDefault(); handleLanguageChange(lang); }}
                      data-testid={`button-lang-${lang}`}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover-elevate ${
                        language === lang ? 'bg-accent' : ''
                      }`}
                    >
                      <span className="text-sm">{languageFlags[lang]}</span>
                      <span className="uppercase font-medium">{lang}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black">
            <div className="px-4 py-4 space-y-3">
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/giftshop/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-giftshop"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.giftshop}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/about-old-amsterdam/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-about"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.about}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/product-range/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-product-range"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.productRange}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/recipes/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-recipes"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.recipes}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/news/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-news"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.news}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/cheese-tasting/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-cheese-tasting"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.cheeseTasting}
              </a>
              <a 
                href={getLocalizedUrl("https://oldamsterdam.com/business/", language)}
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm font-body text-white hover:text-primary transition-colors py-2"
                data-testid="link-mobile-business"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.business}
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
