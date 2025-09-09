import { updateSession } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// run for all routes (or narrow if you prefer)
export const config = { matcher: ['/(.*)'] };
