-- 온라인 커머스팀 프로젝트 유형 통일
UPDATE online_commerce_team
SET project = 'Influencer - Branded',
    project_code = '1',
    updated_at = NOW()
WHERE project IN ('브랜디드시딩', 'tiktok viral - regular', 'Partner_regular project')
   OR LOWER(TRIM(project)) IN ('브랜디드시딩', 'tiktok viral - regular', 'partner_regular project');







