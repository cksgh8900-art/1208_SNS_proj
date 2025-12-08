/**
 * @file check-env.ts
 * @description 환경 변수 검증 스크립트
 *
 * 필수 환경 변수가 설정되어 있는지 확인합니다.
 * 실행: pnpm tsx scripts/check-env.ts
 */

const requiredEnvVars = {
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "Clerk Publishable Key",
  CLERK_SECRET_KEY: "Clerk Secret Key",
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: "Supabase Project URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase Anon Key",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase Service Role Key",
  
  // Storage (선택사항)
  NEXT_PUBLIC_STORAGE_BUCKET: "Storage Bucket Name (선택사항)",
};

const optionalEnvVars = {
  NEXT_PUBLIC_STORAGE_BUCKET: "Storage Bucket Name",
};

function checkEnvVars() {
  console.log("🔍 환경 변수 검증 중...\n");
  
  const missing: string[] = [];
  const present: string[] = [];
  const optional: string[] = [];
  
  // 필수 환경 변수 확인
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(`${key} (${description})`);
    } else {
      present.push(`${key} (${description})`);
    }
  }
  
  // 선택적 환경 변수 확인
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[key];
    if (value && value.trim() !== "") {
      optional.push(`${key} (${description})`);
    }
  }
  
  // 결과 출력
  console.log("✅ 설정된 필수 환경 변수:");
  present.forEach((env) => {
    console.log(`   - ${env}`);
  });
  
  if (optional.length > 0) {
    console.log("\n📦 설정된 선택적 환경 변수:");
    optional.forEach((env) => {
      console.log(`   - ${env}`);
    });
  }
  
  if (missing.length > 0) {
    console.log("\n❌ 누락된 필수 환경 변수:");
    missing.forEach((env) => {
      console.log(`   - ${env}`);
    });
    console.log("\n⚠️  .env 파일을 확인하고 누락된 환경 변수를 추가하세요.");
    process.exit(1);
  }
  
  console.log("\n✅ 모든 필수 환경 변수가 설정되어 있습니다!");
  
  // Supabase URL 형식 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
    console.log("\n⚠️  경고: NEXT_PUBLIC_SUPABASE_URL이 올바른 형식인지 확인하세요.");
  }
  
  // Storage 버킷 확인
  const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET;
  if (!storageBucket) {
    console.log("\n💡 팁: NEXT_PUBLIC_STORAGE_BUCKET을 설정하면 Storage 기능을 사용할 수 있습니다.");
    console.log("   기본값: 'posts'");
  }
}

// 실행
checkEnvVars();

