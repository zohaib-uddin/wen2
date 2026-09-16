import { z } from "zod";

/**
 * RapidGateway Payment Schemas
 * Ye schemas RapidGateway API ke liye validation provide karte hain
 */

// Checkout session create karne ke liye schema
export const RapidGatewayCheckoutSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  amount: z.number().min(1, "Amount must be at least 1 PKR"),
  currency: z.string().default("PKR"),
  basketId: z.string().max(64, "Basket ID max 64 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerMobile: z.string().regex(/^03[0-9]{9}$/, "Pakistani mobile number required (03XXXXXXXXX)"),
  customerName: z.string().min(2, "Customer name required").optional(),
  checkoutUrl: z.string().url().optional(),
  successUrl: z.string().url("Valid success URL required"),
  failureUrl: z.string().url("Valid failure URL required"),
});

// Payment method selection schema
export const PaymentMethodSchema = z.enum([
  "COD",                    // Cash on Delivery
  "CARD",                   // Credit/Debit Card (Visa, Mastercard)
  "EASYPAISA",              // EasyPaisa Wallet
  "JAZZCASH",               // JazzCash Wallet
  "BANK_TRANSFER",          // Bank Transfer (Al Habib, etc.)
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Order payment details schema (database ke liye)
export const OrderPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: PaymentMethodSchema,
  paymentStatus: z.enum([
    "pending",      // Payment initiated but not completed
    "processing",   // Payment in progress (e.g., awaiting wallet approval)
    "paid",         // Payment successful
    "failed",       // Payment failed
    "refunded",     // Payment refunded
  ]).default("pending"),
  transactionId: z.string().optional(),        // RapidGateway transaction reference
  gatewayTxnRef: z.string().optional(),        // Gateway transaction reference
  basketId: z.string().optional(),             // Order reference sent to gateway
  amount: z.number().min(0),
  currency: z.string().default("PKR"),
  environment: z.enum(["TEST", "LIVE"]).default("TEST"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Webhook event schema
export const RapidGatewayWebhookSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  source: z.string(),
  merchantId: z.number(),
  gatewayTxnRef: z.string(),
  merchantTransactionId: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  environment: z.enum(["TEST", "LIVE"]),
  occurredAt: z.string().datetime(),
});

// Refund request schema
export const RefundRequestSchema = z.object({
  merchantId: z.string(),
  basketId: z.string(),
  amount: z.number().min(1).optional(),  // Optional for full refund
  reasonCode: z.string(),
  reasonNote: z.string().optional(),
});
