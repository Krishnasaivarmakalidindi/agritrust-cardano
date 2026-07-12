import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[AgriTrust] Supabase env vars missing – app cannot connect to database.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
