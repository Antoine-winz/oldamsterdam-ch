import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageRedirect() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    setLocation(`/${language}/`, { replace: true });
  }, [language, setLocation]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-primary text-xl">Redirecting...</div>
    </div>
  );
}
