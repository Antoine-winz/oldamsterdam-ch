import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CheeseExpertiseSection() {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const expertise = t.cheeseExpertise;

  const cards = [
    { title: expertise.agingProcess.title, text: expertise.agingProcess.text },
    { title: expertise.flavorProfile.title, text: expertise.flavorProfile.text },
    { title: expertise.crystals.title, text: expertise.crystals.text },
    { title: expertise.swissMarket.title, text: expertise.swissMarket.text },
  ];

  return (
    <section className="py-12 px-4 bg-black" data-testid="section-cheese-expertise">
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-heading text-3xl md:text-4xl font-bold text-primary mb-3 text-center"
          data-testid="heading-cheese-expertise"
        >
          {expertise.title}
        </h2>
        <p className="font-body text-lg text-white/60 text-center mb-10 max-w-2xl mx-auto">
          {expertise.subtitle}
        </p>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
              data-testid={`expertise-card-${i}`}
            >
              <h3 className="font-heading text-xl text-primary mb-3">{card.title}</h3>
              <p className="font-body text-white/80 text-base leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <h3 className="font-heading text-lg text-primary mb-2">{cards[0].title}</h3>
            <p className="font-body text-white/80 text-sm leading-relaxed">{cards[0].text}</p>
          </div>
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="font-body text-primary text-sm underline underline-offset-4 block mx-auto"
              data-testid="button-expertise-read-more"
            >
              {t.brandStory.readMore}
            </button>
          ) : (
            <>
              {cards.slice(1).map((card, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <h3 className="font-heading text-lg text-primary mb-2">{card.title}</h3>
                  <p className="font-body text-white/80 text-sm leading-relaxed">{card.text}</p>
                </div>
              ))}
              <button
                onClick={() => setExpanded(false)}
                className="font-body text-primary text-sm underline underline-offset-4 block mx-auto"
                data-testid="button-expertise-read-less"
              >
                {t.brandStory.readLess}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
