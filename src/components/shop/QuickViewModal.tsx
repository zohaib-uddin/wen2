import React, { useState, useEffect } from "react";
import { useShop } from "../../context/ShopContext";
import { Star, X, ShoppingBag, Plus, Minus, Heart, Share2, ClipboardCheck, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSmallestVariant } from "../../lib/utils/variant";

export const QuickViewModal: React.FC = () => {
  const {
    products,
    quickViewProductId,
    setQuickViewProductId,
    addToCart,
    setDirectCheckoutItem,
    toggleWishlist,
    isInWishlist,
    navigate
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Zoom style state for image hover zoom
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: "scale(1)",
    transformOrigin: "center"
  });

  const activeProduct = products.find(p => p.id === quickViewProductId) || null;

  // Helper to parse sizes dynamically
  const parseSizes = () => {
    if (!activeProduct) return ["100ml"];
    if (activeProduct.variants && activeProduct.variants.length > 0) {
      return activeProduct.variants.map((v: any) => typeof v === 'string' ? v : v.size).filter(Boolean);
    }
    return [activeProduct.size || "100ml"];
  };

  const currentVariant = activeProduct?.variants?.find((v: any) => (typeof v === 'string' ? v : v.size) === selectedVariant) || (activeProduct?.variants?.[0] && typeof activeProduct.variants[0] !== 'string' ? activeProduct.variants[0] : null) || null;

  const getDynamicPrice = () => currentVariant ? currentVariant.price : activeProduct?.price;
  const getDynamicOriginalPrice = () => currentVariant ? currentVariant.compare_price : activeProduct?.originalPrice;

  const currentPrice = getDynamicPrice();
  const originalPrice = getDynamicOriginalPrice();
  const isOutOfStock = currentVariant 
    ? currentVariant.stock_quantity <= 0 
    : (activeProduct?.stock_quantity !== undefined ? activeProduct.stock_quantity <= 0 : false); 


  // Purely dynamic gallery images
  const gallery = activeProduct 
    ? [activeProduct.image, ...(activeProduct.gallery_images || [])].filter(Boolean)
    : [];

  useEffect(() => {
    if (activeProduct) {
      setQuantity(1);
      const sizes = parseSizes();
      setSelectedVariant(getSmallestVariant(sizes));
      setActiveImageIndex(0);
      setCopiedLink(false);
      setZoomStyle({ transform: "scale(1)", transformOrigin: "center" });
    }
  }, [activeProduct]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuickViewProductId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuickViewProductId]);

  if (!activeProduct) return null;

  // Price calculation - fully simplified to match admin-provided static pricing
  const savings = originalPrice ? originalPrice - currentPrice : 0;
  const discountPercent = originalPrice 
    ? Math.round((savings / originalPrice) * 100) 
    : 19;

  const isWishlisted = activeProduct ? isInWishlist(activeProduct.id) : false;

  const handleAddToCart = async () => {
    if (isOutOfStock || isAddingToCart || !activeProduct) return;
    setIsAddingToCart(true);

    // Artificial latency delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const productClone = {
      ...activeProduct,
      price: currentPrice
    };
    
    addToCart(productClone, quantity, selectedVariant);
    setIsAddingToCart(false);
    setQuickViewProductId(null);
  };

  const handleDirectCheckout = async () => {
    if (isOutOfStock) return;
    const productClone = {
      ...activeProduct,
      price: currentPrice
    };
    
    if (setDirectCheckoutItem) {
      setDirectCheckoutItem({
        product: productClone,
        quantity,
        selectedVariant: selectedVariant
      });
    }
    
    setQuickViewProductId(null);
    navigate("checkout");
  };

  const handleCopyShare = () => {
    const shareUrl = `${window.location.origin}/product/${activeProduct.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleViewFullDetails = () => {
    setQuickViewProductId(null);
    navigate("product", activeProduct.id);
  };

  // Hover mouse coordinate tracking for luxurious zoom-in
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: "scale(1.8)",
      transformOrigin: `${x}% ${y}%`,
      transition: "transform 0.08s ease-out, transform-origin 0.08s ease-out"
    });
  };

  const handleMouseLeaveImage = () => {
    setZoomStyle({
      transform: "scale(1)",
      transformOrigin: "center",
      transition: "transform 0.3s ease-out"
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProductId(null)}
          className="fixed inset-0 bg-[#254936] backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans"
          id="luxury-quickview-container"
        >
          {/* Close trigger button */}
          <button
            onClick={() => setQuickViewProductId(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg text-[#254936] hover:bg-[#B69355] hover:text-white flex items-center justify-center z-20 transition duration-300 hover:rotate-90 border border-[#E0D4BE] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Core Content Body - Scrollable */}
          <div className="overflow-y-auto flex-1 p-6 sm:p-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Image Gallery */}
              <div className="space-y-4 md:sticky md:top-0">
                {/* Main Image Frame with hover zoom + superposed arrows */}
                <div 
                  className="relative aspect-square md:aspect-[4/5] max-h-[300px] md:max-h-none bg-gradient-to-b from-[#F4EBDB] to-[#EFE6D5] rounded-2xl overflow-hidden border border-[#F0F0F0] flex items-center justify-center select-none cursor-zoom-in"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeaveImage}
                >
                  <img
                    src={gallery[activeImageIndex]}
                    alt={activeProduct.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                    style={zoomStyle}
                    referrerPolicy="no-referrer"
                  loading="lazy" />

                  {/* SUPERPOSED NAV ARROWS (Strictly Left/Right image navigation) */}
                  {gallery.length > 1 && (
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#254936] hover:text-[#B69355] cursor-pointer pointer-events-auto transition hover:scale-105 active:scale-90"
                        title="Previous Image"
                      >
                        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#254936] hover:text-[#B69355] cursor-pointer pointer-events-auto transition hover:scale-105 active:scale-90"
                        title="Next Image"
                      >
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {activeProduct.isBestSeller && (
                    <span className="absolute top-4 left-4 bg-transparent border border-[#254936] text-[#254936] text-[8px] font-bold tracking-wider px-2 py-0.5 rounded-sm uppercase shadow-none flex items-center gap-1">
                      Best Seller
                    </span>
                  )}
                </div>

                {/* Horizontal Thumbnails row */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hidden">
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 flex-shrink-0 bg-stone-50 overflow-hidden p-2 flex items-center justify-center bg-transparent focus:outline-none transition cursor-pointer ${
                        activeImageIndex === idx 
                          ? "border-[#B69355] shadow-sm bg-stone-50" 
                          : "border-[#E0D4BE] hover:border-[#E0D4BE]"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt="Thumbnail"
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Sizable Details Form */}
              <div className="space-y-6 md:max-h-[75vh]">
                {/* Header Information */}
                <div>
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B69355] uppercase block mb-1">
                    {activeProduct.category ? activeProduct.category.toUpperCase() : "HAIR CARE"}
                    {activeProduct.concern && ` • ${activeProduct.concern.toUpperCase()}`}
                  </span>
                  <h2 className="font-playfair text-2.5xl sm:text-3xl lg:text-3.5xl font-bold text-[#254936] leading-tight mb-2">
                    {activeProduct.name}
                  </h2>
                </div>

                {/* Price Display Block */}
                <div className="py-2.5 border-y border-[#EFE6D5] flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl font-extrabold text-[#254936]">
                    Rs. {(currentPrice || 0).toLocaleString()}
                  </span>
                  {originalPrice && (
                    <>
                      <span className="text-md text-[#63786A] line-through">
                        Rs. {(originalPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                        You Save Rs. {(savings || 0).toLocaleString()} ({discountPercent}%)
                      </span>
                    </>
                  )}
                </div>

                {/* Short bio/description */}
                <div>
                  <p className="text-sm text-[#63786A] font-light leading-relaxed">
                    {activeProduct.description || "Freshly extracted botanical alchemies containing pure Himalayan compounds designed to stimulate dormant scalp roots and enrich cell layers natively."}
                  </p>
                </div>

                {/* Variant Selector (Formulation Size) */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-[#254936] uppercase tracking-widest block">
                    Select Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {parseSizes().map((v) => {
                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedVariant(v)}
                          type="button"
                          className={`flex-1 min-w-[80px] py-2 px-3 text-[10px] font-bold rounded-lg border text-center transition duration-200 focus:outline-none cursor-pointer ${
                            selectedVariant === v
                              ? "border-[#B69355] border-2 bg-[#F4EBDB]/30 text-[#254936]"
                              : "border-[#E0D4BE] hover:border-gray-400 text-[#63786A] bg-white"
                          }`}
                        >
                          <span className="block">{v}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity and Stock Indicator */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#254936] uppercase tracking-widest block">
                    Formulation Quantity
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E0D4BE] rounded-xl overflow-hidden bg-white max-w-[140px]">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        type="button"
                        className="px-4 py-3 hover:bg-[#f5f5f5] text-[#63786A] transition focus:outline-none focus:bg-[#f5f5f5] cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="w-12 text-center text-sm font-bold text-[#254936] focus:outline-none bg-transparent border-none py-0 -mx-1"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        type="button"
                        className="px-4 py-3 hover:bg-[#f5f5f5] text-[#63786A] transition focus:outline-none focus:bg-[#f5f5f5] cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-emerald-500"}`} />
                      <span className="text-xs text-[#63786A] font-medium">
                        {isOutOfStock ? "Out of Stock" : "In Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dual Action CTA Buttons (Add to Cart and Direct Checkout) */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || isAddingToCart}
                      type="button"
                      className="flex-1 bg-white hover:bg-stone-50 text-[#254936] border border-[#254936] disabled:bg-[#f5f5f5] disabled:text-[#63786A] font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </button>

                    <button
                      onClick={handleDirectCheckout}
                      disabled={isOutOfStock}
                      type="button"
                      className="flex-1 bg-[#254936] hover:bg-[#B69355] hover:text-[#254936] text-white disabled:bg-[#f5f5f5] disabled:text-[#63786A] font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 shadow-md border-none cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Buy Now</span>
                    </button>
                  </div>

                  {/* Secondary wishlist/share actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleWishlist(activeProduct.id)}
                      type="button"
                      className={`flex-1 py-3 px-4 border border-[#E0D4BE] rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition hover:bg-stone-50 cursor-pointer ${
                        isWishlisted ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-50" : "bg-white text-[#63786A]"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
                      <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
                    </button>

                    <button
                      onClick={handleCopyCopyShare}
                      type="button"
                      className="py-3 px-5 border border-[#E0D4BE] bg-white hover:bg-stone-50 rounded-xl text-[#63786A] flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rating Stars review (Relocated here after wishlist & share button) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#E0D4BE] justify-center sm:justify-start">
                    <div className="flex text-[#B69355]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(activeProduct.rating) ? "fill-[#B69355] text-[#B69355]" : "text-gray-200 fill-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-[#254936]">{activeProduct.rating.toFixed(1)}</span>
                    <span className="text-xs text-[#63786A]">({activeProduct.reviewCount || 128} verified organic reviews)</span>
                  </div>
                </div>

                {/* Brand Trust Badges */}
                <div className="grid grid-cols-3 gap-2.5 pt-6 border-t border-[#EFE6D5] text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#254936] uppercase block">🌟 Free Sourcing</span>
                    <span className="text-[9px] text-[#63786A] block font-light leading-tight">On all orders in Pakistan</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#254936] uppercase block">📦 7-Day Returns</span>
                    <span className="text-[9px] text-[#63786A] block font-light leading-tight">100% money back secure</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#254936] uppercase block">🔬 100% Authentic</span>
                    <span className="text-[9px] text-[#63786A] block font-light leading-tight">Kashmiri certified origin</span>
                  </div>
                </div>

                {/* Nav text link details */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleViewFullDetails}
                    type="button"
                    className="text-[#B69355] hover:text-[#254936] hover:underline font-semibold text-xs tracking-wider uppercase bg-transparent border-none cursor-pointer"
                  >
                    View Full Product Details &rarr;
                  </button>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  function handleCopyCopyShare() {
    handleCopyShare();
  }
};

export default QuickViewModal;
