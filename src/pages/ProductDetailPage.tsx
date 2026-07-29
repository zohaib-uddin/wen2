import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { Star, Shield, ArrowLeft, ArrowRight, Heart, ShoppingBag, Plus, Minus, Check, Sparkles, Share2, Compass, Home, Sparkle, Truck, RotateCcw, ShieldCheck, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Accordion, AccordionItem } from "../components/ui/Accordion";
import { supabase } from "../lib/supabase/client";
import { getSmallestVariant } from "../lib/utils/variant";

export const ProductDetailPage: React.FC = () => {
  const {
    selectedProduct,
    addToCart,
    setDirectCheckoutItem,
    toggleWishlist,
    isInWishlist,
    navigate
  } = useShop();

  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Category Target Concern and Dynamic sizes
  const [categoryTargetConcern, setCategoryTargetConcern] = useState<string>("");
  const [productSizes, setProductSizes] = useState<string[]>([]);

  // 3D rotation and zoom state for lightbox
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showRotateGuide, setShowRotateGuide] = useState(true);

  // Fallback if no product loaded
  if (!selectedProduct) {
    return (
      <div className="py-32 text-center bg-gradient-to-b from-[#F4EBDB]/20 to-white text-[#254936] min-h-screen font-sans flex flex-col items-center justify-center px-4">
        <Sparkles className="w-12 h-12 text-[#B69355] mb-4 animate-pulse" />
        <p className="text-[#63786A] text-sm max-w-sm mb-6 leading-relaxed">
          The selected product was not found. Let's return to the shop catalogue.
        </p>
        <button
          onClick={() => navigate('shop')}
          className="bg-[#254936] text-white hover:bg-[#B69355] hover:text-[#254936] text-xs px-8 py-4 uppercase rounded-xl font-bold tracking-widest transition-all shadow-md cursor-pointer border-none"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  // Helper to parse sizes
  const parseSizes = () => {
    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      return selectedProduct.variants.map((v: any) => typeof v === 'string' ? v : v.size).filter(Boolean);
    }
    return [selectedProduct.size || "100ml"];
  };

  const currentVariant = selectedProduct.variants?.find((v: any) => (typeof v === 'string' ? v : v.size) === selectedVariant) || (selectedProduct.variants?.[0] && typeof selectedProduct.variants[0] !== 'string' ? selectedProduct.variants[0] : null) || null;

  const isOutOfStock = currentVariant 
    ? currentVariant.stock_quantity <= 0 
    : (selectedProduct.stock_quantity !== undefined ? selectedProduct.stock_quantity <= 0 : false);

  // Initialize selected size variant
  useEffect(() => {
    const sizes = parseSizes();
    setProductSizes(sizes);
    if (sizes.length > 0) {
      // Pick the smallest or the first
      setSelectedVariant(sizes[0]);
    }
    setQuantity(1);
    setActiveThumb(0);
    setCopiedLink(false);
    if (setDirectCheckoutItem) {
      setDirectCheckoutItem(null);
    }
  }, [selectedProduct, setDirectCheckoutItem]);

  // Dynamic pricing based on selected variant size
  const getDynamicPrice = () => {
    if (currentVariant) {
      return currentVariant.price;
    }
    return selectedProduct.price;
  };

  const getDynamicOriginalPrice = () => {
    if (currentVariant) {
      return currentVariant.compare_price || null;
    }
    return selectedProduct.originalPrice || null;
  };

  const currentPrice = getDynamicPrice();
  const originalPrice = getDynamicOriginalPrice();
  const savings = originalPrice ? originalPrice - currentPrice : 0;
  const isWishlisted = isInWishlist(selectedProduct.id);
  const discountPercent = originalPrice
    ? Math.round((savings / originalPrice) * 100)
    : 19; // default 19% if comparison is missing

  const handleAddToCart = async () => {
    if (isAdding) return;
    setIsAdding(true);
    // Mimic premium technical extraction latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const productClone = {
      ...selectedProduct,
      price: currentPrice,
    };
    
    // CRITICAL: Call addToCart with exact quantity and size variant
    addToCart(productClone, quantity, selectedVariant);
    setIsAdding(false);
  };

  const handleDirectCheckout = () => {
    const productClone = {
      ...selectedProduct,
      price: currentPrice,
    };
    if (setDirectCheckoutItem) {
      setDirectCheckoutItem({
        product: productClone,
        quantity,
        selectedVariant: selectedVariant
      });
    }
    navigate('checkout');
  };

  const handleShareClick = () => {
    setCopiedLink(true);
    const pdpUrl = `${window.location.origin}/#/product/${selectedProduct.id}`;
    navigator.clipboard?.writeText?.(pdpUrl);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // 3D Rotation gesture state controllers
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setShowRotateGuide(false);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    setRotation(prev => ({
      x: Math.min(Math.max(prev.x - deltaY * 0.5, -45), 45),
      y: prev.y + deltaX * 0.6
    }));

    if (Math.abs(deltaX) > 60) {
      const idxDiff = deltaX > 0 ? 1 : -1;
      setActiveThumb(prev => {
        const next = prev + idxDiff;
        if (next < 0) return galleryImages.length - 1;
        if (next >= galleryImages.length) return 0;
        return next;
      });
      setDragStart({ x: clientX, y: clientY });
    } else {
      setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleDragEnd = () => {
    setDragStart(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1));

  // Hide 3D rotation guide on lightbox load
  useEffect(() => {
    if (lightboxOpen) {
      setShowRotateGuide(true);
      const timer = setTimeout(() => {
        setShowRotateGuide(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [lightboxOpen]);

  // Pure dynamic gallery images with no static placeholder fallbacks
  const galleryImages = Array.from(new Set([
    selectedProduct.image,
    ...(selectedProduct.gallery_images && Array.isArray(selectedProduct.gallery_images) ? selectedProduct.gallery_images : [])
  ].filter(Boolean)));

  return (
    <div className="bg-gradient-to-b from-[#F4EBDB]/20 to-white text-[#254936] min-h-screen pt-[100px] sm:pt-[120px] pb-[100px] font-sans text-left relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 xl:px-12">
        
        {/* Luxury Breadcrumbs */}
        <div className="flex flex-wrap items-center space-x-2 text-[12px] text-[#63786A] mb-[16px]" id="luxury-breadcrumbs">
          <button onClick={() => navigate('home')} className="hover:text-[#B69355] transition-colors bg-transparent border-none p-0 cursor-pointer">Home</button>
          <span>/</span>
          <button onClick={() => navigate('shop')} className="hover:text-[#B69355] transition-colors bg-transparent border-none p-0 cursor-pointer">Shop</button>
          <span>/</span>
          <span className="hover:text-[#B69355] transition-colors cursor-pointer">{selectedProduct.category ? selectedProduct.category : "Hair Care"}</span>
          <span>/</span>
          <span className="text-[#B69355] line-clamp-1 max-w-[200px]">{selectedProduct.name}</span>
        </div>

        {/* 2-Column Desktop Grid, Stacked Mobile Layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[60px] items-start mb-16">
          
          {/* LEFT COLUMN: Premium Portrait Image Gallery */}
          <div className="w-full lg:w-[45%] space-y-4 lg:sticky lg:top-24">
            {/* Main Interactive Gallery image */}
            <div 
              className="relative w-full max-w-[400px] lg:max-w-[500px] mx-auto aspect-square md:aspect-[4/5] bg-white rounded-[20px] overflow-hidden flex items-center justify-center group select-none"
              id="luxury-main-pdp-gallery-frame"
            >
              <div 
                onClick={() => setLightboxOpen(true)}
                className="w-full h-full flex items-center justify-center cursor-zoom-in overflow-hidden relative"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeThumb}
                    src={galleryImages[activeThumb] || selectedProduct.image}
                    alt={selectedProduct.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  loading="lazy" />
                </AnimatePresence>
              </div>

              {/* Left Navigation Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveThumb((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent flex items-center justify-center text-[#254936] hover:bg-transparent hover:text-[#B69355] shadow-none transition duration-300 cursor-pointer z-10"
                aria-label="Previous image"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Right Navigation Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveThumb((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-transparent flex items-center justify-center text-[#254936] hover:bg-transparent hover:text-[#B69355] shadow-none transition duration-300 cursor-pointer z-10"
                aria-label="Next image"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:text-[#B69355] transition-colors z-10 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
              </button>
              
              <div className="absolute inset-0 bg-[#254936]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-0">
                <span className="bg-white/95 text-[8px] tracking-widest font-bold uppercase py-1.5 px-3 rounded-md shadow-sm text-[#254936]">
                  Click to Expand & Rotate
                </span>
              </div>
            </div>
 
            {/* Thumbnail Strip (Horizontal Scroll / Grid) */}
            <div className="flex items-center gap-[12px] overflow-x-auto scrollbar-none py-1 justify-start">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveThumb(idx)}
                  className={`relative w-[80px] h-[80px] rounded-[12px] overflow-hidden flex-shrink-0 transition-all duration-300 focus:outline-none bg-white p-1 flex items-center justify-center cursor-pointer ${
                    activeThumb === idx ? "border-[2px] border-[#B69355] scale-105" : "border-[1px] border-[#E0D4BE] opacity-70 hover:opacity-100 hover:scale-105"
                  }`}
                  aria-label={`View thumbnail ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${selectedProduct.name} View ${idx + 1}`}
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info details */}
          <div className="w-full lg:w-[55%] space-y-0">
            
            {/* Category Badge */}
            <div className="text-[11px] font-bold uppercase tracking-[2px] text-[#B69355] mb-[12px]">
              {selectedProduct.category ? selectedProduct.category : "HAIR CARE"}{selectedProduct.concern && ` • ${selectedProduct.concern}`}
            </div>
            
            {/* Title */}
            <h1 className="font-playfair text-[28px] lg:text-[36px] font-semibold text-[#254936] leading-[1.2] mb-[16px]">
              {selectedProduct.name}
            </h1>

            {/* Pricing Section */}
            <div className="flex items-baseline flex-wrap mb-[24px]">
              <span className="text-[32px] font-bold text-[#254936]">
                Rs. {(currentPrice || 0).toLocaleString()}
              </span>
              {originalPrice && (
                <>
                  <span className="text-[18px] text-[#63786A] line-through ml-[12px]">
                    Rs. {(originalPrice || 0).toLocaleString()}
                  </span>
                  <span className="text-[13px] font-bold text-green-700 bg-[#f0fdf4] px-[12px] py-[6px] rounded-full ml-[12px]">
                    Save Rs. {(savings || 0).toLocaleString()} ({discountPercent}%)
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            <p className="text-[15px] text-[#63786A] leading-[1.7] mb-[32px]">
              {selectedProduct.potencyExplanation || "Dermatologist-approved skin and hair care, created with organic Himalayan natural extracts to help protect against Pakistan's weather and water conditions."}
            </p>

            {/* Variant Selector (Size/Volume) */}
            <div className="mb-[24px]">
              <label className="text-[11px] font-bold text-[#254936] block mb-[8px]">
                Select Size
              </label>
              <div className="flex flex-row flex-wrap gap-[8px]">
                {productSizes.map((v) => {
                  return (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`py-[8px] px-[16px] rounded-[8px] text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                        selectedVariant === v
                          ? "border-[2px] border-[#254936] bg-[#f0f7f4] text-[#254936] font-bold"
                          : "border-[2px] border-[#E0D4BE] bg-white text-[#254936] hover:border-[#B69355]"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector Option */}
            <div className="mb-[24px]">
              <div className="flex items-center justify-between mb-[12px]">
                <label className="text-[13px] font-bold text-[#254936]">
                  Quantity
                </label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-[2px] border-[#E0D4BE] rounded-[12px] overflow-hidden bg-white h-[44px]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-[44px] h-[44px] bg-white text-[#254936] hover:bg-[#f5f5f5] transition focus:outline-none border-none cursor-pointer flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    className="w-[60px] h-[44px] text-center text-[14px] font-semibold text-[#254936] outline-none border-x border-[#E0D4BE] py-0 m-0"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-[44px] h-[44px] bg-white text-[#254936] hover:bg-[#f5f5f5] transition focus:outline-none border-none cursor-pointer flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-[8px]">
                  <div className={`w-[8px] h-[8px] rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className={`text-[12px] font-bold uppercase tracking-[1px] ${isOutOfStock ? 'text-red-600' : 'text-green-700'}`}>
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Checkout and Cart Actions Block (HIDDEN on mobile, substituted by sticky bottom bar) */}
            <div className="hidden md:flex flex-col mb-[24px]">
              <div className="flex flex-row gap-4 mb-[16px]">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className="flex-1 bg-white border-[2px] border-[#254936] text-[#254936] hover:bg-[#f5f5f5] disabled:bg-gray-200 disabled:text-[#63786A] disabled:border-[#E0D4BE] font-bold py-[18px] px-6 rounded-[12px] text-[14px] uppercase tracking-[1px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-[2px] hover:shadow-lg"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-[18px] h-[18px]" />
                      <span>{isOutOfStock ? "Out of Stock" : "Add to Bag"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDirectCheckout}
                  disabled={isOutOfStock}
                  className="flex-1 bg-[#254936] hover:bg-[#153629] text-white disabled:bg-gray-200 disabled:text-[#63786A] font-bold py-[18px] px-6 rounded-[12px] text-[14px] uppercase tracking-[1px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-[2px] hover:shadow-lg"
                >
                  <ArrowRight className="w-[18px] h-[18px]" />
                  <span>Buy Now</span>
                </button>
              </div>

              <div className="flex gap-[12px] flex-row mb-[24px]">
                <button
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className={`flex-1 py-[14px] text-[13px] rounded-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer border-[2px] ${
                    isWishlisted 
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "border-[#E0D4BE] text-[#254936] bg-white hover:border-[#B69355]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isWishlisted ? "In Wishlist" : "Add to Wishlist"}</span>
                </button>

                <button
                  onClick={handleShareClick}
                  className="flex-1 py-[14px] text-[13px] border-[2px] border-[#E0D4BE] bg-white hover:border-[#B69355] rounded-[12px] text-[#254936] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? "Link Copied!" : "Share"}</span>
                </button>
              </div>

              {/* Rating & Reviews Moved Here */}
              <div className="flex items-center gap-[12px] py-[12px] border-y border-[#E0D4BE]">
                <div className="flex text-[#B69355]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-[16px] h-[16px] ${
                        i < Math.floor(selectedProduct.rating) ? "fill-[#B69355]" : "text-gray-200 fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-[#254936]">{selectedProduct.rating.toFixed(1)}</span>
                <span className="text-[13px] text-[#63786A] hover:underline cursor-pointer">({selectedProduct.reviewCount || 128} reviews)</span>
              </div>
            </div>

            {/* Direct Trust Badges */}
            <div className="flex flex-row justify-between gap-[12px] md:gap-[24px] py-[24px] border-y border-[#E0D4BE] mt-[24px] mb-[24px] flex-nowrap overflow-x-auto hide-scrollbar">
              <div className="flex flex-col items-center gap-2 w-auto shrink-0">
                <Truck className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] text-[#B69355]" />
                <span className="text-[10px] md:text-[12px] text-[#63786A] text-center">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-auto shrink-0">
                <RotateCcw className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] text-[#B69355]" />
                <span className="text-[10px] md:text-[12px] text-[#63786A] text-center">7-Day Returns</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-auto shrink-0">
                <ShieldCheck className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] text-[#B69355]" />
                <span className="text-[10px] md:text-[12px] text-[#63786A] text-center">Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-auto shrink-0">
                <Shield className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] text-[#B69355]" />
                <span className="text-[10px] md:text-[12px] text-[#63786A] text-center">Secure Payment</span>
              </div>
            </div>

            {/* Luxury Expanding Accordion details blocks */}
            <div className="space-y-0">
              <Accordion>
                <AccordionItem title="Description" isOpenByDefault={true} className="border-b border-[#f0f0f0]">
                  <div className="py-[16px] text-[#63786A] leading-[1.7] text-[14px]">
                    <p className="mb-3">
                      {selectedProduct.description || "Crafted specifically to combat modern dust, local weather fatigue, and high salt mineral levels on skin pores."}
                    </p>
                    <div className="mt-4">
                      <p className="font-semibold text-[#254936] mb-2">Key Benefits:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedProduct.keyBenefits?.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionItem>
                <AccordionItem title="Ingredients" className="border-b border-[#f0f0f0]">
                  <div className="py-[16px] text-[#63786A] leading-[1.7] text-[14px]">
                    <p className="bg-[#fcfaf8] p-4 rounded-lg border border-[#E0D4BE]">
                      {selectedProduct.ingredients || "Pure Kashmiri saffron bio-extract particles, Aqua base pH 5.5, Organic Kashmiri Almond essentials, Squalene, Organic Aloe vera juice."}
                    </p>
                  </div>
                </AccordionItem>
                <AccordionItem title="How to Use" className="border-b border-[#f0f0f0]">
                  <div className="py-[16px] text-[#63786A] leading-[1.7] text-[14px]">
                    <p>
                      {selectedProduct.howToUse || "Massage 3-5 drops delicately on fully damp clean skin or hair. Allow natural extracts to absorb completely overnight."}
                    </p>
                  </div>
                </AccordionItem>
                <AccordionItem title="Reviews" className="border-b border-[#f0f0f0]">
                  <div className="py-[16px] text-[#63786A] leading-[1.7] text-[14px]">
                    <p>No reviews yet.</p>
                  </div>
                </AccordionItem>
              </Accordion>
            </div>

          </div>

        </div>

      </div>

      {/* FULL SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
              className="absolute inset-0 bg-[#0A0D0B]/40 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#0F1411]/70 backdrop-blur-xl text-[#F4EBDB] p-6 sm:p-10 z-10 overflow-hidden rounded-3xl border border-white/10 flex flex-col items-center justify-center shadow-[0_25px_60px_-15px_rgba(201,162,39,0.25)]"
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-[#B69355] hover:text-[#254936] text-white py-2.5 px-5 text-[11px] font-bold tracking-widest uppercase rounded-full transition-all cursor-pointer border-none shadow-lg z-30 font-sans"
              >
                Close 3D View
              </button>

              {/* Title & Help Text */}
              <div className="text-center mb-4 z-20">
                <h3 className="font-playfair text-xl sm:text-2xl font-bold text-[#B69355] tracking-wider uppercase">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-gray-300 mt-1 font-mono uppercase tracking-widest">
                  Drag to rotate in 3D &middot; Double click to zoom
                </p>
              </div>

              {/* 3D Interaction Stage */}
              <div 
                className="relative w-full aspect-[4/5] sm:aspect-video max-h-[55vh] flex items-center justify-center cursor-grab active:cursor-grabbing select-none z-10"
                style={{ perspective: 1200 }}
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) {
                    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                onTouchEnd={handleDragEnd}
                onDoubleClick={() => setZoom(prev => prev === 1 ? 1.75 : 1)}
              >
                {/* 3D Light Source Highlights behind product */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
                  <div className="w-64 h-64 bg-[#B69355]/20 rounded-full blur-[100px] animate-pulse" />
                </div>

                {/* 3D Image Canvas */}
                <motion.div
                  style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
                    transformStyle: "preserve-3d",
                    transition: dragStart ? "transform 0.05s linear" : "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)"
                  }}
                  className="w-full h-full flex flex-col items-center justify-center p-4 relative z-10"
                >
                  <img
                    src={galleryImages[activeThumb] || selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_25px_60px_rgba(201,162,39,0.4)] select-none pointer-events-none transition-transform"
                    referrerPolicy="no-referrer"
                    style={{ transform: "translateZ(50px)" }}
                  loading="lazy" />
                  {/* Floating shadow disk beneath product to enhance 3D realism */}
                  <div 
                    style={{ 
                      transform: `translateZ(-50px) rotateX(90deg) translateY(40px)`,
                      opacity: Math.max(0.2, 0.7 - Math.abs(rotation.x)/100)
                    }}
                    className="w-36 h-8 bg-[#254936]/40 rounded-full blur-md absolute bottom-12 transition-opacity"
                  />
                </motion.div>

                {/* Animated Arrow Guidance overlay */}
                <AnimatePresence>
                  {showRotateGuide && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#254936]/40 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none z-20"
                    >
                      <motion.div 
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="flex items-center gap-6 text-[#B69355] mb-3"
                      >
                        <ArrowLeft className="w-8 h-8 stroke-[3]" />
                        <span className="text-[11px] font-bold tracking-widest uppercase bg-[#B69355] text-[#254936] px-4 py-2 rounded-full shadow-lg font-sans">
                          Swipe / Drag to Rotate
                        </span>
                        <ArrowRight className="w-8 h-8 stroke-[3]" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 mt-4 z-20">
                <button
                  onClick={handleZoomOut}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-mono font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition cursor-pointer font-sans"
                >
                  Zoom -
                </button>
                <button
                  onClick={() => {
                    setRotation({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="bg-[#B69355] text-[#254936] text-[10px] font-bold tracking-widest uppercase px-6 py-2.5 rounded-xl hover:scale-105 transition cursor-pointer border-none shadow-md font-sans"
                >
                  Reset Perspective
                </button>
                <button
                  onClick={handleZoomIn}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-mono font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition cursor-pointer font-sans"
                >
                  Zoom +
                </button>
              </div>

              {/* Quick angle stats */}
              <span className="text-[9px] font-mono text-[#63786A] uppercase tracking-widest mt-4">
                Pitch: {Math.round(rotation.x)}&deg; &bull; Yaw: {Math.round(rotation.y)}&deg; &bull; Zoom: {zoom.toFixed(2)}x
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0D4BE] p-4 z-40 flex items-center justify-between gap-4 pb-safe-bottom">
        <div className="flex flex-col text-left">
          <span className="text-[18px] font-bold text-[#254936] font-sans">
            Rs. {((currentPrice || 0) * quantity).toLocaleString()}
          </span>
        </div>
        
        <div className="flex w-1/2">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            className="w-full bg-[#254936] text-white disabled:bg-gray-200 disabled:text-[#63786A] font-bold py-[14px] px-2 rounded-[12px] text-[13px] uppercase tracking-[1px] transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer font-sans"
            id="add-to-cart-sticky-mobile-pdp"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            <span>{isOutOfStock ? "Sold Out" : "Add to Bag"}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductDetailPage;
