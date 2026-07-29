import React, { useState, useEffect } from "react";
import { useShop } from "../../context/ShopContext";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileDrawer } from "../ui/MobileDrawer";
import { supabase } from "../../lib/supabase/client";
import img1 from "../../assets/images/wen 27.png"
import img2 from "../../assets/images/wen 28.png"


const navThemes = [
  { 
    id: 0,
    name: 'Wenglow', 
    themeColor: '#EAB308', // Yellow
    capColor: '#FFFFFF',
    liquidColor: '#fef08a'
  },
  { 
    id: 1,
    name: 'Wen-C', 
    themeColor: '#EA580C', // Orange
    capColor: '#FFFFFF',
    liquidColor: '#fdba74'
  },
  { 
    id: 2,
    name: 'Wen Acne', 
    themeColor: '#0284C7', // Blue
    capColor: '#FFFFFF',
    liquidColor: '#7dd3fc'
  },
  { 
    id: 3,
    name: 'WenAging', 
    themeColor: '#16A34A', // Green
    capColor: '#FFFFFF',
    liquidColor: '#86efac'
  }
];

export const Header: React.FC = () => {
  const {
    cart,
    wishlist,
    setCartOpen,
    setSearchOpen,
    navigate,
    setCategoryFilter,
    setConcernFilter,
    user,
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [activeLogoColor, setActiveLogoColor] = useState(navThemes[0].themeColor);
  const [isMobile, setIsMobile] = useState(false);

  const deliveryThreshold = localStorage.getItem("wen_setting_free_delivery") || "2000";

  const announcements = [
    `Free Shipping on Orders Over Rs. ${Number(deliveryThreshold).toLocaleString()} | 100% Natural & Organic`,
    "Luxury Botanical Formulations Tailored For Pakistani Tap Water",
    "Order Securely via Cash on Delivery Across Pakistan Within 2-4 Days"
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkMobile);
    checkMobile();

    const announcementInterval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
      clearInterval(announcementInterval);
    };
  }, [announcements.length]);

  useEffect(() => {
    let intervalId: any;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !document.hidden) {
          startInterval();
        } else {
          clearInterval(intervalId);
        }
      },
      { threshold: 0 }
    );

    const headerEl = document.getElementById('main-app-header-bar');
    if (headerEl) observer.observe(headerEl);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        startInterval();
      }
    };

    const startInterval = () => {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        setCurrentProductIndex(prev => (prev + 1) % navThemes.length);
      }, 4000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      if (headerEl) observer.unobserve(headerEl);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Color syncs exactly when the drop falls
    const timeout = setTimeout(() => {
      setActiveLogoColor(navThemes[currentProductIndex].themeColor);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [currentProductIndex]);

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

        if (!catsRes.error && catsRes.data) {
          setNavCategories(catsRes.data);
        }
        
        if (!targetsRes.error && targetsRes.data) {
          const sortedTargets = targetsRes.data.sort((a, b) => a.name.localeCompare(b.name));
          setNavTargets(sortedTargets);
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

  const activeTheme = navThemes[currentProductIndex];
  const displayedLogoColor = activeLogoColor;

  return (
    <>
      <style>{`
        .animate-bottle-tilt {
          animation: bottleTilt 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform;
        }
        .animate-cap-unscrew {
          animation: capUnscrew 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform;
        }
        .animate-drop-fall {
          animation: dropFall 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
        }

        @keyframes bottleTilt {
          0%, 15% { transform: rotate(0deg); }
          25%, 75% { transform: rotate(-55deg); }
          85%, 100% { transform: rotate(0deg); }
        }

        @keyframes capUnscrew {
          0%, 15% { transform: translateY(0) rotate(0deg); }
          25%, 75% { transform: translateY(-20px) translateX(-5px) rotate(45deg); }
          85%, 100% { transform: translateY(0) rotate(0deg); }
        }

        @keyframes dropFall {
          0%, 28% { opacity: 0; transform: translate(-28px, -5px) scale(0.5); }
          32% { opacity: 1; transform: translate(-28px, -5px) scale(1); }
          45% { opacity: 1; transform: translate(-28px, 20px) scale(1.1); }
          50% { opacity: 0; transform: translate(-28px, 25px) scale(0); }
          100% { opacity: 0; transform: translate(-28px, 25px) scale(0); }
        }

        .nav-icon {
          color: #254936;
          transition: transform 0.3s ease, color 0.3s ease;
        }
        .nav-icon:hover {
          transform: scale(1.1);
          color: var(--active-theme-color);
        }
      `}</style>
      <header className="w-full z-50 font-sans" id="main-app-header-bar">
        {/* TOP ANNOUNCEMENT BAR */}
        <div className="w-full bg-[#254936] text-white py-[2px] px-4 overflow-hidden relative h-[24px] md:h-[28px] flex items-center justify-center">
          <div className="text-center font-medium text-[9px] md:text-[11px] whitespace-nowrap overflow-hidden text-ellipsis tracking-wide text-white flex items-center justify-center gap-2">
            <span>{announcements[announcementIndex]}</span>
          </div>
        </div>

        {/* MAIN STICKY BAR */}
        <div
          className={`w-full max-w-full transition-all duration-700 z-50 ${
            isScrolled
              ? "fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm"
              : "relative bg-white"
          }`}
          style={{ 
            height: 'auto',
            borderBottom: '1px solid #F0F0F0'
          }}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 h-[72px] lg:h-[88px] flex items-center justify-between">
            
            {/* LEFT SECTION (20%): Dynamic Text Logo & Animation */}
            <div className="flex items-center w-[50%] md:w-[20%] flex-shrink-0 relative">
              <div 
                className="flex flex-col items-start justify-center cursor-pointer relative z-10" 
                onClick={() => {
                  setCategoryFilter(null);
                  setConcernFilter(null);
                  navigate('home');
                }}
              >
                <span 
                  className="font-playfair font-bold uppercase transition-colors duration-700 ease-in-out text-[24px] lg:text-[28px] leading-none pr-[50px]" 
                  style={{ color: displayedLogoColor }}
                >
                  WEN
                </span>
                <span className="font-sans font-semibold uppercase text-[9px] lg:text-[10px] tracking-[2px] text-[#B69355] mt-[-2px] whitespace-nowrap">
                  HAIR & SKIN SECRET
                </span>
              </div>

              {/* Product Animation Showcase */}
              <div className="flex items-center justify-center absolute left-[55px] md:left-[65px] lg:left-[75px] top-[-22px] w-[40px] h-[50px] overflow-visible pointer-events-none z-20">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentProductIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="relative w-[25px] h-[40px] overflow-visible">
                      <svg viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible drop-shadow-md">
                        <g className="animate-bottle-tilt" style={{ transformOrigin: '20px 60px' }}>
                          {/* Bottle Neck */}
                          <rect x="16" y="24" width="8" height="6" fill="#E0D4BE" />
                          {/* Bottle Body */}
                          <path d="M16 30 H24 L30 38 V76 C30 78.2, 28.2 80, 26 80 H14 C11.8 80, 10 78.2, 10 76 V38 L16 30 Z" fill={activeTheme.themeColor} fillOpacity="0.85" stroke="#ffffff" strokeWidth="1" />
                          {/* Bottle Reflection */}
                          <path d="M12 40 C12 38, 14 38, 14 38 V76 C14 78, 12 78, 12 76 Z" fill="#ffffff" fillOpacity="0.4" />
                          {/* Bottle Label */}
                          <rect x="14" y="45" width="12" height="20" fill="#ffffff" rx="1" />
                          <rect x="16" y="48" width="8" height="2" fill={activeTheme.themeColor} />
                          <rect x="16" y="52" width="5" height="1" fill="#E0D4BE" />

                          {/* Cap & Dropper Pipette Group */}
                          <g className="animate-cap-unscrew" style={{ transformOrigin: '20px 24px' }}>
                            {/* Glass tube inside bottle (reveals as cap lifts) */}
                            <rect x="18" y="24" width="4" height="25" fill="#f3f4f6" fillOpacity="0.6" />
                            {/* Cap Body */}
                            <path d="M14 12 C14 10, 26 10, 26 12 V24 H14 V12 Z" fill={activeTheme.capColor} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                            {/* Rubber Bulb */}
                            <path d="M16 10 C16 4, 24 4, 24 10 Z" fill="#f3f4f6" />
                          </g>
                        </g>
                        {/* Serum Drop - Falls from the lifted pipette tip */}
                        <path d="M20 38 C 22 41, 20 43, 20 43 C 20 43, 18 41, 20 38 Z" fill={activeTheme.liquidColor} className="animate-drop-fall" style={{ transformOrigin: '20px 40px' }} />
                      </svg>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* CENTER SECTION (50%): Navigation Links (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center space-x-[20px] lg:space-x-[32px] h-full flex-1 justify-center w-[50%]">
              {['Home', 'Shop All'].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item === 'Home' ? 'home' : 'shop')}
                  className="relative group text-[13px] font-medium uppercase tracking-[1px] text-[#254936] py-2 focus:outline-none"
                >
                  {item}
                  <span 
                    className="absolute bottom-0 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center" 
                    style={{ backgroundColor: displayedLogoColor }}
                  />
                </button>
              ))}

              {/* Categories Mega Menu */}
              <div
                className="h-full flex items-center"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button className="relative group text-[13px] font-medium uppercase tracking-[1px] text-[#254936] py-2 flex items-center gap-1 focus:outline-none h-full">
                  Categories
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${megaMenuOpen ? "rotate-180" : ""}`} />
                  <span 
                    className="absolute bottom-6 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center" 
                    style={{ backgroundColor: displayedLogoColor }}
                  />
                </button>

                <AnimatePresence>
                  {megaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute left-1/2 -translate-x-1/2 top-[88px] w-[900px] bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-[60] overflow-hidden"
                    >
                      <div className="p-[32px] grid grid-cols-3 gap-8">
                        {/* Categories Column */}
                        <div className="flex flex-col">
                          <h4 className="font-playfair font-bold text-[#254936] text-[22px] mb-[16px]">Shop By Category</h4>
                          <img src={img1} alt="Categories" className="w-[200px] h-[200px] object-cover rounded-lg mb-[16px]" referrerPolicy="no-referrer" />
                          <ul className="flex flex-col text-left">
                            {(navCategories.length > 0 ? navCategories : [{id: 1, name: 'Hair Care'}, {id: 2, name: 'Skin Care'}, {id: 3, name: 'Body Care'}]).map((cat) => (
                                <li key={cat.id} className="border-b border-[#f5f5f5] last:border-0">
                                  <button onClick={() => handleCategoryNav(cat.name)} className="text-[13px] text-[#254936] hover:text-[#B69355] transition-colors py-[6px] w-full text-left">
                                    {cat.name}
                                  </button>
                                </li>
                            ))}
                          </ul>
                        </div>
                        {/* Concerns Column */}
                        <div className="flex flex-col">
                          <h4 className="font-playfair font-bold text-[#254936] text-[22px] mb-[16px]">Shop By Concern</h4>
                          <img src={img2} alt="Concerns" className="w-[200px] h-[200px] object-cover rounded-lg mb-[16px]" referrerPolicy="no-referrer" />
                          <ul className="flex flex-col text-left h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                             {(navTargets.length > 0 ? navTargets : [{id: 1, name: 'Hair Fall'}, {id: 2, name: 'Acne & Blemishes'}]).map((target) => (
                                <li key={target.id} className="border-b border-[#f5f5f5] last:border-0">
                                  <button onClick={() => handleConcernNav(target.name)} className="text-[13px] text-[#254936] hover:text-[#B69355] transition-colors py-[6px] w-full text-left">
                                    {target.name}
                                  </button>
                                </li>
                              ))}
                          </ul>
                        </div>
                        {/* Promise Column */}
                        <div className="bg-[#F4EBDB] rounded-xl p-[24px] flex flex-col text-left">
                          <Sparkles className="w-[32px] h-[32px] text-[#B69355] mb-[12px]" />
                          <h4 className="font-playfair text-[20px] text-[#254936] mb-[12px]">The Wen Promise</h4>
                          <p className="text-[13px] text-[#63786A] leading-[1.7] mb-auto">
                            Every Wen formulation is crafted with 100% natural ingredients, free from sulfates, parabens, and harsh chemicals. Designed specifically for Pakistani hair and skin.
                          </p>
                          <button onClick={() => { setMegaMenuOpen(false); navigate('about'); }} className="text-[#B69355] text-[12px] font-bold uppercase tracking-wider mt-[16px] text-left hover:brightness-110">
                            Discover Our Story →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {['Best Sellers', 'Our Story', 'Contact'].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item === 'Our Story' ? 'about' : item.toLowerCase().replace(' ', '-'))}
                  className="relative group text-[13px] font-medium uppercase tracking-[1px] text-[#254936] py-2 focus:outline-none"
                >
                  {item}
                  <span 
                    className="absolute bottom-0 left-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-full group-hover:left-0 origin-center" 
                    style={{ backgroundColor: displayedLogoColor }}
                  />
                </button>
              ))}
            </nav>

            {/* RIGHT SECTION (30%): Utility Icons */}
            <div 
              className="flex items-center justify-end w-[50%] md:w-[30%] h-full"
              style={{ '--active-theme-color': displayedLogoColor } as React.CSSProperties}
            >
              <div className="flex items-center space-x-[12px] md:space-x-[16px] lg:space-x-[20px]">
                <button
                  onClick={() => navigate('track-order')}
                  className="hidden xl:inline-block text-[13px] uppercase font-medium border border-[#254936] text-[#254936] hover:text-white px-4 py-1.5 transition-all duration-500 focus:outline-none hover:bg-[#254936]"
                >
                  Track Order
                </button>
                
                <button onClick={() => navigate(user ? 'sign-in' : 'sign-in')} className="hidden md:block nav-icon focus:outline-none" aria-label="Account">
                  <User className="w-[20px] h-[20px] stroke-[1.5]" />
                </button>
                
                <button onClick={() => navigate('wishlist')} className="hidden md:block nav-icon focus:outline-none relative" aria-label="Wishlist">
                  <Heart className="w-[20px] h-[20px] stroke-[1.5]" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-white font-sans font-medium text-[10px] w-4 h-4 flex items-center justify-center rounded-full transition-colors duration-700" style={{ backgroundColor: displayedLogoColor }}>
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button onClick={() => setSearchOpen(true)} className="nav-icon focus:outline-none" aria-label="Search">
                  <Search className="w-[16px] md:w-[20px] h-[16px] md:h-[20px] stroke-[1.5]" />
                </button>
                
                <button onClick={() => setCartOpen(true)} className="nav-icon focus:outline-none relative" aria-label="Shopping Bag">
                  <ShoppingBag className="w-[16px] md:w-[20px] h-[16px] md:h-[20px] stroke-[1.5]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-white font-sans font-medium text-[8px] md:text-[10px] w-3.5 md:w-4 h-3.5 md:h-4 flex items-center justify-center rounded-full transition-colors duration-700" style={{ backgroundColor: displayedLogoColor }}>
                      {totalCartCount}
                    </span>
                  )}
                </button>
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden nav-icon focus:outline-none" aria-label="Menu">
                  <Menu className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] stroke-[2]" />
                </button>
              </div>
            </div>

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
      />
    </>
  );
};

export default Header;
