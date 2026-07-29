import { getSmallestVariant } from "../lib/utils/variant";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Product, CartItem, PageRoute, ReviewSubmission, Review, SavedAddress } from "../types";
import { supabase, getSupabaseBrowserClient } from "../lib/supabase/client";

interface CheckoutDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  specialInstructions: string;
  billingSameAsShipping: boolean;
  paymentMethod: "COD" | "Card";
  notes?: string;
  couponCode?: string;
  discountPercentage?: number;
}

interface ShopContextType {
  products: Product[];
  currentPage: PageRoute;
  selectedProductId: string | null;
  selectedProduct: Product | null;
  cart: CartItem[];
  directCheckoutItem: CartItem | null;
  setDirectCheckoutItem: (item: CartItem | null) => void;
  wishlist: string[]; // List of product IDs
  savedAddresses: SavedAddress[];
  searchOpen: boolean;
  cartOpen: boolean;
  quickViewProductId: string | null;
  setQuickViewProductId: (id: string | null) => void;
  activeCategoryFilter: string | null;
  activeConcernFilter: string | null;
  activeSortOption: string;
  searchQuery: string;
  checkoutDetails: CheckoutDetails | null;
  lastOrderId: string | null;
  navigate: (page: PageRoute, productId?: string | null) => void;
  addToCart: (product: Product, quantity: number, variant: string) => void;
  removeFromCart: (productId: string, variant: string) => void;
  updateCartQuantity: (productId: string, variant: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearCart: () => void;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setCategoryFilter: (category: string | null) => void;
  setConcernFilter: (concern: string | null) => void;
  setSortOption: (option: string) => void;
  setSearchQuery: (query: string) => void;
  submitReview: (review: ReviewSubmission) => void;
  placeOrder: (details: CheckoutDetails) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productsLoading: boolean;
  toast: { show: boolean; message: string; productName?: string; productImage?: string; type?: 'success' | 'error' } | null;
  triggerToast: (message: string, productName?: string, productImage?: string, type?: 'success' | 'error') => void;
  user: any | null;
  profile: any | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (updatedFields: { fullName?: string; phone?: string; address?: string; city?: string }) => Promise<{ success: boolean; profile?: any; error?: string }>;
  getClient: () => Promise<any>;
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<{ success: boolean; address?: SavedAddress; error?: string }>;
  updateAddress: (address: SavedAddress) => Promise<{ success: boolean; address?: SavedAddress; error?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  setPrimaryAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  appliedCoupon: {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    discount_amount: number;
    coupon_id: string;
  } | null;
  applyCoupon: (code: string, cartTotal: number) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  shopCategories: any[];
  shopConcerns: any[];
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const initialCheckout: CheckoutDetails = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "Lahore",
  country: "Pakistan",
  postalCode: "",
  specialInstructions: "",
  billingSameAsShipping: true,
  paymentMethod: "COD"
};

const mapDbProductToFrontend = (dbProd: any, categoryName: string): Product => {
  if (!dbProd) {
    return {} as Product;
  }
  const shortDescStr = dbProd.short_description || "";
  const potencyExplanation = shortDescStr;
  const dbConcern = dbProd.concern || "";
  const finalConcern = dbConcern;

  const hasVariants = dbProd.product_variants && dbProd.product_variants.length > 0;
  const firstVariant = hasVariants ? dbProd.product_variants[0] : null;

  return {
    id: dbProd.id,
    name: dbProd.name,
    category: (categoryName || "Hair Oil") as any,
    price: hasVariants ? Number(firstVariant.price) : (Number(dbProd.price) || 2500),
    originalPrice: hasVariants 
      ? (firstVariant.compare_price ? Number(firstVariant.compare_price) : undefined)
      : (dbProd.compare_price ? Number(dbProd.compare_price) : undefined),
    actual_price: hasVariants
      ? (firstVariant.actual_price ? Number(firstVariant.actual_price) : undefined)
      : (dbProd.actual_price ? Number(dbProd.actual_price) : undefined),
    rating: Number(dbProd.rating) || 5.0,
    reviewCount: Number(dbProd.reviews_count) || 0,
    image: dbProd.images?.[0] || "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop",
    description: dbProd.description || "",
    keyBenefits: Array.isArray(dbProd.benefits) ? dbProd.benefits : (typeof dbProd.benefits === 'string' ? dbProd.benefits.split(',').map(s=>s.trim()) : []),
    potencyExplanation: potencyExplanation,
    idealFor: [
      "Frizzy and thinning hair in humid climates",
      "Post-pregnancy or stress-related hair fall",
      "Color-treated, chemically damaged hair"
    ],
    howToUse: dbProd.how_to_use || "",
    ingredients: Array.isArray(dbProd.ingredients) ? dbProd.ingredients.join(", ") : (dbProd.ingredients || ""),
    concern: finalConcern as any,
    variants: hasVariants 
      ? dbProd.product_variants.map((v: any) => ({
          id: v.id || `var-${Date.now()}-${Math.random()}`,
          size: v.size,
          price: Number(v.price),
          compare_price: v.compare_price ? Number(v.compare_price) : undefined,
          actual_price: v.actual_price ? Number(v.actual_price) : undefined,
          stock_quantity: Number(v.stock_quantity) || 0
        }))
      : [{
          id: `var-${Date.now()}-${Math.random()}`,
          size: dbProd.size || "100ml",
          price: Number(dbProd.price) || 2500,
          compare_price: dbProd.compare_price ? Number(dbProd.compare_price) : undefined,
          actual_price: dbProd.actual_price ? Number(dbProd.actual_price) : undefined,
          stock_quantity: dbProd.stock_quantity || 0
        }],
    selectedVariant: hasVariants 
      ? firstVariant.size 
      : (dbProd.size || "100ml"),
    has_variants: hasVariants,
    isBestSeller: dbProd.is_bestseller || false,
    isNewArrival: dbProd.is_featured || false,
    stock_quantity: hasVariants ? (firstVariant.stock_quantity || 0) : (dbProd.stock_quantity || 0),
    size: hasVariants ? firstVariant.size : (dbProd.size || "100ml"),
    gallery_images: dbProd.gallery_images || (dbProd.images && dbProd.images.length > 1 ? dbProd.images.slice(1) : []),
    reviews_count: Number(dbProd.reviews_count) || 0,
    reviewsList: []
  };
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("wen_products_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved products", e);
      }
    }
    return [];
  });
  
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [shopCategories, setShopCategories] = useState<any[]>([]);
  const [shopConcerns, setShopConcerns] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '');
      if (!path) {
        if (currentPage !== 'home') setCurrentPage('home');
        return;
      }
      const parts = path.split('/');
      const page = parts[0] as PageRoute;
      const productId = parts[1] || null;
      
      const validPages = ['home', 'shop', 'best-sellers', 'about', 'contact', 'product', 'wishlist', 'track-order', 'checkout', 'checkout-success', 'sign-in', 'sign-up', 'account', 'admin', 'admin-sign-in', 'order-details', 'privacy-policy', 'terms-conditions', 'shipping-policy', 'return-policy'];
      if (validPages.includes(page)) {
        setCurrentPage(page);
        if (productId) {
          setSelectedProductId(productId);
        }
      } else {
        setCurrentPage('home');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("wen_guest_cart_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && item.product && item.product.id);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved guest cart", e);
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("wen_wishlist_state");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to parse wishlist from local storage", e);
      return [];
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const saved = localStorage.getItem("wen_saved_addresses_state");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to parse saved addresses from local storage", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("wen_saved_addresses_state", JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeConcernFilter, setActiveConcernFilter] = useState<string | null>(null);
  const [activeSortOption, setActiveSortOption] = useState<string>("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails | null>(initialCheckout);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    discount_amount: number;
    coupon_id: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("wen_applied_coupon");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse applied coupon from local storage", e);
      return null;
    }
  });

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("wen_applied_coupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("wen_applied_coupon");
    }
  }, [appliedCoupon]);

  const applyCoupon = async (code: string, cartTotal: number) => {
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, cart_total: cartTotal })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const couponData = {
          code: data.code,
          discount_type: data.discount_type as "percentage" | "fixed",
          discount_value: Number(data.discount_value),
          discount_amount: Number(data.discount_amount),
          coupon_id: data.coupon_id
        };
        setAppliedCoupon(couponData);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to validate coupon." };
      }
    } catch (err: any) {
      console.error("Error applying coupon:", err);
      return { success: false, error: "Network error validating coupon." };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const [toast, setToast] = useState<{ show: boolean; message: string; productName?: string; productImage?: string; type?: 'success' | 'error' } | null>(null);

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useAuth();

  const getClient = async () => {
    try {
      const token = await getToken({ template: "supabase" });
      return getSupabaseBrowserClient(token || undefined);
    } catch (err) {
      console.warn("Could not get authenticated Supabase client:", err);
      return supabase;
    }
  };

  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshAuth = async () => {
    // Handled reactively by useUser
  };

  const logout = async () => {
    try {
      await clerkSignOut();
    } catch (err) {
      console.warn("Sign out warning:", err);
    }
    setUser(null);
    setProfile(null);
    navigate('home');
    triggerToast("Logged out successfully");
  };

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!clerkUser) {
      try {
        const saved = localStorage.getItem("wen_guest_cart_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart(parsed.filter(item => item && item.product && item.product.id));
          } else {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      } catch (e) {
        setCart([]);
      }
    } else {
      // Keep guest cart in memory so it can be merged when loadUserData fires
    }
  }, [clerkUser, clerkLoaded]);

  useEffect(() => {
    if (!clerkLoaded) {
      setAuthLoading(true);
      return;
    }

    const syncClerkUser = async () => {
      setAuthLoading(true);
      if (clerkUser) {
        setUser(clerkUser);
        
        const email = clerkUser.primaryEmailAddress?.emailAddress || "";
        const fullName = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "WEN Member";
        let phone = clerkUser.primaryPhoneNumber?.phoneNumber || "";
        const avatar_url = clerkUser.imageUrl || "";

        // Fallback checks from signup sessionStorage if empty
        const tempPhone = sessionStorage.getItem("wen_signup_phone");
        if (!phone && tempPhone) {
          phone = tempPhone;
        }
        const tempFullName = sessionStorage.getItem("wen_signup_fullname");
        const finalFullName = (fullName === "WEN Member" && tempFullName) ? tempFullName : fullName;
        
        const emailLower = email.toLowerCase();
        const isEmailAdmin = emailLower.includes("admin") || emailLower === "zohaibuddin376@gmail.com" || emailLower === "admin@wenhairskin.com";
        const clerkRole = (clerkUser.publicMetadata?.role === "admin" || isEmailAdmin) ? "admin" : "customer";

        try {
          // Send request to our backend API to instantly sync or create this user in Supabase
          const response = await fetch("/api/sync-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerk_id: clerkUser.id,
              email: email,
              full_name: finalFullName,
              phone: phone,
              avatar_url: avatar_url,
              role: clerkRole,
            }),
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData.success && resData.profile) {
              setProfile(resData.profile);
              
              if (currentPage === 'sign-in' || currentPage === 'sign-up' || currentPage === 'admin-sign-in') {
                if (resData.profile.role === 'admin') {
                  navigate('admin');
                } else if (currentPage === 'admin-sign-in') {
                  triggerToast("Access Denied: This account is not registered as an administrator.");
                  try { await clerkSignOut(); } catch(e) {}
                  setUser(null);
                  setProfile(null);
                  navigate('home');
                } else {
                  navigate(currentPage === 'sign-up' ? 'shop' : 'account');
                }
              }
              setAuthLoading(false);
              return;
            }
          }
          
          // Local fallback in case the API call failed or timed out
          const fallbackProfile = {
            id: clerkUser.id,
            clerk_id: clerkUser.id,
            email: email,
            full_name: finalFullName,
            phone: phone,
            role: clerkRole,
            avatar_url: avatar_url
          };
          setProfile(fallbackProfile);
          if (currentPage === 'sign-in' || currentPage === 'sign-up' || currentPage === 'admin-sign-in') {
            if (currentPage === 'admin-sign-in') {
              triggerToast("Access Denied: Administrative credentials could not be verified.");
              try { await clerkSignOut(); } catch(e) {}
              setUser(null);
              setProfile(null);
              navigate('home');
            } else {
              navigate(currentPage === 'sign-up' ? 'shop' : 'account');
            }
          }
        } catch (err) {
          console.error("Profile sync api error, fallback in play:", err);
          setProfile({
            id: clerkUser.id,
            clerk_id: clerkUser.id,
            email: email,
            full_name: finalFullName,
            phone: phone,
            role: clerkRole,
            avatar_url: avatar_url
          });
          if (currentPage === 'sign-in' || currentPage === 'sign-up' || currentPage === 'admin-sign-in') {
            if (currentPage === 'admin-sign-in') {
              triggerToast("Access Denied: Connection error during administrative check.");
              try { await clerkSignOut(); } catch(e) {}
              setUser(null);
              setProfile(null);
              navigate('home');
            } else {
              navigate(currentPage === 'sign-up' ? 'shop' : 'account');
            }
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    };

    syncClerkUser();
  }, [clerkUser, clerkLoaded]);

  // Load Cart and Wishlist from Supabase when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!clerkUser || products.length === 0) return;
      try {
        const response = await fetch(`/api/user-data/${clerkUser.id}`);
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            if (resData.profile) {
              setProfile(resData.profile);
            }
            if (resData.wishlist) {
              setWishlist(resData.wishlist);
            }
            if (resData.cart) {
              const savedUserCartStr = localStorage.getItem(`wen_user_cart_state_${clerkUser.id}`);
              const savedUserCart: CartItem[] = savedUserCartStr ? JSON.parse(savedUserCartStr) : [];
              
              let newCart: CartItem[] = [...savedUserCart];
              
              // Ensure all items in DB are also in the cart
              for (const item of resData.cart) {
                const dbProdId = item.product_id;
                const matchedProd = products.find(p => p?.id === dbProdId || (p?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === dbProdId);
                if (matchedProd) {
                  const exists = newCart.some(c => c.product.id === matchedProd.id);
                  if (!exists) {
                    newCart.push({
                      product: matchedProd,
                      quantity: item.quantity,
                      selectedVariant: getSmallestVariant(matchedProd.variants, matchedProd.size)
                    });
                  }
                }
              }
              
              // Remove items from local cart that are NOT in DB (sync removals from other devices)
              newCart = newCart.filter(localItem => resData.cart.some((dbItem: any) => {
                 const matchedProd = products.find(p => p?.id === dbItem.product_id || (p?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === dbItem.product_id);
                 return matchedProd && matchedProd.id === localItem.product.id;
              }));

              setCart(newCart);
            }
          }
        }

        // Fetch saved addresses from server
        const addrRes = await fetch(`/api/addresses/${clerkUser.id}`);
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          if (addrData.success && addrData.addresses) {
            setSavedAddresses(addrData.addresses);
          }
        }
      } catch (err) {
        console.warn("Error loading user data or saved addresses from server API:", err);
      }
    };

    loadUserData();
  }, [clerkUser, products]);

  const triggerToast = (message: string, productName?: string, productImage?: string, type?: "success" | "error") => {
    let resolvedType: "success" | "error" = type || "success";
    if (!type) {
      const lower = (message || "").toLowerCase();
      if (
        lower.includes("error") ||
        lower.includes("fail") ||
        lower.includes("invalid") ||
        lower.includes("could not") ||
        lower.includes("please fill") ||
        lower.includes("missing") ||
        lower.includes("required") ||
        lower.includes("incorrect")
      ) {
        resolvedType = "error";
      }
    }
    setToast({ show: true, message: message || "", productName, productImage, type: resolvedType });
  };

  // Sync to database and local state
  useEffect(() => {
    const syncDbAndSeed = async () => {
      try {
        // 1. Fetch categories
        const { data: catData, error: catErr } = await supabase.from("categories").select("*");
        const categoryMap: Record<string, string> = {};
        
        if (!catErr && catData && catData.length > 0) {
          catData.forEach(c => {
            categoryMap[c.name] = c.id;
          });
          setShopCategories(catData);
        } else {
          // Seed categories
          const catsToSeed = [
            { name: "Hair Oil", slug: "hair-oil", description: "Saffron Hair Oils" },
            { name: "Shampoo", slug: "shampoo", description: "Sulfate-Free Shampoos" },
            { name: "Face Serum", slug: "face-serum", description: "Clinical Face Serums" },
            { name: "Face Wash", slug: "face-wash", description: "Acne Deep Cleansers" },
            { name: "Night Cream", slug: "night-cream", description: "Ayurvedic Night Creams" },
            { name: "Hair Care", slug: "hair-care", description: "Hair Care Essentials" },
            { name: "Skin Care", slug: "skin-care", description: "Skin Care Essentials" }
          ];
          const { data: seededCats } = await supabase.from("categories").insert(catsToSeed).select();
          if (seededCats) {
            setShopCategories(seededCats);
            seededCats.forEach(c => {
              categoryMap[c.name] = c.id;
            });
          }
        }

        // Fetch targets
        const targetsRes = await fetch("/api/admin/product-targets");
        if (targetsRes.ok) {
          const tarData = await targetsRes.json();
          if (tarData.success && tarData.targets) {
            setShopConcerns(tarData.targets);
          }
        }

        // 2. Fetch products
        const { data: prodData, error: prodErr } = await supabase.from("products").select("*, categories(id, name, slug), product_variants(*)").order("created_at", { ascending: true });
        if (!prodErr && prodData) {
          const mapped = prodData.map((dp: any) => mapDbProductToFrontend(dp, dp.categories?.name));
          setProducts(mapped);
        }
      } catch (err) {
        console.warn("Supabase database connection failed; using localStorage fallback.", err);
      } finally {
        setProductsLoading(false);
      }
    };

    syncDbAndSeed();
  }, []);

  // Helper to safely set localStorage without crashing on quota exceeded
  const safeSetItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage quota exceeded or failed for ${key}, attempting slim down...`);
      try {
        if (key === "wen_products_state") {
          const slimmed = (value as Product[]).map(p => ({ ...p, gallery_images: undefined }));
          localStorage.setItem(key, JSON.stringify(slimmed));
        } else if (key === "wen_cart_state") {
          const slimmed = (value as CartItem[]).map(c => ({
            ...c,
            product: { ...c.product, gallery_images: undefined }
          }));
          localStorage.setItem(key, JSON.stringify(slimmed));
        }
      } catch (innerErr) {
        console.warn(`Fallback local storage failed for ${key}`, innerErr);
      }
    }
  };

  // Sync to local storage for local redundancy
  useEffect(() => {
    safeSetItem("wen_products_state", products);
  }, [products]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!clerkUser) {
      safeSetItem("wen_guest_cart_state", cart);
    } else {
      safeSetItem(`wen_user_cart_state_${clerkUser.id}`, cart);
    }
  }, [cart]);

  useEffect(() => {
    safeSetItem("wen_wishlist_state", wishlist);
  }, [wishlist]);

  const selectedProduct = selectedProductId 
    ? products.find(p => p?.id === selectedProductId) || null 
    : null;

  // Custom Navigation Handler supporting dynamic view transitions
  const navigate = (page: PageRoute, productId: string | null = null) => {
    let newPath = `/${page}`;
    if (productId) {
      newPath = `/${page}/${productId}`;
    }
    
    // Only push state if the path is different
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
      // Dispatch a popstate event manually so our listener catches it and updates state
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    
    setCurrentPage(page);
    if (productId) setSelectedProductId(productId);
    
    // Scroll smoothly to top on navigation action
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getProductUuid = (prodId: any): string | null => {
    if (!prodId) return null;
    const strId = String(prodId);
    
    // 1. If strId is already a UUID (length 36), return it
    if (strId.length === 36) {
      return strId;
    }

    // 2. Direct match in loaded products
    let matched = products.find(p => p?.id === strId);
    if (matched && matched.id && matched.id.length === 36) {
      return matched.id;
    }

    // 3. Normalized slug or name match
    matched = products.find(p => {
      const pSlug = (p?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const searchSlug = (strId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return (
        p?.id === strId ||
        pSlug === searchSlug ||
        pSlug.includes(searchSlug) ||
        searchSlug.includes(pSlug) ||
        (p?.name || "").toLowerCase().trim() === (strId || "").toLowerCase().trim()
      );
    });

    if (matched && matched.id && matched.id.length === 36) {
      return matched.id;
    }

    return null;
  };

  const syncCartItemWithDb = async (productId: string, quantity: number) => {
    if (!clerkUser) return;
    try {
      const dbProdId = getProductUuid(productId);
      if (!dbProdId) return;

      await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          product_id: dbProdId,
          quantity: quantity,
        }),
      });
    } catch (err) {
      console.error("Error syncing cart item with Supabase via API:", err);
    }
  };

  const deleteCartItemFromDb = async (productId: string) => {
    if (!clerkUser) return;
    try {
      const dbProdId = getProductUuid(productId);
      if (!dbProdId) return;

      await fetch("/api/cart/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          product_id: dbProdId,
        }),
      });
    } catch (err) {
      console.error("Error deleting cart item from Supabase via API:", err);
    }
  };

  const syncWishlistWithDb = async (productId: string, shouldAdd: boolean) => {
    if (!clerkUser) return;
    try {
      const dbProdId = getProductUuid(productId);
      if (!dbProdId) return;

      await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          product_id: dbProdId,
          shouldAdd: shouldAdd,
        }),
      });
    } catch (err) {
      console.error("Error syncing wishlist with Supabase via API:", err);
    }
  };

  const addToCart = (product: Product, quantity: number, variant: string) => {
    console.log('=== ADD TO CART DEBUG ===');
    console.log('Product ID:', product?.id);
    console.log('Product Name:', product?.name);
    console.log('Quantity parameter:', quantity);
    console.log('Variant:', variant);
    
    if (!product || !product.id) {
      console.warn("addToCart was called with an invalid product:", product);
      return;
    }

    const resolvedVariant = variant || getSmallestVariant(product.variants, product.size);
    const addQty = quantity || 1;

    // Safely compute the final quantity synchronously to avoid state race conditions during DB sync
    const safeCartList = Array.isArray(cart) ? cart.filter(item => item && item.product && item.product.id) : [];
    const existingItem = safeCartList.find(
      (item) => item.product.id === product.id && item.selectedVariant === resolvedVariant
    );
    const finalQty = existingItem ? (existingItem.quantity + addQty) : addQty;

    let newTotalQuantityForProduct = 0;
    setCart((prevCart) => {
      const safeCart = Array.isArray(prevCart)
        ? prevCart.filter(item => item && item.product && item.product.id)
        : [];
      
      const existingIndex = safeCart.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === resolvedVariant
      );
      
      let updatedCart: CartItem[];
      if (existingIndex > -1) {
        updatedCart = safeCart.map((item, index) => {
          if (index === existingIndex) {
            return { ...item, quantity: finalQty };
          }
          return item;
        });
      } else {
        updatedCart = [...safeCart, { product, quantity: finalQty, selectedVariant: resolvedVariant }];
      }
      
      newTotalQuantityForProduct = updatedCart.filter(item => item.product.id === product.id).reduce((acc, item) => acc + item.quantity, 0);
      return updatedCart;
    });

    // Sync with DB using computed newTotalQuantityForProduct
    setTimeout(() => {
      syncCartItemWithDb(product.id, newTotalQuantityForProduct);
    }, 50);

    setCartOpen(true); // Auto-open cart sidebar when adding item
    triggerToast("Added to Cart Successfully", product.name, product.image);
  };

  const removeFromCart = (productId: string, variant: string) => {
    let remainingQuantity = 0;
    setCart((prevCart) => {
      const safeCart = Array.isArray(prevCart) ? prevCart.filter(item => item && item.product && item.product.id) : [];
      const updatedCart = safeCart.filter(
        (item) => !(item.product.id === productId && item.selectedVariant === variant)
      );
      remainingQuantity = updatedCart.filter(item => item.product.id === productId).reduce((acc, item) => acc + item.quantity, 0);
      return updatedCart;
    });

    // Sync with DB
    setTimeout(() => {
      if (remainingQuantity > 0) {
        syncCartItemWithDb(productId, remainingQuantity);
      } else {
        deleteCartItemFromDb(productId);
      }
    }, 50);
  };

  const updateCartQuantity = (productId: string, variant: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    let newTotalQuantity = 0;
    setCart((prevCart) => {
      const safeCart = Array.isArray(prevCart) ? prevCart.filter(item => item && item.product && item.product.id) : [];
      const updatedCart = safeCart.map((item) =>
        item.product.id === productId && item.selectedVariant === variant
          ? { ...item, quantity }
          : item
      );
      newTotalQuantity = updatedCart.filter(item => item.product.id === productId).reduce((acc, item) => acc + item.quantity, 0);
      return updatedCart;
    });

    // Sync with DB
    setTimeout(() => {
      syncCartItemWithDb(productId, newTotalQuantity);
    }, 50);
  };

  const toggleWishlist = (productId: string) => {
    if (!user && !clerkUser) {
      triggerToast("Please login to manage your wishlist.", undefined, undefined, "error");
      return;
    }

    let shouldAdd = false;
    setWishlist((prev) => {
      const alreadyHas = prev.includes(productId);
      shouldAdd = !alreadyHas;
      const updated = alreadyHas
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      return updated;
    });

    // Sync with DB
    syncWishlistWithDb(productId, shouldAdd);
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const clearCart = async () => {
    setCart([]);
    if (clerkUser) {
      try {
        await fetch("/api/cart/clear", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerk_id: clerkUser.id,
          }),
        });
      } catch (err) {
        console.error("Error clearing cart items from Supabase via API:", err);
      }
    }
  };

  const updateProfile = async (updatedFields: { fullName?: string; phone?: string; address?: string; city?: string }) => {
    if (!clerkUser) return { success: false, error: "Not logged in" };
    try {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const avatar_url = clerkUser.imageUrl || "";

      const payload = {
        clerk_id: clerkUser.id,
        email: email,
        full_name: updatedFields.fullName !== undefined ? updatedFields.fullName : profile?.full_name,
        phone: updatedFields.phone !== undefined ? updatedFields.phone : profile?.phone,
        avatar_url: avatar_url,
        address: updatedFields.address !== undefined ? updatedFields.address : profile?.address,
        city: updatedFields.city !== undefined ? updatedFields.city : profile?.city,
        is_manual: true
      };

      const response = await fetch("/api/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.profile) {
          setProfile(resData.profile);
          return { success: true, profile: resData.profile };
        }
      }
      return { success: false, error: "Failed to update profile on backend" };
    } catch (err: any) {
      console.error("Error updating profile:", err);
      return { success: false, error: err.message };
    }
  };

  const addAddress = async (newAddr: Omit<SavedAddress, "id">) => {
    const tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const fullNewAddr: SavedAddress = { ...newAddr, id: tempId };

    if (!clerkUser) {
      setSavedAddresses(prev => {
        const updated = [...prev, fullNewAddr];
        if (newAddr.is_primary) {
          return updated.map(a => a.id === tempId ? { ...a, is_primary: true } : { ...a, is_primary: false });
        }
        return updated;
      });
      return { success: true, address: fullNewAddr };
    }

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          full_name: newAddr.full_name,
          phone: newAddr.phone,
          address: newAddr.address,
          city: newAddr.city,
          country: newAddr.country,
          postal_code: newAddr.postal_code,
          special_instructions: newAddr.special_instructions,
          is_primary: newAddr.is_primary
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          setSavedAddresses(prev => {
            const list = prev.filter(a => a.id !== tempId && a.id !== data.address.id);
            const updated = [...list, data.address];
            if (data.address.is_primary) {
              return updated.map(a => a.id === data.address.id ? { ...a, is_primary: true } : { ...a, is_primary: false });
            }
            return updated;
          });
          return { success: true, address: data.address };
        } else if (data.fallback) {
          setSavedAddresses(prev => {
            const updated = [...prev, fullNewAddr];
            if (newAddr.is_primary) {
              return updated.map(a => a.id === tempId ? { ...a, is_primary: true } : { ...a, is_primary: false });
            }
            return updated;
          });
          return { success: true, address: fullNewAddr };
        }
      }
      return { success: false, error: "Server request failed" };
    } catch (err: any) {
      console.warn("Failed to add address on server, using local fallback:", err);
      setSavedAddresses(prev => {
        const updated = [...prev, fullNewAddr];
        if (newAddr.is_primary) {
          return updated.map(a => a.id === tempId ? { ...a, is_primary: true } : { ...a, is_primary: false });
        }
        return updated;
      });
      return { success: true, address: fullNewAddr };
    }
  };

  const updateAddress = async (updatedAddr: SavedAddress) => {
    if (!clerkUser) {
      setSavedAddresses(prev => {
        const list = prev.map(a => a.id === updatedAddr.id ? updatedAddr : a);
        if (updatedAddr.is_primary) {
          return list.map(a => a.id === updatedAddr.id ? { ...a, is_primary: true } : { ...a, is_primary: false });
        }
        return list;
      });
      return { success: true, address: updatedAddr };
    }

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: clerkUser.id,
          id: updatedAddr.id,
          full_name: updatedAddr.full_name,
          phone: updatedAddr.phone,
          address: updatedAddr.address,
          city: updatedAddr.city,
          country: updatedAddr.country,
          postal_code: updatedAddr.postal_code,
          special_instructions: updatedAddr.special_instructions,
          is_primary: updatedAddr.is_primary
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.address) {
          setSavedAddresses(prev => {
            const list = prev.map(a => a.id === data.address.id ? data.address : a);
            if (data.address.is_primary) {
              return list.map(a => a.id === data.address.id ? { ...a, is_primary: true } : { ...a, is_primary: false });
            }
            return list;
          });
          return { success: true, address: data.address };
        } else if (data.fallback) {
          setSavedAddresses(prev => {
            const list = prev.map(a => a.id === updatedAddr.id ? updatedAddr : a);
            if (updatedAddr.is_primary) {
              return list.map(a => a.id === updatedAddr.id ? { ...a, is_primary: true } : { ...a, is_primary: false });
            }
            return list;
          });
          return { success: true, address: updatedAddr };
        }
      }
      return { success: false, error: "Server request failed" };
    } catch (err: any) {
      console.warn("Failed to update address on server, using local fallback:", err);
      setSavedAddresses(prev => {
        const list = prev.map(a => a.id === updatedAddr.id ? updatedAddr : a);
        if (updatedAddr.is_primary) {
          return list.map(a => a.id === updatedAddr.id ? { ...a, is_primary: true } : { ...a, is_primary: false });
        }
        return list;
      });
      return { success: true, address: updatedAddr };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!clerkUser) {
      setSavedAddresses(prev => prev.filter(a => a.id !== id));
      return { success: true };
    }

    try {
      const response = await fetch(`/api/user/addresses/${id}?clerk_id=${clerkUser.id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSavedAddresses(prev => prev.filter(a => a.id !== id));
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to delete saved address." };
      }
    } catch (err: any) {
      console.warn("Failed to delete address on server:", err);
      return { success: false, error: err.message || "Network issue during deletion request." };
    }
  };

  const setPrimaryAddress = async (id: string) => {
    if (!clerkUser) {
      setSavedAddresses(prev => prev.map(a => a.id === id ? { ...a, is_primary: true } : { ...a, is_primary: false }));
      return { success: true };
    }

    try {
      const response = await fetch("/api/addresses/set-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, clerk_id: clerkUser.id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success || data.fallback) {
          setSavedAddresses(prev => prev.map(a => a.id === id ? { ...a, is_primary: true } : { ...a, is_primary: false }));
          return { success: true };
        }
      }
      return { success: false, error: "Server request failed" };
    } catch (err: any) {
      console.warn("Failed to set primary address on server, using local fallback:", err);
      setSavedAddresses(prev => prev.map(a => a.id === id ? { ...a, is_primary: true } : { ...a, is_primary: false }));
      return { success: true };
    }
  };

  const setCategoryFilter = (category: string | null) => {
    setActiveCategoryFilter(category);
    if (category) {
      setActiveConcernFilter(null); // Clear overlapping concerns
    }
  };

  const setConcernFilter = (concern: string | null) => {
    setActiveConcernFilter(concern);
    if (concern) {
      setActiveCategoryFilter(null); // Clear overlapping categories
    }
  };

  const submitReview = async (submission: ReviewSubmission) => {
    // 1. Insert into Supabase reviews table
    try {
      const matchedProd = products.find(p => p?.name === submission.productName);
      if (matchedProd) {
        await supabase.from("reviews").insert({
          product_id: matchedProd.id,
          rating: submission.rating,
          comment: `${submission.title}: ${submission.text}`,
          is_approved: true
        });
      }
    } catch (e) {
      console.warn("Could not save review on Supabase.", e);
    }

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.name === submission.productName) {
          const newReview: Review = {
            id: `usr-${Date.now()}`,
            author: submission.author,
            city: submission.city,
            rating: submission.rating,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit"
            }),
            title: submission.title,
            text: submission.text,
          };
          const updatedReviewsList = [newReview, ...p.reviewsList];
          const newRating = parseFloat(
            (
              updatedReviewsList.reduce((acc, r) => acc + r.rating, 0) /
              updatedReviewsList.length
            ).toFixed(1)
          );
          return {
            ...p,
            reviewsList: updatedReviewsList,
            reviewCount: updatedReviewsList.length,
            rating: newRating,
          };
        }
        return p;
      })
    );
  };

  const placeOrder = async (details: CheckoutDetails) => {
    // Generate fallback order number in case network fails
    const fallbackOrderNumber = `WEN-${Math.floor(100000 + Math.random() * 900000)}`;
    const checkoutCart = directCheckoutItem ? [directCheckoutItem] : cart;
    const totalAmount = checkoutCart.reduce((acc, item) => acc + (Number(item.product?.price) || 0) * item.quantity, 0);
    const discountAmount = details.discountPercentage ? Math.round(totalAmount * (details.discountPercentage / 100)) : 0;
    const threshold = Number(localStorage.getItem("wen_setting_free_delivery") || "2000");
    const estTotal = totalAmount + (totalAmount >= threshold ? 0 : 250) - discountAmount;

    let finalOrderNumber = fallbackOrderNumber;

    // 1. Persist securely via server API route
    try {
      const resolvedCartItems = checkoutCart.map(item => {
        const dbProdId = getProductUuid(item.product.id);
        const productImg = item.product.image || (item.product.images && item.product.images[0]) || "";
        return {
          id: item.id,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant,
          product: {
            id: dbProdId || item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: productImg.length > 500 ? "" : productImg, // Strip huge base64s to prevent entity too large
            category: item.product.category,
            concern: item.product.concern
          }
        };
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clerk_id: clerkUser?.id || null,
          details,
          cart_items: resolvedCartItems
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.order) {
          finalOrderNumber = resData.order.order_number;
        }
      }
    } catch (e) {
      console.warn("Could not save transaction to Supabase database. Falling back to local tracking state.", e);
    }

    setCheckoutDetails(details);
    setLastOrderId(finalOrderNumber);
    
    // Save order in mock local tracking database for the user to track later
    let trackingDb: any = {};
    try {
      trackingDb = JSON.parse(localStorage.getItem("wen_order_tracking_db") || "{}");
    } catch (e) {
      console.warn("Failed to parse tracking DB, resetting");
    }
    trackingDb[finalOrderNumber] = {
      orderId: finalOrderNumber,
      fullName: details.fullName,
      email: details.email,
      phone: details.phone,
      address: `${details.address}, ${details.city}, Pakistan`,
      items: checkoutCart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        variant: item.selectedVariant,
        price: item.product.price
      })),
      totalPrice: estTotal,
      status: "Placed",
      couponCode: details.couponCode || null,
      discountPercentage: details.discountPercentage || 0,
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    try {
      localStorage.setItem("wen_order_tracking_db", JSON.stringify(trackingDb));
    } catch (e) {
      console.warn("Quota exceeded, could not save to wen_order_tracking_db");
    }

    // Reset shopping cart upon successful checkout
    if (directCheckoutItem) {
      setDirectCheckoutItem(null);
    } else {
      clearCart();
    }
    removeCoupon();
    navigate('checkout-success');
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        currentPage,
        selectedProductId,
        selectedProduct,
        cart,
        directCheckoutItem,
        setDirectCheckoutItem,
        wishlist,
        savedAddresses,
        searchOpen,
        cartOpen,
        quickViewProductId,
        setQuickViewProductId,
        activeCategoryFilter,
        activeConcernFilter,
        activeSortOption,
        searchQuery,
        checkoutDetails,
        lastOrderId,
        navigate,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
        setSearchOpen,
        setCartOpen,
        setCategoryFilter,
        setConcernFilter,
        setSortOption: setActiveSortOption,
        setSearchQuery,
        submitReview,
        placeOrder,
        setProducts,
        productsLoading,
        toast,
        triggerToast,
        user,
        profile,
        authLoading,
        logout,
        refreshAuth,
        updateProfile,
        getClient,
        addAddress,
        updateAddress,
        deleteAddress,
        setPrimaryAddress,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        shopCategories,
        shopConcerns,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};
