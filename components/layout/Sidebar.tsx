"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, SquarePlus, User } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일 Sidebar 컴포넌트
 *
 * 반응형 레이아웃:
 * - Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px-1023px): 72px 너비, 아이콘만
 * - Mobile (<768px): 숨김
 *
 * 메뉴 항목:
 * - 홈 (/)
 * - 검색 (/search - 1차 제외, UI만)
 * - 만들기 (모달 열기 - 나중에 구현)
 * - 프로필 (/profile)
 */

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
  onClick?: () => void;
}

const menuItems: MenuItem[] = [
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
      // 1차에서는 알림만 표시
      alert("검색 기능은 곧 추가될 예정입니다.");
    },
  },
  {
    href: "#",
    icon: SquarePlus,
    label: "만들기",
    onClick: () => {
      // 1차에서는 알림만 표시
      alert("게시물 작성 기능은 곧 추가될 예정입니다.");
    },
  },
  {
    href: "/profile",
    icon: User,
    label: "프로필",
    requiresAuth: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:bg-white md:border-r md:border-instagram-border md:z-40">
      {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
      <div className="hidden lg:flex lg:flex-col lg:w-[244px] lg:pt-8 lg:px-4">
        <div className="mb-8 px-4">
          <Link href="/" className="text-2xl font-instagram-bold text-instagram-text-primary">
            Instagram
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSearchOrCreate = item.href === "/search" || item.href === "#";

            if (item.requiresAuth) {
              return (
                <SignedIn key={item.href}>
                  <SidebarMenuItem
                    item={item}
                    isActive={isActive}
                    showText={true}
                  />
                </SignedIn>
              );
            }

            if (isSearchOrCreate && item.onClick) {
              return (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive
                        ? "text-instagram-text-primary"
                        : "text-instagram-text-primary"
                    }`}
                  />
                  <span
                    className={`text-instagram-sm ${
                      isActive
                        ? "font-instagram-bold text-instagram-text-primary"
                        : "font-instagram-normal text-instagram-text-primary"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <SidebarMenuItem
                key={item.href}
                item={item}
                isActive={isActive}
                showText={true}
              />
            );
          })}
        </nav>
      </div>

      {/* Tablet: 72px 너비, 아이콘만 */}
      <div className="hidden md:flex lg:hidden md:flex-col md:w-[72px] md:pt-8 md:items-center">
        <div className="mb-8">
          <Link href="/" className="text-xl font-instagram-bold text-instagram-text-primary">
            IG
          </Link>
        </div>

        <nav className="flex flex-col gap-4 items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSearchOrCreate = item.href === "/search" || item.href === "#";

            if (item.requiresAuth) {
              return (
                <SignedIn key={item.href}>
                  <SidebarIconButton
                    item={item}
                    isActive={isActive}
                  />
                </SignedIn>
              );
            }

            if (isSearchOrCreate && item.onClick) {
              return (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  title={item.label}
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
              <SidebarIconButton
                key={item.href}
                item={item}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

interface SidebarMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  showText: boolean;
}

function SidebarMenuItem({ item, isActive, showText }: SidebarMenuItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon
        className={`w-6 h-6 ${
          isActive
            ? "text-instagram-text-primary"
            : "text-instagram-text-primary"
        }`}
        fill={isActive ? "currentColor" : "none"}
      />
      {showText && (
        <span
          className={`text-instagram-sm ${
            isActive
              ? "font-instagram-bold text-instagram-text-primary"
              : "font-instagram-normal text-instagram-text-primary"
          }`}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

function SidebarIconButton({ item, isActive }: { item: MenuItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
      title={item.label}
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

