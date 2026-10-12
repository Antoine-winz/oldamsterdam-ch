import { useLanguage } from '@/contexts/LanguageContext';
import awardsImage from '@assets/image_1770837377091.png';
import { getLocalizedUrl } from '@/lib/localeLinks';

export default function AwardsSection() {
  const { t, language } = useLanguage();

  const learnMoreUrl = getLocalizedUrl('https://oldamsterdam.com/news/old-amsterdam-triumphs-at-world-cheese-awards-2025/', language);

  return (
    <section className="py-12 px-4 bg-black border-t border-white/5" data-testid="section-awards">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary text-center mb-3" data-testid="heading-awards">
          {t.awards.titleLine1}<br />
          <span>World Cheese Awards 2025</span>
        </h2>

        <p className="font-body text-lg text-white/80 text-center mb-8" data-testid="text-awards-subtitle">
          {t.awards.subtitle}
        </p>

        <div className="mb-8">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/awards-mobile.webp" type="image/webp" />
            <source srcSet="/images/awards.webp" type="image/webp" />
            <img
              src={awardsImage}
              alt="Old Amsterdam World Cheese Awards 2025 - three award-winning cheese wheels with Gold and Bronze medals"
              className="w-full rounded-md"
              loading="lazy"
              decoding="async"
              width={1920}
              height={1280}
              data-testid="img-awards-cheeses"
            />
          </picture>
        </div>

        <div className="hidden md:block">
          <p className="font-body text-base text-white/80 leading-relaxed mb-6" data-testid="text-awards-description">
            {t.awards.description}
          </p>

          <blockquote className="border-l-0 border-t border-b border-white/10 py-5 px-2 mb-6">
            <p className="font-body text-base text-white/90 italic mb-2" data-testid="text-awards-quote">
              "{t.awards.quote}"
            </p>
            <cite className="font-body text-sm text-primary not-italic" data-testid="text-awards-quote-author">
              — {t.awards.quoteAuthor}
            </cite>
          </blockquote>

          <a
            href={t.awards.readMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-white text-base underline hover:text-primary transition-colors inline-block"
            data-testid="link-awards-read-more"
          >
            {t.awards.readMore}
          </a>
        </div>

        <div className="md:hidden text-center">
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-primary text-base underline underline-offset-4 hover:text-white transition-colors"
            data-testid="link-awards-learn-more-mobile"
          >
            {t.awards.readMore}
          </a>
        </div>
      </div>
    </section>
  );
}
