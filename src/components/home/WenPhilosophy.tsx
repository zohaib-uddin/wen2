import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "motion/react";
import { useShop } from "../../context/ShopContext";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useScrollArrows } from "../../hooks/useScrollArrows";

const AnimatedCounter = ({ value, suffix }: { value: number, suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
};

export const WenPhilosophy: React.FC = () => {
  const { navigate } = useShop();
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

  const stats = [
    {
      value: 98,
      suffix: "%",
      label: "Natural Actives",
      description: "Sourced from organic farms across Pakistan"
    },
    {
      value: 12,
      suffix: "+",
      label: "Lab Trials",
      description: "Each product tested for safety and quality"
    },
    {
      value: 10,
      suffix: "k+",
      label: "Happy Customers",
      description: "Trusted by women across Pakistan"
    }
  ];

  // Premium Glassmorphism Arrow Base Class
  const arrowBaseClass = "absolute z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-[#254936] shadow-md hover:bg-white/60 hover:scale-105 transition-all duration-300 cursor-pointer";

  return (
    <section className="bg-[#F4EBDB] pt-[24px] md:pt-[60px] pb-[40px] md:pb-[120px] font-sans">
      <div className="max-w-[1280px] mx-auto px-[16px] md:px-[24px]">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-[600px] mx-auto mb-[24px] md:mb-[60px] flex flex-col items-center"
        >
          <div className="w-[40px] h-[2px] bg-[#B69355] mb-[8px] md:mb-[16px]" />
          <h2 className="font-playfair text-[20px] md:text-[44px] font-bold text-[#254936] tracking-[-0.01em]">
            The Wen Philosophy
          </h2>
          <p className="text-[11px] md:text-[15px] text-[#63786A] leading-[1.6] md:leading-[1.7] mt-[6px] md:mt-[12px] max-w-[500px]">
            Rooted in clinical science, enriched by nature.
          </p>
        </motion.div>

        {/* Mobile: Horizontal scroll, Desktop: Grid */}
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
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 -mx-[16px] px-[16px] md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-[16px] md:gap-[60px] text-center scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-[75vw] shrink-0 md:w-auto snap-center flex flex-col items-center bg-white md:bg-transparent p-[24px] md:p-0 rounded-[16px] md:rounded-none shadow-sm md:shadow-none hover:shadow-md transition-shadow duration-300"
                onClick={() => navigate('shop')}
              >
                <h3 className="font-playfair text-[48px] md:text-[64px] font-bold text-[#B69355] mb-[8px] leading-none">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </h3>
                <span className="text-[#254936] text-[11px] md:text-[12px] font-bold uppercase tracking-[2px] mb-[8px] md:mb-[12px]">
                  {stat.label}
                </span>
                <p className="text-[12px] md:text-[13px] text-[#63786A] leading-[1.7] max-w-[280px]">
                  {stat.description}
                </p>
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

export default WenPhilosophy;