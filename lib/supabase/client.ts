import { createClient } from "@supabase/supabase-js";

/**
 * @file client.ts
 * @description Supabase 클라이언트 (인증 불필요한 공개 데이터용)
 *
 * 이 클라이언트는 인증이 필요하지 않은 공개 데이터에 접근할 때 사용합니다.
 * RLS 정책이 `to anon`인 데이터에 접근할 수 있습니다.
 *
 * 인증이 필요한 데이터에 접근하려면:
 * - Client Component: `useClerkSupabaseClient()` 사용
 * - Server Component/Action: `createClerkSupabaseClient()` 사용
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { supabase } from '@/lib/supabase/client';
 *
 * export default function PublicData() {
 *   const { data } = await supabase
 *     .from('public_instruments')
 *     .select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// 기본 export (하위 호환성 유지)
export const supabase = createClient();
