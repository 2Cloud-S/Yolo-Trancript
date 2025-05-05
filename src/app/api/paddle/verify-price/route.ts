import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to verify if a Paddle price ID exists and is properly configured
 * This is useful for debugging checkout issues and testing environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get('priceId');
    
    if (!priceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing priceId parameter'
      }, { status: 400 });
    }

    // Check if the price ID exists in environment variables
    const padlleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
    const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    
    // Map price IDs to their environment variable names
    const priceVariableMap: Record<string, string> = {
      [process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || '']: 'NEXT_PUBLIC_PADDLE_PRICE_STARTER',
      [process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '']: 'NEXT_PUBLIC_PADDLE_PRICE_PRO',
      [process.env.NEXT_PUBLIC_PADDLE_PRICE_CREATOR || '']: 'NEXT_PUBLIC_PADDLE_PRICE_CREATOR',
      [process.env.NEXT_PUBLIC_PADDLE_PRICE_POWER || '']: 'NEXT_PUBLIC_PADDLE_PRICE_POWER',
    };
    
    const variableName = priceVariableMap[priceId] || 'Not found in environment variables';
    const isPriceValid = Object.keys(priceVariableMap).includes(priceId);
    
    return NextResponse.json({
      success: true,
      data: {
        priceId,
        isPriceValid,
        environment: padlleEnvironment,
        clientTokenExists: !!paddleClientToken,
        variableName,
        isFormatValid: priceId.startsWith('pri_'),
      }
    });
  } catch (error: any) {
    console.error('[verify-price] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 