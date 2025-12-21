// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

// 🚨 FRONTEND = ANON KEY UNIQUEMENT
// 👉 Ces variables viennent du fichier .env
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Validate environment variables before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE CONFIGURATION ERROR:');
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('  - VITE_SUPABASE_URL is not defined');
  if (!supabaseAnonKey) console.error('  - VITE_SUPABASE_ANON_KEY is not defined');
  console.error('Please check your .env file and ensure these variables are set correctly.');
}

// 🚀 Création du client Supabase (sécurisé côté front)
// Only create client if we have valid configuration
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Debug logging for development
if (import.meta.env?.DEV) {
  if (supabase) {
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Supabase client failed to initialize - check environment variables');
  }
}

// Only expose to window if client was created successfully
if (supabase) {
  window.supabase = supabase;
}