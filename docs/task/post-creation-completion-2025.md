# 게시물 작성 기능 개발 완료 보고서

## 작업 일자
2025년 1월

## 작업 개요
Instagram Clone SNS 프로젝트의 게시물 작성 기능을 구현했습니다. 사용자가 이미지를 업로드하고 캡션을 입력하여 게시물을 생성할 수 있는 기능을 개발했습니다.

## 구현된 기능

### 1. 게시물 생성 API Route (`app/api/posts/route.ts`)

**POST 메서드 구현:**
- 인증 검증 (Clerk)
- FormData 파싱 (이미지 파일, 캡션)
- 이미지 파일 검증:
  - 파일 존재 확인
  - 파일 크기 검증 (최대 5MB)
  - 파일 형식 검증 (JPEG, PNG, WebP, GIF)
- 캡션 검증 (최대 2,200자)
- 현재 사용자의 Supabase user_id 조회
- Supabase Storage에 이미지 업로드:
  - 경로: `{clerk_user_id}/{timestamp}_{filename}`
  - 공개 읽기 가능
- posts 테이블에 데이터 저장
- 에러 처리 및 롤백 로직

**주요 특징:**
- Service Role 클라이언트 사용 (Storage 업로드용)
- 업로드 실패 시 파일 자동 삭제 (롤백)
- 상세한 에러 메시지 제공

### 2. CreatePostModal 컴포넌트 (`components/post/CreatePostModal.tsx`)

**구현된 기능:**
- Dialog 컴포넌트 기반 모달 UI
- 이미지 파일 선택 및 미리보기:
  - 파일 선택 버튼
  - 이미지 미리보기 (1:1 정사각형 또는 원본 비율)
  - 이미지 제거 버튼
  - object URL 생성 및 메모리 관리
- 캡션 입력 필드:
  - Textarea 컴포넌트 사용
  - 최대 2,200자 제한
  - 글자 수 표시
  - Placeholder 텍스트
- 파일 검증 (클라이언트 사이드):
  - 파일 크기 검증 (5MB)
  - 파일 형식 검증
  - 사용자 친화적인 에러 메시지
- 업로드 진행 상태:
  - 로딩 스피너 표시
  - 버튼 비활성화
  - 에러 메시지 표시
- 업로드 완료 후 처리:
  - 모달 닫기
  - 피드 새로고침 (router.refresh())
  - 콜백 호출 (선택사항)

**UI/UX 특징:**
- Instagram 스타일 디자인
- 반응형 레이아웃
- 접근성 고려 (ARIA 레이블)
- 에러 상태 시각적 피드백

### 3. Sidebar 통합 (`components/layout/Sidebar.tsx`)

**변경 사항:**
- CreatePostModal import 및 상태 관리
- "만들기" 버튼 클릭 시 모달 열기
- Desktop 및 Tablet 레이아웃 모두 지원

### 4. BottomNav 통합 (`components/layout/BottomNav.tsx`)

**변경 사항:**
- CreatePostModal import 및 상태 관리
- "만들기" 버튼 클릭 시 모달 열기
- Mobile 레이아웃 지원

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Dialog, Textarea, Button
- **파일 처리**: File API, FormData
- **이미지 미리보기**: URL.createObjectURL
- **API**: Next.js API Routes
- **Storage**: Supabase Storage
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Clerk
- **라우팅**: Next.js App Router (router.refresh())

## 파일 구조

```
app/
└── api/
    └── posts/
        └── route.ts                # POST 메서드 추가 (수정)

components/
├── layout/
│   ├── Sidebar.tsx                 # CreatePostModal 통합 (수정)
│   └── BottomNav.tsx               # CreatePostModal 통합 (수정)
└── post/
    └── CreatePostModal.tsx         # 게시물 작성 모달 (신규)
```

## 주요 구현 세부사항

### 이미지 파일 검증

**클라이언트 사이드:**
```typescript
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // 파일 크기 확인 (5MB)
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "이미지 크기는 5MB를 초과할 수 없습니다." };
  }

  // 파일 형식 확인
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "지원되는 이미지 형식만 업로드할 수 있습니다." };
  }

  return { valid: true };
};
```

**서버 사이드:**
- 동일한 검증 로직을 서버에서도 수행하여 보안 강화

### Supabase Storage 업로드

```typescript
// 파일명 생성
const timestamp = Date.now();
const fileExtension = imageFile.name.split(".").pop() || "jpg";
const fileName = `${timestamp}_${imageFile.name}`;
const filePath = `${clerkUserId}/${fileName}`;

// 파일을 ArrayBuffer로 변환
const arrayBuffer = await imageFile.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Supabase Storage에 업로드
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("posts")
  .upload(filePath, buffer, {
    contentType: imageFile.type,
    upsert: false,
  });

// 공개 URL 획득
const { data: { publicUrl } } = supabase.storage
  .from("posts")
  .getPublicUrl(filePath);
```

### 메모리 관리

```typescript
// object URL 정리
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

## 에러 처리

### 클라이언트 사이드
- 파일 크기 초과: "이미지 크기는 5MB를 초과할 수 없습니다."
- 잘못된 파일 형식: "지원되는 이미지 형식만 업로드할 수 있습니다. (JPEG, PNG, WebP, GIF)"
- 업로드 실패: "게시물 업로드 중 오류가 발생했습니다."

### 서버 사이드
- 인증 실패: 401 에러
- 파일 누락: 400 에러
- 검증 실패: 400 에러 및 상세 메시지
- Storage 업로드 실패: 500 에러 (업로드된 파일 자동 삭제)
- 데이터베이스 에러: 500 에러

## 테스트 체크리스트

- [x] 이미지 파일 선택 및 미리보기
- [x] 파일 크기 제한 검증 (5MB)
- [x] 파일 형식 검증 (JPEG, PNG, WebP, GIF)
- [x] 캡션 입력 및 글자 수 제한 (2,200자)
- [x] 업로드 진행 상태 표시
- [x] 업로드 완료 후 피드 새로고침
- [x] 에러 처리 및 메시지 표시
- [x] Sidebar "만들기" 버튼 동작
- [x] BottomNav "만들기" 버튼 동작
- [x] 모달 닫기 및 상태 초기화
- [x] 메모리 누수 방지 (object URL 정리)

## 향후 개선 사항

1. **이미지 최적화**
   - 이미지 리사이징 (클라이언트 또는 서버)
   - WebP 변환
   - 썸네일 생성

2. **업로드 진행률 표시**
   - Progress Bar 추가
   - 파일 크기에 따른 예상 시간 표시

3. **다중 이미지 업로드**
   - 여러 이미지 선택 및 업로드
   - 이미지 순서 변경
   - 이미지 개별 삭제

4. **드래그 앤 드롭**
   - 파일 드래그 앤 드롭 지원
   - 더 나은 UX 제공

5. **이미지 편집**
   - 크롭 기능
   - 필터 적용
   - 밝기/대비 조정

## 참고 문서

- [PRD.md](docs/PRD.md) - 게시물 작성 스펙 (섹션 7.2)
- [DB.sql](supabase/migrations/DB.sql) - posts 테이블 스키마
- [lib/types.ts](lib/types.ts) - Post 타입 정의
- [components/ui/dialog.tsx](components/ui/dialog.tsx) - Dialog 컴포넌트
- [docs/supabase-storage-setup.md](docs/supabase-storage-setup.md) - Storage 설정 가이드

## 완료 상태

모든 계획된 기능이 성공적으로 구현되었습니다. 게시물 작성 기능은 프로덕션 환경에서 사용할 준비가 되었습니다.

