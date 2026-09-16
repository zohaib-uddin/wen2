import { NextRequest, NextResponse } from 'next/server';
import { getRapidGatewayToken } from '@/lib/rapidgateway';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, basketId, customerEmail, customerMobile, paymentMethod } = body;

    console.log('[Initiate API] Received request:', { amount, basketId, customerEmail, customerMobile, paymentMethod });

    if (!amount || !basketId || !customerEmail || !customerMobile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Get Access Token
    console.log('[Initiate API] Getting access token...');
    const accessToken = await getRapidGatewayToken();
    console.log('[Initiate API] Token obtained:', accessToken ? 'Yes' : 'No');

    // Step 2: Create Transaction for Hosted Checkout (Redirect Flow)
    const formData = new URLSearchParams();
    formData.append('MERCHANT_ID', process.env.RAPIDGATEWAY_MERCHANT_ID || 'client');
    formData.append('MERCHANT_NAME', 'Wen Hair & Skin Secret');
    formData.append('TXNAMT', amount.toString());
    formData.append('CURRENCY_CODE', 'PKR');
    formData.append('CUSTOMER_MOBILE_NO', customerMobile);
    formData.append('CUSTOMER_EMAIL_ADDRESS', customerEmail);
    formData.append('BASKET_ID', basketId);
    formData.append('TXNDESC', `Order ${basketId} via ${paymentMethod || 'Online'}`);
    formData.append('ORDER_DATE', new Date().toISOString().split('T')[0]);

    // Dynamic Success/Failure URLs based on your domain
    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    formData.append('SUCCESS_URL', `${baseUrl}/order-success?order_id=${basketId}&status=success`);
    formData.append('FAILURE_URL', `${baseUrl}/checkout?order_id=${basketId}&status=failed`);
    formData.append('CHECKOUT_URL', `${baseUrl}/checkout`);
    formData.append('VERSION', 'MY_VER_1.0');
    formData.append('PROCCODE', '0');

    const apiUrl = process.env.RAPIDGATEWAY_ENVIRONMENT === 'LIVE'
      ? 'https://secure.rapid-gateway.com/rapid/process-transaction'
      : 'https://secure.rapid-gateway.com/sandbox/process-transaction';

    console.log('[Initiate API] Calling RapidGateway API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      redirect: 'manual', // Important: Redirect ko follow mat karo, URL capture karo
    });

    console.log('[Initiate API] Response status:', response.status);
    console.log('[Initiate API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Initiate API] RapidGateway API Error:', errorText);
      throw new Error(`Payment initiation failed: ${response.status} - ${errorText}`);
    }

    // The API returns a redirect URL in the Location header
    const redirectUrl = response.headers.get('Location') || response.headers.get('location');

    console.log('[Initiate API] Redirect URL:', redirectUrl);

    if (!redirectUrl) {
      // Try to parse from body if not in header
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.redirectUrl || data.checkoutUrl) {
            return NextResponse.json({ success: true, redirectUrl: data.redirectUrl || data.checkoutUrl });
          }
        }
      } catch (e) {
        console.log('[Initiate API] No JSON in response body');
      }
      throw new Error('No redirect URL received from payment gateway');
    }

    return NextResponse.json({ success: true, redirectUrl });

  } catch (error: any) {
    console.error('[Initiate API] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
