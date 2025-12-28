-- 글로벌 마케팅 솔루션팀 프로젝트 유형 변경
UPDATE global_marketing_team
SET project = 'Influencer - Pickple',
    project_code = '2',
    updated_at = NOW()
WHERE project = 'tiktok viral - 10k'
   OR LOWER(TRIM(project)) = 'tiktok viral - 10k';

UPDATE global_marketing_team
SET project = 'Influencer - Pickple - 100',
    project_code = '3',
    updated_at = NOW()
WHERE project = '100원 캠페인'
   OR LOWER(TRIM(project)) = '100원 캠페인';








