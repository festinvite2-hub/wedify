import { createBrowserClient } from '@supabase/ssr';

let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL;
  const key = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

export { getSupabase };
