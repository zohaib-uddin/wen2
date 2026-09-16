import { NextResponse } from "next/server";
import { getRapidGatewayConfigStatus } from "../../../../src/lib/rapidgateway";

/**
 * GET /api/rapidgateway/config
 * Configuration status check karne ke liye (debugging ke liye useful)
 */
export async function GET() {
  try {
    const configStatus = getRapidGatewayConfigStatus();
    
    return NextResponse.json({
      success: true,
      configuration: configStatus,
      message: configStatus.isTestMode 
        ? "Running in TEST/SANDBOX mode. No real money will be charged."
        : "Running in LIVE mode. Real transactions will occur.",
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('[RapidGateway Config] Error getting config:', error.message);
    
    return NextResponse.json(
      { error: error.message || "Failed to get configuration" },
      { status: 500 }
    );
  }
}
