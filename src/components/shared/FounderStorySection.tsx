import React from "react";
import { useShop } from "../../context/ShopContext";
import { motion } from "motion/react";
import img1 from "../../assets/images/wen 16.jpeg";

export const FounderStorySection: React.FC = () => {
  const { navigate } = useShop();

  return (
    <section
      className="bg-[#F4EBDB] py-[60px] md:py-[80px] lg:py-[120px] font-sans"
      id="brand-story-section"
    >
      <div className="max-w-[1280px] mx-auto px-[24px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] lg:gap-[80px] items-center">
          {/* Left Column: Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full relative px-[20px] md:px-[40px] lg:px-0"
          >
            <div className="absolute inset-0 bg-[#B69355] translate-x-4 translate-y-4 rounded-2xl opacity-20 hidden md:block" />
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl z-10 border border-white/50">
              <img
                src={img1}
                alt="Natural beauty ingredients"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Right Column: Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-[24px]"
          >
            <div>
              <div className="w-[40px] h-[2px] bg-[#B69355] mb-[16px]" />
              <span className="text-[#B69355] text-[11px] font-bold tracking-[3px] uppercase block mb-[16px]">
                The Wen Story
              </span>
              <h2 className="font-playfair text-[32px] md:text-[44px] font-bold text-[#254936] tracking-[-0.01em]">
                Crafting Beauty <br className="hidden lg:block" /> from Nature
              </h2>
            </div>

            <p className="font-playfair italic text-[22px] md:text-[24px] text-[#254936] leading-[1.5] border-l-[3px] border-[#B69355] pl-[20px] my-[24px]">
              "We believe that true luxury is knowing exactly what you are
              putting on your skin, and seeing real, transformative results."
            </p>

            <p className="text-[15px] text-[#63786A] leading-[1.8] max-w-[500px]">
              Our formulations fuse pure Kashmiri Saffron, organic oils, and
              clinically vetted active compounds to rehabilitate native scalp
              layers completely against salt and severe summer UV damage. Each
              mixture is double-filtered to guarantee pristine results you can
              feel from the very first drops.
            </p>

            <div className="pt-[16px]">
              <span className="font-playfair italic text-[20px] text-[#254936] block">
                Hassan
              </span>
              <span className="text-[11px] text-[#63786A] uppercase tracking-[2px] font-bold block mt-[4px]">
                Founder
              </span>
            </div>

            <div className="pt-[24px]">
              <button
                onClick={() => navigate("about")}
                className="border-2 border-[#254936] text-[#254936] hover:bg-[#254936] hover:text-white transition-colors duration-300 px-[32px] py-[16px] rounded-xl text-[13px] font-bold uppercase tracking-[1px] outline-none"
              >
                Read Our Story
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FounderStorySection;
