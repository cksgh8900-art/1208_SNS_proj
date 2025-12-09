# 팔로우 기능 개발 계획

## 개요

PRD.md와 DB.sql을 기반으로 Instagram Clone SNS의 팔로우 기능을 개발합니다. 사용자가 다른 사용자를 팔로우/언팔로우할 수 있는 기능을 구현하며, Optimistic UI 업데이트와 실시간 통계 업데이트를 포함합니다.

## 현재 상태

- `app/api/follows/route.ts`: 없음 (생성 필요)
- `components/profile/FollowButton.tsx`: 없음 (생성 필요)
- `components/profile/ProfileHeader.tsx`: 팔로우 버튼 UI만 존재 (실제 기능 미구현)
- `supabase/migrations/DB.sql`: follows 테이블 정의됨
- `app/api/users/[userId]/route.ts`: 팔로우 상태 확인 기능 존재
- `app/api/likes/route.ts`: 좋아요 API 참고 가능

## 개발할 컴포넌트 및 파일

### 1. 팔로우 API Route

#### 1.1 `app/api/follows/route.ts` 생성

**POST 메서드 구현:**

**기능:**
- 팔로우 추가
- 인증 검증 (Clerk)
- 자기 자신 팔로우 방지
- 중복 팔로우 방지 (UNIQUE 제약조건)
- 팔로워 수 반환

**요청 형식:**
```json
{
  "followingId": "uuid" // 팔로우할 사용자의 Supabase user_id
}
```

**응답 형식:**
```typescript
{
  message: string;
  data?: {
    followersCount: number;
  };
  error?: string;
}
```

**구현 로직:**
1. 인증 확인 (Clerk)
2. 요청 본문 파싱 (followingId)
3. 현재 사용자의 Supabase user_id 조회
4. 자기 자신 팔로우 방지 검증
5. 중복 팔로우 확인
6. follows 테이블에 데이터 삽입
7. 업데이트된 팔로워 수 조회
8. 응답 반환

**에러 처리:**
- 인증되지 않은 사용자: 401 에러
- followingId 누락: 400 에러
- 자기 자신 팔로우 시도: 400 에러
- 중복 팔로우: 409 에러
- 데이터베이스 에러: 500 에러

**DELETE 메서드 구현:**

**기능:**
- 팔로우 제거 (언팔로우)
- 인증 검증 (Clerk)
- 팔로워 수 반환

**요청 형식:**
```json
{
  "followingId": "uuid" // 언팔로우할 사용자의 Supabase user_id
}
```

**응답 형식:**
```typescript
{
  message: string;
  data?: {
    followersCount: number;
  };
  error?: string;
}
```

**구현 로직:**
1. 인증 확인 (Clerk)
2. 요청 본문 파싱 (followingId)
3. 현재 사용자의 Supabase user_id 조회
4. follows 테이블에서 데이터 삭제
5. 업데이트된 팔로워 수 조회
6. 응답 반환

**에러 처리:**
- 인증되지 않은 사용자: 401 에러
- followingId 누락: 400 에러
- 팔로우 관계가 없음: 404 에러
- 데이터베이스 에러: 500 에러

### 2. FollowButton 컴포넌트

#### 2.1 `components/profile/FollowButton.tsx` 생성

**Props:**
```typescript
interface FollowButtonProps {
  followingId: string; // 팔로우할 사용자의 Supabase user_id
  initialFollowing: boolean; // 초기 팔로우 상태
  initialFollowersCount: number; // 초기 팔로워 수
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void; // 팔로우 상태 변경 콜백
  size?: "sm" | "md" | "lg"; // 버튼 크기
}
```

**구성 요소:**

**1. 버튼 상태**
- 미팔로우: "팔로우" 버튼 (파란색 배경)
- 팔로우 중: "팔로잉" 버튼 (회색 배경)
- Hover 시: "언팔로우" 텍스트 (빨간 테두리)

**2. 상태 관리**
- `isFollowing`: 팔로우 상태
- `followersCount`: 팔로워 수
- `loading`: 로딩 상태
- `error`: 에러 메시지

**3. 기능**
- 클릭 시 API 호출
- Optimistic UI 업데이트
- 에러 발생 시 롤백
- 로딩 상태 표시

**스타일:**
- 미팔로우: `bg-instagram-blue text-white hover:bg-blue-600`
- 팔로우 중: `bg-gray-200 text-instagram-text-primary hover:bg-red-50 hover:text-red-500 hover:border-red-500`
- Hover 시: "언팔로우" 텍스트 표시

