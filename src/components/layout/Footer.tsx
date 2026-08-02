import React, { useState } from "react";
import { useShop } from "../../context/ShopContext";
import { Instagram, Facebook, CreditCard } from "lucide-react";

// TikTok icon component (Lucide mein nahi hai toh custom SVG)
const TikTok = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const Footer: React.FC = () => {
  const { navigate, setCategoryFilter, setConcernFilter } = useShop();

  const handleCategoryNav = (cat: string | null) => {
    setCategoryFilter(cat);
    setConcernFilter(null);
    navigate('shop');
  };

  return (
    <footer className="bg-[#1F4D3A] text-white font-sans" id="main-app-footer-bar">
      {/* SECTION 2: Main Footer Content */}
      <div className="py-[32px] md:py-[60px] px-[16px] md:px-[24px] pb-[24px] md:pb-[40px] border-t border-white/10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-[24px] md:gap-[40px] text-left">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="font-playfair text-[20px] md:text-[28px] font-bold text-white block leading-none cursor-pointer" onClick={() => navigate('home')}>
              WEN
            </span>
            <span className="font-sans text-[8px] md:text-[10px] font-bold text-[#C9A227] tracking-[2px] uppercase block mt-[4px]">
              HAIR & SKIN SECRET
            </span>
            <p className="text-[11px] md:text-[13px] text-white/70 font-light leading-[1.6] mt-[12px] md:mt-[20px] max-w-[280px]">
              Fusing age-old herbal wisdom with advanced modern clinical science. Handcrafted with safe botanical bioactives.
            </p>
            <div className="flex gap-[12px] mt-[16px]">
              {[
                { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/wenskincareandhairsecret' }, 
                { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61591159816514' }, 
                { name: 'TikTok', icon: TikTok, url: 'https://www.tiktok.com/@wenhairoilandskinsecret' } 
              ].map((platform, i) => {
                const Icon = platform.icon;
                return (
                  <a
                    key={i}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[28px] h-[28px] md:w-[36px] md:h-[36px] rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#C9A227] hover:text-[#C9A227] transition-all duration-300"
                    aria-label={platform.name}
                  >
                    <Icon className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="flex flex-col">
            <h4 className="text-[10px] md:text-[13px] font-bold text-[#C9A227] uppercase tracking-[1px] md:tracking-[2px] mb-[12px] md:mb-[20px]">
              Shop
            </h4>
            <ul className="w-full flex flex-col items-start">
              {[
                { name: "Hair Oils", cat: "Hair Oil" },
                { name: "Shampoos", cat: "Shampoo" },
                { name: "Serum", cat: "Serum" },
                { name: "Cleansers", cat: "Face Wash" },
                { name: "Night Creams", cat: "Night Cream" }
              ].map((item, i) => (
                <li key={i} className="w-full border-b border-white/10 last:border-0">
                  <button 
                    onClick={() => handleCategoryNav(item.cat)}
                    className="text-[10px] md:text-[13px] text-white/80 font-light hover:text-white transition-colors duration-200 py-[4px] md:py-[6px] block w-full text-left"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col">
            <h4 className="text-[10px] md:text-[13px] font-bold text-[#C9A227] uppercase tracking-[1px] md:tracking-[2px] mb-[12px] md:mb-[20px]">
              Support
            </h4>
            <ul className="w-full flex flex-col items-start">
              <li className="w-full border-b border-white/10">
                <button onClick={() => navigate('shipping-policy')} className="text-[10px] md:text-[13px] text-white/80 font-light hover:text-white transition-colors duration-200 py-[4px] md:py-[6px] block w-full text-left">
                  Shipping Policy
                </button>
              </li>
              <li className="w-full">
                <button onClick={() => navigate('privacy-policy')} className="text-[10px] md:text-[13px] text-white/80 font-light hover:text-white transition-colors duration-200 py-[4px] md:py-[6px] block w-full text-left">
                  Privacy Policy
                </button>
              </li>
               <li className="w-full border-b border-white/10">
                <button onClick={() => navigate('return-policy')} className="text-[10px] md:text-[13px] text-white/80 font-light hover:text-white transition-colors duration-200 py-[4px] md:py-[6px] block w-full text-left">
                  Return Policy
                </button>
              </li>
              <li className="w-full">
                <button onClick={() => navigate('terms-conditions')} className="text-[10px] md:text-[13px] text-white/80 font-light hover:text-white transition-colors duration-200 py-[4px] md:py-[6px] block w-full text-left">
                  Terms and Conditions
                </button>
              </li>
            </ul>
            <p className="text-[10px] md:text-[13px] text-[#C9A227] font-bold mt-[8px] md:mt-[12px]">
              info@wen.com.pk
            </p>
          </div>

          {/* Column 4: Our Story */}
          <div className="flex flex-col col-span-2 md:col-span-1">
            <h4 className="text-[10px] md:text-[13px] font-bold text-[#C9A227] uppercase tracking-[1px] md:tracking-[2px] mb-[12px] md:mb-[20px]">
              Our Story
            </h4>
            <ul className="w-full flex flex-col items-start">
              <li className="w-full border-b border-white/10">
                <span className="text-[10px] md:text-[13px] text-white/80 font-light py-[4px] md:py-[6px] block w-full text-left">
                  Ingredients: 100% Ayurvedic Saffron
                </span>
              </li>
              <li className="w-full border-b border-white/10">
                <span className="text-[10px] md:text-[13px] text-white/80 font-light py-[4px] md:py-[6px] block w-full text-left">
                  Sustainability: Green Packaging
                </span>
              </li>
              <li className="w-full">
                <span className="text-[10px] md:text-[13px] text-white/80 font-light py-[4px] md:py-[6px] block w-full text-left">
                  Laboratory: Certified Organic
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: Bottom Bar */}
      <div className="py-[16px] md:py-[24px] px-[16px] md:px-[24px] border-t border-white/10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-[12px] md:gap-[16px]">
          <div className="text-[9px] md:text-[12px] text-white/60 font-light text-center sm:text-left">
            &copy; {new Date().getFullYear()} WEN Hair & Skin Pakistan. All Rights Reserved.
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-[8px] md:gap-[12px] text-[9px] md:text-[12px] text-white/80 uppercase font-bold tracking-[1px]">
            <span className="cursor-pointer hover:text-[#C9A227] transition-colors" onClick={() => handleCategoryNav('Hair Care')}>Hair Care</span>
            <span className="w-[1px] h-[10px] md:h-[12px] bg-white/20" />
            <span className="cursor-pointer hover:text-[#C9A227] transition-colors" onClick={() => handleCategoryNav('Skin Care')}>Skin Care</span>
            <span className="w-[1px] h-[10px] md:h-[12px] bg-white/20" />
            <span className="cursor-pointer hover:text-[#C9A227] transition-colors" onClick={() => handleCategoryNav('Body Care')}>Body Care</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
export default Footer;