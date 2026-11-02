import { createClient } from "@supabase/supabase-js";
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
// A missing or malformed configuration must not crash the public website.
let client = null;
try { if (url && key && /^https:\/\//.test(url)) client = createClient(url, key); } catch (_) { /* Store shows an unavailable state. */ }
export const supabase = client;
