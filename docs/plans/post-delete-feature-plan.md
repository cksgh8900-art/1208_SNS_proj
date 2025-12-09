# 게시물 삭제 기능 개발 계획

## 개요

PRD.md와 DB.sql을 기반으로 Instagram Clone SNS의 게시물 삭제 기능을 개발합니다. 본인 게시물만 삭제할 수 있으며, 삭제 시 Supabase Storage의 이미지도 함께 삭제합니다. 삭제 확인 다이얼로그를 통해 실수로 인한 삭제를 방지합니다.

## 현재 상태

- `app/api/posts/[postId]/route.ts`: 없음 (생성 필요)
- `components/post/PostCard.tsx`: ⋯ 메뉴 버튼 존재 (기능 미구현)
- `components/post/PostModal.tsx`: ⋯ 메뉴 버튼 존재 (기능 미구현)
- `lib/supabase/service-role.ts`: Service Role 클라이언트 존재
- `components/ui/dialog.tsx`: Dialog 컴포넌트 존재
- `supabase/migrations/DB.sql`: posts 테이블 정의됨 (CASCADE 삭제 설정)

## 개발할 컴포넌트 및 파일

### 1. 게시물 삭제 API Route

#### 1.1 `app/api/posts/[postId]/route.ts` 생성

**DELETE 메서드 구현:**

**기능:**
- 게시물 삭제
- 본인만 삭제 가능 (인증 검증)
- Supabase Storage에서 이미지 삭제
- 관련 데이터 CASCADE 삭제 (likes, comments는 DB에서 자동 처리)

**요청 형식:**
- Path Parameter: `postId` (게시물 UUID)

**응답 형식:**
```typescript
{
  message: string;
  error?: string;
}
```

**구현 로직:**
1. 인증 확인 (Clerk)
2. postId 파라미터 확인
3. 현재 사용자의 Supabase user_id 조회
4. 게시물 조회 및 소유자 확인
5. 본인 게시물인지 검증
6. 게시물의 image_url에서 파일 경로 추출
7. Supabase Storage에서 이미지 삭제
8. posts 테이블에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
9. 응답 반환

**에러 처리:**
- 인증되지 않은 사용자: 401 에러
- postId 누락: 400 에러
- 게시물을 찾을 수 없음: 404 에러
- 본인 게시물이 아님: 403 에러
- Storage 삭제 실패: 500 에러 (경고만, DB 삭제는 진행)
- 데이터베이스 에러: 500 에러

**특별 처리:**
- Storage 이미지 삭제 실패 시에도 DB 삭제는 진행 (이미지 URL은 무효화되므로)
- 삭제 전 게시물 정보 조회하여 image_url 확인

### 2. 삭제 확인 다이얼로그 컴포넌트

#### 2.1 `components/post/DeletePostDialog.tsx` 생성 (선택사항)

**또는 기존 Dialog 컴포넌트 활용**

**기능:**
- 삭제 확인 메시지 표시
- "삭제" 및 "취소" 버튼
- 삭제 진행 시 로딩 상태 표시

**Props:**
```typescript
interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>; // 삭제 확인 콜백
  postCaption?: string; // 게시물 캡션 (선택사항)
}
```

**구현:**
- shadcn/ui Dialog 컴포넌트 사용
- 삭제 확인 메시지
- 로딩 상태 표시

### 3. PostCard 통합

#### 3.1 `components/post/PostCard.tsx` 업데이트

**변경 사항:**
- ⋯ 메뉴 버튼 클릭 시 드롭다운 메뉴 표시
- 본인 게시물인 경우 "삭제" 옵션 표시
- 삭제 확인 다이얼로그 표시
- 삭제 성공 시 피드에서 제거

