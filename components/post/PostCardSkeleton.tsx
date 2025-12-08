/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 Skeleton 컴포넌트
 *
 * PostCard와 동일한 구조의 로딩 UI를 제공합니다.
 * Shimmer 애니메이션 효과를 포함합니다.
 */

export default function PostCardSkeleton() {
  return (
    <article className="bg-white border border-instagram-border border-t-0 mb-4 animate-pulse">
      {/* 헤더 Skeleton */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-2">
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </header>

      {/* 이미지 Skeleton */}
      <div className="relative w-full aspect-square bg-gray-200" />

      {/* 액션 버튼 Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* 좋아요 수 Skeleton */}
      <div className="px-4 pb-2">
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>

      {/* 캡션 Skeleton */}
      <div className="px-4 pb-2">
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
        </div>
      </div>

      {/* 댓글 미리보기 Skeleton */}
      <div className="px-4 pb-3">
        <div className="w-32 h-3 bg-gray-200 rounded mb-2" />
        <div className="space-y-1">
          <div className="w-full h-3 bg-gray-200 rounded" />
          <div className="w-4/5 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    </article>
  );
}

