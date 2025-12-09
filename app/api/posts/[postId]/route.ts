import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";

/**
 * @file app/api/posts/[postId]/route.ts
 * @description 게시물 삭제 API Route
 *
 * DELETE: 게시물 삭제
 * - 본인만 삭제 가능 (인증 검증)
 * - 게시물 소유자 확인
 * - Supabase Storage에서 이미지 삭제
 * - DB에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
 * - 에러 처리
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // postId 파라미터 확인
    const { postId } = await params;
    if (!postId) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();
    const serviceRoleSupabase = getServiceRoleClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("사용자 조회 에러:", userError);
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 게시물 조회 및 소유자 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("게시물 조회 에러:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 게시물인지 확인
    if (postData.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // Supabase Storage에서 이미지 삭제
    // image_url 예시: https://[project].supabase.co/storage/v1/object/public/posts/[userId]/[filename]
    const imageUrl = postData.image_url;
    if (imageUrl) {
      try {
        const urlParts = imageUrl.split("/storage/v1/object/public/");
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // "posts/[userId]/[filename]"

          // Storage에서 이미지 삭제
          const { error: storageError } = await serviceRoleSupabase.storage
            .from("posts")
            .remove([filePath]);

          if (storageError) {
            console.error("이미지 삭제 에러:", storageError);
            // 경고만, DB 삭제는 계속 진행
          }
        }
      } catch (storageErr) {
        console.error("이미지 삭제 처리 중 에러:", storageErr);
        // 경고만, DB 삭제는 계속 진행
      }
    }

    // DB에서 게시물 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("게시물 삭제 에러:", deleteError);
      return NextResponse.json(
        { error: "게시물 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "게시물이 성공적으로 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("게시물 삭제 API 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

