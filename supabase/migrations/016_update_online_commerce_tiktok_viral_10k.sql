-- 온라인 커머스팀 tiktok viral - 10k 프로젝트 유형 변경
UPDATE online_commerce_team
SET project = 'Influencer - Pickple',
    project_code = '2',
    updated_at = NOW()
WHERE project = 'tiktok viral - 10k'
   OR LOWER(TRIM(project)) = 'tiktok viral - 10k';


