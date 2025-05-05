import { NextRequest, NextResponse } from 'next/server';

// Simple diagnostic endpoint for webhook testing
export async function POST(req: NextRequest) {
  console.log('🔍 DIAGNOSTIC: Webhook diagnostic endpoint hit:', new Date().toISOString());
  
  try {
    // Log request information for debugging
    const headers = Object.fromEntries(req.headers.entries());
    console.log('🔍 DIAGNOSTIC: Request headers:', JSON.stringify(headers));
    console.log('🔍 DIAGNOSTIC: Request URL:', req.url);
    console.log('🔍 DIAGNOSTIC: Request method:', req.method);
    
    // Get the raw request body
    const rawBody = await req.text();
    console.log('🔍 DIAGNOSTIC: Raw body length:', rawBody.length);
    console.log('🔍 DIAGNOSTIC: Raw body preview:', rawBody.substring(0, 500) + (rawBody.length > 500 ? '...' : ''));
    
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('🔍 DIAGNOSTIC: JSON parsed successfully');
    } catch (e) {
      console.error('❌ DIAGNOSTIC: Error parsing JSON body:', e);
      parsedBody = { error: 'Invalid JSON' };
    }
    
    // Return all the diagnostic information
    return NextResponse.json({
      message: 'Webhook diagnostic endpoint',
      timestamp: new Date().toISOString(),
      headers: headers,
      url: req.url,
      method: req.method,
      bodyPreview: rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : ''),
      parsedBody: parsedBody
    });
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Error in diagnostic endpoint:', error);
    return NextResponse.json({ 
      error: 'Diagnostic endpoint error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also handle GET requests for easier testing in browser
export async function GET(req: NextRequest) {
  console.log('🔍 DIAGNOSTIC: Webhook diagnostic GET endpoint hit:', new Date().toISOString());
  
  return NextResponse.json({
    message: 'Webhook diagnostic endpoint (GET)',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    info: 'This endpoint is for testing webhook connectivity. POST to this endpoint to see payload details.'
  });
} 