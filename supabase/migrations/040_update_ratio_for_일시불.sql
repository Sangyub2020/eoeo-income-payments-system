-- advance_balance가 '일시불'인 경우 ratio를 100으로 업데이트
UPDATE income_records
SET ratio = 100
WHERE advance_balance = '일시불'
  AND (ratio IS NULL OR ratio != 100);