**구현:**
```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [showMenu, setShowMenu] = useState(false);

// 본인 게시물 여부 확인
const isOwnPost = currentUserId && post.user?.clerk_id === currentUserId;

// 삭제 핸들러
const handleDelete = async () => {
  try {
    const response = await fetch(`/api/posts/${post.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("게시물 삭제에 실패했습니다.");
    }

    // 피드에서 제거 (부모 컴포넌트에 알림)
    onPostDelete?.(post.id);
  } catch (error) {
    console.error("게시물 삭제 에러:", error);
    alert("게시물 삭제 중 오류가 발생했습니다.");
  }
};
```

**메뉴 구현:**
- 드롭다운 메뉴 (shadcn/ui DropdownMenu 또는 커스텀)
- 본인 게시물: "삭제" 옵션
- 다른 사람 게시물: "신고" 옵션 (1차 제외, UI만)

### 4. PostModal 통합

#### 4.1 `components/post/PostModal.tsx` 업데이트

**변경 사항:**
- ⋯ 메뉴 버튼 클릭 시 드롭다운 메뉴 표시
- 본인 게시물인 경우 "삭제" 옵션 표시
- 삭제 확인 다이얼로그 표시
- 삭제 성공 시 모달 닫기 및 피드 업데이트

**구현:**
- PostCard와 유사한 로직
- 삭제 후 모달 닫기 (`onOpenChange(false)`)
- 부모 컴포넌트에 삭제 알림

### 5. PostFeed 통합

#### 5.1 `components/post/PostFeed.tsx` 업데이트

**변경 사항:**
- 게시물 삭제 콜백 처리
- 삭제된 게시물을 목록에서 제거

**구현:**
```tsx
const handlePostDelete = useCallback((postId: string) => {
  setPosts((prev) => prev.filter((post) => post.id !== postId));
}, []);

<PostCard
  post={post}
  currentUserId={clerkUserId}
  posts={posts}
  onPostDelete={handlePostDelete}
/>
```

### 6. PostGrid 통합

#### 6.1 `components/profile/PostGrid.tsx` 업데이트

**변경 사항:**
- 게시물 삭제 콜백 처리
- 삭제된 게시물을 목록에서 제거
- 게시물 수 업데이트 (부모 컴포넌트에 알림)

**구현:**
- PostFeed와 유사한 로직
- 삭제 후 게시물 수 감소

## 상세 구현 사항

### 게시물 삭제 API 구현

**이미지 URL에서 파일 경로 추출:**
```typescript
// image_url 예시: https://[project].supabase.co/storage/v1/object/public/posts/[userId]/[filename]
const imageUrl = post.image_url;
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

**게시물 삭제:**
```typescript
// 게시물 소유자 확인
const { data: postData, error: postError } = await supabase
  .from("posts")
  .select("user_id, image_url")
  .eq("id", postId)
  .single();

if (postError || !postData) {
  return NextResponse.json(
    { error: "게시물을 찾을 수 없습니다." },
    { status: 404 }
  );
}

// 본인 게시물인지 확인
if (postData.user_id !== currentUser.id) {
  return NextResponse.json(
    { error: "본인의 게시물만 삭제할 수 있습니다." },
    { status: 403 }
  );
}

// Storage에서 이미지 삭제
// ... (위 코드 참고)

// DB에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
const { error: deleteError } = await supabase
  .from("posts")
  .delete()
  .eq("id", postId);

if (deleteError) {
  console.error("게시물 삭제 에러:", deleteError);
  return NextResponse.json(
    { error: "게시물 삭제에 실패했습니다." },
    { status: 500 }
  );
}
```

### 드롭다운 메뉴 구현

