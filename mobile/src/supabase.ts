import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Same Supabase project the web app (TALIN) uses — anon key is safe to ship
// client-side, RLS on the tasks/roles/notes tables scopes rows to user_id.
const SUPABASE_URL = 'https://cxgtrhjtvrkvrmojqvtz.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z3RyaGp0dnJrdnJtb2pxdnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTgxOTcsImV4cCI6MjA5MTEzNDE5N30.DMMDWEDYzEMcToT3sSzCQ6eL_VkD2o4UtBGzS4A4zq4';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
