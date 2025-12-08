/**
 * @file verify-supabase-setup.ts
 * @description Supabase 설정 검증 스크립트
 *
 * Supabase 연결 및 데이터베이스 상태를 확인합니다.
 * 실행: pnpm tsx scripts/verify-supabase-setup.ts
 */

import { createClient } from "@supabase/supabase-js";

async function verifySupabaseSetup() {
  console.log("🔍 Supabase 설정 검증 중...\n");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ 환경 변수가 설정되지 않았습니다.");
    console.error("   NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.");
    process.exit(1);
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 연결 테스트
    console.log("1️⃣ Supabase 연결 테스트...");
    const { data: healthCheck, error: healthError } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    
    if (healthError && healthError.code !== "PGRST116") {
      // PGRST116은 테이블이 없을 때 발생하는 에러
      throw healthError;
    }
    
    console.log("   ✅ Supabase 연결 성공\n");
    
    // 테이블 확인
    console.log("2️⃣ 테이블 확인...");
    const tables = ["users", "posts", "likes", "comments", "follows"];
    const existingTables: string[] = [];
    const missingTables: string[] = [];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select("count").limit(1);
      if (error && error.code === "PGRST116") {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    }
    
    if (existingTables.length > 0) {
      console.log("   ✅ 존재하는 테이블:");
      existingTables.forEach((table) => console.log(`      - ${table}`));
    }
    
    if (missingTables.length > 0) {
      console.log("\n   ⚠️  누락된 테이블:");
      missingTables.forEach((table) => console.log(`      - ${table}`));
      console.log("\n   💡 마이그레이션을 적용하세요:");
      console.log("      docs/supabase-migration-guide.md 참고");
    }
    
    // Storage 버킷 확인
    console.log("\n3️⃣ Storage 버킷 확인...");
    const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "posts";
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`   ⚠️  Storage 접근 권한이 없습니다: ${bucketsError.message}`);
    } else {
      const bucket = buckets?.find((b) => b.name === bucketName);
      if (bucket) {
        console.log(`   ✅ '${bucketName}' 버킷이 존재합니다`);
        console.log(`      공개 여부: ${bucket.public ? "공개" : "비공개"}`);
      } else {
        console.log(`   ⚠️  '${bucketName}' 버킷이 없습니다`);
        console.log("\n   💡 Storage 버킷을 생성하세요:");
        console.log("      docs/supabase-storage-setup.md 참고");
      }
    }
    
    console.log("\n✅ 검증 완료!");
    
  } catch (error: any) {
    console.error("\n❌ 오류 발생:");
    console.error(`   ${error.message}`);
    if (error.code) {
      console.error(`   코드: ${error.code}`);
    }
    process.exit(1);
  }
}

// 실행
verifySupabaseSetup();

