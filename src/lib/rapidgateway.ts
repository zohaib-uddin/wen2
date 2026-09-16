/**
 * RapidGateway API Client - Phase 1 Implementation
 * 
 * Ye library RapidGateway ke saath communicate karti hai:
 * - Access token obtain karna (OAuth2)
 * - Checkout sessions create karna
 * - Payment status verify karna
 * - Sandbox testing support
 * 
 * IMPORTANT: Abhi TEST mode mein hai. Jab Merchant ID milegi, tab .env update karna.
 */

interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope?: string[];
}

interface CheckoutSessionRequest {
  merchantId: string | number;
  amount: number;
  currency: string;
  basketId: string;
  customerEmail: string;
  customerMobile: string;
  customerName?: string;
  checkoutUrl?: string;
  successUrl?: string;
  failureUrl?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
  redirectUrl?: string;
}

interface TransactionRequest {
  MERCHANT_ID: string;
  MERCHANT_NAME: string;
  TXNAMT: string;
  CURRENCY_CODE: string;
  CUSTOMER_MOBILE_NO: string;
  CUSTOMER_EMAIL_ADDRESS: string;
  BASKET_ID: string;
  TXNDESC?: string;
  ORDER_DATE: string;
  SUCCESS_URL: string;
  FAILURE_URL: string;
  CHECKOUT_URL?: string;
  VERSION: string;
  PROCCODE?: string;
}

interface TransactionResponse {
  redirectUrl: string;
  basketId: string;
  amount: number;
  environment: "TEST" | "LIVE";
}

class RapidGatewayClient {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private tokenEndpoint: string;
  private environment: "TEST" | "LIVE";
  private merchantId?: string;
  private merchantName: string;

  constructor() {
    // Environment variables se configuration load karna
    this.clientId = process.env.RAPIDGATEWAY_CLIENT_ID || "client";
    this.clientSecret = process.env.RAPIDGATEWAY_CLIENT_SECRET || "secret";
    this.apiUrl = process.env.RAPIDGATEWAY_API_URL || "https://secure.rapid-gateway.com";
    this.tokenEndpoint = process.env.RAPIDGATEWAY_TOKEN_ENDPOINT || "https://secure.rapid-gateway.com/oauth2/token";
    this.environment = (process.env.RAPIDGATEWAY_ENVIRONMENT as "TEST" | "LIVE") || "TEST";
    this.merchantId = process.env.RAPIDGATEWAY_MERCHANT_ID || undefined;
    this.merchantName = process.env.RAPIDGATEWAY_MERCHANT_NAME || "Wen Hair & Skin Secret";

    console.log(`[RapidGateway] Initialized in ${this.environment} mode`);
  }