**구현 예시:**
```tsx
const [isFollowing, setIsFollowing] = useState(initialFollowing);
const [followersCount, setFollowersCount] = useState(initialFollowersCount);
const [loading, setLoading] = useState(false);

const handleFollow = async () => {
  if (loading) return;

  // Optimistic 업데이트
  const previousFollowing = isFollowing;
  const previousCount = followersCount;

  setIsFollowing(!isFollowing);
  setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
  setLoading(true);

  try {
    const response = await fetch("/api/follows", {
      method: isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "팔로우 처리 중 오류가 발생했습니다.");
    }

    // 성공 시 서버에서 받은 팔로워 수로 업데이트
    if (data.data?.followersCount !== undefined) {
      setFollowersCount(data.data.followersCount);
    }

    // 콜백 호출
    if (onFollowChange) {
      onFollowChange(!isFollowing, data.data?.followersCount || followersCount);
    }
  } catch (error: any) {
    // 실패 시 롤백
    setIsFollowing(previousFollowing);
    setFollowersCount(previousCount);
    console.error("팔로우 처리 에러:", error);
  } finally {
    setLoading(false);
  }
};
```

### 3. ProfileHeader 통합

#### 3.1 `components/profile/ProfileHeader.tsx` 업데이트

**변경 사항:**
- FollowButton 컴포넌트 사용
- 팔로우 버튼 로직을 FollowButton으로 대체
- 팔로워 수 실시간 업데이트

**구현:**
```tsx
import FollowButton from "./FollowButton";

// 기존 팔로우 버튼을 FollowButton으로 교체
{!isOwnProfile && (
  <FollowButton
    followingId={user.id}
    initialFollowing={user.is_following || false}
    initialFollowersCount={user.followers_count}
    onFollowChange={(isFollowing, followersCount) => {
      setIsFollowing(isFollowing);
      setFollowersCount(followersCount);
    }}
  />
)}
```

### 4. 프로필 페이지 통합

#### 4.1 `app/(main)/profile/[userId]/page.tsx` 업데이트

**변경 사항:**
- 팔로우 상태 변경 시 사용자 정보 새로고침 (선택사항)
- 또는 ProfileHeader에서 팔로워 수만 업데이트

**구현:**
```tsx
const handleFollowChange = (isFollowing: boolean, followersCount: number) => {
  // 사용자 정보 업데이트 (선택사항)
  // 또는 ProfileHeader에서만 상태 업데이트
};
```

## 상세 구현 사항

### 팔로우 API 구현

**POST 메서드:**
```typescript
export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { followingId } = await request.json();
  if (!followingId) {
    return NextResponse.json({ error: "followingId가 필요합니다." }, { status: 400 });
  }

  const supabase = createClerkSupabaseClient();

  // 현재 사용자의 Supabase user_id 조회
  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  // 자기 자신 팔로우 방지
  if (currentUser.id === followingId) {
    return NextResponse.json(
      { error: "자기 자신을 팔로우할 수 없습니다." },
      { status: 400 }
    );
  }

  // 팔로우 추가
  const { error: insertError } = await supabase
    .from("follows")
    .insert({ follower_id: currentUser.id, following_id: followingId });

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique constraint violation (이미 팔로우 중)
      return NextResponse.json(
        { error: "이미 팔로우 중입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "팔로우 추가에 실패했습니다." },
      { status: 500 }
    );
  }

  // 업데이트된 팔로워 수 조회
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", followingId);

  return NextResponse.json({
    message: "팔로우가 추가되었습니다.",
    data: { followersCount: count },
  });
}
```

**DELETE 메서드:**
```typescript
export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { followingId } = await request.json();
  if (!followingId) {
    return NextResponse.json({ error: "followingId가 필요합니다." }, { status: 400 });
  }

  const supabase = createClerkSupabaseClient();

  // 현재 사용자의 Supabase user_id 조회
  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  // 팔로우 제거
  const { error: deleteError, count } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", currentUser.id)
    .eq("following_id", followingId)
    .select("*", { count: "exact" });

  if (deleteError) {
    return NextResponse.json(
      { error: "팔로우 제거에 실패했습니다." },
      { status: 500 }
    );
  }

  if (count === 0) {
    return NextResponse.json(
      { error: "팔로우 관계를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 업데이트된 팔로워 수 조회
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", followingId);

  return NextResponse.json({
    message: "팔로우가 제거되었습니다.",
    data: { followersCount },
  });
}
```

### FollowButton 구현

