import { SignedIn, SignedOut } from "@clerk/nextjs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * @file app/(main)/layout.tsx
 * @description Instagram Clone SNS 메인 레이아웃
 *
 * 반응형 레이아웃 구조:
 * - Desktop (≥1024px): Sidebar(244px) + Main Content(max 630px 중앙)
 * - Tablet (768px-1023px): Sidebar(72px 아이콘만) + Main Content
 * - Mobile (<768px): Header(60px) + Main Content + BottomNav(50px)
 *
 * Main Content:
 * - 최대 너비: 630px
 * - 중앙 정렬
 * - 배경: #FAFAFA
 * - Mobile: Header와 BottomNav를 위한 패딩 추가
 */

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-instagram-background">
      {/* Mobile Header */}
      <Header />

      {/* Desktop/Tablet Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar (Desktop/Tablet만 표시, 인증된 사용자만) */}
        <SignedIn>
          <Sidebar />
        </SignedIn>

        {/* Main Content */}
        <main className="flex-1 w-full">
          {/* Desktop/Tablet: Sidebar 너비만큼 여백 추가 */}
          <div className="md:ml-[72px] lg:ml-[244px]">
            {/* Mobile: Header와 BottomNav를 위한 패딩 */}
            <div className="pt-[60px] pb-[50px] md:pt-0 md:pb-0">
              {/* 콘텐츠 영역: 최대 630px 중앙 정렬 */}
              <div className="max-w-[630px] mx-auto bg-instagram-background min-h-screen md:min-h-0">
                {/* 인증되지 않은 사용자 안내 */}
                <SignedOut>
                  <div className="flex flex-col items-center justify-center min-h-screen p-8">
                    <h1 className="text-3xl font-instagram-bold text-instagram-text-primary mb-4">
                      Instagram에 오신 것을 환영합니다
                    </h1>
                    <p className="text-instagram-sm text-instagram-text-secondary mb-8 text-center">
                      로그인하여 게시물을 확인하고 공유하세요.
                    </p>
                    <SignInButton mode="modal">
                      <Button className="bg-instagram-blue text-white hover:bg-blue-600">
                        로그인
                      </Button>
                    </SignInButton>
                  </div>
                </SignedOut>

                {/* 인증된 사용자 콘텐츠 */}
                <SignedIn>{children}</SignedIn>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile BottomNav */}
      <BottomNav />
    </div>
  );
}