  /**
   * Step 1: OAuth2 Access Token obtain karna
   * Ye token har API request ke liye chahiye hota hai
   */
  async getAccessToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RapidGateway] Token request failed:', errorText);
        throw new Error(`Failed to obtain access token: ${response.status} ${errorText}`);
      }

      const data: TokenResponse = await response.json();
      console.log('[RapidGateway] Access token obtained successfully');
      
      return data.access_token;
    } catch (error: any) {
      console.error('[RapidGateway] Error getting access token:', error.message);
      throw error;
    }
  }

  /**
   * Step 2a: Hosted Checkout ke liye transaction process karna
   * Ye method customer ko hosted payment page par redirect karta hai
   */
  async processTransaction(request: {
    amount: number;
    basketId: string;
    customerEmail: string;
    customerMobile: string;
    customerName?: string;
    successUrl: string;
    failureUrl: string;
    checkoutUrl?: string;
    description?: string;
    paymentMethodType?: string; // 'card', 'jazzcash', 'easypaisa', 'bank'
  }): Promise<TransactionResponse> {
    try {
      // Pehle access token lena hoga
      const accessToken = await this.getAccessToken();
      
      const merchantId = this.merchantId || this.clientId;
      
      // Payment method type ko RapidGateway format mein convert karna
      // Note: RapidGateway hosted checkout page par user final method select karega
      // Ye sirf preference hint hai
      const paymentMethodHint = request.paymentMethodType || 'card';
      
      const formData = new URLSearchParams({
        MERCHANT_ID: String(merchantId),
        MERCHANT_NAME: this.merchantName,
        TXNAMT: request.amount.toFixed(2),
        CURRENCY_CODE: 'PKR',
        CUSTOMER_MOBILE_NO: request.customerMobile.replace(/[-\s/()]/g, ''),
        CUSTOMER_EMAIL_ADDRESS: request.customerEmail,
        BASKET_ID: request.basketId,
        TXNDESC: request.description || `Order ${request.basketId} - ${paymentMethodHint.toUpperCase()}`,
        ORDER_DATE: new Date().toISOString().split('T')[0],
        SUCCESS_URL: request.successUrl,
        FAILURE_URL: request.failureUrl,
        CHECKOUT_URL: request.checkoutUrl || process.env.STORE_CHECKOUT_URL || window.location.origin,
        VERSION: 'MY_VER_1.0',
        PROCCODE: '0',
      });

      // Sandbox vs Live endpoint select karna
      const endpoint = this.environment === 'TEST'
        ? `${this.apiUrl}/sandbox/process-transaction`
        : `${this.apiUrl}/rapid/process-transaction`;

      console.log('[RapidGateway] Processing transaction:', {
        endpoint,
        amount: request.amount,
        basketId: request.basketId,
        paymentMethodType: paymentMethodHint,
        environment: this.environment
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual', // Redirect URL capture karne ke liye
      });

      // Redirect URL extract karna
      let redirectUrl = response.headers.get('Location') || '';
      
      // Agar redirect URL nahi mila aur response ok hai, toh body parse karo
      if (!redirectUrl && response.ok) {
        try {
          const responseData = await response.json();
          redirectUrl = responseData.redirectUrl || responseData.checkoutUrl || '';
        } catch (e) {
          // JSON parse failed, ignore
        }
      }

      if (!redirectUrl) {
        throw new Error('No redirect URL received from RapidGateway');
      }

      console.log(`[RapidGateway] Transaction initiated, redirect URL: ${redirectUrl}`);

      return {
        redirectUrl,
        basketId: request.basketId,
        amount: request.amount,
        environment: this.environment,
      };
    } catch (error: any) {
      console.error('[RapidGateway] Error processing transaction:', error.message);
      throw error;
    }
  }

  /**
   * Step 2b: Embedded Checkout ke liye session create karna
   * Ye method iframe-based checkout ke liye hai (advanced feature)
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const sessionRequest = {
        merchantId: typeof request.merchantId === 'string' 
          ? parseInt(request.merchantId) || 0 
          : request.merchantId,
        amount: request.amount,
        currency: request.currency || 'PKR',
        basketId: request.basketId,
        customerEmail: request.customerEmail,
        customerMobile: request.customerMobile.replace(/[-\s/()]/g, ''),
        ...(request.customerName && { customerName: request.customerName }),
      };

      const response = await fetch(`${this.apiUrl}/v1/checkout-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Environment': this.environment,
        },
        body: JSON.stringify(sessionRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create checkout session: ${response.status} ${errorText}`);
      }

      const data: CheckoutSessionResponse = await response.json();
      console.log('[RapidGateway] Checkout session created successfully');

      return data;
    } catch (error: any) {
      console.error('[RapidGateway] Error creating checkout session:', error.message);
      throw error;
    }
  }

  /**
   * Payment status verify karna (server-side verification)
   * Ye method payment ki final status confirm karta hai
   */
  async verifyPayment(basketId: string): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING';
    transactionId?: string;
    amount?: number;
    currency?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Note: Ye endpoint documentation mein specify nahi hai clearly
      // Real implementation mein webhook se status receive hogi
      const response = await fetch(`${this.apiUrl}/v1/transactions/${basketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Environment': this.environment,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to verify payment: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        status: data.status || 'PENDING',
        transactionId: data.gatewayTxnRef,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error: any) {
      console.error('[RapidGateway] Error verifying payment:', error.message);
      // Fallback: Pending return karo agar verification fail hojaye
      return { status: 'PENDING' };
    }
  }

  /**
   * Configuration check karna
   * Ye method batata hai ke setup sahi hai ya nahi
   */
  getConfigStatus(): {
    isConfigured: boolean;
    isTestMode: boolean;
    hasMerchantId: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    
    if (!this.clientId || this.clientId === 'client') {
      missingFields.push('RAPIDGATEWAY_CLIENT_ID (using default test value)');
    }
    
    if (!this.clientSecret || this.clientSecret === 'secret') {
      missingFields.push('RAPIDGATEWAY_CLIENT_SECRET (using default test value)');
    }
    
    const hasMerchantId = !!this.merchantId && this.merchantId !== '';
    if (!hasMerchantId) {
      missingFields.push('RAPIDGATEWAY_MERCHANT_ID (required for LIVE mode)');
    }

    return {
      isConfigured: missingFields.length === 0 || this.environment === 'TEST',
      isTestMode: this.environment === 'TEST',
      hasMerchantId,
      missingFields,
    };
  }
}

// Singleton instance export karna
export const rapidGatewayClient = new RapidGatewayClient();

// Helper functions for easy usage
export async function getRapidGatewayToken(): Promise<string> {
  return rapidGatewayClient.getAccessToken();
}

export async function processRapidGatewayTransaction(request: {
  amount: number;
  basketId: string;
  customerEmail: string;
  customerMobile: string;
  customerName?: string;
  successUrl: string;
  failureUrl: string;
  checkoutUrl?: string;
  description?: string;
}): Promise<TransactionResponse> {
  return rapidGatewayClient.processTransaction(request);
}

export function getRapidGatewayConfigStatus() {
  return rapidGatewayClient.getConfigStatus();
}
