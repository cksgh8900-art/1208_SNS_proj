import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Clerk 한국어 로컬라이제이션 설정
 * 
 * @clerk/localizations 패키지의 koKR을 사용하여 모든 Clerk 컴포넌트를 한국어로 표시합니다.
 * 
 * 참고:
 * - 로컬라이제이션은 Clerk 컴포넌트의 텍스트만 변경합니다
 * - Clerk Account Portal은 여전히 영어로 표시됩니다
 * - 커스텀 에러 메시지는 unstable__errors 키를 통해 커스터마이징 가능합니다
 * 
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */
const koreanLocalization = {
  ...koKR,
  // 필요시 커스텀 에러 메시지 추가 가능
  // unstable__errors: {
  //   ...koKR.unstable__errors,
  //   not_allowed_access: '접근이 허용되지 않은 이메일 도메인입니다. 접근을 원하시면 이메일로 문의해주세요.',
  // },
};

export const metadata: Metadata = {
  title: "SaaS 템플릿",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
