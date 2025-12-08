# Clerk + Supabase 통합 가이드

이 문서는 2025년 4월 이후 권장되는 네이티브 통합 방식을 기반으로 작성되었습니다.

## 개요

Clerk와 Supabase를 통합하면:
- Clerk의 강력한 인증 기능 활용
- Supabase의 데이터베이스 및 스토리지 기능 활용
- Row Level Security (RLS)로 사용자별 데이터 접근 제어

**중요**: 2025년 4월 1일부터 JWT 템플릿 방식은 deprecated되었습니다. 네이티브 통합 방식을 사용해야 합니다.

## 설정 단계

### 1. Clerk Dashboard에서 Supabase 통합 활성화

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. **Setup** > **Supabase** 메뉴로 이동
3. **Activate Supabase integration** 클릭
4. 표시되는 **Clerk domain** 복사 (예: `your-app.clerk.accounts.dev`)

### 2. Supabase Dashboard에서 Clerk를 Third-Party Auth Provider로 추가

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** > **Sign In / Up** 메뉴로 이동
4. **Third Party Auth** 탭 선택
5. **Add provider** 클릭
6. **Clerk** 선택
7. Clerk Dashboard에서 복사한 **Clerk domain** 입력
8. 저장

### 3. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # 서버 사이드 전용
```

### 4. 코드에서 사용하기

#### Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    return data;
  }

  return <div>...</div>;
}
```

#### Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    throw error;
  }

  return (
    <div>
      {data?.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

#### Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function addTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) {
    throw new Error(`Failed to add task: ${error.message}`);
  }

  return data;
}
```

## Row Level Security (RLS) 설정

RLS를 사용하여 사용자가 자신의 데이터에만 접근할 수 있도록 제한할 수 있습니다.

### RLS 정책 예시

```sql
-- 테이블 생성 (user_id는 Clerk user ID를 저장)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub')
);

-- RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
TO authenticated
USING ((auth.jwt()->>'sub') = user_id);

-- 사용자는 자신의 tasks만 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON tasks
FOR UPDATE
TO authenticated
USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON tasks
FOR DELETE
TO authenticated
USING ((auth.jwt()->>'sub') = user_id);
```

### RLS 작동 원리

1. 클라이언트가 Supabase에 요청을 보낼 때 Clerk 세션 토큰이 함께 전달됩니다.
2. Supabase가 토큰을 검증하고 `auth.jwt()->>'sub'`에서 Clerk user ID를 추출합니다.
3. RLS 정책이 이 user ID를 사용하여 데이터 접근을 제한합니다.

## 주요 파일 구조

```
lib/supabase/
├── clerk-client.ts    # Client Component용 (useClerkSupabaseClient hook)
├── server.ts         # Server Component/Server Action용 (createClerkSupabaseClient)
├── client.ts         # 인증 불필요한 공개 데이터용
└── service-role.ts   # 관리자 권한 작업용 (RLS 우회)
```

## 테스트 방법

1. 애플리케이션 실행: `pnpm dev`
2. 로그인 후 데이터 생성/조회 테스트
3. 다른 계정으로 로그인하여 데이터 격리 확인
4. Supabase Dashboard에서 데이터 확인

## 문제 해결

### "Unauthorized" 오류

- Clerk와 Supabase 통합이 제대로 설정되었는지 확인
- 환경 변수가 올바르게 설정되었는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### RLS 정책이 작동하지 않음

- RLS가 활성화되었는지 확인: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- 정책이 올바르게 생성되었는지 확인
- `auth.jwt()->>'sub'`가 올바른 Clerk user ID를 반환하는지 확인

## 참고 자료

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 문서](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)

