-- 선/잔금 컬럼에서 "분할X" 값을 "일시불"로 업데이트
UPDATE income_records
SET advance_balance = '일시불'
WHERE advance_balance = '분할X';



