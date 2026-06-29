import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In dev without .env, export a stub that no-ops gracefully
export const supabase = (url && key)
  ? createClient(url, key)
  : {
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('no-supabase') }) }) }),
        upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('no-supabase') }) }) }),
        insert: async () => ({ error: new Error('no-supabase') }),
      }),
    };
