# 게시물 삭제 기능 개발 완료 보고서

## 작업 일자
2025년 1월

## 작업 개요
Instagram Clone SNS 프로젝트의 게시물 삭제 기능을 구현했습니다. 본인 게시물만 삭제할 수 있으며, 삭제 시 Supabase Storage의 이미지도 함께 삭제합니다. 삭제 확인 다이얼로그를 통해 실수로 인한 삭제를 방지합니다.

## 구현된 기능

### 1. 게시물 삭제 API Route (`app/api/posts/[postId]/route.ts`)

**DELETE 메서드 구현:**

**기능:**
- 게시물 삭제
- 본인만 삭제 가능 (인증 검증)
- 게시물 소유자 확인
- Supabase Storage에서 이미지 삭제
- DB에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
- 에러 처리

**구현 로직:**
1. 인증 확인 (Clerk)
2. postId 파라미터 확인
3. 현재 사용자의 Supabase user_id 조회
4. 게시물 조회 및 소유자 확인
5. 본인 게시물인지 검증
6. 게시물의 image_url에서 파일 경로 추출
7. Supabase Storage에서 이미지 삭제 (Service Role 클라이언트 사용)
8. DB에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
9. 응답 반환

**에러 처리:**
- 인증되지 않은 사용자: 401 에러
- postId 누락: 400 에러
- 게시물을 찾을 수 없음: 404 에러
- 본인 게시물이 아님: 403 에러
- Storage 삭제 실패: 경고만 (DB 삭제는 계속 진행)
- 데이터베이스 에러: 500 에러

**특별 처리:**
- Storage 이미지 삭제 실패 시에도 DB 삭제는 진행 (이미지 URL은 무효화되므로)
- 이미지 URL에서 파일 경로 추출: `/storage/v1/object/public/` 이후 경로 사용

### 2. 드롭다운 메뉴 구현

**커스텀 드롭다운 메뉴:**
- 외부 클릭 시 메뉴 닫기
- 본인 게시물: "삭제" 옵션 (빨간색)
- 다른 사람 게시물: "신고" 옵션 (1차 제외, UI만)

**구현:**
- `useRef`와 `useEffect`를 사용한 외부 클릭 감지
- 절대 위치 배치 (`absolute`)
- z-index 설정 (`z-50`)

### 3. 삭제 확인 다이얼로그

**구현:**
- shadcn/ui Dialog 컴포넌트 사용
- 삭제 확인 메시지
- 로딩 상태 표시 ("삭제 중...")
- 취소 및 삭제 버튼
- 삭제 버튼은 `variant="destructive"` 사용

### 4. PostCard 통합 (`components/post/PostCard.tsx`)

**변경 사항:**
- 드롭다운 메뉴 추가
- 삭제 확인 다이얼로그 통합
- 삭제 핸들러 구현
- 삭제 콜백 처리 (`onPostDelete` prop 추가)

**구현:**
- 본인 게시물 여부 확인 (`isOwnPost`)
- 메뉴 상태 관리 (`showMenu`)
- 삭제 다이얼로그 상태 관리 (`showDeleteDialog`)
- 삭제 진행 상태 관리 (`deleting`)

### 5. PostModal 통합 (`components/post/PostModal.tsx`)

**변경 사항:**
- 드롭다운 메뉴 추가
- 삭제 확인 다이얼로그 통합
- 삭제 핸들러 구현
- 삭제 후 모달 닫기

**구현:**
- PostCard와 유사한 로직
- 삭제 후 모달 닫기 (`onOpenChange(false)`)
- 부모 컴포넌트에 삭제 알림 (`onPostDelete`)

### 6. PostFeed 통합 (`components/post/PostFeed.tsx`)

**변경 사항:**
- 게시물 삭제 콜백 처리
- 삭제된 게시물을 목록에서 제거

**구현:**
```tsx
const handlePostDelete = useCallback((postId: string) => {
  setPosts((prev) => prev.filter((post) => post.id !== postId));
}, []);

<PostCard
  key={post.id}
  post={post}
  posts={posts}
  onPostDelete={handlePostDelete}
/>
```

### 7. PostGrid 통합 (`components/profile/PostGrid.tsx`)

**변경 사항:**
- 게시물 삭제 콜백 처리
- 삭제된 게시물을 목록에서 제거
- 삭제 후 모달 닫기

**구현:**
```tsx
onPostDelete={(postId) => {
  setPosts((prev) => prev.filter((p) => p.id !== postId));
  setPostModalOpen(false);
  if (onPostDelete) {
    onPostDelete(postId);
  }
}}
```

## 주요 기능

### 게시물 삭제
- 본인 게시물만 삭제 가능
- 삭제 확인 다이얼로그로 실수 방지
- Storage 이미지 삭제
- DB 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)

### 드롭다운 메뉴
- 본인 게시물: "삭제" 옵션
- 다른 사람 게시물: "신고" 옵션 (1차 제외)
- 외부 클릭 시 자동 닫기

### 삭제 확인 다이얼로그
- 삭제 확인 메시지
- 로딩 상태 표시
- 취소 및 삭제 버튼

### 피드 업데이트
- 삭제 후 즉시 피드에서 제거
- PostFeed 및 PostGrid 모두 지원

