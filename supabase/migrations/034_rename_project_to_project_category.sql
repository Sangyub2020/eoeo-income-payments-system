-- income_records 테이블에서 project 컬럼을 project_category로 변경
ALTER TABLE income_records 
RENAME COLUMN project TO project_category;

-- project_category2, project_category3 컬럼 추가
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS project_category2 VARCHAR;

ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS project_category3 VARCHAR;

-- project_code2, project_code3 컬럼 추가
ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS project_code2 VARCHAR;

ALTER TABLE income_records 
ADD COLUMN IF NOT EXISTS project_code3 VARCHAR;

