# 댓글 기능 개발 완료 보고서

## 작업 일자
2025년 1월

## 작업 개요
Instagram Clone SNS 프로젝트의 댓글 기능을 구현했습니다. 사용자가 게시물에 댓글을 작성하고, 조회하며, 본인의 댓글을 삭제할 수 있는 기능을 개발했습니다.

## 구현된 기능

### 1. 댓글 API Route (`app/api/comments/route.ts`)

**GET 메서드 구현:**
- 특정 게시물의 댓글 목록 조회
- 시간 역순 정렬 (최신순)
- 사용자 정보 JOIN
- 페이지네이션 지원 (limit, offset)
- 게시물 존재 확인

**POST 메서드 구현:**
- 댓글 작성
- 인증 검증 (Clerk)
- 게시물 존재 확인
- 댓글 내용 검증 (빈 댓글 방지)
- 현재 사용자의 Supabase user_id 조회
- comments 테이블에 데이터 저장
- 생성된 댓글과 사용자 정보 반환

**DELETE 메서드 구현:**
- 댓글 삭제
- 본인만 삭제 가능 (소유자 확인)
- 인증 검증 (Clerk)
- 댓글 존재 확인
- 에러 처리

**주요 특징:**
- 상세한 에러 메시지 제공
- 권한 확인 (삭제는 본인만)
- CommentWithUser 타입으로 응답

### 2. CommentList 컴포넌트 (`components/comment/CommentList.tsx`)

**구현된 기능:**
- 댓글 목록 렌더링
- 최신 댓글부터 표시
- maxDisplay 개수만큼만 표시 (나머지는 "모두 보기" 버튼)
- 삭제 버튼 표시 (본인만)
- 댓글 삭제 처리
- 로딩 상태 표시
- 에러 처리

**UI/UX 특징:**
- Instagram 스타일 디자인
- 사용자명 Bold, 프로필 링크
- 상대 시간 표시
- Hover 시 삭제 버튼 표시
- "댓글 N개 모두 보기" 버튼

**Props:**
- `postId`: 게시물 ID
- `initialComments`: 초기 댓글 (SSR용)
- `maxDisplay`: 최대 표시 개수 (PostCard: 2)
- `showDeleteButton`: 삭제 버튼 표시 여부
- `currentUserId`: 현재 사용자 ID
- `onCommentDelete`: 댓글 삭제 콜백

### 3. CommentForm 컴포넌트 (`components/comment/CommentForm.tsx`)

**구현된 기능:**
- 댓글 입력 필드
- Enter 키로 제출 (Shift+Enter는 줄바꿈)
- 제출 버튼으로 제출
- 제출 후 입력 필드 초기화
- 댓글 내용 검증
- 에러 처리
- 자동 포커스 (선택사항)

**UI/UX 특징:**
- Instagram 스타일 디자인
- 입력 필드: 테두리 없음, 배경 투명
- 제출 버튼: 파란색, 비활성화 시 회색
- Placeholder: "댓글 달기..."
- 제출 중 상태 표시

**Props:**
- `postId`: 게시물 ID
- `onSubmit`: 제출 성공 콜백
- `placeholder`: Placeholder 텍스트
- `autoFocus`: 자동 포커스

### 4. PostCard 통합 (`components/post/PostCard.tsx`)

**변경 사항:**
- CommentList 컴포넌트 import 및 통합
- CommentForm 컴포넌트 import 및 통합
- 댓글 수 상태 관리 (commentsCount)
- 댓글 작성 후 댓글 수 증가
- 댓글 삭제 후 댓글 수 감소

**레이아웃:**
```
┌─────────────────────────────────────┐
│ [게시물 헤더]                        │
├─────────────────────────────────────┤
│ [이미지]                            │
├─────────────────────────────────────┤
│ [액션 버튼]                         │
│ 좋아요 N개                          │
│ [캡션]                              │
│ [CommentList - 최신 2개]            │
│ [CommentForm]                       │
└─────────────────────────────────────┘
```

### 5. 타입 정의 확장 (`lib/types.ts`)

**CommentWithUser 타입 추가:**
```typescript
export interface CommentWithUser extends Comment {
  user?: User; // JOIN된 사용자 정보
}
```

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Textarea, Button
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Clerk
- **타입**: TypeScript

