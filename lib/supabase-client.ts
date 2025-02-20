"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

export async function getSupabaseClient() {
  // Create a new Supabase client with custom auth
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Important: Use service role key
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
      /*       global: {
        headers: {
          // Pass Clerk user ID as custom header
          "x-clerk-user-id": userId
        }
      } */
    }
  )
}
