import { getSmallestVariant } from "../../lib/utils/variant";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShop } from "../../context/ShopContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Images
import img1 from '../../assets/images/banner1.webp';

const slides = [
  {
    id: 1,
    type: 'image',
    subtitle: 'Clinical Formulation',
    title: 'Glow Beyond \n Expectations',
    description: 'Achieve the ultimate glass-skin radiance. Infused with professional-strength Glutathione, Alpha Arbutin, and pure Kashmiri Saffron.',
    productName: 'Wenglow',
    price: 'Rs. 1,799',
    mediaUrl: img1,
    color: '#E11D48',
    duration: 5000
  },
];

// Premium smooth animations with subtle zoom-in
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1.02,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.8 },
      scale: { duration: 1.2, ease: "easeOut" }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    scale: 0.95,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.6 },
      scale: { duration: 0.6 }
    }
  })
};

export const HeroSection: React.FC = () => {
  const { navigate } = useShop(); // productsLoading hata diya taake banner block na ho
  const [[page, direction], setPage] = useState([0, 0]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slideIndex = Math.abs(page % slides.length);
  const currentSlide = slides[slideIndex];

  // 🚀 1. PRELOAD MAGIC: Image ko foran download karne ke liye browser ko high priority signal
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img1;
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      paginate(1);
    }, currentSlide.duration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [page, currentSlide.duration]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  // ❌ YAHAN SE LOADING SPINNER KA CODE HATA DIYA HAI TAKAY BANNER FORAN DIKHAY

  return (
    <section
      className="relative w-full md:h-[80vh] overflow-hidden bg-[#254936]"
      id="hero-luxury-section"
      role="region"
      aria-label="Product Showcase"
    >
      {/* Media Container */}
      <div className="relative w-full h-[250px] md:absolute md:inset-0 md:w-full md:h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {currentSlide.type === 'video' ? (
              <video 
                src={currentSlide.mediaUrl} 
                autoPlay 
                loop 
                muted 
                playsInline
                preload="auto"
                className="w-full h-full object-cover object-[10%_50%] md:object-center"
              />
            ) : (
              <img
                src={currentSlide.mediaUrl}
                alt={currentSlide.productName}
                loading="eager"       // ⚡ Foran load karne ka command
                fetchPriority="high" // ⚡ Browser ko batata hai ke yeh sab se zaroori image hai
                decoding="async"
                className="w-full h-full object-cover object-[10%_50%] md:object-center"
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-[12px] md:bottom-[40px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-[10px] md:gap-[24px]">
        <button 
           onClick={() => paginate(-1)} 
           className="w-[24px] md:w-[48px] h-[24px] md:h-[48px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors focus:outline-none"
           aria-label="Previous Slide"
        >
          <ChevronLeft className="w-[12px] md:w-[24px] h-[12px] md:h-[24px]" />
        </button>
        <div className="flex gap-[6px] md:gap-[12px]">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const newDirection = idx > slideIndex ? 1 : -1;
                setPage([idx, newDirection]);
              }}
              className={`h-[2px] md:h-[4px] rounded-full transition-all duration-300 focus:outline-none ${
                idx === slideIndex ? "w-[16px] md:w-[32px] bg-[#C9A227]" : "w-[8px] md:w-[16px] bg-white/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        <button 
           onClick={() => paginate(1)} 
           className="w-[24px] md:w-[48px] h-[24px] md:h-[48px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors focus:outline-none"
           aria-label="Next Slide"
        >
          <ChevronRight className="w-[12px] md:w-[24px] h-[12px] md:h-[24px]" />
        </button>
      </div>
    </section>
  );
};