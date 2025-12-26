-- 프로젝트 유형 전체 교체
-- 기존 데이터 삭제
DELETE FROM projects;

-- 새로운 프로젝트 유형 삽입
INSERT INTO projects (code, name) VALUES
  ('1', 'Influencer - Branded'),
  ('2', 'Influencer - Pickple'),
  ('3', 'Influencer - Pickple - 100'),
  ('4', 'Amazon - Promotion'),
  ('5', '재고 바이백'),
  ('6', '할리우드 셀럽 협업'),
  ('7', '퍼포먼스마케팅대행'),
  ('10', 'other'),
  ('20', '직거래'),
  ('21', '중계무역');







