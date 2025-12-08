"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * @file clerk-client.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요 (deprecated)
 * - Clerk를 Supabase의 third-party auth provider로 설정 필요
 * - useAuth().getToken()으로 현재 세션 토큰을 Supabase에 전달
 * - Supabase가 자동으로 Clerk 토큰을 검증하고 `auth.jwt()->>'sub'`로 사용자 ID 확인
 *
 * 설정 방법:
 * 1. Clerk Dashboard에서 Supabase 통합 활성화
 * 2. Supabase Dashboard > Authentication > Sign In/Up > Third Party Auth에서 Clerk 추가
 * 3. Clerk Domain 입력
 *
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 * @see https://supabase.com/docs/guides/auth/third-party/clerk
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data, error } = await supabase
 *       .from('tasks')
 *       .select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        // Clerk 세션 토큰을 Supabase에 전달
        // Supabase가 이 토큰을 검증하고 auth.jwt()->>'sub'로 사용자 ID 추출
        const token = await getToken();
        return token ?? null;
      },
    });
  }, [getToken]);

  return supabase;
}
