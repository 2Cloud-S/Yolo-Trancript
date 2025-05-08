import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [supabase-rls] Starting RLS policy check');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Check current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        details: userError?.message || 'No user found' 
      }, { status: 401 });
    }
    
    // Get current auth JWT claims
    const { data: authData } = await supabase.rpc('who_am_i');
    
    // Check if RLS is enabled on the integrations table
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_enabled', {
      table_name: 'integrations'
    });
    
    // Get role permissions
    const { data: userRole } = await supabase.auth.getSession();
    
    // Try getting integrations with current user
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id);
      
    // Try using service role (if available)
    let adminResults = null;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get() { return null; }, set() {}, remove() {} } }
      );
      
      const { data, error } = await adminClient
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);
        
      adminResults = { data, error: error?.message };
    }
    
    // Create test integration to check write permissions
    const testId = `test-rls-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('integrations')
      .insert({
        id: testId,
        user_id: user.id,
        provider: 'test_provider',
        status: 'disconnected',
        settings: { test: true }
      })
      .select()
      .single();
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      jwt: authData,
      session: userRole,
      rls: {
        isEnabled: rlsCheck,
        error: rlsError?.message
      },
      normal_access: {
        integrations: integrations,
        error: integrationsError?.message
      },
      admin_access: adminResults,
      write_test: {
        success: !!insertData,
        data: insertData,
        error: insertError?.message
      },
      instructions: `
        If you're seeing errors with normal_access but admin_access works, 
        you likely have an RLS policy issue.
        
        To fix RLS for integrations table, add this policy in the Supabase Dashboard:
        
        CREATE POLICY "Users can manage their own integrations" 
        ON integrations
        FOR ALL 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `
    });
  } catch (error) {
    console.error('Error testing RLS:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 