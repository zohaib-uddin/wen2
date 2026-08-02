import React, { useRef } from "react";
import { Star, BadgeCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { useScrollArrows } from "../../hooks/useScrollArrows";
import { motion } from "motion/react";

interface Testimonial {
  name: string;
  avatar: string;
  text: string;
}

export const TestimonialSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isAtStart, isAtEnd } = useScrollArrows(scrollContainerRef);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const testimonials: Testimonial[] = [
    {
      name: "Zara Ahmed",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=100&w=400&auto=format&fit=crop",
      text: '"Pakistan\'s salty water literally ruined my split ends. Two weeks with the Kashmiri Saffron Hair Serum and my scalp has never felt this hydrated and alive!"',
    },
    {
      name: "Maryam Malik",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=100&w=400&auto=format&fit=crop",
      text: '"Absolutely in love with the Acne Deep Cleanser. My skin texture is completely soft now, with no dry flares or oiliness mirroring under the Lahore humidity."',
    },
    {
      name: "Fatima Bilal",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=100&w=400&auto=format&fit=crop",
      text: '"The Saffron night Glow Dream Cream cleared my dark spots in under 3 weeks. It feels unbelievably luxurious, smells elegant, and provides verified skin hydration."',
    },
  ];

  // Premium Glassmorphism Arrow Base Class
  const arrowBaseClass = "absolute z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-[#254936] shadow-lg hover:bg-white/50 hover:scale-105 transition-all duration-300 cursor-pointer";

  return (
    <section
      className="bg-white py-[40px] md:py-[80px] lg:py-[120px] font-sans"
      id="testimonial-section"
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
          <div className="w-[40px] h-[2px] bg-[#B69355] mb-[8px] md:mb-[16px]" />
          <span className="text-[#B69355] text-[9px] md:text-[11px] font-bold tracking-[3px] uppercase block mb-[8px] md:mb-[16px]">
            Real Stories
          </span>
          <h2 className="font-playfair text-[24px] md:text-[44px] font-bold text-[#254936] tracking-[-0.01em]">
            Loved by Thousands
          </h2>
          <p className="text-[11px] md:text-[15px] text-[#63786A] leading-[1.6] md:leading-[1.7] mt-[8px] md:mt-[12px] max-w-[500px]">
            Hear from our esteemed clientele who have transformed their daily rituals.
          </p>
        </motion.div>

        {/* Testimonials Grid with Premium Arrows */}
        <div className="relative group">
          
          {/* 👈 Left Arrow: Premium Transparent & Vertically Centered */}
          <button
            onClick={scrollLeft}
            className={`${arrowBaseClass} left-0 md:-left-6 top-1/2 -translate-y-1/2 ${
              isAtStart ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
            }`}
            aria-label="Scroll left"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-[16px] md:gap-[32px] pb-4 px-[16px] -mx-[16px] md:px-[24px] md:-mx-[24px] scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((test, idx) => (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="w-[75vw] md:w-[calc(33.333%-22px)] shrink-0 snap-center bg-white border border-[#E0D4BE] rounded-2xl p-[24px] md:p-[40px] flex flex-col hover:border-[#B69355]/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-[4px] mb-[16px] md:mb-[32px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-[12px] md:w-[14px] h-[12px] md:h-[14px] text-[#B69355] fill-[#B69355]"
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="font-playfair text-[15px] md:text-[18px] italic text-[#254936] leading-[1.6] md:leading-[1.7] mb-[24px] md:mb-[40px] flex-grow">
                  {test.text}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-[12px] md:gap-[16px] mt-auto">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="w-[36px] md:w-[48px] h-[36px] md:h-[48px] rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-sans font-bold text-[11px] md:text-[13px] text-[#254936] tracking-[0.5px]">
                      {test.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <BadgeCheck className="w-[10px] md:w-[12px] h-[10px] md:h-[12px] text-[#B69355]" />
                      <span className="text-[9px] md:text-[11px] text-[#63786A] uppercase tracking-[1px] font-bold">
                        Verified Buyer
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 👉 Right Arrow: Premium Transparent & Vertically Centered */}
          <button
            onClick={scrollRight}
            className={`${arrowBaseClass} right-0 md:-right-6 top-1/2 -translate-y-1/2 ${
              isAtEnd ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
            }`}
            aria-label="Scroll right"
          >
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;