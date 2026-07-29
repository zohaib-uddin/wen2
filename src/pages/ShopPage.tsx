import React, { useState, useEffect, useRef } from "react";
import { useShop } from "../context/ShopContext";
import { ChevronRight, ChevronLeft, Grid, List, SlidersHorizontal, RefreshCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/shop/ProductCard";
import { FilterSidebar } from "../components/shop/FilterSidebar";
import { supabase } from "../lib/supabase/client";

export const ShopPage: React.FC = () => {
  const {
    products,
    activeSortOption,
    setSortOption,
    navigate,
    activeCategoryFilter,
    activeConcernFilter,
    setCategoryFilter,
    setConcernFilter
  } = useShop();

  // Local Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Dynamic Categories state and scroll ref
  const [dynamicCats, setDynamicCats] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data, error } = await supabase.from("categories").select("*");
        if (!error && data) {
          const formatted = data.map(c => {
            const parts = (c.description || "").split("||");
            const descText = parts[0] || c.description || "";
            const targetConcern = parts[1] || "";
            return { ...c, descriptionText: descText, target_concern: targetConcern };
          });
          setDynamicCats(formatted);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  const handleScrollCategories = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Synchronize with global context filters on navigation changes
  React.useEffect(() => {
    if (activeCategoryFilter) {
      setSelectedCategories([activeCategoryFilter]);
    } else if (activeCategoryFilter === null && selectedCategories.length === 1) {
      // Don't override if user is manually toggling on the sidebar unless explicitly cleared
    }
  }, [activeCategoryFilter]);

  React.useEffect(() => {
    if (activeConcernFilter) {
      setSelectedConcerns([activeConcernFilter]);
    } else if (activeConcernFilter === null && selectedConcerns.length === 1) {
      // Don't override if user is manually toggling on the sidebar unless explicitly cleared
    }
  }, [activeConcernFilter]);

  // View style grid vs list state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Load More pagination state
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Filter application pipeline
  const filteredProducts = products.filter((p) => {
    // Check for bestsellers query param or dropdown filter
    const searchParams = new URLSearchParams(window.location.search);
    if ((searchParams.get('bestsellers') === 'true' || activeSortOption === 'best-sellers') && !p.isBestSeller) {
      return false;
    }

    // 1. Category Filter matching
    if (selectedCategories.length > 0) {
      const match = selectedCategories.some((selectedCat) => {
        if (selectedCat === "Skin Care") {
          return ["Face Serum", "Face Wash", "Night Cream", "Skin Care"].includes(p.category);
        }
        if (selectedCat === "Hair Care") {
          return ["Hair Oil", "Shampoo", "Hair Care"].includes(p.category);
        }
        return p.category === selectedCat;
      });
      if (!match) return false;
    }

    // 2. Concern Filter matching
    if (selectedConcerns.length > 0) {
      if (!selectedConcerns.includes(p.concern)) {
        return false;
      }
    }

    // 3. Price Filter matching
    if (p.price < priceRange[0] || p.price > priceRange[1]) {
      return false;
    }

    // 4. Rating Filter matching
    if (minRating !== null) {
      if (p.rating < minRating) {
        return false;
      }
    }

    // 5. Stock Status Filter
    if (inStockOnly) {
      const isOutOfStock = p.id === "wen-hair-masque-empty";
      if (isOutOfStock) return false;
    }

    return true;
  });

  // Sorting pipeline execution
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (activeSortOption === "price-low") {
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    }
    if (activeSortOption === "price-high") {
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    }
    if (activeSortOption === "rating") {
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    }
    if (activeSortOption === "best-sellers") {
      return (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
    }
    // Default to oldest first (preserve original DB order)
    return 0;
  });

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setSelectedConcerns([]);
    setMinRating(null);
    setInStockOnly(false);
    setVisibleCount(6);
    setCategoryFilter(null);
    setConcernFilter(null);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    // Mimic realistic premium server loading speed
    await new Promise((resolve) => setTimeout(resolve, 800));
    setVisibleCount((prev) => Math.min(prev + 6, sortedProducts.length));
    setIsLoadingMore(false);
  };

  const paginatedProducts = sortedProducts.slice(0, visibleCount);

  return (
    <div className="bg-gradient-to-b from-[#F4EBDB]/30 to-white text-[#254936] min-h-screen py-8 lg:py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Luxury Breadcrumb bar */}
        <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold text-[#63786A] uppercase tracking-widest mb-6 text-left">
          <button onClick={() => navigate('home')} className="hover:text-[#B69355] transition duration-300 bg-transparent border-none p-0 cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-250" />
          <span className="text-[#B69355]">Shop All Formulas</span>
        </div>

        {/* Category Header Showcase banner */}
        <div className="relative border border-[#F0EBE3] rounded-3xl bg-gradient-to-r from-[#F4EBDB]/40 via-white/80 to-[#F4EBDB]/20 p-6 sm:p-12 mb-10 text-left overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[#B69355]/5 rounded-l-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-[#B69355] text-[10px] sm:text-xs font-bold tracking-[0.25em] block uppercase leading-none">
              LABORATORY FORMULATION CATALOGUE
            </span>
            <h1 className="font-playfair text-2xl sm:text-4xl lg:text-5xl font-bold text-[#254936] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Shop All Formulations
            </h1>
            <p className="text-xs sm:text-sm text-[#63786A] font-light leading-relaxed">
              Meticulously engineered utilizing organic Kashmiri saffron, active skin acids, and raw organic cold-pressed floral infusions. Formatted beautifully to combat the local climate indexes of Pakistan.
            </p>
          </div>
        </div>



        {/* Toolbar & Filter Header controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 border-y border-[#E0D4BE] mb-8 text-xs text-[#63786A]">
          <div className="flex items-center justify-between md:justify-start gap-6">
            <span className="text-left font-medium">
              Showing <strong className="text-[#254936] font-semibold font-mono">{Math.min(visibleCount, sortedProducts.length)}</strong> of <strong className="text-[#254936] font-semibold font-mono">{sortedProducts.length}</strong> creations
            </span>

            {/* View Grid vs List toggle button controls */}
            <div className="hidden sm:flex items-center gap-1 border border-[#E0D4BE] p-1 rounded-xl bg-white">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all border-none cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-[#254936] shadow-xs" : "hover:text-[#254936] text-gray-300"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all border-none cursor-pointer ${
                  viewMode === "list" ? "bg-white text-[#254936] shadow-xs" : "hover:text-[#254936] text-gray-300"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto">
            {/* Mobile Filter toggle drawer button trigger */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white border border-[#E0D4BE] px-4 py-2.5 rounded-xl hover:border-[#B69355] transition-all text-sm font-semibold text-[#254936] cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#B69355]" />
              Filters
            </button>

            {/* Sorter Selector dropdown */}
            <div className="flex items-center space-x-2.5">
              <span className="font-semibold text-[#63786A]">Sort By:</span>
              <select
                value={activeSortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white border border-[#E0D4BE] rounded-xl px-4 py-2.5 font-semibold text-xs text-[#254936] focus:outline-none focus:border-[#B69355] cursor-pointer"
              >
                <option value="recommended">All</option>
                <option value="best-sellers">Best Sellers</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Reviews: Top Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Two-column responsive layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[40px] items-start">
          
          {/* Left-hand Sticky sidebar for desktop, Drawer for mobile */}
          <FilterSidebar
            products={products}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedConcerns={selectedConcerns}
            setSelectedConcerns={setSelectedConcerns}
            minRating={minRating}
            setMinRating={setMinRating}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            isOpen={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
          />

          {/* Right-hand Product display area */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Active filters display tags */}
            {(selectedCategories.length > 0 || selectedConcerns.length > 0 || minRating !== null || inStockOnly || priceRange[0] > 0 || priceRange[1] < 5000) && (
              <div className="flex flex-wrap items-center gap-2 mb-6 text-left">
                <span className="text-xs text-[#63786A] mr-1">Active criteria:</span>
                {selectedCategories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-[#E0D4BE] px-3.5 py-1 rounded-full text-gray-750">
                    {c}
                    <button onClick={() => setSelectedCategories(selectedCategories.filter(x => x !== c))} className="text-[#B69355] hover:text-[#254936] bg-transparent border-none p-0 cursor-pointer font-bold ml-1.5">{"×"}</button>
                  </span>
                ))}
                {selectedConcerns.map((con) => (
                  <span key={con} className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-[#E0D4BE] px-3.5 py-1 rounded-full text-gray-750">
                    {con}
                    <button onClick={() => setSelectedConcerns(selectedConcerns.filter(x => x !== con))} className="text-[#B69355] hover:text-[#254936] bg-transparent border-none p-0 cursor-pointer font-bold ml-1.5">{"×"}</button>
                  </span>
                ))}
                {minRating !== null && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-[#E0D4BE] px-3.5 py-1 rounded-full text-gray-750">
                    {minRating}+ Stars
                    <button onClick={() => setMinRating(null)} className="text-[#B69355] hover:text-[#254936] bg-transparent border-none p-0 cursor-pointer font-bold ml-1.5">{"×"}</button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-[#E0D4BE] px-3.5 py-1 rounded-full text-gray-750">
                    In Stock
                    <button onClick={() => setInStockOnly(false)} className="text-[#B69355] hover:text-[#254936] bg-transparent border-none p-0 cursor-pointer font-bold ml-1.5">{"×"}</button>
                  </span>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-[#E0D4BE] px-3.5 py-1 rounded-full text-gray-750">
                    Rs. {priceRange[0]} - Rs. {priceRange[1]}
                    <button onClick={() => setPriceRange([0, 5000])} className="text-[#B69355] hover:text-[#254936] bg-transparent border-none p-0 cursor-pointer font-bold ml-1.5">{"×"}</button>
                  </span>
                )}
                
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-[#B69355] hover:text-[#254936] hover:underline uppercase tracking-wide font-semibold ml-auto bg-transparent border-none p-0 cursor-pointer transition-colors"
                >
                  <RefreshCcw className="w-3 h-3 animate-spin duration-1000" />
                  Reset all criteria
                </button>
              </div>
            )}

            {/* Main Product Output Container */}
            {paginatedProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-[#E0D4BE] rounded-3xl bg-white/50 space-y-4">
                <p className="text-[#63786A] font-light text-sm">No products match your active filter criteria.</p>
                <button
                  onClick={handleClearFilters}
                  className="bg-[#254936] hover:bg-[#B69355] hover:text-[#254936] text-[#FFF] text-xs font-bold px-6 py-3.5 uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none shadow-sm"
                >
                  Clear All Criteria
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                <div 
                  className={
                    viewMode === "list"
                      ? "space-y-6"
                      : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
                  }
                >
                  {paginatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} viewMode={viewMode} />
                  ))}
                </div>

                {/* Elegant Load More pagination UI */}
                {sortedProducts.length > visibleCount && (
                  <div className="py-4 border-t border-gray-50 flex flex-col items-center space-y-3 pt-8">
                    <span className="text-xs text-[#63786A] font-medium">
                      You've viewed {visibleCount} of {sortedProducts.length} premium solutions
                    </span>
                    <div className="w-48 h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#B69355] transition-all duration-500 ease-out"
                        style={{ width: `${(visibleCount / sortedProducts.length) * 100}%` }}
                      />
                    </div>
                    
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="mt-2 bg-[#254936] hover:bg-[#B69355] hover:text-[#254936] text-white disabled:bg-[#f5f5f5] disabled:text-[#63786A] font-bold py-3.5 px-10 rounded-xl text-xs uppercase tracking-widest transition duration-300 flex items-center gap-2 border-none shadow-sm cursor-pointer"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Preparing Extracts...</span>
                        </>
                      ) : (
                        <span>Load More Formulas</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
export default ShopPage;
