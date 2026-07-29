-- ==========================================
-- WEN HAIR & SKIN SECRET - SUPABASE DATABASE SCHEMA
-- ==========================================
-- This single comprehensive script sets up the PostgreSQL schema, 
-- default values, automatic triggers, helper routines, and secure 
-- Row Level Security (RLS) policies for "Wen Hair & Skin Secret".

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. UTILITY FUNCTIONS & TRIGGER DEFINITIONS
-- ==========================================

-- Automatic updated_at timestamp function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. TABLE CREATIONS
-- ==========================================

-- 1. profiles (Synced with Clerk)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  role TEXT DEFAULT 'customer' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_role_validity CHECK (role IN ('customer', 'admin'))
);

-- 2. categories view
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. products formulation catalogue
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2),
  compare_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  category_id UUID REFERENCES public.categories ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  is_bestseller BOOLEAN DEFAULT false NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0) NOT NULL,
  reviews_count INTEGER DEFAULT 0 NOT NULL,
  ingredients TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  how_to_use TEXT,
  benefits TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  has_variants BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_positive_price CHECK (price >= 0.0)
);

-- 3.5 product_variants holding multi-size options
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_positive_variant_price CHECK (price >= 0.0),
  CONSTRAINT check_positive_variant_stock CHECK (stock_quantity >= 0)
);

-- 4. cart_items holding active user items before orders
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_positive_quantity CHECK (quantity > 0),
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);

-- 5. orders log
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  shipping_name TEXT,
  shipping_phone TEXT,
  postal_code TEXT,
  special_instructions TEXT,
  payment_method TEXT DEFAULT 'cod' NOT NULL,
  payment_status TEXT DEFAULT 'unpaid',
  coupon_code TEXT,
  discount_percentage INTEGER,
  tracking_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_order_status_valid CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT check_positive_total CHECK (total_amount >= 0.0)
);

-- 6. order_items detail specifications per transaction
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name TEXT,
  product_image TEXT,
  category TEXT,
  concern TEXT,
  variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_order_item_quantity CHECK (quantity > 0),
  CONSTRAINT check_order_item_price CHECK (price >= 0.0)
);

-- 7. messages (Contact Inquiries Feed)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  replied BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. reviews submitted by registered Customers
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  video_url TEXT,
  before_image TEXT,
  after_image TEXT,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT check_review_rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- 9. coupons (Botanical Vouchers Registry)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. UPDATED_AT AUTO TRIGGERS SETUPS
-- ==========================================

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) HELPER ROUTINES
-- ==========================================

-- Helper function to safely check if current session user is an admin
-- SECURITY DEFINER makes it run with creator's permissions to avoid direct recursive select policies on profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. RLS POLICIES FOR TABLES
-- ==========================================

-- Enable Row Level Security on all active tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------
CREATE POLICY "Enable read check for owners and admins" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Enable self-registration & admin registry" 
ON public.profiles FOR INSERT 
TO authenticated, anon, service_role
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Enable update for owners and admins" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Enable delete for admins only" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- ------------------------------------------
-- B. CATEGORIES POLICIES
-- ------------------------------------------
CREATE POLICY "Public can view any category" 
ON public.categories FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can manage categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------
-- C. PRODUCTS POLICIES
-- ------------------------------------------
CREATE POLICY "Public can examine active products" 
ON public.products FOR SELECT 
TO authenticated, anon
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can manage products" 
ON public.products FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------
-- C.5 PRODUCT VARIANTS POLICIES
-- ------------------------------------------
CREATE POLICY "Public can examine active variants" 
ON public.product_variants FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can manage variants" 
ON public.product_variants FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------
-- D. CART ITEMS POLICIES
-- ------------------------------------------
CREATE POLICY "Users can access their own cart items" 
ON public.cart_items FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Insert must match user_id
CREATE POLICY "Users can append item to their own cart" 
ON public.cart_items FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their own cart quantity" 
ON public.cart_items FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- ------------------------------------------
-- E. ORDERS POLICIES
-- ------------------------------------------
CREATE POLICY "Users can read their own orders" 
ON public.orders FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can initiate transactions" 
ON public.orders FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can alter order statuses or remove" 
ON public.orders FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------
-- F. ORDER ITEMS POLICIES
-- ------------------------------------------
CREATE POLICY "Users can read their own order items" 
ON public.order_items FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.user_id = auth.uid()
  ) 
  OR public.is_admin()
);

CREATE POLICY "Users can fill transaction elements on order creation" 
ON public.order_items FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = public.order_items.order_id 
    AND public.orders.user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can modify transaction items details" 
ON public.order_items FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------
-- G. MESSAGES (CONTACT) POLICIES
-- ------------------------------------------
-- Allow public to deposit inquiries
CREATE POLICY "Inquirers can deposit support messages" 
ON public.messages FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Only admins can inspect/reply
CREATE POLICY "Only admins can scan and read incoming messages" 
ON public.messages FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can update incoming messages" 
ON public.messages FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete messages" 
ON public.messages FOR DELETE 
TO authenticated
USING (public.is_admin());

-- ------------------------------------------
-- H. REVIEWS POLICIES
-- ------------------------------------------
-- Public read approved, owners read own anytime, admins read all
CREATE POLICY "Read approved reviews, owners can view regardless" 
ON public.reviews FOR SELECT 
TO authenticated, anon
USING (is_approved = true OR user_id = auth.uid() OR public.is_admin());

-- Authenticated can insert their own
CREATE POLICY "Customers can draft reviews for themselves" 
ON public.reviews FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Owner or admin update/remove reviews
CREATE POLICY "Owners can rewrite reviews and admins manage layout" 
ON public.reviews FOR UPDATE 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners can retract draft or admins purge reviews" 
ON public.reviews FOR DELETE 
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------
-- I. COUPONS POLICIES
-- ------------------------------------------
-- Allow public & anonymous sessions to verify active coupons at checkout
CREATE POLICY "Enable public verification of active coupons" 
ON public.coupons FOR SELECT 
TO authenticated, anon
USING (is_active = true);

-- Enable full coupon administration for administrative accounts
CREATE POLICY "Enable administrative management of coupons" 
ON public.coupons FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- 6. PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

