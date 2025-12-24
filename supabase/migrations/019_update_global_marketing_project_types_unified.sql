-- 글로벌 마케팅 솔루션팀 프로젝트 유형 통일
UPDATE global_marketing_team
SET project = 'Influencer - Branded',
    project_code = '1',
    updated_at = NOW()
WHERE project IN ('tiktok viral - regular', 'Partner_regular project')
   OR LOWER(TRIM(project)) IN ('tiktok viral - regular', 'partner_regular project');




