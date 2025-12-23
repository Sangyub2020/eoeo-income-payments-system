-- 글로벌 마케팅 솔루션팀 'Amazon - network promotion' 프로젝트 유형 변경
UPDATE global_marketing_team
SET project = 'Amazon - Promotion',
    project_code = '4',
    updated_at = NOW()
WHERE project = 'Amazon - network promotion'
   OR LOWER(TRIM(project)) = 'amazon - network promotion';

