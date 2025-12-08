# Supabase Storage 버킷 생성 가이드

이 문서는 Instagram Clone SNS 프로젝트의 이미지 저장을 위한 Supabase Storage 버킷을 설정하는 방법을 안내합니다.

## 버킷 정보

- **버킷 이름**: `posts`
- **공개 읽기**: 예 (모든 사용자가 이미지 조회 가능)
- **업로드 권한**: 인증된 사용자만 업로드 가능
- **파일 크기 제한**: 5MB
- **허용 파일 형식**: 이미지 (jpg, jpeg, png, webp)

## 방법 1: Supabase Dashboard 사용 (권장)

### 단계별 가이드

1. **Supabase Dashboard 접속**
   - [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
   - 프로젝트 선택

2. **Storage 메뉴 열기**
   - 왼쪽 사이드바에서 **Storage** 클릭

3. **새 버킷 생성**
   - **New bucket** 버튼 클릭
   - 버킷 이름: `posts` 입력
   - **Public bucket** 체크박스 선택 (공개 읽기)
   - **Create bucket** 버튼 클릭

4. **업로드 정책 설정**
   - 생성된 `posts` 버킷 클릭
   - **Policies** 탭 선택
   - **New Policy** 버튼 클릭

### 업로드 정책 (INSERT)

**정책 이름**: `Authenticated users can upload images`

**정책 SQL**:
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);
```

이 정책은:
- 인증된 사용자만 업로드 가능
- 자신의 폴더(`{clerk_user_id}/`)에만 업로드 가능

### 읽기 정책 (SELECT) - 공개 버킷이므로 자동 적용

공개 버킷으로 설정했으므로 별도의 읽기 정책이 필요 없습니다. 모든 사용자가 이미지를 조회할 수 있습니다.

### 삭제 정책 (DELETE)

**정책 이름**: `Users can delete their own images`

**정책 SQL**:
```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);
```

이 정책은:
- 인증된 사용자만 삭제 가능
- 자신의 폴더에 있는 파일만 삭제 가능

### 업데이트 정책 (UPDATE)

**정책 이름**: `Users can update their own images`

**정책 SQL**:
```sql
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);
```

## 방법 2: SQL Editor 사용

다음 SQL을 Supabase Dashboard > SQL Editor에서 실행할 수도 있습니다:

```sql
-- 버킷 생성 (공개 읽기)
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- 업로드 정책
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);

-- 삭제 정책
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);

-- 업데이트 정책
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')::text
);
```

## 파일 경로 구조

프로젝트에서 사용하는 파일 경로 구조:

```
posts/
  {clerk_user_id}/
    {post_id}/
      {filename}.{ext}
```

예시:
```
posts/
  user_abc123/
    post_xyz789/
      image.jpg
```

또는 더 간단한 구조:

```
posts/
  {post_id}/
    {filename}.{ext}
```

예시:
```
posts/
  post_xyz789/
    image.jpg
```

## 개발 단계에서 RLS 비활성화 (선택사항)

개발 중에는 Storage RLS를 비활성화할 수 있습니다:

```sql
-- Storage RLS 비활성화 (개발 전용)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**주의**: 프로덕션 환경에서는 반드시 RLS를 활성화하고 적절한 정책을 설정해야 합니다.

## 파일 크기 및 형식 제한

애플리케이션 레벨에서 다음 제한을 적용해야 합니다:

- **최대 파일 크기**: 5MB
- **허용 파일 형식**: 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`

## 환경 변수 설정

`.env` 파일에 다음 변수를 추가하세요 (선택사항):

```bash
NEXT_PUBLIC_STORAGE_BUCKET=posts
```

## 테스트

버킷이 정상적으로 생성되었는지 확인:

1. **Supabase Dashboard > Storage**에서 `posts` 버킷 확인
2. **Policies** 탭에서 정책이 올바르게 설정되었는지 확인
3. 테스트 이미지 업로드 시도

## 문제 해결

### 에러: "new row violates row-level security policy"

RLS 정책이 올바르게 설정되지 않았을 수 있습니다:
- 정책이 올바르게 생성되었는지 확인
- Clerk user ID가 올바르게 전달되는지 확인
- 개발 중에는 RLS를 비활성화할 수 있습니다

### 에러: "Bucket not found"

버킷이 생성되지 않았을 수 있습니다:
- Supabase Dashboard > Storage에서 버킷 목록 확인
- 버킷 이름이 정확한지 확인 (`posts`)

### 에러: "File size exceeds limit"

파일 크기가 5MB를 초과하는 경우:
- 애플리케이션에서 파일 크기를 검증해야 합니다
- Supabase Storage 자체에는 기본 크기 제한이 없으므로 애플리케이션 레벨에서 제한해야 합니다

## 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Storage RLS 정책 가이드](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage 파일 업로드 가이드](https://supabase.com/docs/guides/storage/uploads)

