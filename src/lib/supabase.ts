/**
 * Supabase Client Singleton
 *
 * Initializes and exports a single Supabase client instance.
 * Uses environment variables for configuration.
 * @see https://supabase.com/docs/reference/javascript/initializing
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
