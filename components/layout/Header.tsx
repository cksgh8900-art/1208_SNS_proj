"use client";

import Link from "next/link";
import { Bell, Send, UserButton } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * @file Header.tsx
 * @description Mobile 전용 Header 컴포넌트
 *
 * Mobile (<768px) 전용:
 * - 높이: 60px 고정
 * - 위치: 상단 고정 (sticky)
 * - 배경: 흰색 (#FFFFFF)
 * - 구성: 로고 + 알림/DM/프로필 아이콘
 *
 * Desktop/Tablet에서는 숨김 처리
 */

export default function Header() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-instagram-border z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* 로고 */}
        <Link href="/" className="text-xl font-instagram-bold text-instagram-text-primary">
          Instagram
        </Link>

        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-4">
          <SignedIn>
            {/* 알림 아이콘 */}
            <button
              onClick={() => {
                // 1차에서는 알림만 표시
                alert("알림 기능은 곧 추가될 예정입니다.");
              }}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="알림"
            >
              <Bell className="w-6 h-6 text-instagram-text-primary" />
            </button>

            {/* DM 아이콘 */}
            <button
              onClick={() => {
                // 1차에서는 알림만 표시
                alert("메시지 기능은 곧 추가될 예정입니다.");
              }}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="메시지"
            >
              <Send className="w-6 h-6 text-instagram-text-primary" />
            </button>

            {/* 프로필 */}
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

