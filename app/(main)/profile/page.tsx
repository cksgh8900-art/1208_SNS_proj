import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/(main)/profile/page.tsx
 * @description 본인 프로필 페이지
 *
 * 현재 로그인한 사용자의 프로필로 리다이렉트합니다.
 */

export default async function OwnProfilePage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Clerk ID로 Supabase user_id 조회
  const supabase = createClerkSupabaseClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !user) {
    // 사용자가 없으면 홈으로 리다이렉트
    redirect("/");
  }

  redirect(`/profile/${user.id}`);
}

