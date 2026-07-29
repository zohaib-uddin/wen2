import React, { useRef, useMemo } from "react";
import { useShop } from "../../context/ShopContext";
import { motion } from "motion/react";
import { ProductCard } from "../shop/ProductCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useScrollArrows } from "../../hooks/useScrollArrows";

export const BestSellersSection: React.FC = () => {
  const { products, productsLoading, navigate } = useShop();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isAtStart, isAtEnd } = useScrollArrows(scrollContainerRef);

  // Sort ALL products by creation date (Oldest first)
  // Removed .slice(0, 8) limit to show ALL products as requested
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Check if any product actually has a date field to avoid NaN sorting issues
    const hasDateField = products.some((p: any) => p.created_at || p.createdAt || p.date);
    
    if (hasDateField) {
      return [...products].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || b.date || 0).getTime();
        return dateA - dateB; // Ascending order: Oldest creation date comes first
      });
    }
    
    // Fallback: If no date fields exist, trust the original DB order 
    // (which ShopPage.tsx confirms is already oldest first)
    return products;
  }, [products]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (productsLoading) {
    return (
      <section className="py-[40px] md:py-[80px] lg:py-[120px] bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-[40px] h-[40px] border-[4px] border-[#B69355] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (!displayProducts || displayProducts.length === 0) {
    return (
      <section className="py-[40px] md:py-[80px] lg:py-[120px] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#63786A] text-[15px]">More items coming soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-[40px] md:py-[120px] bg-[#F4EBDB] font-sans"
      id="best-sellers-section-target"
    >
      <div className="max-w-[1280px] mx-auto px-[16px] md:px-[24px]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-[600px] mx-auto mb-[32px] md:mb-[60px] flex flex-col items-center"
        >
          <div className="w-[40px] h-[2px] bg-[#B69355] mb-[12px] md:mb-[16px]" />
          <span className="text-[#B69355] text-[10px] md:text-[11px] font-bold tracking-[3px] uppercase block mb-[12px] md:mb-[16px]">
            CURATED FOR YOU
          </span>
          <h2 className="font-playfair text-[28px] md:text-[44px] font-bold text-[#254936] tracking-[-0.01em]">
            Featured Products
          </h2>
          <p className="text-[13px] md:text-[15px] text-[#63786A] leading-[1.7] mt-[8px] md:mt-[12px] max-w-[500px]">
            Handpicked formulations for your unique beauty needs
          </p>
        </motion.div>

        {/* Product Carousel with Arrows */}
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className={`absolute left-0 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 md:w-12 h-10 md:h-12 flex items-center justify-center text-[#254936] transition-all duration-300 cursor-pointer ${
              isAtStart ? "opacity-0 pointer-events-none translate-x-[-10px]" : "opacity-100 translate-x-0"
            }`}
            aria-label="Scroll left"
          >
            <ArrowLeft size={28} strokeWidth={2.5} className="md:w-8 md:h-8" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 gap-[16px] md:gap-[24px] px-[16px] md:px-0 -mx-[16px] md:mx-0 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="w-[85vw] sm:w-[280px] md:w-[calc(25%-18px)] shrink-0 snap-center md:snap-start"
              >
                <ProductCard
                  product={product}
                  viewMode="grid"
                  pageContext="best-sellers"
                />
              </motion.div>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className={`absolute right-0 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 md:w-12 h-10 md:h-12 flex items-center justify-center text-[#254936] transition-all duration-300 cursor-pointer ${
              isAtEnd ? "opacity-0 pointer-events-none translate-x-[10px]" : "opacity-100 translate-x-0"
            }`}
            aria-label="Scroll right"
          >
            <ArrowRight size={28} strokeWidth={2.5} className="md:w-8 md:h-8" />
          </button>
        </div>

        <div className="flex justify-center mt-[32px] md:mt-[48px]">
          <button
            onClick={() => navigate("shop")}
            className="inline-block text-[#B69355] hover:text-[#254936] font-bold text-[11px] md:text-[12px] uppercase tracking-[2px] transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-current after:origin-left after:scale-x-100 hover:after:scale-x-0 after:transition-transform after:duration-300"
            id="view-all-products-btn"
          >
            All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default BestSellersSection;