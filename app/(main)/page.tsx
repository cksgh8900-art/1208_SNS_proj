/**
 * @file app/(main)/page.tsx
 * @description Instagram Clone SNS 홈 피드 페이지
 *
 * 이 페이지는 메인 레이아웃((main)/layout.tsx)을 사용합니다.
 * PostFeed 컴포넌트는 나중에 구현됩니다.
 *
 * 현재는 임시 콘텐츠를 표시합니다.
 */

export default function HomePage() {
  return (
    <div className="w-full">
      <div className="p-4">
        <h1 className="text-2xl font-instagram-bold text-instagram-text-primary mb-4">
          홈 피드
        </h1>
        <p className="text-instagram-sm text-instagram-text-secondary">
          게시물 피드가 여기에 표시됩니다.
        </p>
      </div>
    </div>
  );
}

