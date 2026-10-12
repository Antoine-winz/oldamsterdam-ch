import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BrandStorySection from '@/components/BrandStorySection';
import AwardsSection from '@/components/AwardsSection';
import ProductsSection from '@/components/ProductsSection';
import CheeseExpertiseSection from '@/components/CheeseExpertiseSection';
import WhereToBuySection from '@/components/WhereToBuySection';
import FAQSection from '@/components/FAQSection';
import Spring2026Section from '@/components/Spring2026Section';
import Footer from '@/components/Footer';
import PageTracker from '@/components/PageTracker';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { language } = useLanguage();
  return (
    <div className="min-h-screen">
      <PageTracker path={`/${language}/`} language={language} />
      <Header />
      <main>
        <HeroSection />
        <BrandStorySection />
        <AwardsSection />
        <div id="products">
          <ProductsSection />
        </div>
        <CheeseExpertiseSection />
        {/* WhereToBuySection hidden on mobile — store search is embedded in hero on small screens */}
        <div className="hidden md:block">
          <WhereToBuySection />
        </div>
        <FAQSection />
        <Spring2026Section />
      </main>
      <Footer />
    </div>
  );
}
