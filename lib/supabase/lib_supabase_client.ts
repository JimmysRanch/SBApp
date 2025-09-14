'use client';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tzbybtluhzntfhjexptw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YnlidGx1aHpudGZoamV4cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTkxNzIsImV4cCI6MjA3MTk5NTE3Mn0.E-2Y9CupjktT67UwkCP3Bm7-cBDmkolk2RIo_sPyRHQ";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
