import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language, translations } from '@/lib/i18n';
import Home from './Home';

interface LanguageHomeProps {
  lang: Language;
}

const FAQ_SCRIPT_ID = 'faq-jsonld';

export default function LanguageHome({ lang }: LanguageHomeProps) {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage(lang);
  }, [lang, setLanguage]);

  useEffect(() => {
    const faqQuestions = Object.values(
      translations[lang].faq.questions as Record<string, { q: string; a: string }>
    );
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqQuestions.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };

    let faqScript = document.getElementById(FAQ_SCRIPT_ID) as HTMLScriptElement | null;
    if (!faqScript) {
      faqScript = document.createElement('script');
      faqScript.id = FAQ_SCRIPT_ID;
      faqScript.type = 'application/ld+json';
      document.head.appendChild(faqScript);
    }
    faqScript.textContent = JSON.stringify(faqJsonLd);

    return () => {
      const script = document.getElementById(FAQ_SCRIPT_ID);
      if (script) script.remove();
    };
  }, [lang]);

  return <Home />;
}
