import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedUrl } from '@/lib/localeLinks';
import type { Product } from '@shared/schema';
import wedgeImage from '@assets/wedge_1773673721617.png';
import slicesImage from '@assets/slices_1773673721617.png';

const imageMap: Record<string, string> = {
  'wedge_1773673721617.png': wedgeImage,
  'slices_1773673721617.png': slicesImage,
  'Old-Amsterdam-Classic-Wedge-5.29-oz-150g-3D-2_1761326282415.png': wedgeImage,
  'Old-Amsterdam-Classic-115g-slices_1761326282415.png': slicesImage,
};

const webpMap: Record<string, { desktop: string; mobile: string }> = {
  'wedge_1773673721617.png': { desktop: '/images/wedge.webp', mobile: '/images/wedge-mobile.webp' },
  'slices_1773673721617.png': { desktop: '/images/slices.webp', mobile: '/images/slices-mobile.webp' },
  'Old-Amsterdam-Classic-Wedge-5.29-oz-150g-3D-2_1761326282415.png': { desktop: '/images/wedge.webp', mobile: '/images/wedge-mobile.webp' },
  'Old-Amsterdam-Classic-115g-slices_1761326282415.png': { desktop: '/images/slices.webp', mobile: '/images/slices-mobile.webp' },
};

function truncateToFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0] : text;
}

function ProductDescription({ description, productId }: { description: string; productId: string }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const summary = truncateToFirstSentence(description);
  const hasMMore = summary.length < description.length;

  return (
    <>
      <p className="hidden md:block font-body text-white/80 text-lg mb-6 px-4 leading-relaxed" data-testid={`text-product-description-${productId}`}>
        {description}
      </p>
      <div className="md:hidden px-4 mb-4">
        <p className="font-body text-white/80 text-base leading-relaxed" data-testid={`text-product-description-mobile-${productId}`}>
          {expanded ? description : summary}
          {hasMMore && (
            <>
              {' '}
              <button
                onClick={() => setExpanded(!expanded)}
                className="font-body text-primary text-sm underline underline-offset-4 inline"
                data-testid={`button-product-readmore-${productId}`}
              >
                {expanded ? t.brandStory.readLess : t.brandStory.readMore}
              </button>
            </>
          )}
        </p>
      </div>
    </>
  );
}

export default function ProductsSection() {
  const { language, t } = useLanguage();

  const { data: productsData = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    retry: 3,
    retryDelay: 1000,
  });

  const products = productsData.map((product) => ({
    id: product.id.toString(),
    name: product.name[language],
    weight: product.weight,
    description: product.description[language],
    image: imageMap[product.image] || product.image,
    webp: webpMap[product.image] || null,
    productUrl: getLocalizedUrl(product.productUrl, language),
  }));

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-white/70">
            <p className="text-lg mb-2">Loading products...</p>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/70">Error loading products. Please refresh the page.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4">
            {t.products.title}
          </h2>
          <p className="font-body text-lg text-white/80">
            {t.products.subtitle}
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="text-center group"
                data-testid={`card-product-${product.id}`}
              >
                <a 
                  href={product.productUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="mb-6 md:mb-8 cursor-pointer transition-transform duration-300 group-hover:scale-105">
                    <picture>
                      {product.webp && (
                        <>
                          <source media="(max-width: 768px)" srcSet={product.webp.mobile} type="image/webp" />
                          <source srcSet={product.webp.desktop} type="image/webp" />
                        </>
                      )}
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-auto object-contain max-w-md mx-auto"
                        style={{ minHeight: '200px' }}
                        loading="lazy"
                        decoding="async"
                        width={600}
                        height={600}
                        data-testid={`img-product-${product.id}`}
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0.3';
                        }}
                      />
                    </picture>
                  </div>
                  <h3 className="font-heading text-2xl md:text-3xl font-normal mb-4 md:mb-6 text-white group-hover:text-primary transition-colors cursor-pointer" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                </a>
                <ProductDescription description={product.description} productId={product.id} />
                <a 
                  href={product.productUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.products.learnMore} – ${product.name}`}
                  className="font-body text-white text-base md:text-lg underline hover:text-primary transition-colors inline-block" 
                  data-testid={`link-show-products-${product.id}`}
                >
                  {t.products.learnMore}
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
