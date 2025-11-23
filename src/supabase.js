import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qotlcxonvfcbagghqxdg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdGxjeG9udmZjYmFnZ2hxeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDI3ODMsImV4cCI6MjA3OTM3ODc4M30.K_lg3ERyR-1JelVM7N8bI6HarKGB_13MXzHtQ5P2wMQ";

export const supabase = createClient(supabaseUrl, supabaseKey);
