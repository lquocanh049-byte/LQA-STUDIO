import { createClient } from "@supabase/supabase-js";

let client;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return client;
}

export function getPublicImageUrl(path) {
  const supabase = getSupabase();
  if (!supabase || !path) return "";
  return supabase.storage.from("layouts").getPublicUrl(path).data.publicUrl;
}