**버튼 스타일:**
```tsx
<Button
  onClick={handleFollow}
  disabled={loading}
  className={`
    text-instagram-sm font-instagram-semibold
    ${
      isFollowing
        ? "bg-gray-200 text-instagram-text-primary hover:bg-red-50 hover:text-red-500 hover:border-red-500"
        : "bg-instagram-blue text-white hover:bg-blue-600"
    }
  `}
>
  {loading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <span className="group-hover:hidden">
      {isFollowing ? "팔로잉" : "팔로우"}
    </span>
  )}
  {isFollowing && (
    <span className="hidden group-hover:inline text-red-500">
      언팔로우
    </span>
  )}
</Button>
```

**Hover 효과:**
- 팔로우 중 상태에서 Hover 시 "언팔로우" 텍스트 표시
- 빨간 테두리 및 텍스트 색상 변경

### Optimistic UI 업데이트

**구현:**
```typescript
// Optimistic 업데이트
const previousFollowing = isFollowing;
const previousCount = followersCount;

setIsFollowing(!isFollowing);
setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

try {
  // API 호출
  // 성공 시 서버 데이터로 업데이트
} catch (error) {
  // 실패 시 롤백
  setIsFollowing(previousFollowing);
  setFollowersCount(previousCount);
}
```

### 팔로워 수 실시간 업데이트

**구현:**
```typescript
// ProfileHeader에서
const [followersCount, setFollowersCount] = useState(user.followers_count);

// FollowButton의 onFollowChange 콜백
onFollowChange={(isFollowing, newFollowersCount) => {
  setIsFollowing(isFollowing);
  setFollowersCount(newFollowersCount);
}}
```

## 파일 구조

```
app/
└── api/
    └── follows/
        └── route.ts            # 팔로우 API (신규)

components/
└── profile/
    ├── ProfileHeader.tsx       # FollowButton 통합 (수정)
    └── FollowButton.tsx        # 팔로우 버튼 컴포넌트 (신규)
```

## 구현 순서

1. **팔로우 API Route 개발**
   - POST 메서드 구현
   - DELETE 메서드 구현
   - 에러 처리

2. **FollowButton 컴포넌트 개발**
   - 버튼 상태 관리
   - API 호출 로직
   - Optimistic UI 업데이트
   - Hover 효과

3. **ProfileHeader 통합**
   - FollowButton 컴포넌트 사용
   - 팔로워 수 실시간 업데이트

4. **에러 처리 및 최적화**
   - 에러 처리 개선
   - 로딩 상태 개선
   - 성능 최적화

## 기술 스택

- **UI 컴포넌트**: shadcn/ui Button
- **기존 컴포넌트**: ProfileHeader
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (follows 테이블)
- **인증**: Clerk
- **타입**: TypeScript

## 참고 파일

- [PRD.md](docs/PRD.md) - 팔로우 기능 스펙 (섹션 7.6)
- [DB.sql](supabase/migrations/DB.sql) - follows 테이블 스키마
- [app/api/likes/route.ts](app/api/likes/route.ts) - 좋아요 API 참고
- [components/post/LikeButton.tsx](components/post/LikeButton.tsx) - LikeButton 컴포넌트 참고
- [components/profile/ProfileHeader.tsx](components/profile/ProfileHeader.tsx) - ProfileHeader 컴포넌트

## 주의사항

1. **자기 자신 팔로우 방지**: API에서 명시적으로 검증
2. **중복 팔로우 방지**: UNIQUE 제약조건 활용
3. **Optimistic UI**: 실패 시 롤백 처리 필수
4. **팔로워 수 업데이트**: 실시간으로 업데이트되어야 함
5. **에러 처리**: 사용자 친화적인 에러 메시지 제공
6. **로딩 상태**: 버튼 클릭 시 로딩 상태 표시
7. **Hover 효과**: 팔로우 중 상태에서만 "언팔로우" 표시

## 테스트 체크리스트

- [ ] 팔로우 추가 API 작동 확인
- [ ] 팔로우 제거 API 작동 확인
- [ ] 자기 자신 팔로우 방지 확인
- [ ] 중복 팔로우 방지 확인
- [ ] FollowButton 컴포넌트 렌더링
- [ ] 버튼 상태 변경 확인
- [ ] Hover 효과 확인
- [ ] Optimistic UI 업데이트 확인
- [ ] 에러 발생 시 롤백 확인
- [ ] 팔로워 수 실시간 업데이트 확인
- [ ] 로딩 상태 표시 확인

