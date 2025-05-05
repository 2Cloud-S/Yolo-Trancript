import { NextRequest } from 'next/server';
import { POST, OPTIONS } from './webhook/route';
 
// Re-export the handlers from the webhook/route.ts file
// This ensures both /api/webhook and /api/webhook/ work identically
export { POST, OPTIONS }; 