import { Instagram, Facebook } from 'lucide-react';
import { SiPinterest, SiTripadvisor } from 'react-icons/si';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedUrl } from '@/lib/localeLinks';

export default function Footer() {
  const { language, t } = useLanguage();

  const mainSiteUrl = getLocalizedUrl('https://oldamsterdam.com/', language);

  return (
    <footer className="bg-black text-white pt-2 md:pt-12 pb-4 md:pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="hidden md:grid grid-cols-4 gap-8 mb-16">
          <div>
            <h3 className="text-base font-body font-bold text-white mb-3">{t.footer.switzerlandSection}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`/${language}/#products`}
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-section-products"
                >
                  {t.nav.products}
                </a>
              </li>
              <li>
                <a
                  href={`/${language}/#where-to-buy`}
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-section-where-to-buy"
                >
                  {t.footer.whereToBuy}
                </a>
              </li>
              <li>
                <a
                  href={`/${language}/#faq`}
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-section-faq"
                >
                  {t.footer.faqShort}
                </a>
              </li>
            </ul>
            <ul className="space-y-3 mt-6">
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/giftshop/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-webshop"
                >
                  {t.footer.webshop}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/product-category/gift-boxes/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-gift-boxes"
                >
                  {t.footer.giftBoxes}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/product-category/cheese/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-cheeses"
                >
                  {t.footer.cheeses}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/product-category/accessories/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-accessories"
                >
                  {t.footer.accessories}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/recipes/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-recipes"
                >
                  {t.footer.recipes}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-body font-bold text-white mb-3">{t.footer.customerService}</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/shipping-delivery-payment-methods/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-shipping"
                >
                  {t.footer.shippingDelivery}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/my-account/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-my-account"
                >
                  {t.footer.myAccount}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/my-account/orders/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-my-orders"
                >
                  {t.footer.myOrders}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/refund_returns/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-refund"
                >
                  {t.footer.refundReturns}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-body font-bold text-white mb-3">{t.footer.aboutUs}</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/cheese-stores/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-cheese-stores"
                >
                  {t.footer.cheeseStores}
                </a>
              </li>
              <li>
                <a 
                  href="https://www.westlandkaas.nl/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-grow-by"
                >
                  {t.footer.westlandKaas}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/frequently-asked-questions/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-faq"
                >
                  {t.footer.faq}
                </a>
              </li>
              <li>
                <a 
                  href={getLocalizedUrl("https://oldamsterdam.com/contact/", language)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base font-body text-white hover:text-primary transition-colors"
                  data-testid="link-footer-contact"
                >
                  {t.footer.contactUs}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex md:justify-end items-start">
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/oldamsterdam_nl/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Instagram" className="text-white hover:text-primary transition-colors" data-testid="link-social-instagram">
                <Instagram className="w-6 h-6" aria-hidden="true" />
              </a>
              <a href="https://www.facebook.com/OldAmsterdamCheese/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Facebook" className="text-white hover:text-primary transition-colors" data-testid="link-social-facebook">
                <Facebook className="w-6 h-6" aria-hidden="true" />
              </a>
              <a href="https://nl.pinterest.com/oldamsterdam_nl/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Pinterest" className="text-white hover:text-primary transition-colors" data-testid="link-social-pinterest">
                <SiPinterest className="w-6 h-6" aria-hidden="true" />
              </a>
              <a href="https://www.tripadvisor.nl/Attraction_Review-g188590-d5538742-Reviews-Old_Amsterdam_Cheese_Store-Amsterdam_North_Holland_Province.html" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on TripAdvisor" className="text-white hover:text-primary transition-colors" data-testid="link-social-tripadvisor">
                <SiTripadvisor className="w-6 h-6" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="md:hidden flex flex-col items-center gap-4 mb-4">
          <a
            href={mainSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-primary text-base underline underline-offset-4 hover:text-white transition-colors"
            data-testid="link-footer-learn-more-mobile"
          >
            {t.footer.learnMoreMobile}
          </a>

          <div className="flex items-center gap-5">
            <a href="https://www.instagram.com/oldamsterdam_nl/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Instagram" className="text-white hover:text-primary transition-colors" data-testid="link-social-instagram-mobile">
              <Instagram className="w-6 h-6" aria-hidden="true" />
            </a>
            <a href="https://www.facebook.com/OldAmsterdamCheese/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Facebook" className="text-white hover:text-primary transition-colors" data-testid="link-social-facebook-mobile">
              <Facebook className="w-6 h-6" aria-hidden="true" />
            </a>
            <a href="https://nl.pinterest.com/oldamsterdam_nl/" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on Pinterest" className="text-white hover:text-primary transition-colors" data-testid="link-social-pinterest-mobile">
              <SiPinterest className="w-6 h-6" aria-hidden="true" />
            </a>
            <a href="https://www.tripadvisor.nl/Attraction_Review-g188590-d5538742-Reviews-Old_Amsterdam_Cheese_Store-Amsterdam_North_Holland_Province.html" target="_blank" rel="noopener noreferrer" aria-label="Old Amsterdam on TripAdvisor" className="text-white hover:text-primary transition-colors" data-testid="link-social-tripadvisor-mobile">
              <SiTripadvisor className="w-6 h-6" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-4 md:mt-8 pt-4 md:pt-6 pb-2">
          <nav aria-label="Language versions" className="flex justify-center gap-4 mb-3">
            <a href="/en/" lang="en" hrefLang="en-CH" className="text-xs font-body text-white/50 hover:text-primary transition-colors uppercase" data-testid="link-locale-en">EN</a>
            <a href="/fr/" lang="fr" hrefLang="fr-CH" className="text-xs font-body text-white/50 hover:text-primary transition-colors uppercase" data-testid="link-locale-fr">FR</a>
            <a href="/de/" lang="de" hrefLang="de-CH" className="text-xs font-body text-white/50 hover:text-primary transition-colors uppercase" data-testid="link-locale-de">DE</a>
            <a href="/it/" lang="it" hrefLang="it-CH" className="text-xs font-body text-white/50 hover:text-primary transition-colors uppercase" data-testid="link-locale-it">IT</a>
          </nav>
          <div className="hidden md:block text-center text-sm font-body">
            <span className="text-primary">{t.footer.copyright}</span>
            <span className="text-white/70"> | </span>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/privacy-policy/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-primary transition-colors"
              data-testid="link-footer-privacy"
            >
              {t.footer.privacy}
            </a>
            <span className="text-white/70"> | </span>
            <a 
              href={getLocalizedUrl("https://oldamsterdam.com/general-terms-and-conditions/", language)}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-primary transition-colors"
              data-testid="link-footer-terms"
            >
              {t.footer.terms}
            </a>
          </div>
          <div className="md:hidden text-center">
            <a
              href={mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-body text-primary hover:text-white transition-colors"
              data-testid="link-footer-copyright-mobile"
            >
              © 2026 Old Amsterdam BV
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
