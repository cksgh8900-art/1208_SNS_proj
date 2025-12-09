/**
 * @file PostGridSkeleton.tsx
 * @description 프로필 페이지 게시물 그리드 로딩 스켈레톤 UI 컴포넌트
 *
 * 게시물 그리드 로딩 중 사용자에게 시각적인 피드백을 제공합니다.
 */

export default function PostGridSkeleton() {
  return (
    <div className="w-full">
      {/* 탭 메뉴 스켈레톤 */}
      <div className="w-full border-t border-instagram-border">
        <div className="flex items-center justify-center gap-16">
          <div className="h-12 w-20 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-12 w-20 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-12 w-20 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>

      {/* 그리드 스켈레톤 */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 mt-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

