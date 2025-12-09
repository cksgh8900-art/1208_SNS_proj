# 프로필 페이지 개발 완료 보고서

## 작업 일자
2025년 1월

## 작업 개요
Instagram Clone SNS 프로젝트의 프로필 페이지 기능을 구현했습니다. 사용자 정보, 통계, 게시물 그리드를 표시하며, 본인 프로필과 다른 사람 프로필을 구분하여 처리합니다.

## 구현된 기능

### 1. 사용자 정보 API Route (`app/api/users/[userId]/route.ts`)

**GET 메서드 구현:**

**기능:**
- 특정 사용자의 정보 조회
- user_stats 뷰 활용
- 현재 사용자의 팔로우 상태 확인
- 본인 프로필 여부 확인
- Clerk ID와 Supabase user_id 모두 지원

**구현 로직:**
1. 인증 확인 (Clerk)
2. userId 파라미터 확인
3. userId가 Clerk ID인지 Supabase user_id인지 확인
4. user_stats 뷰에서 사용자 정보 및 통계 조회
5. 현재 사용자의 팔로우 상태 확인 (다른 사람 프로필인 경우)
6. UserWithStats 타입으로 변환
7. 응답 반환

**에러 처리:**
- 인증되지 않은 사용자: 401 에러
- 사용자를 찾을 수 없음: 404 에러
- 데이터베이스 에러: 500 에러

### 2. ProfileHeader 컴포넌트 (`components/profile/ProfileHeader.tsx`)

**구조:**
- 프로필 이미지 (Desktop: 150px, Mobile: 90px)
- 사용자명
- 통계 (게시물 수, 팔로워 수, 팔로잉 수)
- 액션 버튼 (팔로우/팔로잉 또는 프로필 편집)

**구현된 기능:**
- 프로필 이미지 표시 (이니셜)
- 사용자명 표시
- 통계 표시 (게시물, 팔로워, 팔로잉)
- 통계 클릭 처리 (게시물로 스크롤, 팔로워/팔로잉 목록은 1차 제외)
- 팔로우 버튼 (다른 사람 프로필, UI만, 실제 기능은 다음 단계)
- 프로필 편집 버튼 (본인 프로필, 1차 제외)
- 반응형 레이아웃 (Desktop/Mobile)

**Props:**
- `user`: UserWithStats 타입의 사용자 정보
- `isOwnProfile`: 본인 프로필 여부
- `currentUserId`: 현재 사용자 Clerk ID
- `onFollowChange`: 팔로우 상태 변경 콜백

### 3. PostGrid 컴포넌트 (`components/profile/PostGrid.tsx`)

**구조:**
- 탭 메뉴 (게시물, 릴스, 태그됨 - 1차에서는 게시물만 활성)
- 3열 그리드 레이아웃
- 1:1 정사각형 썸네일
- Hover 오버레이 (좋아요/댓글 수)

**구현된 기능:**
- 게시물 목록 로드 (`/api/posts?userId=...`)
- 3열 그리드 레이아웃 렌더링
- Hover 효과 (좋아요/댓글 수 표시, Desktop)
- 게시물 클릭 시 PostModal 열기
- 로딩 상태 및 에러 처리
- 빈 상태 처리

**Props:**
- `userId`: Supabase user_id
- `initialPosts`: 초기 게시물 (SSR용)
- `onPostClick`: 게시물 클릭 콜백

### 4. 프로필 페이지 (`app/(main)/profile/[userId]/page.tsx`)

**동적 라우트:**
- `/profile/[userId]`: 특정 사용자의 프로필

**구현 로직:**
1. 현재 로그인한 사용자 Clerk ID 확인
2. userId 파라미터 확인
3. userId가 Clerk ID인지 Supabase user_id인지 확인
4. 사용자 정보 조회 (user_stats 뷰)
5. 본인 프로필 여부 확인
6. 게시물 목록 조회 (SSR)
7. ProfileHeader 및 PostGrid 렌더링

**Server Component 구현:**
- Suspense를 사용한 로딩 상태 처리
- 직접 Supabase 클라이언트 사용 (API 호출 대신)
- 에러 처리

### 5. 본인 프로필 페이지 (`app/(main)/profile/page.tsx`)

**기능:**
- 현재 로그인한 사용자의 프로필로 리다이렉트
- Clerk ID로 Supabase user_id 조회
- `/profile/[userId]`로 리다이렉트

**구현:**
```tsx
export default async function OwnProfilePage() {
  const { userId: clerkUserId } = await auth();
  // Clerk ID로 Supabase user_id 조회
  // `/profile/${user.id}`로 리다이렉트
}
```

### 6. PostGridSkeleton 컴포넌트 (`components/profile/PostGridSkeleton.tsx`)

**기능:**
- 프로필 페이지 게시물 그리드 로딩 스켈레톤 UI
- 탭 메뉴 및 그리드 스켈레톤

### 7. Sidebar 통합

**기존 구현:**
- Sidebar와 BottomNav에 이미 "/profile" 링크 존재
- 본인 프로필로 자동 리다이렉트