**옵션 1: shadcn/ui DropdownMenu 사용**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button>
      <MoreHorizontal />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {isOwnPost && (
      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
        삭제
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

**옵션 2: 커스텀 드롭다운 메뉴**
```tsx
const [showMenu, setShowMenu] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);

// 외부 클릭 시 메뉴 닫기
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

<div className="relative" ref={menuRef}>
  <button onClick={() => setShowMenu(!showMenu)}>
    <MoreHorizontal />
  </button>
  {showMenu && (
    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg">
      {isOwnPost && (
        <button onClick={handleDeleteClick}>삭제</button>
      )}
    </div>
  )}
</div>
```

**권장:** 옵션 1 (shadcn/ui DropdownMenu) - 일관성 및 접근성

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
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
        취소
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        {deleting ? "삭제 중..." : "삭제"}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 게시물 삭제 후 피드 업데이트

**PostFeed에서:**
```tsx
const handlePostDelete = useCallback((postId: string) => {
  setPosts((prev) => prev.filter((post) => post.id !== postId));
}, []);

<PostCard
  post={post}
  onPostDelete={handlePostDelete}
/>
```

**PostCard에서:**
```tsx
interface PostCardProps {
  // ... 기존 props
  onPostDelete?: (postId: string) => void;
}

const handleDelete = async () => {
  // API 호출
  // 성공 시
  if (onPostDelete) {
    onPostDelete(post.id);
  }
};
```

## 파일 구조

```
app/
└── api/
    └── posts/
        └── [postId]/
            └── route.ts            # 게시물 삭제 API (신규)

components/
├── post/
│   ├── PostCard.tsx                # 삭제 메뉴 통합 (수정)
│   ├── PostModal.tsx               # 삭제 메뉴 통합 (수정)
│   ├── PostFeed.tsx                # 삭제 콜백 처리 (수정)
│   └── DeletePostDialog.tsx        # 삭제 확인 다이얼로그 (선택사항)
└── profile/
    └── PostGrid.tsx                # 삭제 콜백 처리 (수정)
```

## 구현 순서

1. **게시물 삭제 API Route 개발**
   - DELETE 메서드 구현
   - 본인 게시물 검증
   - Storage 이미지 삭제
   - DB 게시물 삭제
   - 에러 처리

2. **드롭다운 메뉴 구현**
   - shadcn/ui DropdownMenu 설치 및 사용
   - 본인 게시물 여부 확인
   - 삭제 옵션 표시

3. **삭제 확인 다이얼로그 구현**
   - Dialog 컴포넌트 사용
   - 삭제 확인 메시지
   - 로딩 상태 표시

4. **PostCard 통합**
   - 드롭다운 메뉴 추가
   - 삭제 확인 다이얼로그 통합
   - 삭제 핸들러 구현
   - 삭제 콜백 처리

5. **PostModal 통합**
   - 드롭다운 메뉴 추가
   - 삭제 확인 다이얼로그 통합
   - 삭제 핸들러 구현
   - 삭제 후 모달 닫기

6. **PostFeed 및 PostGrid 통합**
   - 삭제 콜백 처리
   - 게시물 목록에서 제거

7. **에러 처리 및 최적화**
   - 에러 처리 개선
   - 로딩 상태 개선
   - 성능 최적화

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Dialog, DropdownMenu
- **기존 컴포넌트**: PostCard, PostModal, PostFeed, PostGrid
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (posts 테이블, Storage)
- **인증**: Clerk
- **타입**: TypeScript

## 참고 파일

- [PRD.md](docs/PRD.md) - 게시물 삭제 스펙 (섹션 7.2)
- [DB.sql](supabase/migrations/DB.sql) - posts 테이블 스키마
- [app/api/posts/route.ts](app/api/posts/route.ts) - 게시물 API 참고
- [lib/supabase/service-role.ts](lib/supabase/service-role.ts) - Service Role 클라이언트
- [components/post/PostCard.tsx](components/post/PostCard.tsx) - PostCard 컴포넌트
- [components/post/PostModal.tsx](components/post/PostModal.tsx) - PostModal 컴포넌트
- [components/ui/dialog.tsx](components/ui/dialog.tsx) - Dialog 컴포넌트

## 주의사항

1. **본인 게시물 검증**: API에서 명시적으로 검증 필수
2. **Storage 이미지 삭제**: Service Role 클라이언트 사용
3. **삭제 확인**: 실수 방지를 위한 확인 다이얼로그 필수
4. **CASCADE 삭제**: DB에서 자동 처리되므로 별도 처리 불필요
5. **에러 처리**: Storage 삭제 실패 시에도 DB 삭제는 진행
6. **피드 업데이트**: 삭제 후 즉시 피드에서 제거
7. **로딩 상태**: 삭제 진행 중 로딩 상태 표시
8. **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 테스트 체크리스트

- [ ] 게시물 삭제 API 작동 확인
- [ ] 본인 게시물만 삭제 가능 확인
- [ ] 다른 사람 게시물 삭제 불가 확인
- [ ] Storage 이미지 삭제 확인
- [ ] 삭제 확인 다이얼로그 표시 확인
- [ ] 드롭다운 메뉴 표시 확인
- [ ] PostCard에서 삭제 기능 확인
- [ ] PostModal에서 삭제 기능 확인
- [ ] 삭제 후 피드에서 제거 확인
- [ ] 삭제 후 프로필 페이지 게시물 수 업데이트 확인
- [ ] 에러 처리 확인
- [ ] 로딩 상태 표시 확인

