import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * @file server.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * Supabase 공식 Next.js 퀵스타트 패턴을 따르되, Clerk 통합을 유지합니다.
 * 
 * 2025년 4월부터 권장되는 네이티브 통합 방식:
 * - JWT 템플릿 불필요 (deprecated)
 * - Clerk를 Supabase의 third-party auth provider로 설정 필요
 * - auth().getToken()으로 현재 세션 토큰을 Supabase에 전달
 * - Supabase가 자동으로 Clerk 토큰을 검증하고 `auth.jwt()->>'sub'`로 사용자 ID 확인
 *
 * 설정 방법:
 * 1. Clerk Dashboard에서 Supabase 통합 활성화
 * 2. Supabase Dashboard > Authentication > Sign In/Up > Third Party Auth에서 Clerk 추가
 * 3. Clerk Domain 입력
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 * @see https://supabase.com/docs/guides/auth/third-party/clerk
 *
 * @example
 * ```tsx
 * // Server Component (Supabase 공식 문서 패턴)
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('instruments')
 *     .select('*');
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server Action
 * 'use server';
 *
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function addTask(name: string) {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('tasks')
 *     .insert({ name });
 *   return { data, error };
 * }
 * ```
 */
export function createClerkSupabaseClient() {
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
      const { getToken } = await auth();
      return await getToken();
    },
  });
}

/**
 * Supabase 공식 문서의 패턴을 따르는 별칭
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */
export const createClient = createClerkSupabaseClient;