## 주요 기능

### 사용자 정보 표시
- 프로필 이미지 (이니셜)
- 사용자명
- 통계 (게시물 수, 팔로워 수, 팔로잉 수)

### 게시물 그리드
- 3열 그리드 레이아웃 (반응형)
- 1:1 정사각형 썸네일
- Hover 시 좋아요/댓글 수 표시 (Desktop)
- 클릭 시 게시물 상세 모달 열기

### 본인 프로필 vs 다른 사람 프로필
- 본인 프로필: 프로필 편집 버튼 표시
- 다른 사람 프로필: 팔로우/팔로잉 버튼 표시

### 통계 클릭 처리
- 게시물 클릭: 게시물 그리드로 스크롤
- 팔로워/팔로잉 클릭: 알림 표시 (1차 제외)

## 업데이트된 파일

- `app/api/users/[userId]/route.ts` - 신규 생성
- `components/profile/ProfileHeader.tsx` - 신규 생성
- `components/profile/PostGrid.tsx` - 신규 생성
- `components/profile/PostGridSkeleton.tsx` - 신규 생성
- `app/(main)/profile/page.tsx` - 신규 생성
- `app/(main)/profile/[userId]/page.tsx` - 신규 생성
- `docs/TODO.md` - 완료 체크

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Button
- **기존 컴포넌트**: PostModal
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (user_stats 뷰)
- **인증**: Clerk
- **타입**: TypeScript

## 주요 구현 세부사항

### 사용자 ID 처리

```typescript
// userId가 Clerk ID인지 Supabase user_id인지 확인
const { data: userByClerkId } = await supabase
  .from("users")
  .select("id")
  .eq("clerk_id", userId)
  .single();

const targetUserId = userByClerkId ? userByClerkId.id : userId;
```

### user_stats 뷰 활용

```typescript
const { data: userStats } = await supabase
  .from("user_stats")
  .select("*")
  .eq("user_id", targetUserId)
  .single();
```

### 팔로우 상태 확인

```typescript
const { data: follow } = await supabase
  .from("follows")
  .select("id")
  .eq("follower_id", currentUser.id)
  .eq("following_id", targetUserId)
  .single();

const isFollowing = !!follow;
```

### 게시물 그리드 레이아웃

```tsx
<div className="grid grid-cols-3 gap-1 md:gap-2">
  {posts.map((post) => (
    <div className="group relative aspect-square">
      <Image src={post.image_url} alt="..." fill />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100">
        {/* Hover 오버레이 */}
      </div>
    </div>
  ))}
</div>
```

### 게시물 클릭 처리

```tsx
const handlePostClick = (post: PostWithStats) => {
  setSelectedPostId(post.id);
  setPostModalOpen(true);
};

<PostModal
  postId={selectedPostId}
  open={postModalOpen}
  onOpenChange={setPostModalOpen}
  posts={posts}
/>
```

## 테스트 체크리스트

- [x] 사용자 정보 API Route 작동 확인
- [x] ProfileHeader 컴포넌트 렌더링
- [x] PostGrid 컴포넌트 렌더링
- [x] 본인 프로필 페이지 리다이렉트
- [x] 다른 사람 프로필 페이지 표시
- [x] 게시물 그리드 표시
- [x] 게시물 클릭 시 모달 열기
- [x] 통계 클릭 처리
- [x] 팔로우 버튼 UI (실제 기능은 다음 단계)
- [x] 반응형 레이아웃 (Desktop/Mobile)
- [x] 로딩 상태 표시
- [x] 에러 처리

## 향후 개선 사항

1. **팔로우 기능**
   - 실제 팔로우/언팔로우 API 연동
   - 팔로우 상태 실시간 업데이트

2. **프로필 편집**
   - 프로필 이미지 업로드
   - 사용자명 변경
   - 소개 추가

3. **팔로워/팔로잉 목록**
   - 팔로워 목록 모달
   - 팔로잉 목록 모달

4. **게시물 그리드 최적화**
   - 무한 스크롤
   - 성능 최적화

5. **통계 실시간 업데이트**
   - 게시물 수 실시간 업데이트
   - 팔로워 수 실시간 업데이트

## 참고 파일

- [PRD.md](docs/PRD.md) - 프로필 페이지 스펙 (섹션 4, 7.5)
- [DB.sql](supabase/migrations/DB.sql) - user_stats 뷰 스키마
- [lib/types.ts](lib/types.ts) - UserWithStats 타입 정의
- [components/post/PostModal.tsx](components/post/PostModal.tsx) - PostModal 컴포넌트
- [app/api/posts/route.ts](app/api/posts/route.ts) - 게시물 API 참고
- [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) - Sidebar 컴포넌트

## 완료 상태

모든 계획된 기능이 성공적으로 구현되었습니다. 프로필 페이지 기능은 프로덕션 환경에서 사용할 준비가 되었습니다. 팔로우 기능의 실제 API 연동은 다음 단계에서 구현될 예정입니다.

