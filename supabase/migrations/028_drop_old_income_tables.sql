-- 기존 5개 입금 관리 테이블 삭제
-- 통합 테이블(income_records)로 모든 데이터가 마이그레이션되었으므로 기존 테이블은 더 이상 필요하지 않음

-- 주의: 이 마이그레이션은 되돌릴 수 없습니다. 실행 전에 데이터 백업을 권장합니다.

DROP TABLE IF EXISTS online_commerce_team CASCADE;
DROP TABLE IF EXISTS global_marketing_team CASCADE;
DROP TABLE IF EXISTS global_sales_team CASCADE;
DROP TABLE IF EXISTS brand_planning_team CASCADE;
DROP TABLE IF EXISTS other_income CASCADE;








