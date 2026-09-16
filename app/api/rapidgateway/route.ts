import { NextRequest, NextResponse } from "next/server";
import { rapidGatewayClient, getRapidGatewayConfigStatus } from "../../../src/lib/rapidgateway";

/**
 * RapidGateway Payment API Routes - Phase 2 Implementation
 * 
 * Ye API routes checkout process ko handle karte hain:
 * - POST /api/rapidgateway/initiate: Payment initiate karna
 * - GET /api/rapidgateway/status: Payment status check karna
 * - GET /api/rapidgateway/config: Configuration status check karna
 * 
 * IMPORTANT: Abhi TEST mode mein hai. Webhook integration Phase 4 mein hoga.
 */

// POST /api/rapidgateway/initiate
// Payment transaction initiate karne ke liye
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Required fields validate karna
    const { amount, basketId, customerEmail, customerMobile, customerName, successUrl, failureUrl, checkoutUrl, description } = body;
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be greater than 0." },
        { status: 400 }
      );
    }
    
    if (!basketId || typeof basketId !== 'string') {
      return NextResponse.json(
        { error: "Basket ID (order reference) is required." },
        { status: 400 }
      );
    }
    
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { error: "Valid customer email is required." },
        { status: 400 }
      );
    }
    
    // Pakistani mobile number validation
    const cleanPhone = customerMobile?.replace(/[-\s/()]/g, '') || '';
    if (!/^03[0-9]{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Valid Pakistani mobile number required (03XXXXXXXXX)." },
        { status: 400 }
      );
    }
    
    if (!successUrl || !failureUrl) {
      return NextResponse.json(
        { error: "Success and Failure URLs are required." },
        { status: 400 }
      );
    }
    
    console.log('[RapidGateway API] Initiating payment:', {
      amount,
      basketId,
      customerEmail,
      environment: process.env.RAPIDGATEWAY_ENVIRONMENT || 'TEST'
    });
    
    // RapidGateway client se transaction process karna
    const result = await rapidGatewayClient.processTransaction({
      amount,
      basketId,
      customerEmail,
      customerMobile: cleanPhone,
      customerName,
      successUrl,
      failureUrl,
      checkoutUrl,
      description: description || `Order ${basketId}`,
    });
    
    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      basketId: result.basketId,
      amount: result.amount,
      environment: result.environment,
      message: "Payment initiated successfully. Redirect customer to checkout URL.",
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[RapidGateway API] Error initiating payment:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to initiate payment",
        details: "Payment gateway error occurred"
      },
      { status: 500 }
    );
  }
}

// GET /api/rapidgateway/status
// Payment status verify karne ke liye (server-side verification)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const basketId = searchParams.get('basketId');
    
    if (!basketId) {
      return NextResponse.json(
        { error: "Basket ID (order reference) is required." },
        { status: 400 }
      );
    }
    
    console.log('[RapidGateway API] Verifying payment for basket:', basketId);
    
    // Payment status verify karna
    const result = await rapidGatewayClient.verifyPayment(basketId);
    
    return NextResponse.json({
      success: true,
      basketId,
      status: result.status,
      transactionId: result.transactionId,
      amount: result.amount,
      currency: result.currency,
      message: "Payment status retrieved successfully",
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[RapidGateway API] Error verifying payment:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to verify payment",
        status: "UNKNOWN"
      },
      { status: 500 }
    );
  }
}
