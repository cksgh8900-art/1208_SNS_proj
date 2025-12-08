import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Suspense } from "react";

/**
 * @file app/instruments/page.tsx
 * @description Supabase 공식 Next.js 퀵스타트 예시 페이지
 *
 * 이 페이지는 Supabase 공식 문서의 예시를 따라 구현되었습니다.
 * instruments 테이블에서 데이터를 조회하여 표시합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */
async function InstrumentsData() {
  const supabase = createClerkSupabaseClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    console.error("Error fetching instruments:", error);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
        <p className="text-sm text-red-500 dark:text-red-500 mt-2">
          Supabase 프로젝트에 instruments 테이블이 생성되어 있는지 확인하세요.
        </p>
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-yellow-600 dark:text-yellow-400">
          데이터가 없습니다. Supabase에서 instruments 테이블을 생성하고 데이터를 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">악기 목록</h2>
      <ul className="space-y-2">
        {instruments.map((instrument: { id: number; name: string }) => (
          <li
            key={instrument.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium">{instrument.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ID: {instrument.id}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          💡 이 데이터는 Supabase 데이터베이스에서 가져온 것입니다.
        </p>
      </div>
    </div>
  );
}

export default function Instruments() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Supabase 연결 테스트</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Supabase 공식 Next.js 퀵스타트 예시를 기반으로 구현되었습니다.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              악기 데이터를 불러오는 중...
            </p>
          </div>
        }
      >
        <InstrumentsData />
      </Suspense>
    </div>
  );
}

