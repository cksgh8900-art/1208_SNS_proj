# Supabase 데이터베이스 마이그레이션 가이드

이 문서는 Instagram Clone SNS 프로젝트의 데이터베이스 스키마를 Supabase에 적용하는 방법을 안내합니다.

## 마이그레이션 파일

- `supabase/migrations/20251208142219_initial_schema.sql` - 초기 데이터베이스 스키마

## 방법 1: Supabase Dashboard SQL Editor 사용 (권장)

### 단계별 가이드

1. **Supabase Dashboard 접속**
   - [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 사이드바에서 **SQL Editor** 클릭
   - **New query** 버튼 클릭

3. **마이그레이션 파일 내용 복사**
   - `supabase/migrations/20251208142219_initial_schema.sql` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)

4. **SQL 실행**
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - **Run** 버튼 클릭 또는 `Ctrl+Enter`

5. **결과 확인**
   - 성공 메시지 확인
   - 에러가 발생하면 에러 메시지를 확인하고 수정

### 생성되는 항목 확인

마이그레이션이 성공적으로 실행되면 다음이 생성됩니다:

**테이블:**
- `users` - 사용자 정보
- `posts` - 게시물
- `likes` - 좋아요
- `comments` - 댓글
- `follows` - 팔로우 관계

**뷰 (Views):**
- `post_stats` - 게시물 통계 (좋아요 수, 댓글 수)
- `user_stats` - 사용자 통계 (게시물 수, 팔로워 수, 팔로잉 수)

**트리거 (Triggers):**
- `set_updated_at` on `posts` - updated_at 자동 업데이트
- `set_updated_at` on `comments` - updated_at 자동 업데이트

**함수 (Functions):**
- `handle_updated_at()` - updated_at 업데이트 함수

## 방법 2: Supabase CLI 사용

### 사전 준비

1. **Supabase CLI 설치**
   ```bash
   npm install -g supabase
   ```

2. **Supabase 로그인**
   ```bash
   supabase login
   ```

3. **프로젝트 연결**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   - Project REF는 Supabase Dashboard > Project Settings > General에서 확인 가능

### 마이그레이션 실행

```bash
# 마이그레이션 파일 적용
supabase db push

# 또는 특정 마이그레이션만 실행
supabase migration up
```

### 마이그레이션 상태 확인

```bash
# 적용된 마이그레이션 목록 확인
supabase migration list
```

## 마이그레이션 검증

마이그레이션이 성공적으로 적용되었는지 확인하려면 다음 SQL 쿼리를 실행하세요:

### 테이블 확인

```sql
-- 모든 테이블 목록 확인
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

예상 결과:
- comments
- follows
- likes
- posts
- users

### 뷰 확인

```sql
-- 모든 뷰 목록 확인
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

예상 결과:
- post_stats
- user_stats

### 트리거 확인

```sql
-- 모든 트리거 목록 확인
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

예상 결과:
- set_updated_at on comments (BEFORE UPDATE)
- set_updated_at on posts (BEFORE UPDATE)

### 함수 확인

```sql
-- 모든 함수 목록 확인
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

예상 결과:
- handle_updated_at

### 인덱스 확인

```sql
-- 모든 인덱스 목록 확인
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 문제 해결

### 에러: "relation already exists"

테이블이 이미 존재하는 경우:
- `CREATE TABLE IF NOT EXISTS` 구문을 사용했으므로 안전하게 재실행 가능
- 또는 기존 테이블을 삭제 후 재실행

### 에러: "permission denied"

권한 문제인 경우:
- Supabase Dashboard에서 올바른 프로젝트를 선택했는지 확인
- Service Role Key를 사용하여 실행 (프로덕션에서는 권장하지 않음)

### 에러: "function already exists"

함수가 이미 존재하는 경우:
- `CREATE OR REPLACE FUNCTION` 구문을 사용했으므로 안전하게 재실행 가능

## 다음 단계

마이그레이션이 성공적으로 완료되면:

1. **Storage 버킷 생성** - `docs/supabase-storage-setup.md` 참고
2. **환경 변수 설정** - `.env` 파일에 Supabase URL과 키 추가
3. **타입 생성** (선택사항) - `pnpm run gen:types` 실행하여 TypeScript 타입 생성

## 참고 자료

- [Supabase SQL Editor 문서](https://supabase.com/docs/guides/database/tables)
- [Supabase CLI 문서](https://supabase.com/docs/reference/cli)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

