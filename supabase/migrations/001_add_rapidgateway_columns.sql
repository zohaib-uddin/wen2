-- ==========================================
-- PHASE 3: RapidGateway Payment Integration - Database Migration
-- ==========================================
-- This migration adds RapidGateway payment tracking columns to the orders table
-- Run this in Supabase SQL Editor or via CLI

-- Add RapidGateway payment integration columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rapidgateway_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS rapidgateway_basket_id TEXT,
ADD COLUMN IF NOT EXISTS rapidgateway_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway_response JSONB;

-- Add check constraints for payment method and status
DO $$
BEGIN
  -- Add payment_method check constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_method' AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT check_payment_method 
    CHECK (payment_method IN ('cod', 'rapidgateway'));
  END IF;

  -- Add payment_status check constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_status' AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('unpaid', 'paid', 'pending', 'failed', 'refunded'));
  END IF;
END
$$;

-- Create index on rapidgateway_basket_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_rapidgateway_basket_id 
ON public.orders(rapidgateway_basket_id);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders(payment_status);

-- Create index on payment_method_type for analytics
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_type 
ON public.orders(payment_method_type);

-- Add comment to document the new columns
COMMENT ON COLUMN public.orders.rapidgateway_transaction_id IS 'RapidGateway transaction reference ID (RG-xxxx)';
COMMENT ON COLUMN public.orders.rapidgateway_basket_id IS 'Merchant basket/order ID sent to RapidGateway';
COMMENT ON COLUMN public.orders.rapidgateway_session_id IS 'RapidGateway checkout session ID for embedded checkout';
COMMENT ON COLUMN public.orders.payment_method_type IS 'Payment method type: CARD, EASYPAISA, JAZZCASH, BANK_TRANSFER, RAAST';
COMMENT ON COLUMN public.orders.payment_gateway_response IS 'Full JSON response from RapidGateway API';
