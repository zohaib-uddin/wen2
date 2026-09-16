import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/rapidgateway/webhook
 * RapidGateway se payment webhooks receive karne ke liye
 * 
 * IMPORTANT: Ye endpoint Phase 4 mein properly implement hoga.
 * Abhi ye sirf placeholder hai testing ke liye.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-rapidgateway-signature');
    const timestamp = req.headers.get('x-rapidgateway-timestamp');
    const eventType = req.headers.get('x-rapidgateway-event');
    
    console.log('[RapidGateway Webhook] Received webhook:', {
      eventType,
      timestamp,
      hasSignature: !!signature,
    });
    
    // Signature verification Phase 4 mein implement hoga
    // Abhi ke liye hum sirf log karenge aur acknowledge karenge
    
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }
    
    // Webhook event ko process karna
    const { eventType, merchantTransactionId, status, amount, gatewayTxnRef } = payload;
    
    console.log('[RapidGateway Webhook] Processing event:', {
      type: eventType,
      basketId: merchantTransactionId,
      status,
      amount,
      gatewayTxnRef,
    });
    
    // Event types handle karna
    switch (eventType) {
      case 'transaction.completed':
        console.log('[RapidGateway Webhook] Payment SUCCESS:', merchantTransactionId);
        // Order ko 'paid' mark karna (Phase 4 mein implement hoga)
        break;
        
      case 'transaction.failed':
        console.log('[RapidGateway Webhook] Payment FAILED:', merchantTransactionId);
        // Order ko 'failed' mark karna (Phase 4 mein implement hoga)
        break;
        
      case 'refund.succeeded':
        console.log('[RapidGateway Webhook] Refund SUCCESS:', merchantTransactionId);
        break;
        
      default:
        console.log('[RapidGateway Webhook] Unhandled event type:', eventType);
    }
    
    // Webhook successfully receive ho gaya
    return NextResponse.json({
      success: true,
      received: true,
      eventId: payload.eventId,
      message: "Webhook acknowledged",
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[RapidGateway Webhook] Error processing webhook:', error.message);
    
    // Error bhi acknowledge karna taake RapidGateway retry na kare
    return NextResponse.json(
      { 
        error: error.message || "Webhook processing failed",
        acknowledged: true 
      },
      { status: 200 }
    );
  }
}

// GET request ke liye simple response
export async function GET() {
  return NextResponse.json({
    message: "RapidGateway Webhook Endpoint Active",
    documentation: "POST webhook events to this URL",
  }, { status: 200 });
}