## 파일 구조

```
app/
└── api/
    └── comments/
        └── route.ts                # 댓글 API Route (신규)

components/
├── comment/
│   ├── CommentList.tsx            # 댓글 목록 컴포넌트 (신규)
│   └── CommentForm.tsx             # 댓글 작성 폼 컴포넌트 (신규)
└── post/
    └── PostCard.tsx                # 댓글 기능 통합 (수정)

lib/
└── types.ts                        # CommentWithUser 타입 추가 (수정)
```

## 주요 구현 세부사항

### 댓글 내용 검증

**클라이언트 사이드:**
```typescript
const validateComment = (text: string): { valid: boolean; error?: string } => {
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: "댓글을 입력해주세요." };
  }
  
  return { valid: true };
};
```

**서버 사이드:**
- 동일한 검증 로직을 서버에서도 수행하여 보안 강화

### 댓글 삭제 권한 확인

```typescript
// 댓글 존재 확인 및 소유자 확인
const { data: comment, error: commentError } = await supabase
  .from("comments")
  .select("user_id")
  .eq("id", commentId)
  .single();

// 소유자 확인
if (comment.user_id !== currentUser.id) {
  return NextResponse.json(
    { error: "댓글을 삭제할 권한이 없습니다." },
    { status: 403 }
  );
}
```

### Enter 키 처리

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (content.trim() && !submitting) {
      handleSubmit();
    }
  }
};
```

### 댓글 수 실시간 업데이트

```typescript
// 댓글 작성 후
<CommentForm
  onSubmit={(comment) => {
    setCommentsCount((prev) => prev + 1);
  }}
/>

// 댓글 삭제 후
<CommentList
  onCommentDelete={(commentId) => {
    setCommentsCount((prev) => Math.max(0, prev - 1));
  }}
/>
```

## 에러 처리

### 클라이언트 사이드
- 빈 댓글: "댓글을 입력해주세요."
- 댓글 작성 실패: "댓글 작성 중 오류가 발생했습니다."
- 댓글 삭제 실패: "댓글 삭제 중 오류가 발생했습니다."

### 서버 사이드
- 인증 실패: 401 에러
- 필수 파라미터 누락: 400 에러
- 게시물/댓글 없음: 404 에러
- 권한 없음 (삭제): 403 에러
- 댓글 내용 검증 실패: 400 에러
- 데이터베이스 에러: 500 에러

## 테스트 체크리스트

- [x] 댓글 목록 조회
- [x] 댓글 작성
- [x] 댓글 삭제 (본인만)
- [x] Enter 키로 댓글 제출
- [x] Shift+Enter로 줄바꿈
- [x] 댓글 수 실시간 업데이트
- [x] 최신 2개만 표시 (PostCard)
- [x] 삭제 버튼 표시 (본인만)
- [x] 에러 처리 및 메시지 표시
- [x] 로딩 상태 표시

## 향후 개선 사항

1. **댓글 상세 모달**
   - 전체 댓글 표시
   - 무한 스크롤
   - 댓글 수정 기능

2. **댓글 좋아요**
   - 댓글에 좋아요 기능 추가
   - 좋아요 수 표시

3. **댓글 답글**
   - 대댓글 기능
   - 답글 표시 (들여쓰기)

4. **댓글 알림**
   - 댓글 작성 시 알림
   - 댓글 멘션 기능

5. **댓글 필터링**
   - 최신순/인기순 정렬
   - 특정 사용자 댓글만 보기

## 참고 문서

- [PRD.md](docs/PRD.md) - 댓글 스펙 (섹션 7.4)
- [DB.sql](supabase/migrations/DB.sql) - comments 테이블 스키마
- [lib/types.ts](lib/types.ts) - Comment 타입 정의
- [components/post/PostCard.tsx](components/post/PostCard.tsx) - PostCard 컴포넌트
- [app/api/posts/route.ts](app/api/posts/route.ts) - 게시물 API 참고

## 완료 상태

모든 계획된 기능이 성공적으로 구현되었습니다. 댓글 기능은 프로덕션 환경에서 사용할 준비가 되었습니다.

