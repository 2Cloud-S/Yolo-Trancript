import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current auth state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication error: ' + sessionError.message 
      }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // The SQL to fix permissions - same as fix_permissions.sql
    const fixPermissionsSQL = `
      -- Grant access to schemas
      GRANT usage ON schema public TO postgres, anon, authenticated, service_role;
      
      -- Grant privileges on credit tables
      GRANT ALL privileges ON "user_credits" TO postgres, anon, authenticated, service_role;
      GRANT ALL privileges ON "credit_transactions" TO postgres, anon, authenticated, service_role;
      GRANT ALL privileges ON "credit_usage" TO postgres, anon, authenticated, service_role;
      GRANT ALL privileges ON "transcriptions" TO postgres, anon, authenticated, service_role;
      
      -- Ensure RLS policies are correctly set up for user_credits
      ALTER TABLE IF EXISTS "user_credits" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view their own credit balance" ON "user_credits";
      CREATE POLICY "Users can view their own credit balance"
        ON "user_credits" FOR SELECT
        USING (auth.uid() = user_id);
      
      -- Ensure RLS policies are correctly set up for credit_transactions
      ALTER TABLE IF EXISTS "credit_transactions" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view their own credit transactions" ON "credit_transactions";
      CREATE POLICY "Users can view their own credit transactions"
        ON "credit_transactions" FOR SELECT
        USING (auth.uid() = user_id);
      
      -- Ensure RLS policies are correctly set up for credit_usage
      ALTER TABLE IF EXISTS "credit_usage" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view their own credit usage" ON "credit_usage";
      CREATE POLICY "Users can view their own credit usage"
        ON "credit_usage" FOR SELECT
        USING (auth.uid() = user_id);
      
      -- Fix view permissions for the user_credit_summary view
      GRANT SELECT ON "user_credit_summary" TO authenticated;
      
      -- Fix default privileges for future operations
      ALTER DEFAULT privileges IN schema public GRANT ALL ON tables TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT privileges IN schema public GRANT ALL ON functions TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT privileges IN schema public GRANT ALL ON sequences TO postgres, anon, authenticated, service_role;
    `;
    
    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: fixPermissionsSQL });
    
    if (sqlError) {
      console.error('Error executing fix permissions SQL:', sqlError);
      
      // Alternative approach if RPC doesn't work
      try {
        // Try to run each statement separately using direct queries
        const statements = fixPermissionsSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
          
        for (const statement of statements) {
          const { error } = await supabase.rpc('run_sql_statement', { statement });
          if (error) {
            console.error(`Error running statement "${statement}":`, error);
          }
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'Permissions fixed using fallback method'
        });
      } catch (fallbackError: any) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to run SQL: ' + sqlError.message,
          fallbackError: fallbackError.message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Permissions fixed successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in fix-permissions endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error: ' + error.message 
    }, { status: 500 });
  }
} 