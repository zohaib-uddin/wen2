import React, { useState } from "react";
import { useShop } from "../../context/ShopContext";
import { Star, Heart, ShoppingBag, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  pageContext?: 'home' | 'shop' | 'best-sellers' | 'category' | 'search' | 'wishlist';
  showCategory?: boolean;
  showDiscount?: boolean;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showSize?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = "grid",
  pageContext = 'shop',
  showCategory = true,
  showDiscount = true,
  showWishlist = true,
  showQuickView = true,
  showSize = true
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

  // Not logged in → error toast (same as before)
  if (!user) {
    triggerToast("Please login to add items to your wishlist", undefined, undefined, "error");
    return;
  }

  // Toggle se pehle check karo ke abhi favorited hai ya nahi
  const wasFavorited = isFavorited;

  toggleWishlist(product.id);

  // 👇 Success toast with product image + title
  if (wasFavorited) {
    triggerToast(
      "Removed from favorites",
      product.name,
      product.image,
      "success"
    );
  } else {
    triggerToast(
      "Successfully added to favorites",
      product.name,
      product.image,
      "success"
    );
  }
};

  const handleNavigateToDetail = () => {
    navigate("product", product.id);
  };

  const Badge = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={`text-[7px] md:text-[9px] font-bold px-1.2 py-0.5 rounded-full uppercase tracking-[0.3px] ${className}`}>
      {children}
    </span>
  );

  return (
    <motion.div 
      id={`product-card-${product.id}`}
      onClick={handleNavigateToDetail}
      className="flex flex-col h-full border-0 transition-all duration-300 ease-out cursor-pointer bg-transparent"
    >
      {/* 👇 Image Section — large devices par height barhai gayi (300px → 340px) */}
      <div className="rounded-xl relative w-full h-[200px] md:h-[240px] lg:h-[340px] border-2 border-[#fff] shrink-0">
        <img
          src={primaryImage}
          alt={product.name}
          className="rounded-xl w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy" 
        />

        {/* 👇 BEST SELLERS TAG — fixed width hatayi, ab whitespace-nowrap se har device par aik hi line mein */}
       {/* 👇 BEST SELLERS TAG — sirf tab dikhega jab admin ne isBestSeller = true kiya ho */}
{product.isBestSeller && (
  <div className="absolute top-6.5 left-2 z-10">
    <div className="h-4 px-2 rounded-full bg-[#B69355] flex items-center justify-center text-white text-[7px] md:text-[9px] font-bold tracking-[0.5px] whitespace-nowrap">
      Best Seller
    </div>
  </div>
)}

        {/* OFF Discount Tag */}
        <div className="absolute top-2 left-2 z-10">
          <div className="w-7 h-4 rounded-full bg-[#EF4444] flex items-center justify-center text-white text-[7px] md:text-[9px] font-bold tracking-[0.5px]">
            {actualDiscountPercent}%
          </div>
        </div>

       {/* Wishlist Icon — Red + Filled when favorited */}
{showWishlist && (
  <button
    onClick={handleToggleFavorite}
    className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full cursor-pointer bg-white border flex items-center justify-center shadow-sm transition-colors duration-200 ${
      isFavorited
        ? "border-[#254936] text-red-500"
        : "border-[#254936] text-[#254936] hover:text-[#B69355]"
    }`}
    title={isFavorited ? "Remove from Wishlist" : "Add to Wishlist"}
  >
    <Heart className={`w-2.5 h-2.5 ${isFavorited ? "fill-red-500" : ""}`} />
  </button>
)}

        {/* Quick View Icon */}
        {showQuickView && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuickViewProductId(product.id); }}
            className="absolute top-7.5 right-2 z-10 w-5 h-5 rounded-full cursor-pointer bg-white border border-[#254936] flex items-center justify-center text-[#254936] hover:text-[#B69355] shadow-sm"
            title="Quick View"
          >
            <Eye className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Details Section */}
      <div className="p-3 pt-2 bg-transparent border-t border-[#254936]/10 flex flex-col flex-1">
        {/* Category (Optional) */}
        {showCategory && (
          <span className="text-[7px] md:text-[9px] uppercase tracking-[1.5px] font-bold text-[#B69355] block mb-1">
            {product.category || "SERUM"}
          </span>
        )}

        {/* Title — fixed 2-line height */}
        <h3 className="text-[10px] md:text-[12px] lg:text-[14px] font-bold text-[#254936] leading-[1.3] h-[26px] md:h-[31px] lg:h-[37px] overflow-hidden mb-1">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] md:text-[14px] lg:text-[16px] font-bold text-[#254936]">
            Rs. {currentPrice?.toLocaleString() || "0"}
          </span>
          {originalPrice && (
            <span className="text-[9px] md:text-[10px] lg:text-[12px] text-[#63786A] line-through">
              Rs. {originalPrice?.toLocaleString() || "0"}
            </span>
          )}
        </div>

        {/* Rating Section */}
        <div className="flex items-center mb-1">
          <div className="flex text-[#FFD700]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-[7px] md:text-[9px] lg:text-[10px] text-[#63786A] ml-1">({product.reviewCount || 0})</span>
        </div>

        {/* Size Selector */}
        {showSize && parsedVariants && parsedVariants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {parsedVariants.map((size) => (
              <button
                key={size}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                className={`px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full text-[7px] md:text-[9px] lg:text-[10px] font-medium transition-colors ${
                  selectedSize === size
                    ? "bg-[#254936] border border-[#254936] text-[#fff]"
                    : "bg-transparent border border-[#254936] text-[#254936] cursor-pointer"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Add to Cart */}
        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock || isAdding}
          className={`mt-auto w-full py-1.5 lg:py-2 px-2 rounded-full cursor-pointer bg-transparent border border-[#254936] text-[#254936] font-medium text-[8px] md:text-[10px] lg:text-[11px] uppercase tracking-[1px] transition-all duration-300 flex items-center justify-center gap-1.5 ${
            isAdding ? "opacity-70 cursor-not-allowed" : "hover:bg-[#254936] hover:text-white"
          }`}
        >
          {isAdding ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-2.5 h-2.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;