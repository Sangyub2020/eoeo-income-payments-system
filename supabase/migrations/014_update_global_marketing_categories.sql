-- 글로벌 마케팅 솔루션팀 카테고리 명칭 변경
UPDATE global_marketing_team
SET category = CASE
  WHEN category = 'ONE-TIME' THEN '용역사업 - 서비스매출'
  WHEN category = '정부지원사업' THEN '용역사업 - 수출바우처'
  ELSE category
END,
updated_at = NOW()
WHERE category IN ('ONE-TIME', '정부지원사업');







