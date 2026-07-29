import { getSmallestVariant } from "../../lib/utils/variant";
import React, { useState } from "react";
import { Product } from "../../types";
import { useShop } from "../../context/ShopContext";
import { Star, Heart, ShoppingBag, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  pageContext?: 'home' | 'shop' | 'best-sellers' | 'category' | 'search' | 'wishlist';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = "grid",
  pageContext = 'shop'
}) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigate,
    setQuickViewProductId,
    user,
    triggerToast
  } = useShop();

  const [isAdding, setIsAdding] = React.useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  
  const parsedVariants = product.variants && product.variants.length > 0
    ? product.variants.map((v: any) => typeof v === 'string' ? v : v.size).filter(Boolean)
    : [product.size || "100ml"];
  const [selectedSize, setSelectedSize] = useState(parsedVariants[0] || "100ml");

  const currentVariant = product.variants?.find((v: any) => (typeof v === 'string' ? v : v.size) === selectedSize) || (product.variants?.[0] && typeof product.variants[0] !== 'string' ? product.variants[0] : null) || null;

  const getDynamicPrice = () => currentVariant ? currentVariant.price : product.price;
  const getDynamicOriginalPrice = () => currentVariant ? currentVariant.compare_price : product.originalPrice;

  const currentPrice = getDynamicPrice();
  const originalPrice = getDynamicOriginalPrice();

  const isFavorited = isInWishlist(product.id);
  const images = [product.image, ...(product.gallery_images || [])].filter(Boolean);
  
  const primaryImage = images[currentImageIdx] || product.image;

  const actualDiscountPercent = originalPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 0) {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 0) {
      setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const isOutOfStock = currentVariant 
    ? currentVariant.stock_quantity <= 0 
    : (product.stock_quantity !== undefined ? product.stock_quantity <= 0 : false); 
  const isLowStock = currentVariant 
    ? currentVariant.stock_quantity > 0 && currentVariant.stock_quantity <= 5
    : (product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const productClone = {
      ...product,
      price: currentPrice,
    };
    addToCart(productClone, 1, selectedSize);
    setIsAdding(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      triggerToast("Please login to add items to your wishlist", undefined, undefined, "error");
    }
    toggleWishlist(product.id);
  };

  const handleNavigateToDetail = () => {
    navigate("product", product.id);
  };

  const showBestSellerBadge = product.isBestSeller;
  const showNewBadge = false; // "न्यू वाला जो है ना बैज उसको हटा दो"

  const Badge = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm tracking-[0.5px] ${className}`}>
      {children}
    </span>
  );

  if (viewMode === "list") {
    return (
      <motion.div 
        id={`product-card-${product.id}`}
        onClick={handleNavigateToDetail}
        className="group relative bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out cursor-pointer flex flex-col md:flex-row text-left w-full hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative w-full md:w-[32%] aspect-square md:aspect-[3/4] max-h-[280px] md:max-h-none bg-white flex-shrink-0 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#f0f0f0] overflow-hidden">
          <motion.img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy" 
          />

          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
            {product.originalPrice && actualDiscountPercent > 0 && (
              <Badge className="bg-[#ef4444] text-white">-{actualDiscountPercent}%</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-[#f97316] text-white">Only {currentVariant ? currentVariant.stock_quantity : product.stock_quantity} Left</Badge>
            )}
            {showBestSellerBadge && (
              <Badge className="bg-white/70 backdrop-blur-sm text-[#254936]">Best Seller</Badge>
            )}
            {showNewBadge && (
              <Badge className="bg-[#254936] text-white">New</Badge>
            )}
          </div>
        </div>

        <div className="p-[24px] flex-1 flex flex-col justify-between space-y-4 bg-white">
          <div className="space-y-[12px]">
            <span className="text-[10px] uppercase tracking-[2px] text-[#B69355] font-bold block">
              {product.category || "HAIR CARE"}
            </span>
            <h3 className="font-playfair text-[24px] font-bold text-[#254936] leading-tight group-hover:text-[#254936] transition-colors duration-300 tracking-[-0.01em]">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-[6px]">
              <div className="flex text-[#B69355]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-[14px] h-[14px] ${
                      i < Math.floor(product.rating) ? "fill-[#B69355] text-[#B69355]" : "text-[#E0D4BE] fill-[#E0D4BE]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[12px] font-bold text-[#254936]">{product.rating.toFixed(1)}</span>
              <span className="text-[12px] text-[#63786A]">({product.reviewCount})</span>
            </div>

            <p className="text-[14px] text-[#63786A] font-light leading-[1.7] line-clamp-2 max-w-2xl">
              {product.description}
            </p>
          </div>

          <div className="pt-[20px] border-t border-[#f0f0f0] flex flex-wrap items-center justify-between gap-[16px]">
            <div className="space-y-[4px]">
              <div className="flex items-baseline gap-[8px]">
                <span className="text-[20px] font-bold text-[#254936]">
                  Rs. {(currentPrice || 0).toLocaleString()}
                </span>
                {originalPrice && (
                  <span className="text-[13px] text-[#63786A] line-through">
                    Rs. {(originalPrice || 0).toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-[6px]">
                <div className={`w-[6px] h-[6px] rounded-full ${isOutOfStock ? "bg-[#ef4444]" : isLowStock ? "bg-[#f97316]" : "bg-[#10b981]"}`} />
                <span className="text-[11px] font-bold uppercase tracking-[1px] text-[#63786A]">
                  {isOutOfStock ? (
                    <span className="text-[#ef4444]">Out of Stock</span>
                  ) : isLowStock ? (
                    <span className="text-[#f97316]">Low Stock</span>
                  ) : (
                    <span className="text-[#10b981]">In Stock</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[12px] w-full sm:w-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setQuickViewProductId(product.id); }}
                className="w-[44px] h-[44px] shrink-0 transition-colors flex items-center justify-center cursor-pointer text-[#254936] hover:text-[#B69355]"
                title="Quick View"
              >
                <Eye className="w-[20px] h-[20px]" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-[44px] h-[44px] shrink-0 transition-colors cursor-pointer flex items-center justify-center ${
                  isFavorited ? "text-red-500" : "text-[#254936] hover:text-red-500"
                }`}
                title="Wishlist"
              >
                <Heart className={`w-[20px] h-[20px] ${isFavorited ? "fill-red-500" : ""}`} />
              </button>
              
              <button
                onClick={handleQuickAdd}
                disabled={isOutOfStock || isAdding}
                className="flex-1 sm:flex-none bg-[#254936] hover:bg-[#254936] text-white disabled:bg-gray-200 disabled:text-[#63786A] font-bold py-[14px] px-[32px] rounded-xl text-[13px] uppercase tracking-[1px] transition-all duration-300 flex items-center justify-center gap-[8px] cursor-pointer whitespace-nowrap"
              >
                {isAdding ? (
                  <Loader2 className="w-[16px] h-[16px] animate-spin" />
                ) : (
                  <ShoppingBag className="w-[16px] h-[16px]" />
                )}
                <span>Add To Cart</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view (Standard luxury design card - White background)
  return (
    <motion.div
      id={`product-card-${product.id}`}
      onClick={handleNavigateToDetail}
      className="group relative bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer flex flex-col h-full text-left hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-full max-w-[320px] mx-auto"
    >
      <div className="relative w-full aspect-[4/5] max-h-[350px] md:max-h-[420px] bg-gradient-to-b from-[#F4EBDB] to-[#f5f5f5] flex items-center justify-center overflow-hidden">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`${product.name} - view ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-opacity duration-300 ${idx === currentImageIdx ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
            referrerPolicy="no-referrer"
            loading="lazy" 
          />
        ))}

        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10 w-[32px] h-[32px] rounded-full bg-white/60 backdrop-blur-sm hover:bg-white text-[#254936] hover:text-[#B69355] shadow-sm"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10 w-[32px] h-[32px] rounded-full bg-white/60 backdrop-blur-sm hover:bg-white text-[#254936] hover:text-[#B69355] shadow-sm"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[6px] z-10">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`rounded-full shadow-sm transition-all duration-300 ${idx === currentImageIdx ? 'w-[8px] h-[8px] bg-[#B69355]' : 'w-[6px] h-[6px] bg-white'}`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.originalPrice && actualDiscountPercent > 0 && (
            <Badge className="bg-[#ef4444] text-white">-{actualDiscountPercent}%</Badge>
          )}
          {isLowStock && (
            <Badge className="bg-[#f97316] text-white">Only {currentVariant ? currentVariant.stock_quantity : product.stock_quantity} Left</Badge>
          )}
          {showBestSellerBadge && (
            <Badge className="bg-white/70 backdrop-blur-sm text-[#254936]">Best Seller</Badge>
          )}
          {showNewBadge && (
            <Badge className="bg-[#254936] text-white">New</Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`flex items-center justify-center w-[32px] h-[32px] rounded-full bg-white/70 backdrop-blur-sm hover:bg-white shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10 group/fav ${isFavorited ? "text-red-500" : "text-[#254936] hover:text-[#B69355]"}`}
            title="Wishlist"
          >
            <Heart className={`w-[16px] h-[16px] ${isFavorited ? "fill-red-500" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setQuickViewProductId(product.id); }}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-white/70 backdrop-blur-sm hover:bg-white shadow-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10 group/qv text-[#254936] hover:text-[#B69355]"
            title="Quick View"
          >
            <Eye className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>

      <div className="p-[12px] md:p-[16px] px-[16px] md:px-[20px] pb-[16px] md:pb-[20px] flex-1 flex flex-col bg-white text-left">
        <span className="text-[8px] md:text-[9px] uppercase tracking-[2px] font-bold text-[#B69355] block mb-[4px] md:mb-[6px]">
          {product.category || "HAIR CARE"}
        </span>
        <h3 className="font-playfair text-[12px] md:text-[14px] font-semibold text-[#254936] leading-snug line-clamp-2 mb-[6px] md:mb-[8px] group-hover:text-[#B69355] transition-colors duration-300">
          {product.name}
        </h3>
        <div className="flex items-center gap-[4px] md:gap-[6px] mb-[8px] md:mb-[12px]">
          <div className="flex text-[#B69355]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-[9px] md:w-[10px] h-[9px] md:h-[10px] ${
                  i < Math.floor(product.rating) ? "fill-[#B69355] text-[#B69355]" : "text-[#E0D4BE] fill-[#E0D4BE]"
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] md:text-[10px] text-[#63786A]">
            ({product.reviewCount || 128})
          </span>
        </div>

        <div className="flex items-baseline gap-[6px] md:gap-[8px] mb-[12px] md:mb-[16px]">
          <span className="text-[13px] md:text-[15px] font-bold text-[#254936]">
            Rs. {(currentPrice || 0).toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-[9px] md:text-[10px] text-[#63786A] line-through">
              Rs. {(originalPrice || 0).toLocaleString()}
            </span>
          )}
        </div>

        {/* Size Selector */}
        {parsedVariants && parsedVariants.length > 0 && (
          <div className="mb-[10px] md:mb-[12px]">
            <span className="text-[9px] md:text-[10px] uppercase tracking-[1px] text-[#63786A] mb-[4px] md:mb-[6px] block">
              Size
            </span>
            <div className="flex flex-row gap-[4px] md:gap-[6px] flex-wrap">
              {parsedVariants.map((size) => (
                <button
                  key={size}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                  className={`px-[10px] md:px-[12px] py-[4px] md:py-[6px] rounded-lg text-[9px] md:text-[11px] transition-colors ${
                    selectedSize === size
                      ? "border-[2px] border-[#254936] bg-[#f0f7f4] text-[#254936] font-bold"
                      : "border-[1.5px] border-[#E0D4BE] bg-white text-[#63786A] hover:border-[#B69355]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || isAdding}
            className="w-full bg-[#254936] hover:bg-[#254936] text-white disabled:bg-gray-200 disabled:text-[#63786A] font-bold py-[12px] px-[12px] rounded-xl text-[11px] flex items-center justify-center gap-[8px] uppercase tracking-[1px] cursor-pointer border-none transition-all duration-300 active:scale-[0.98]"
          >
            {isAdding ? (
              <Loader2 className="w-[14px] h-[14px] animate-spin" />
            ) : (
              <ShoppingBag className="w-[14px] h-[14px]" />
            )}
            <span>Add To Cart</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
