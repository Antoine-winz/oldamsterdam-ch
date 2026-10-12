import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import springBanner from '@assets/231005_OA-BORRELPLANKEN_Combi-1-uitgebreid-scaled_1761384500337.jpg';

export default function Spring2026Section() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language }),
      });

      if (response.status === 409) {
        toast({
          title: t.spring2026.alreadySubscribedTitle,
          description: t.spring2026.alreadySubscribedDescription,
        });
        setEmail('');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      toast({
        title: t.spring2026.successTitle,
        description: t.spring2026.successDescription,
      });
      setEmail('');
    } catch (error) {
      toast({
        title: t.spring2026.errorTitle,
        description: t.spring2026.errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-4 md:py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/spring-banner-mobile.webp" type="image/webp" />
          <source srcSet="/images/spring-banner.webp" type="image/webp" />
          <img 
            src={springBanner} 
            alt="Old Amsterdam cheese now available in Switzerland" 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={2560}
            height={1707}
          />
        </picture>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="bg-black/60 backdrop-blur-sm p-8 md:p-10 rounded-lg text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4">
            {t.spring2026.title}
          </h2>
          <p className="font-heading text-xl text-white mb-6">
            {t.spring2026.subtitle}
          </p>
          <p className="font-body text-lg text-white/90 mb-12">
            {t.spring2026.description}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.spring2026.emailPlaceholder}
              required
              className="flex-1 bg-black/80 backdrop-blur-md border-white/30 text-white placeholder:text-white/60"
              data-testid="input-newsletter-email"
            />
            <Button 
              type="submit" 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
              data-testid="button-newsletter-submit"
            >
              {isSubmitting ? t.spring2026.subscribing : t.spring2026.subscribe}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
