import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, type NextResponse } from 'next/server';

export function createApiClient(request: NextRequest, response: NextResponse) {
  console.log('🔍 [api-client] Creating Supabase API client');
  console.log(`🔍 [api-client] Using URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            path: options.path ?? '/',
            domain: options.domain,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: options.path ?? '/',
            domain: options.domain,
            maxAge: 0,
          });
        },
      },
    }
  );
}

export async function getCurrentUser(request: NextRequest, response: NextResponse) {
  console.log('🔍 [api-client] Getting current user');
  const supabase = createApiClient(request, response);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error(`❌ [api-client] Error getting user: ${error.message}`);
    return null;
  }

  if (!user) {
    console.log('🔍 [api-client] No user found in session');
    return null;
  }

  console.log(`✅ [api-client] Found user: ${user.id}`);
  return user;
}

export async function getIntegration(
  request: NextRequest,
  response: NextResponse,
  userId: string,
  provider: string
) {
  console.log(`🔍 [api-client] Getting integration - userId: ${userId}, provider: ${provider}`);
  const supabase = createApiClient(request, response);
  
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .select()
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      console.error(`❌ [api-client] Error retrieving integration: ${error.message}, code: ${error.code}`);
      
      // Log debugging info to see what we're querying for
      console.log(`🔍 [api-client] Debug - Query parameters: userId=${userId}, provider=${provider}`);
      
      // Check if the table exists
      const { data: tableExists, error: tableError } = await supabase
        .from('integrations')
        .select('id')
        .limit(1);
        
      if (tableError) {
        console.error(`❌ [api-client] Table check error: ${tableError.message}`);
      } else {
        console.log(`🔍 [api-client] Table exists check: ${tableExists !== null}`);
      }
      
      return null;
    }

    if (!integration) {
      console.log(`🔍 [api-client] No integration found for userId: ${userId}, provider: ${provider}`);
      return null;
    }

    console.log(`✅ [api-client] Found integration: ${integration.id}`);
    return integration;
  } catch (e) {
    console.error(`❌ [api-client] Unexpected error getting integration: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return null;
  }
}

export async function updateIntegration(
  request: NextRequest,
  response: NextResponse,
  integrationId: string,
  updates: Record<string, any>
) {
  console.log(`🔍 [api-client] Updating integration: ${integrationId}`);
  console.log(`🔍 [api-client] Update fields: ${Object.keys(updates).join(', ')}`);
  
  const supabase = createApiClient(request, response);
  
  try {
    const { data: integration, error } = await supabase
      .from('integrations')
      .update(updates)
      .eq('id', integrationId)
      .select()
      .single();

    if (error) {
      console.error(`❌ [api-client] Error updating integration: ${error.message}, code: ${error.code}`);
      throw error;
    }

    console.log(`✅ [api-client] Integration updated successfully: ${integrationId}`);
    return integration;
  } catch (e) {
    console.error(`❌ [api-client] Unexpected error updating integration: ${e instanceof Error ? e.message : 'Unknown error'}`);
    throw e;
  }
} 