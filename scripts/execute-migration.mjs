// 마이그레이션 실행 스크립트
const sql = `
-- income_records 테이블에 brand_names 배열 필드 추가 (복수 브랜드 지원)
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS brand_names TEXT[];

-- 기존 brand_name 데이터를 brand_names 배열로 마이그레이션
UPDATE income_records 
SET brand_names = ARRAY[brand_name]::TEXT[]
WHERE brand_name IS NOT NULL AND brand_name != '' AND (brand_names IS NULL OR array_length(brand_names, 1) IS NULL);

-- 인덱스 생성 (배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_income_records_brand_names ON income_records USING GIN (brand_names);
`;

console.log('마이그레이션 SQL:');
console.log(sql);
console.log('\n이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하거나,');
console.log('MCP를 통해 실행해주세요.');

