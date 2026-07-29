import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import vid1 from "../../assets/images/wen vid1.mp4";
import vid2 from "../../assets/images/wen vid2.mp4";
import vid3 from "../../assets/images/wen vid3.mp4";
import vid4 from "../../assets/images/wen vid4.mp4";
import vid5 from "../../assets/images/wen vid5.mp4";
import vid6 from "../../assets/images/wen vid6.mp4";

import { Play, Volume2, VolumeX, ArrowLeft, ArrowRight } 
from "lucide-react";
import { useScrollArrows } from "../../hooks/useScrollArrows";

export const VideoGuidesSection: React.FC = () => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isAtStart, isAtEnd } = useScrollArrows(scrollContainerRef);

  const videos = [
     {
      id: 1,
      title: "Unlock Your Glow with Wen-C Vitamin C Serum",
      description: "Discover how Wen-C Serum fights dullness and uneven tone. Packed with Vitamin C, Glutathione, and Ferulic Acid, this powerful antioxidant blend restores radiance and protects your skin for a brighter complexion.",
      videoUrl: vid1,
    },
     {
      id: 2,
      title: "Clear Skin Journey with Wen Acne Control Serum",
      description: "Learn how to tackle acne, marks, and oiliness effectively. Formulated with Mandelic Acid, Tea Tree, and Neem, this serum targets blemishes and balances skin for a smooth, clear complexion over time.",
      videoUrl: vid2,
    },
     {
      id: 3,
      title: "Fade Dark Spots with Wenglow Glutathione Serum",
      description: "Say goodbye to dullness and uneven tone. Powered by Glutathione, Vitamin C, and Niacinamide, this advanced brightening serum fades dark spots and hydrates your skin for a radiant, even complexion.",
      videoUrl: vid3,
    },
     {
      id: 4,
      title: "Affordable Anti-Aging with WenAging Serum",
      description: "Discover a budget-friendly way to fight wrinkles and age spots. Enriched with Pentapeptides and Hyaluronic Acid, this serum boosts collagen production for hydrated, youthful-looking skin without the high price tag.",
      videoUrl: vid4,
    },
     {
      id: 5,
      title: "Relief from Itching with Wen Scabi Soap",
      description: "Struggling with itching or fungal infections? Discover how Wen Scabi Soap deeply cleanses the skin to eliminate scabies and soothe irritation for lasting comfort and relief.",
      videoUrl: vid5,
    },
     {
      id: 6,
      title: "Gentle Cleansing for Oily & Acne-Prone Skin",
      description: "Looking for a gentle cleanser that fights grease? Wen Acni Soap removes excess oil and daily impurities without harshness, leaving your acne-prone skin feeling fresh, clean, and balanced.",
      videoUrl: vid6,
    }
  ];

  const handlePlayClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setPlayingId(id);
    const videoEl = document.getElementById(`video-${id}`) as HTMLVideoElement;
    if (videoEl) {
      videoEl.play();
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

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

  return (
    <section className="bg-white py-[40px] md:py-[80px] lg:py-[120px] font-sans overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-[16px] md:px-[24px]">
        <div className="text-center max-w-[700px] mx-auto mb-[32px] md:mb-[60px]">
          <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[3px] text-[#B69355] block mb-[8px] md:mb-[16px]">
            Masterclass
          </span>
          <h2 className="font-playfair text-[24px] md:text-[48px] font-bold text-[#254936] tracking-[-0.02em] leading-[1.1] mb-[12px] md:mb-[24px]">
            The Wen Rituals
          </h2>
          <p className="text-[11px] md:text-[15px] text-[#63786A] leading-[1.6] md:leading-[1.7]">
            Watch our experts demonstrate the best techniques to apply Wen's natural skincare products for glowing results.
          </p>
        </div>

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
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 -mx-[16px] px-[16px] md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-[16px] md:gap-[30px] scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((video, idx) => {
              const isPlaying = playingId === video.id;
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="w-[65vw] md:w-auto min-w-[65vw] md:min-w-0 snap-center shrink-0 flex flex-col group"
                >
                  <div 
                    className="relative aspect-[3/4] md:aspect-[9/16] max-h-[500px] bg-gray-100 rounded-2xl md:rounded-3xl overflow-hidden mb-[16px] md:mb-[24px] cursor-pointer shadow-sm"
                    onClick={(e) => {
                      if (isPlaying) {
                        const videoEl = document.getElementById(`video-${video.id}`) as HTMLVideoElement;
                        if (videoEl) {
                          if (videoEl.paused) videoEl.play();
                          else videoEl.pause();
                        }
                      } else {
                        handlePlayClick(e, video.id);
                      }
                    }}
                  >
                    <video
                      id={`video-${video.id}`}
                      src={video.videoUrl}
                      poster={video.poster}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      muted={isMuted}
                      loop
                      playsInline
                    />
                    
                    {/* Play Button Overlay (shown when not playing) */}
                    {!isPlaying && (
                      <>
                        <div className="absolute inset-0 bg-[#254936]/20 group-hover:bg-[#254936]/10 transition-colors duration-300" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48px] md:w-[60px] h-[48px] md:h-[60px] bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow-xl">
                          <Play className="w-[16px] md:w-[20px] h-[16px] md:h-[20px] text-[#254936] fill-[#254936] ml-1" />
                        </div>
                      </>
                    )}

                    {/* Volume Control Overlay (shown when playing) */}
                    {isPlaying && (
                      <div 
                        className="absolute bottom-4 right-4 w-[36px] md:w-[40px] h-[36px] md:h-[40px] bg-[#254936]/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#254936]/70 transition-colors z-10"
                        onClick={handleToggleMute}
                      >
                        {isMuted ? <VolumeX className="w-4 md:w-5 h-4 md:h-5" /> : <Volume2 className="w-4 md:w-5 h-4 md:h-5" />}
                      </div>
                    )}
                  </div>

                  <h3 className="font-playfair text-[18px] md:text-[20px] font-bold text-[#254936] mb-[8px] md:mb-[12px] group-hover:text-[#B69355] transition-colors">
                    {video.title}
                </h3>
                <p className="text-[14px] text-[#63786A] leading-[1.6]">
                  {video.description}
                </p>
              </motion.div>
            );
          })}
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
      </div>
    </section>
  );
};
