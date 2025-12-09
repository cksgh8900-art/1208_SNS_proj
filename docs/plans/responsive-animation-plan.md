# 반응형 및 애니메이션 기능 개발 계획

## 개요

PRD.md와 DB.sql을 기반으로 Instagram Clone SNS의 반응형 레이아웃과 애니메이션 기능을 완성합니다. 이미 일부 기능이 구현되어 있으나, 검증 및 개선이 필요한 부분들을 확인하고 완성합니다.

## 현재 상태

### 이미 구현된 기능

- **반응형 레이아웃**: Sidebar, Header, BottomNav 기본 구조 구현됨
- **좋아요 애니메이션**: LikeButton에 scale 애니메이션 구현됨
- **더블탭 좋아요**: PostCard에 큰 하트 애니메이션 구현됨
- **무한 스크롤**: PostFeed에 Intersection Observer 구현됨
- **Skeleton UI**: PostCardSkeleton 구현됨

### 검증 및 개선이 필요한 부분

- 반응형 브레이크포인트 적용 검증
- 애니메이션 완성도 검증
- Shimmer 효과 추가
- 추가 애니메이션 개선

## 개발할 작업

### 1. 반응형 브레이크포인트 검증 및 개선

#### 1.1 레이아웃 컴포넌트 검증

**Sidebar (`components/layout/Sidebar.tsx`):**
- Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트 확인
- Tablet (768px-1023px): 72px 너비, 아이콘만 확인
- Mobile (<768px): 숨김 확인

**Header (`components/layout/Header.tsx`):**
- Mobile (<768px): 표시 확인
- Desktop/Tablet: 숨김 확인
- 높이 60px 확인

**BottomNav (`components/layout/BottomNav.tsx`):**
- Mobile (<768px): 표시 확인
- Desktop/Tablet: 숨김 확인
- 높이 50px 확인

**Main Layout (`app/(main)/layout.tsx`):**
- Desktop: Sidebar(244px) + Main Content(max 630px 중앙) 확인
- Tablet: Sidebar(72px) + Main Content 확인
- Mobile: Header(60px) + Main Content + BottomNav(50px) 확인
- 패딩 및 여백 확인

#### 1.2 PostCard 반응형 검증

**PostCard (`components/post/PostCard.tsx`):**
- Mobile: 전체 너비 확인
- Desktop/Tablet: 최대 630px 확인
- 이미지 비율 1:1 유지 확인
- 텍스트 크기 반응형 확인

#### 1.3 프로필 페이지 반응형 검증

**ProfileHeader (`components/profile/ProfileHeader.tsx`):**
- 프로필 이미지 크기: Desktop 150px, Mobile 90px 확인
- 레이아웃: Desktop 가로, Mobile 세로 확인

**PostGrid (`components/profile/PostGrid.tsx`):**
- 3열 그리드 레이아웃 확인
- 반응형 간격 확인

### 2. 좋아요 애니메이션 개선

#### 2.1 LikeButton 애니메이션 검증

**현재 구현:**
- 클릭 시 scale(1.3) → scale(1) (0.15초)
- 빈 하트 → 빨간 하트 전환

**검증 사항:**
- 애니메이션 타이밍 확인 (0.15초)
- scale 변환 확인
- 색상 전환 확인
- 부드러운 전환 확인

**개선 사항:**
- 애니메이션 easing 함수 확인
- 성능 최적화 (transform 사용)

#### 2.2 더블탭 좋아요 애니메이션 검증

**현재 구현:**
- 큰 하트 fade in/out (1초)
- `animate-fade-in-out-heart` 키프레임 사용

**검증 사항:**
- 키프레임 정의 확인 (`app/globals.css`)
- 애니메이션 타이밍 확인 (1초)
- fade in/out 확인
- scale 변환 확인

**개선 사항:**
- 애니메이션 완성도 확인
- 모바일 터치 이벤트 확인

### 3. Skeleton UI 개선

#### 3.1 PostCardSkeleton 검증

**현재 구현:**
- 기본 Skeleton UI 구현됨
- `animate-pulse` 사용

**개선 사항:**
- Shimmer 효과 추가
- 더 자연스러운 로딩 애니메이션
- PostGridSkeleton에도 Shimmer 적용

**Shimmer 효과 구현:**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

### 4. 추가 애니메이션 개선

#### 4.1 버튼 Hover 효과

**현재 구현:**
- 기본 hover 효과 있음

**개선 사항:**
- 부드러운 transition 확인
- 색상 전환 확인
- scale 효과 추가 (선택사항)

#### 4.2 모달 애니메이션

**현재 구현:**
- Dialog 컴포넌트 기본 애니메이션 사용

**검증 사항:**
- 모달 열기/닫기 애니메이션 확인
- 배경 오버레이 fade 효과 확인
- 내용 zoom 효과 확인

#### 4.3 드롭다운 메뉴 애니메이션

**현재 구현:**
- 커스텀 드롭다운 메뉴 구현됨

**개선 사항:**
- 페이드 인/아웃 효과 추가
- 슬라이드 다운 효과 추가
- 부드러운 전환

#### 4.4 이미지 로딩 애니메이션

**현재 구현:**
- Next.js Image 컴포넌트 사용

