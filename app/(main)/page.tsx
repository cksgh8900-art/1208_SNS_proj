import { Suspense } from "react";
import PostFeed from "@/components/post/PostFeed";
import PostCardSkeleton from "@/components/post/PostCardSkeleton";

/**
 * @file app/(main)/page.tsx
 * @description Instagram Clone SNS 홈 피드 페이지
 *
 * 이 페이지는 메인 레이아웃((main)/layout.tsx)을 사용합니다.
 * PostFeed 컴포넌트를 통해 게시물 목록을 표시합니다.
 */

function PostFeedSkeleton() {
  return (
    <>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="w-full bg-instagram-background">
      <Suspense fallback={<PostFeedSkeleton />}>
        <PostFeed />
      </Suspense>
    </div>
  );
}

