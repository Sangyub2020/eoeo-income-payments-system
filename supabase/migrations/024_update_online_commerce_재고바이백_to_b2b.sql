-- 온라인 커머스팀 거래 유형 '재고 바이백'을 'B2B'로 변경
UPDATE online_commerce_team
SET category = 'B2B',
    updated_at = NOW()
WHERE category = '재고 바이백';







