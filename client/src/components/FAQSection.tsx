import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = Object.values(t.faq.questions);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-2 md:py-12 px-4 bg-black" id="faq" data-testid="section-faq">
      <div className="max-w-3xl mx-auto">
        <h2 
          className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4 text-center"
          data-testid="heading-faq"
        >
          {t.faq.title}
        </h2>
        <p className="font-body text-white/70 text-center mb-12 text-lg">
          {t.faq.subtitle}
        </p>

        <div className="space-y-0 md:space-y-3">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="border border-white/10 rounded-lg"
                data-testid={`faq-item-${index}`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex items-center justify-between gap-4 px-4 py-4 md:p-5 cursor-pointer w-full text-left hover-elevate rounded-lg"
                  data-testid={`button-faq-toggle-${index}`}
                >
                  <h3 className="font-body text-xl md:text-lg text-white font-normal md:font-medium pr-2">
                    {item.q}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200 hidden md:block ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div hidden={!isOpen}>
                  <p className="font-body text-white/80 text-base leading-relaxed px-5 pb-5">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
