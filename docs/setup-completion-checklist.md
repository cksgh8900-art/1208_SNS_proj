# 기본 세팅 완료 체크리스트

이 문서는 기본 세팅이 완료되었는지 확인하는 체크리스트입니다.

## 자동화된 검증

### 1. 환경 변수 확인

```bash
pnpm run check:env
```

이 명령어는 다음을 확인합니다:
- 필수 환경 변수 설정 여부
- 환경 변수 형식 검증
- 선택적 환경 변수 안내

### 2. Supabase 설정 검증

```bash
pnpm run verify:supabase
```

이 명령어는 다음을 확인합니다:
- Supabase 연결 상태
- 테이블 존재 여부 (users, posts, likes, comments, follows)
- Storage 버킷 존재 여부

## 수동 확인 항목

### Supabase 데이터베이스 마이그레이션

- [ ] Supabase Dashboard 접속
- [ ] SQL Editor에서 `20251208142219_initial_schema.sql` 실행
- [ ] `verify_migration.sql` 실행하여 검증
- [ ] 다음 테이블이 생성되었는지 확인:
  - [ ] users
  - [ ] posts
  - [ ] likes
  - [ ] comments
  - [ ] follows
- [ ] 다음 뷰가 생성되었는지 확인:
  - [ ] post_stats
  - [ ] user_stats
- [ ] 다음 트리거가 생성되었는지 확인:
  - [ ] posts 테이블의 updated_at 트리거
  - [ ] comments 테이블의 updated_at 트리거

### Supabase Storage 버킷

- [ ] `posts` 버킷 생성
- [ ] 버킷이 공개(Public)로 설정되었는지 확인
- [ ] 다음 정책이 설정되었는지 확인:
  - [ ] Authenticated users can upload images (INSERT)
  - [ ] Users can delete their own images (DELETE)
  - [ ] Users can update their own images (UPDATE)

### 환경 변수

- [ ] `.env` 파일에 다음 변수가 설정되어 있는지 확인:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NEXT_PUBLIC_STORAGE_BUCKET (선택사항)

## 완료 확인

모든 항목이 체크되면 기본 세팅이 완료된 것입니다!

다음 단계: TODO.md의 "## 2. 레이아웃 구조" 개발 시작

