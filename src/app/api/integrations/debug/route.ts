import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [debug] Starting database schema check');
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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

    console.log('🔍 [debug] Checking current user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error(`❌ [debug] User error: ${userError.message}`);
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ [debug] No authenticated user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log(`✅ [debug] Found user: ${user.id}`);

    // Check integrations table schema
    console.log('🔍 [debug] Checking integrations table schema');
    const { data: integrationsSchema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'integrations')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.error(`❌ [debug] Schema error: ${schemaError.message}`);
      return NextResponse.json({ error: schemaError.message }, { status: 500 });
    }

    // Check for any existing integrations
    console.log('🔍 [debug] Checking existing integrations');
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('id, provider, user_id, status')
      .eq('user_id', user.id);

    if (integrationsError) {
      console.error(`❌ [debug] Integrations error: ${integrationsError.message}`);
    }

    // Check RLS policies
    console.log('🔍 [debug] Checking RLS policies');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_policies_info', { table_name: 'integrations' });
    
    // Try with service role to bypass RLS if it exists
    let adminIntegrations = null;
    let adminError = null;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('🔍 [debug] Testing with service role to bypass RLS');
      try {
        const serviceRoleClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
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
        
        const result = await serviceRoleClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id);
          
        adminIntegrations = result.data;
        adminError = result.error;
        
        if (adminError) {
          console.error(`❌ [debug] Admin query error: ${adminError.message}`);
        } else {
          console.log(`✅ [debug] Admin query found ${adminIntegrations?.length || 0} integrations`);
        }
      } catch (e) {
        console.error(`❌ [debug] Error using service role: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      console.log('❌ [debug] No service role key available for RLS bypass test');
    }

    // Try direct integration request
    console.log('🔍 [debug] Trying direct integration request for google_drive');
    const { data: googleDriveIntegration, error: googleDriveError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_drive')
      .single();

    if (googleDriveError) {
      console.log(`🔍 [debug] Google Drive integration error: ${googleDriveError.message}`);
    } else if (googleDriveIntegration) {
      console.log(`✅ [debug] Found Google Drive integration: ${googleDriveIntegration.id}`);
    } else {
      console.log('🔍 [debug] No Google Drive integration found');
    }

    // Insert test integration record
    console.log('🔍 [debug] Testing integration insertion');
    const integrationId = `test-integration-${user.id}`;
    const { data: insertResult, error: insertError } = await supabase
      .from('integrations')
      .upsert({
        id: integrationId,
        user_id: user.id,
        provider: 'test_provider',
        status: 'disconnected',
        settings: {
          oauth_state: 'test-state',
          auto_save: true,
          test_field: 'test-value'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [debug] Insert error: ${insertError.message}`);
    } else {
      console.log(`✅ [debug] Test integration inserted successfully`);
    }

    // Return all diagnostic info
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      schema: {
        integrations: integrationsSchema,
        error: schemaError ? (schemaError as any).message || String(schemaError) : null
      },
      rlsPolicies: {
        policies: rlsPolicies,
        error: rlsError ? (rlsError as any).message || String(rlsError) : null
      },
      adminQuery: process.env.SUPABASE_SERVICE_ROLE_KEY ? {
        integrations: adminIntegrations,
        error: adminError ? (adminError as any).message || String(adminError) : null
      } : "No service role key available",
      existingIntegrations: {
        integrations,
        error: integrationsError ? (integrationsError as any).message || String(integrationsError) : null
      },
      googleDriveIntegration: {
        exists: !!googleDriveIntegration,
        data: googleDriveIntegration,
        error: googleDriveError ? (googleDriveError as any).message || String(googleDriveError) : null
      },
      testInsertion: {
        success: !!insertResult,
        data: insertResult,
        error: insertError ? (insertError as any).message || String(insertError) : null
      }
    });
  } catch (error) {
    console.error('❌ [debug] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 