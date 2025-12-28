-- 글로벌 마케팅 솔루션팀 '브랜디드시딩' 프로젝트 유형 통일
UPDATE global_marketing_team
SET project = 'Influencer - Branded',
    project_code = '1',
    updated_at = NOW()
WHERE project = '브랜디드시딩'
   OR LOWER(TRIM(project)) = '브랜디드시딩';








