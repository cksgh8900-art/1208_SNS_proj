-- Supabase 공식 Next.js 퀵스타트 예시: instruments 테이블
-- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

-- 테이블 생성
CREATE TABLE IF NOT EXISTS public.instruments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 샘플 데이터 삽입
INSERT INTO public.instruments (name)
VALUES
    ('violin'),
    ('viola'),
    ('cello')
ON CONFLICT DO NOTHING;

-- Row Level Security 활성화
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 권한 정책 (anon 사용자도 읽을 수 있음)
CREATE POLICY "public can read instruments"
ON public.instruments
FOR SELECT
TO anon
USING (true);

-- 인증된 사용자도 읽을 수 있음
CREATE POLICY "authenticated can read instruments"
ON public.instruments
FOR SELECT
TO authenticated
USING (true);

-- 권한 부여
GRANT ALL ON TABLE public.instruments TO anon;
GRANT ALL ON TABLE public.instruments TO authenticated;
GRANT ALL ON TABLE public.instruments TO service_role;

