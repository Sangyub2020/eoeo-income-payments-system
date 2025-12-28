-- 온라인 커머스팀 카테고리 명칭 변경
UPDATE online_commerce_team
SET category = CASE
  WHEN category = '파트너십/마케팅지원비' THEN '파트너십 - 서비스매출'
  WHEN category = '정부지원사업' THEN '파트너십 - 수출바우처'
  WHEN category = '기재고사입' THEN '재고 바이백'
  ELSE category
END,
updated_at = NOW()
WHERE category IN ('파트너십/마케팅지원비', '정부지원사업', '기재고사입');








