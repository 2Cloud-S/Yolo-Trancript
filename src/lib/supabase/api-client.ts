import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, type NextResponse } from 'next/server';

export function createApiClient(request: NextRequest, response: NextResponse) {
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
  const supabase = createApiClient(request, response);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getIntegration(
  request: NextRequest,
  response: NextResponse,
  userId: string,
  provider: string
) {
  const supabase = createApiClient(request, response);
  const { data: integration, error } = await supabase
    .from('integrations')
    .select()
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !integration) {
    return null;
  }

  return integration;
}

export async function updateIntegration(
  request: NextRequest,
  response: NextResponse,
  integrationId: string,
  updates: Record<string, any>
) {
  const supabase = createApiClient(request, response);
  const { data: integration, error } = await supabase
    .from('integrations')
    .update(updates)
    .eq('id', integrationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return integration;
} 