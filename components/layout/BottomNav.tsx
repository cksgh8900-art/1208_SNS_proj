"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, SquarePlus, Heart, User } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * @file BottomNav.tsx
 * @description Mobile 전용 Bottom Navigation 컴포넌트
 *
 * Mobile (<768px) 전용:
 * - 높이: 50px 고정
 * - 위치: 하단 고정 (fixed)
 * - 배경: 흰색 (#FFFFFF)
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * - 아이콘 크기: 24px
 * - Active 상태: 아이콘 채워진 버전 또는 색상 변경
 *
 * Desktop/Tablet에서는 숨김 처리
 */

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
  onClick?: () => void;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: Home,
    label: "홈",
  },
  {
    href: "/search",
    icon: Search,
    label: "검색",
    onClick: () => {
      alert("검색 기능은 곧 추가될 예정입니다.");
    },
  },
  {
    href: "#",
    icon: SquarePlus,
    label: "만들기",
    onClick: () => {
      alert("게시물 작성 기능은 곧 추가될 예정입니다.");
    },
  },
  {
    href: "/likes",
    icon: Heart,
    label: "좋아요",
    onClick: () => {
      alert("좋아요 목록 기능은 곧 추가될 예정입니다.");
    },
  },
  {
    href: "/profile",
    icon: User,
    label: "프로필",
    requiresAuth: true,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-instagram-border z-40">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isActionButton = item.onClick !== undefined;

          if (item.requiresAuth) {
            return (
              <SignedIn key={item.href}>
                <NavItemButton
                  item={item}
                  isActive={isActive}
                />
              </SignedIn>
            );
          }

          if (isActionButton) {
            return (
              <button
                key={item.href}
                onClick={item.onClick}
                className="flex-1 flex items-center justify-center h-full hover:bg-gray-50 transition-colors"
                aria-label={item.label}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive
                      ? "text-instagram-text-primary"
                      : "text-instagram-text-primary"
                  }`}
                />
              </button>
            );
          }

          return (
            <NavItemButton
              key={item.href}
              item={item}
              isActive={isActive}
            />
          );
        })}

        <SignedOut>
          <div className="flex-1 flex items-center justify-center">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="h-8">
                로그인
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </nav>
  );
}

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
}

function NavItemButton({ item, isActive }: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="flex-1 flex items-center justify-center h-full hover:bg-gray-50 transition-colors"
      aria-label={item.label}
    >
      <Icon
        className={`w-6 h-6 ${
          isActive
            ? "text-instagram-text-primary"
            : "text-instagram-text-primary"
        }`}
        fill={isActive ? "currentColor" : "none"}
      />
    </Link>
  );
}

