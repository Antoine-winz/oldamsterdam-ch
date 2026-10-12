import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedUrl } from '@/lib/localeLinks';

export default function BrandStorySection() {
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const storyUrl = getLocalizedUrl('https://oldamsterdam.com/about-old-amsterdam/', language);

  return (
    <section className="py-12 px-4 bg-black" data-testid="section-brand-story">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-8 text-center" data-testid="heading-brand-story">
          {t.brandStory.title}
        </h2>
        
        <div className="hidden md:block space-y-6">
          <p className="font-body text-lg text-white/90 leading-relaxed">
            {t.brandStory.paragraph1}
          </p>
          <p className="font-body text-lg text-white/90 leading-relaxed">
            {t.brandStory.paragraph2}
          </p>
          <p className="font-body text-lg text-white/90 leading-relaxed">
            {t.brandStory.paragraph3}
          </p>
        </div>

        <div className="md:hidden space-y-4">
          {!expanded ? (
            <p className="font-body text-base text-white/90 leading-relaxed">
              {t.brandStory.summaryMobile}{' '}
              <button
                onClick={() => setExpanded(true)}
                className="font-body text-primary text-sm underline underline-offset-4 inline"
                data-testid="button-brand-story-read-more"
              >
                {t.brandStory.readMore}
              </button>
            </p>
          ) : (
            <>
              <p className="font-body text-base text-white/90 leading-relaxed">
                {t.brandStory.paragraph1}
              </p>
              <p className="font-body text-base text-white/90 leading-relaxed">
                {t.brandStory.paragraph2}
              </p>
              <p className="font-body text-base text-white/90 leading-relaxed">
                {t.brandStory.paragraph3}{' '}
                <button
                  onClick={() => setExpanded(false)}
                  className="font-body text-primary text-sm underline underline-offset-4 inline"
                  data-testid="button-brand-story-read-less"
                >
                  {t.brandStory.readLess}
                </button>
              </p>
            </>
          )}
        </div>

        <div className="mt-10 text-center">
          <a 
            href={storyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-white text-lg underline hover:text-primary transition-colors inline-block"
            data-testid="link-brand-story-more"
          >
            {t.brandStory.learnMore}
          </a>
        </div>
      </div>
    </section>
  );
}
