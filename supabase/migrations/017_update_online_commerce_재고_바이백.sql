-- 온라인 커머스팀 '기재고 사입' 프로젝트 유형 변경
UPDATE online_commerce_team
SET project = '재고 바이백',
    project_code = '5',
    updated_at = NOW()
WHERE project = '기재고 사입'
   OR LOWER(TRIM(project)) = '기재고 사입';