## 업데이트된 파일

- `app/api/posts/[postId]/route.ts` - 신규 생성
- `components/post/PostCard.tsx` - 삭제 메뉴 통합
- `components/post/PostModal.tsx` - 삭제 메뉴 통합
- `components/post/PostFeed.tsx` - 삭제 콜백 처리
- `components/profile/PostGrid.tsx` - 삭제 콜백 처리
- `docs/TODO.md` - 완료 체크
- `docs/task/post-delete-completion-2025.md` - 완료 보고서 작성

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Dialog, Button
- **기존 컴포넌트**: PostCard, PostModal, PostFeed, PostGrid
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (posts 테이블, Storage)
- **인증**: Clerk
- **타입**: TypeScript

## 주요 구현 세부사항

### 게시물 삭제 API 구현

**이미지 URL에서 파일 경로 추출:**
```typescript
const urlParts = imageUrl.split("/storage/v1/object/public/");
if (urlParts.length === 2) {
  const filePath = urlParts[1]; // "posts/[userId]/[filename]"
  
  // Storage에서 이미지 삭제
  const { error: storageError } = await serviceRoleSupabase.storage
    .from("posts")
    .remove([filePath]);
  
  if (storageError) {
    console.error("이미지 삭제 에러:", storageError);
    // 경고만, DB 삭제는 계속 진행
  }
}
```

**게시물 소유자 확인:**
```typescript
// 게시물 조회 및 소유자 확인
const { data: postData } = await supabase
  .from("posts")
  .select("user_id, image_url")
  .eq("id", postId)
  .single();

// 본인 게시물인지 확인
if (postData.user_id !== currentUser.id) {
  return NextResponse.json(
    { error: "본인의 게시물만 삭제할 수 있습니다." },
    { status: 403 }
  );
}
```

### 드롭다운 메뉴 구현

**외부 클릭 감지:**
```tsx
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };
  if (showMenu) {
    document.addEventListener("mousedown", handleClickOutside);
  }
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showMenu]);
```

**메뉴 렌더링:**
```tsx
{showMenu && (
  <div className="absolute right-0 top-full mt-1 bg-white border border-instagram-border rounded-lg shadow-lg z-50 min-w-[160px]">
    {isOwnPost && (
      <button onClick={() => setShowDeleteDialog(true)}>
        <Trash2 className="w-4 h-4" />
        삭제
      </button>
    )}
  </div>
)}
```

### 삭제 확인 다이얼로그

**구현:**
```tsx
<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>게시물 삭제</DialogTitle>
      <DialogDescription>
        이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
        취소
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        {deleting ? "삭제 중..." : "삭제"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 게시물 삭제 후 피드 업데이트

**PostFeed에서:**
```tsx
const handlePostDelete = useCallback((postId: string) => {
  setPosts((prev) => prev.filter((post) => post.id !== postId));
}, []);
```

**PostGrid에서:**
```tsx
onPostDelete={(postId) => {
  setPosts((prev) => prev.filter((p) => p.id !== postId));
  setPostModalOpen(false);
}}
```

## 테스트 체크리스트

- [x] 게시물 삭제 API 작동 확인
- [x] 본인 게시물만 삭제 가능 확인
- [x] 다른 사람 게시물 삭제 불가 확인
- [x] Storage 이미지 삭제 확인
- [x] 삭제 확인 다이얼로그 표시 확인
- [x] 드롭다운 메뉴 표시 확인
- [x] PostCard에서 삭제 기능 확인
- [x] PostModal에서 삭제 기능 확인
- [x] 삭제 후 피드에서 제거 확인
- [x] 삭제 후 프로필 페이지 게시물 수 업데이트 확인
- [x] 에러 처리 확인
- [x] 로딩 상태 표시 확인

## 향후 개선 사항

1. **신고 기능**
   - 다른 사람 게시물 신고 기능 구현
   - 신고 API 및 관리자 페이지

2. **삭제 알림**
   - 삭제 성공 알림 (Toast 메시지)
   - 삭제 실패 알림 개선

3. **성능 최적화**
   - 삭제 후 피드 새로고침 최적화
   - 이미지 삭제 비동기 처리

## 참고 파일

- [PRD.md](docs/PRD.md) - 게시물 삭제 스펙 (섹션 7.2)
- [DB.sql](supabase/migrations/DB.sql) - posts 테이블 스키마
- [app/api/posts/route.ts](app/api/posts/route.ts) - 게시물 API 참고
- [lib/supabase/service-role.ts](lib/supabase/service-role.ts) - Service Role 클라이언트
- [components/post/PostCard.tsx](components/post/PostCard.tsx) - PostCard 컴포넌트
- [components/post/PostModal.tsx](components/post/PostModal.tsx) - PostModal 컴포넌트
- [components/ui/dialog.tsx](components/ui/dialog.tsx) - Dialog 컴포넌트

## 완료 상태

모든 계획된 기능이 성공적으로 구현되었습니다. 게시물 삭제 기능은 프로덕션 환경에서 사용할 준비가 되었습니다. 사용자는 본인의 게시물을 삭제할 수 있으며, 삭제 시 Storage 이미지와 DB 데이터가 모두 삭제됩니다.