**개선 사항:**
- 이미지 로딩 중 placeholder 표시
- 페이드 인 효과 추가
- 로딩 실패 시 대체 이미지

### 5. 성능 최적화

#### 5.1 애니메이션 성능

**최적화 사항:**
- `transform` 및 `opacity` 사용 (GPU 가속)
- `will-change` 속성 사용 (필요시)
- 불필요한 리플로우 방지

#### 5.2 반응형 성능

**최적화 사항:**
- 미디어 쿼리 최적화
- 불필요한 리렌더링 방지
- 이미지 최적화 (Next.js Image)

## 상세 구현 사항

### 반응형 브레이크포인트 검증

**Tailwind CSS 브레이크포인트:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**프로젝트 브레이크포인트:**
- Mobile: < 768px
- Tablet: 768px ~ 1023px
- Desktop: ≥ 1024px

**검증 방법:**
- 브라우저 개발자 도구 사용
- 다양한 화면 크기에서 테스트
- 실제 디바이스 테스트 (선택사항)

### Shimmer 효과 구현

**PostCardSkeleton에 적용:**
```tsx
<div className="relative overflow-hidden">
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  <div className="h-full w-full bg-gray-200" />
</div>
```

**CSS 키프레임:**
```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
```

### 애니메이션 개선

**좋아요 버튼:**
```tsx
className={`
  transition-transform duration-150 ease-out
  ${animating ? "scale-125" : "scale-100"}
`}
```

**드롭다운 메뉴:**
```tsx
className={`
  transition-all duration-200 ease-out
  ${showMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
`}
```

**이미지 로딩:**
```tsx
<Image
  className="transition-opacity duration-300"
  onLoadingComplete={() => setImageLoaded(true)}
/>
```

## 파일 구조

```
app/
└── globals.css                    # 애니메이션 키프레임 추가 (수정)

components/
├── post/
│   ├── PostCard.tsx              # 반응형 검증 (수정)
│   └── PostCardSkeleton.tsx      # Shimmer 효과 추가 (수정)
└── profile/
    └── PostGridSkeleton.tsx      # Shimmer 효과 추가 (수정)
```

## 구현 순서

1. **반응형 브레이크포인트 검증**
   - 레이아웃 컴포넌트 검증
   - PostCard 반응형 검증
   - 프로필 페이지 반응형 검증
   - 문제 발견 시 수정

2. **애니메이션 검증 및 개선**
   - 좋아요 애니메이션 검증
   - 더블탭 좋아요 애니메이션 검증
   - 모달 애니메이션 검증
   - 드롭다운 메뉴 애니메이션 개선

3. **Skeleton UI 개선**
   - Shimmer 효과 추가
   - PostCardSkeleton 개선
   - PostGridSkeleton 개선

4. **성능 최적화**
   - 애니메이션 성능 최적화
   - 반응형 성능 최적화

5. **최종 테스트**
   - 다양한 화면 크기에서 테스트
   - 애니메이션 동작 확인
   - 성능 확인

## 기술 스택

- **CSS**: Tailwind CSS v4
- **애니메이션**: CSS Keyframes, Tailwind Transitions
- **이미지**: Next.js Image 컴포넌트
- **반응형**: Tailwind CSS 미디어 쿼리

## 참고 파일

- [PRD.md](docs/PRD.md) - 반응형 및 애니메이션 스펙 (섹션 2, 8, 9)
- [app/globals.css](app/globals.css) - 전역 CSS 및 애니메이션
- [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) - Sidebar 컴포넌트
- [components/layout/Header.tsx](components/layout/Header.tsx) - Header 컴포넌트
- [components/layout/BottomNav.tsx](components/layout/BottomNav.tsx) - BottomNav 컴포넌트
- [components/post/LikeButton.tsx](components/post/LikeButton.tsx) - LikeButton 컴포넌트
- [components/post/PostCard.tsx](components/post/PostCard.tsx) - PostCard 컴포넌트
- [components/post/PostCardSkeleton.tsx](components/post/PostCardSkeleton.tsx) - PostCardSkeleton 컴포넌트

## 주의사항

1. **성능**: 애니메이션은 GPU 가속 속성(`transform`, `opacity`) 사용
2. **접근성**: 애니메이션 선호도 설정 고려 (`prefers-reduced-motion`)
3. **일관성**: 모든 애니메이션의 타이밍과 easing 함수 통일
4. **반응형**: 모든 화면 크기에서 정상 작동 확인
5. **브라우저 호환성**: 주요 브라우저에서 테스트

## 테스트 체크리스트

- [ ] Desktop 레이아웃 확인 (≥1024px)
- [ ] Tablet 레이아웃 확인 (768px-1023px)
- [ ] Mobile 레이아웃 확인 (<768px)
- [ ] 좋아요 애니메이션 확인
- [ ] 더블탭 좋아요 애니메이션 확인
- [ ] Skeleton UI Shimmer 효과 확인
- [ ] 모달 애니메이션 확인
- [ ] 드롭다운 메뉴 애니메이션 확인
- [ ] 이미지 로딩 애니메이션 확인
- [ ] 성능 확인 (애니메이션 프레임레이트)
- [ ] 접근성 확인 (prefers-reduced-motion)

