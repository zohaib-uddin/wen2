import React, { useState, useEffect } from "react";
import { useShop } from "../../context/ShopContext";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileDrawer } from "../ui/MobileDrawer";
import { supabase } from "../../lib/supabase/client";

// 👉 YAHAN APNA ASLI LOGO IMAGE IMPORT KAREIN
import logoImg from "../../assets/images/wen logo.png"; 
import img1 from "../../assets/images/wen 27.png";
import img2 from "../../assets/images/wen 28.png";

export const Header: React.FC = () => {
  const { cart, wishlist, setCartOpen, setSearchOpen, navigate, setCategoryFilter, setConcernFilter, user } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const deliveryThreshold = localStorage.getItem("wen_setting_free_delivery") || "2000";

  const announcements = [
    `Free Shipping on Orders Over Rs. ${Number(deliveryThreshold).toLocaleString()} | 100% Natural & Organic`,
    "Luxury Botanical Formulations Tailored For Pakistani Tap Water",
    "Order Securely via Cash on Delivery Across Pakistan Within 2-4 Days"
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const announcementInterval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(announcementInterval);
    };
  }, [announcements.length]);

  const totalCartCount = Array.isArray(cart)
    ? cart.reduce((acc, item) => acc + ((item && item.quantity) || 0), 0)
    : 0;

  const [navCategories, setNavCategories] = useState<any[]>([]);
  const [navTargets, setNavTargets] = useState<any[]>([]);

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const [catsRes, targetsRes] = await Promise.all([
          supabase.from("categories").select("*"),
          supabase.from("product_targets").select("*")
        ]);
        if (!catsRes.error && catsRes.data) setNavCategories(catsRes.data);
        if (!targetsRes.error && targetsRes.data) {
          setNavTargets(targetsRes.data.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.warn("Error fetching nav data:", err);
      }
    };
    fetchNavData();
  }, []);

  const handleCategoryNav = (cat: string | null) => {
    setCategoryFilter(cat);
    setConcernFilter(null);
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    navigate('shop');
  };

  const handleConcernNav = (concern: string) => {
    setConcernFilter(concern);
    setCategoryFilter(null);
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    navigate('shop');
  };

  return (
    <>
      <style>{`
        .nav-icon {
          color: #254936;
          transition: transform 0.3s ease, color 0.3s ease;
        }
        .nav-icon:hover {
          transform: scale(1.1);
          color: #B69355;
        }
      `}</style>
      
      {/* Header ko relative banaya taake mega menu iske hisaab se center ho sake */}
      <header className="relative w-full z-50 font-sans" id="main-app-header-bar">
        {/* TOP ANNOUNCEMENT BAR */}
        <div className="w-full bg-[#254936] text-white py-[2px] px-4 overflow-hidden relative h-[24px] md:h-[28px] flex items-center justify-center">
          <div className="text-center font-medium text-[9px] md:text-[11px] whitespace-nowrap overflow-hidden text-ellipsis tracking-wide text-white flex items-center justify-center gap-2">
            <span>{announcements[announcementIndex]}</span>
          </div>
        </div>

        {/* MAIN STICKY BAR */}
        <div
          className={`w-full max-w-full transition-all duration-700 z-50 ${
            isScrolled ? "fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm" : "relative bg-white"
          }`}
          style={{ borderBottom: '1px solid #F0F0F0' }}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 h-[105px] lg:h-[105px] flex items-center justify-between relative">
            
            {/* 👈 1. ABSOLUTE LEFT CORNER: Logo with Scroll Blending */}
            <div 
              className="flex-shrink-0 cursor-pointer -ml-0 sm:-ml-6 md:-ml-8" 
              onClick={() => { setCategoryFilter(null); setConcernFilter(null); navigate('home'); }}
            >
              <img 
                src={logoImg} 
                alt="WEN Logo" 
                className={`h-[100px] md:h-[105px] w-auto object-contain transition-all duration-500 ${
                  // Jab scroll ho, toh white background blend ho jaye
                  isScrolled ? "mix-blend-multiply opacity-90" : "mix-blend-normal opacity-100"
                }`} 
              />
            </div>

            {/* 👉 2. ABSOLUTE RIGHT: Navigation + Icons Group */}
            <div className="flex items-center gap-6 lg:gap-10">
              
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                {['Home', 'Shop All'].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => navigate(item === 'Home' ? 'home' : 'shop')} 
                    className="relative group text-[14px] lg:text-[15px] font-medium uppercase tracking-[1px] text-[#254936] py-2 focus:outline-none"
                  >
                    {item}
                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center bg-[#B69355]" />
                  </button>
                ))}

                {/* Categories Button (Hover triggers state) */}
                <div 
                  className="relative h-full flex items-center" 
                  onMouseEnter={() => setMegaMenuOpen(true)} 
                  onMouseLeave={() => setMegaMenuOpen(false)}
                >
                  <button className="relative group text-[14px] lg:text-[15px] font-medium uppercase tracking-[1px] text-[#254936] py-2 flex items-center gap-1 focus:outline-none h-full">
                    Categories
                    <ChevronDown className={`w-[16px] h-[16px] transition-transform duration-300 ${megaMenuOpen ? "rotate-180" : ""}`} />
                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center bg-[#B69355]" />
                  </button>
                </div>

                {['Best Sellers', 'Our Story', 'Contact'].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => navigate(item === 'Our Story' ? 'about' : item.toLowerCase().replace(' ', '-'))} 
                    className="relative group text-[14px] lg:text-[15px] font-medium uppercase tracking-[1px] text-[#254936] py-2 focus:outline-none"
                  >
                    {item}
                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center bg-[#B69355]" />
                  </button>
                ))}
              </nav>

              {/* Utility Icons */}
              <div className="flex items-center gap-4 lg:gap-6">
                <button onClick={() => navigate('track-order')} className="hidden xl:inline-block text-[14px] uppercase font-medium border border-[#254936] text-[#254936] hover:text-white px-4 py-1.5 transition-all duration-500 focus:outline-none hover:bg-[#254936]">
                  Track Order
                </button>
                
                <button onClick={() => navigate(user ? 'sign-in' : 'sign-in')} className="hidden md:block nav-icon focus:outline-none" aria-label="Account">
                  <User className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] stroke-[1.5]" />
                </button>
                
                <button onClick={() => navigate('wishlist')} className="hidden md:block nav-icon focus:outline-none relative" aria-label="Wishlist">
                  <Heart className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] stroke-[1.5]" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-white font-sans font-medium text-[10px] w-4 h-4 flex items-center justify-center rounded-full transition-colors duration-700 bg-[#B69355]">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button onClick={() => setSearchOpen(true)} className="nav-icon focus:outline-none" aria-label="Search">
                  <Search className="w-[20px] h-[20px] md:w-[24px] md:h-[24px] stroke-[1.5]" />
                </button>
                
                <button onClick={() => setCartOpen(true)} className="nav-icon focus:outline-none relative" aria-label="Shopping Bag">
                  <ShoppingBag className="w-[20px] h-[20px] md:w-[24px] md:h-[24px] stroke-[1.5]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-white font-sans font-medium text-[10px] w-4 h-4 flex items-center justify-center rounded-full transition-colors duration-700 bg-[#B69355]">
                      {totalCartCount}
                    </span>
                  )}
                </button>
                
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden nav-icon focus:outline-none p-1" aria-label="Menu">
                  <Menu className="w-[28px] h-[28px] stroke-[2]" />
                </button>
              </div>
            </div>

            {/* 👉 3. CENTERED MEGA MENU: Ab yeh button ke andar nahi, balki main container mein hai taake center ho sake */}
            <AnimatePresence>
              {megaMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.25, ease: "easeOut" }} 
                  // left-1/2 -translate-x-1/2 isko screen ke bilkul center mein rakhta hai
                  // onMouseEnter lagaya hai taake mouse menu ke andar jane par band na ho
                  className="absolute left-1/2 -translate-x-1/2 top-[105px] w-[95vw] max-w-[900px] bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-[60] overflow-hidden"
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  onMouseLeave={() => setMegaMenuOpen(false)}
                >
                  <div className="p-[32px] grid grid-cols-3 gap-8">
                    <div className="flex flex-col">
                      <h4 className="font-playfair font-bold text-[#254936] text-[22px] mb-[16px]">Shop By Category</h4>
                      <img src={img1} alt="Categories" className="w-[200px] h-[200px] object-cover rounded-lg mb-[16px]" referrerPolicy="no-referrer" />
                      <ul className="flex flex-col text-left">
                        {(navCategories.length > 0 ? navCategories : [{id: 1, name: 'Hair Care'}, {id: 2, name: 'Skin Care'}, {id: 3, name: 'Body Care'}]).map((cat) => (
                          <li key={cat.id} className="border-b border-[#f5f5f5] last:border-0">
                            <button onClick={() => handleCategoryNav(cat.name)} className="text-[14px] text-[#254936] hover:text-[#B69355] transition-colors py-[6px] w-full text-left">{cat.name}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-playfair font-bold text-[#254936] text-[22px] mb-[16px]">Shop By Concern</h4>
                      <img src={img2} alt="Concerns" className="w-[200px] h-[200px] object-cover rounded-lg mb-[16px]" referrerPolicy="no-referrer" />
                      <ul className="flex flex-col text-left h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {(navTargets.length > 0 ? navTargets : [{id: 1, name: 'Hair Fall'}, {id: 2, name: 'Acne & Blemishes'}]).map((target) => (
                          <li key={target.id} className="border-b border-[#f5f5f5] last:border-0">
                            <button onClick={() => handleConcernNav(target.name)} className="text-[14px] text-[#254936] hover:text-[#B69355] transition-colors py-[6px] w-full text-left">{target.name}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#F4EBDB] rounded-xl p-[24px] flex flex-col text-left">
                      <Sparkles className="w-[32px] h-[32px] text-[#B69355] mb-[12px]" />
                      <h4 className="font-playfair text-[20px] text-[#254936] mb-[12px]">The Wen Promise</h4>
                      <p className="text-[14px] text-[#63786A] leading-[1.7] mb-auto">Every Wen formulation is crafted with 100% natural ingredients, free from sulfates, parabens, and harsh chemicals. Designed specifically for Pakistani hair and skin.</p>
                      <button onClick={() => { setMegaMenuOpen(false); navigate('about'); }} className="text-[#B69355] text-[13px] font-bold uppercase tracking-wider mt-[16px] text-left hover:brightness-110">Discover Our Story →</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={navigate}
        onCategoryClick={handleCategoryNav}
        onConcernClick={handleConcernNav}
        wishlistCount={wishlist.length}
        navCategories={navCategories}
        navTargets={navTargets}
        logoImage={logoImg} 
      />
    </>
  );
};

export default Header;