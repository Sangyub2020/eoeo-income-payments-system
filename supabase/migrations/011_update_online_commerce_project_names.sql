-- 온라인 커머스팀 테이블의 project_name 업데이트
-- company_name과 deposit_amount가 매칭되는 행에 대해 project_name을 업데이트

-- 입금액이 있는 경우만 업데이트 (입금액이 NULL이거나 0인 경우 제외)
-- Project name이 비어있지 않은 경우만 업데이트

UPDATE online_commerce_team
SET project_name = CASE
  -- (주) 팜스킨
  WHEN company_name = '(주) 팜스킨' AND deposit_amount = 55000000 THEN '수출바우처'
  
  -- (주)더마펌
  WHEN company_name = '(주)더마펌' AND deposit_amount = -36573490 THEN '아마존 계약 해지건에 따른 마케팅 비용 환불 건'
  WHEN company_name = '(주)더마펌' AND deposit_amount = 185451264 THEN '아마존 계약 해지건에 따른 기재고 사입 건'
  
  -- (주)마이노멀컴퍼니
  WHEN company_name = '(주)마이노멀컴퍼니' AND deposit_amount = 55000000 AND deposit_date::text = '2025-03-31' THEN 'My Normal 25년 틱톡 바이럴 마케팅'
  WHEN company_name = '(주)마이노멀컴퍼니' AND deposit_amount = 55000000 AND deposit_date::text = '2025-05-30' THEN 'My Normal 25년 틱톡 바이럴 마케팅'
  
  -- (주)에즈원글로벌
  WHEN company_name = '(주)에즈원글로벌' AND deposit_amount = 40000000 THEN ''
  
  -- (주)엔앤비랩
  WHEN company_name = '(주)엔앤비랩' AND deposit_amount = 808618 THEN 'Maxclinic_NanoMicro_2503 (브랜디드 시딩)'
  WHEN company_name = '(주)엔앤비랩' AND deposit_amount = 5000000 AND deposit_date::text = '2025-08-07' THEN '수출바우처 사업'
  WHEN company_name = '(주)엔앤비랩' AND deposit_amount = 972000 THEN 'Maxclinic 오일폼 K-CON 샘플 제공 건 (162개)'
  
  -- (주)웰코스
  WHEN company_name = '(주)웰코스' AND deposit_amount = 5998460 THEN '3pl 재고 사입'
  WHEN company_name = '(주)웰코스' AND deposit_amount = 6555044 THEN '아마존 기재고 사입'
  
  -- (주)위드기어
  WHEN company_name = '(주)위드기어' AND deposit_amount = 10374744 THEN '위드기어 기재고 사입건 (공급가 기준 30%) / 면세'
  
  -- (주)코리아테크
  WHEN company_name = '(주)코리아테크' AND deposit_amount = 699351180 AND deposit_date::text = '2024-08-16' THEN ''
  WHEN company_name = '(주)코리아테크' AND deposit_amount = 18781441 THEN ''
  WHEN company_name = '(주)코리아테크' AND deposit_amount = 5534621 THEN 'SA_SKahi240920EFBA/SA_SKahi241029EFBA'
  WHEN company_name = '(주)코리아테크' AND deposit_amount = 699351180 AND deposit_date::text = '2025-01-20' THEN '마케팅지원비'
  WHEN company_name = '(주)코리아테크' AND deposit_amount = 15712400 THEN 'KAHI 인플루언서 2차 저작권 구매 비용 대납'
  
  -- (주)코스메랩
  WHEN company_name = '(주)코스메랩' AND deposit_amount = 2420100 THEN 'G9SKIN / BERRISOM_기재고 사입'
  
  -- (주)페렌벨
  WHEN company_name = '(주)페렌벨' AND deposit_amount = 5000000 AND deposit_date::text = '2025-11-10' THEN '썸바이미_수출바우처 사업_브랜디드 시딩 5천만원'
  
  -- (주)한국인삼공사
  WHEN company_name = '(주)한국인삼공사' AND deposit_amount = 231000000 THEN '정관장 2분기 마케팅 비용'
  
  -- CLAP INTERNATIONAL
  WHEN company_name = 'CLAP INTERNATIONAL (HONG KONG) LIMITED' AND deposit_amount = 299960 THEN '헤일리 비버 비알머드 계약금 반환'
  
  -- COMA US
  WHEN company_name = 'COMA US' AND deposit_amount = 36867.50 THEN '미국 법인 코마가 한국 아마존 재고 거래 (틱톡샵)'
  
  -- KOREAN RED GINSENG CORPORATION INC
  WHEN company_name = 'KOREAN RED GINSENG CORPORATION INC' AND deposit_amount = 49988 THEN '정관장 4분기 마케팅 비용 (5만불씩 결제건)'
  
  -- 고려대학교산학협력단
  WHEN company_name = '고려대학교산학협력단' AND deposit_amount = 19800000 THEN '2024 창업 프로그램 운영'
  
  -- 고려신용정보(주)
  WHEN company_name = '고려신용정보(주)' AND deposit_amount = 100000000 THEN ''
  
  -- 기업은행 무역센터
  WHEN company_name = '기업은행 무역센터' AND deposit_amount = 27500000 THEN '온라인수출 공동물류 지원사업'
  WHEN company_name = '기업은행 무역센터' AND deposit_amount = 25000000 THEN '공동물류사업 지원금'
  
  -- 다슈코리아 주식회사
  WHEN company_name = '다슈코리아 주식회사' AND deposit_amount = 11000000 THEN ''
  WHEN company_name = '다슈코리아 주식회사' AND deposit_amount = 33000000 THEN ''
  WHEN company_name = '다슈코리아 주식회사' AND deposit_amount = 219629670 THEN '아마존 계약 해지건에 따른 기재고 사입 건'
  
  -- 땡큐네이처 주식회사
  WHEN company_name = '땡큐네이처 주식회사' AND deposit_amount = 15168000 THEN ''
  
  -- 모노글로트홀딩스
  WHEN company_name = '모노글로트홀딩스' AND deposit_amount = 45833332 THEN ''
  WHEN company_name = '모노글로트홀딩스' AND deposit_amount = 800000000 THEN 'ELROEL 25년도 틱톡 바이럴 마케팅'
  
  -- 씨아이에스인터내셔날서비스(주)
  WHEN company_name = '씨아이에스인터내셔날서비스(주)' AND deposit_amount = 110000000 THEN 'HAYEJIN_1st_2408'
  WHEN company_name = '씨아이에스인터내셔날서비스(주)' AND deposit_amount = 0 THEN 'Hayejin 2nd_2410'
  WHEN company_name = '씨아이에스인터내셔날서비스(주)' AND deposit_amount = 545800 THEN '하예진 미국 틱톡 계정운영 - 미국 유심구매'
  
  -- 와디즈엑스 주식회사
  WHEN company_name = '와디즈엑스 주식회사' AND deposit_amount = 3000000 THEN '와디즈엑스_수출바우처_3천만원'
  
  -- 인피니티 벤처스 주식회사
  WHEN company_name = '인피니티 벤처스 주식회사' AND deposit_amount = 4593272 THEN ''
  WHEN company_name = '인피니티 벤처스 주식회사' AND deposit_amount = 2064600 THEN ''
  WHEN company_name = '인피니티 벤처스 주식회사' AND deposit_amount = 71695770 THEN ''
  WHEN company_name = '인피니티 벤처스 주식회사' AND deposit_amount = 76130840 THEN ''
  WHEN company_name = '인피니티 벤처스 주식회사' AND deposit_amount = 22811683 THEN ''
  
  -- 장원문화인쇄
  WHEN company_name = '장원문화인쇄' AND deposit_amount = 45833332 THEN ''
  WHEN company_name = '장원문화인쇄' AND deposit_amount = 87798795 THEN 'ELROEL 25년도 틱톡 바이럴 마케팅'
  
  -- 주식회사 듀이트리
  WHEN company_name = '주식회사 듀이트리' AND deposit_amount = 3300000 AND deposit_date::text = '2024-08-23' THEN ''
  WHEN company_name = '주식회사 듀이트리' AND deposit_amount = 3300000 AND deposit_date IS NULL THEN ''
  WHEN company_name = '주식회사 듀이트리' AND deposit_amount = 23205735 AND deposit_date::text = '2025-09-25' THEN '듀이트리 재고 재사입 1차건'
  WHEN company_name = '주식회사 듀이트리' AND deposit_amount = 23205735 AND deposit_date::text = '2025-10-27' THEN '듀이트리 재고 재사입 2차건'
  
  -- 주식회사 디엔코스메틱스
  WHEN company_name = '주식회사 디엔코스메틱스' AND deposit_amount = 1386475477 THEN '이지듀 초도발주 점내 마케팅비 + 2025 1차 점외 마케팅비'
  
  -- 주식회사 로크
  WHEN company_name = '주식회사 로크' AND deposit_amount = 282506 THEN ''
  WHEN company_name = '주식회사 로크' AND deposit_amount = 1051617 THEN ''
  
  -- 주식회사 메디쿼터스
  WHEN company_name = '주식회사 메디쿼터스 (MEDIQUITOUS Co.,Ltd.)' AND deposit_amount = 110000000 THEN 'ANILLO_1st_2505'
  
  -- 주식회사 명인화장품
  WHEN company_name = '주식회사 명인화장품' AND deposit_amount IS NULL THEN '명인화장품_브랜디드시딩(수출바우처)_3,000만 원'
  
  -- 주식회사 모다모다
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = 2380000 THEN ''
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = 9326819 AND deposit_date::text = '2024-11-19' THEN ''
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = 9326819 AND deposit_date::text = '2025-01-31' THEN ''
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = 38500000 THEN 'MODAMODA_10K_2501'
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = 15680000 THEN '모다모다 블랙샴푸 300g 기재고 판매'
  WHEN company_name = '주식회사 모다모다' AND deposit_amount = -17325000 THEN '모다모다 광고(시딩) 부분 환불 (1,750만원/3,500만원-위약금10%)'
  
  -- 주식회사 바노바기
  WHEN company_name = '주식회사 바노바기' AND deposit_amount = 55954500 THEN '아마존 계약 해지건에 따른 기재고 사입 1차'
  WHEN company_name = '주식회사 바노바기' AND deposit_amount = 23058473 THEN '기재고 판매'
  
  -- 주식회사 부스터즈
  WHEN company_name = '주식회사 부스터즈' AND deposit_amount = 58736700 THEN '부스터즈 르무통재고 재사입의 건'
  
  -- 주식회사 비엠스마일
  WHEN company_name = '주식회사 비엠스마일' AND deposit_amount = 11000000 THEN ''
  
  -- 주식회사 비엠코스
  WHEN company_name = '주식회사 비엠코스' AND deposit_amount = 55000000 THEN ''
  WHEN company_name = '주식회사 비엠코스' AND deposit_amount = 44000000 AND deposit_date::text = '2024-02-24' THEN '수출바우처'
  WHEN company_name = '주식회사 비엠코스' AND deposit_amount = 2666700 THEN '혁신바우처'
  WHEN company_name = '주식회사 비엠코스' AND deposit_amount = 44000000 AND deposit_date IS NULL THEN '중기부 수출바우처'
  
  -- 주식회사 쌤시크코스메틱
  WHEN company_name = '주식회사 쌤시크코스메틱' AND deposit_amount = 10546100 THEN ''
  
  -- 주식회사 씨엠에스랩
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 3215269 THEN ''
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 5439374 THEN 'Pinate_S1_2410'
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 6441127 THEN 'Pinate_S1_2410 (브랜디드 시딩)'
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 1845256 THEN 'Pinate_S1_2410 (브랜디드 시딩)'
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 4650773 THEN 'Pinate_S1_2410 (브랜디드 시딩)'
  WHEN company_name = '주식회사 씨엠에스랩' AND deposit_amount = 3599070 THEN 'Pinate_S1_2410 (브랜디드 시딩)'
  
  -- 주식회사 아이콘비엑스
  WHEN company_name = '주식회사 아이콘비엑스' AND deposit_amount IS NULL THEN '디어도어_수출바우처_2,442만원'
  
  -- 주식회사 알앤티컴퍼니
  WHEN company_name = '주식회사 알앤티컴퍼니(RNT COMPANY CO..LTD)' AND deposit_amount = 4337217 THEN ''
  
  -- 주식회사 알에이치앤비브랜즈
  WHEN company_name = '주식회사 알에이치앤비브랜즈(RH&B BRANDS. INC.)' AND deposit_amount = 29067520 THEN 'rated green 기재고 사입'
  WHEN company_name = '주식회사 알에이치앤비브랜즈(RH&B BRANDS. INC.)' AND deposit_amount = 4963000 THEN 'rated green 기재고 사입'
  
  -- 주식회사 에스비코스메틱스
  WHEN company_name = '주식회사 에스비코스메틱스' AND deposit_amount = 33000000 AND deposit_date::text = '2024-10-18' THEN 'SelfBeauty_S1_2408'
  WHEN company_name = '주식회사 에스비코스메틱스' AND deposit_amount = 22000000 THEN 'SelfBeauty_S1_2408'
  WHEN company_name = '주식회사 에스비코스메틱스' AND deposit_amount = 1355339 THEN ''
  WHEN company_name = '주식회사 에스비코스메틱스' AND deposit_amount = 2844232 THEN ''
  
  -- 주식회사 오유인터내셔널
  WHEN company_name = '주식회사 오유인터내셔널' AND deposit_amount = 8134786 THEN ''
  
  -- 주식회사 이안에프엔씨
  WHEN company_name = '주식회사 이안에프엔씨' AND deposit_amount = 0 THEN '3월 마케팅 비용 입금'
  WHEN company_name = '주식회사 이안에프엔씨' AND deposit_amount = 0 AND deposit_date IS NULL THEN '4월 마케팅 비용 입금'
  WHEN company_name = '주식회사 이안에프엔씨' AND deposit_amount = 28614885 THEN '3-5월 마케팅 비용 마이너스 후, 실제 소진한 금액으로 계산서 재발행'
  
  -- 주식회사 이엘와이컴퍼니
  WHEN company_name = '주식회사 이엘와이컴퍼니' AND deposit_amount = 2852300 THEN ''
  
  -- 주식회사 지구인컴퍼니
  WHEN company_name = '주식회사 지구인컴퍼니' AND deposit_amount = 4400000 THEN '[UNLIMEAT_Free_2406]'
  
  -- 주식회사 채화
  WHEN company_name = '주식회사 채화' AND deposit_amount = 38500000 THEN ''
  
  -- 주식회사 페이지
  WHEN company_name = '주식회사 페이지 (PAGE INC.)' AND deposit_amount = 15047430 THEN ''
  
  -- 주식회사 플레인하우스
  WHEN company_name = '주식회사 플레인하우스' AND deposit_amount = 3185177 THEN ''
  
  -- 한국인삼공사
  WHEN company_name = '한국인삼공사' AND deposit_amount = 385000000 THEN '틱톡 바이럴 마케팅'
  WHEN company_name = '한국인삼공사' AND deposit_amount = 165000000 THEN '틱톡 바이럴 마케팅'
  WHEN company_name = '한국인삼공사' AND deposit_amount = 539000000 THEN '정관장 2분기 마케팅 비용'
  
  ELSE project_name
END,
updated_at = NOW()
WHERE deposit_amount IS NOT NULL
  AND (
    -- 위의 CASE 문에서 매칭되는 조건들
    (company_name = '(주) 팜스킨' AND deposit_amount = 55000000)
    OR (company_name = '(주)더마펌' AND deposit_amount IN (-36573490, 185451264))
    OR (company_name = '(주)마이노멀컴퍼니' AND deposit_amount = 55000000)
    OR (company_name = '(주)에즈원글로벌' AND deposit_amount = 40000000)
    OR (company_name = '(주)엔앤비랩' AND deposit_amount IN (808618, 5000000, 972000))
    OR (company_name = '(주)웰코스' AND deposit_amount IN (5998460, 6555044))
    OR (company_name = '(주)위드기어' AND deposit_amount = 10374744)
    OR (company_name = '(주)코리아테크' AND deposit_amount IN (699351180, 18781441, 5534621, 15712400))
    OR (company_name = '(주)코스메랩' AND deposit_amount = 2420100)
    OR (company_name = '(주)페렌벨' AND deposit_amount = 5000000)
    OR (company_name = '(주)한국인삼공사' AND deposit_amount = 231000000)
    OR (company_name = 'CLAP INTERNATIONAL (HONG KONG) LIMITED' AND deposit_amount = 299960)
    OR (company_name = 'COMA US' AND deposit_amount = 36867.50)
    OR (company_name = 'KOREAN RED GINSENG CORPORATION INC' AND deposit_amount = 49988)
    OR (company_name = '고려대학교산학협력단' AND deposit_amount = 19800000)
    OR (company_name = '고려신용정보(주)' AND deposit_amount = 100000000)
    OR (company_name = '기업은행 무역센터' AND deposit_amount IN (27500000, 25000000))
    OR (company_name = '다슈코리아 주식회사' AND deposit_amount IN (11000000, 33000000, 219629670))
    OR (company_name = '땡큐네이처 주식회사' AND deposit_amount = 15168000)
    OR (company_name = '모노글로트홀딩스' AND deposit_amount IN (45833332, 800000000))
    OR (company_name = '씨아이에스인터내셔날서비스(주)' AND deposit_amount IN (110000000, 0, 545800))
    OR (company_name = '와디즈엑스 주식회사' AND deposit_amount = 3000000)
    OR (company_name = '인피니티 벤처스 주식회사' AND deposit_amount IN (4593272, 2064600, 71695770, 76130840, 22811683))
    OR (company_name = '장원문화인쇄' AND deposit_amount IN (45833332, 87798795))
    OR (company_name = '주식회사 듀이트리' AND deposit_amount IN (3300000, 23205735))
    OR (company_name = '주식회사 디엔코스메틱스' AND deposit_amount = 1386475477)
    OR (company_name = '주식회사 로크' AND deposit_amount IN (282506, 1051617))
    OR (company_name = '주식회사 메디쿼터스 (MEDIQUITOUS Co.,Ltd.)' AND deposit_amount = 110000000)
    OR (company_name = '주식회사 모다모다' AND deposit_amount IN (2380000, 9326819, 38500000, 15680000, -17325000))
    OR (company_name = '주식회사 바노바기' AND deposit_amount IN (55954500, 23058473))
    OR (company_name = '주식회사 부스터즈' AND deposit_amount = 58736700)
    OR (company_name = '주식회사 비엠스마일' AND deposit_amount = 11000000)
    OR (company_name = '주식회사 비엠코스' AND deposit_amount IN (55000000, 44000000, 2666700))
    OR (company_name = '주식회사 쌤시크코스메틱' AND deposit_amount = 10546100)
    OR (company_name = '주식회사 씨엠에스랩' AND deposit_amount IN (3215269, 5439374, 6441127, 1845256, 4650773, 3599070))
    OR (company_name = '주식회사 알앤티컴퍼니(RNT COMPANY CO..LTD)' AND deposit_amount = 4337217)
    OR (company_name = '주식회사 알에이치앤비브랜즈(RH&B BRANDS. INC.)' AND deposit_amount IN (29067520, 4963000))
    OR (company_name = '주식회사 에스비코스메틱스' AND deposit_amount IN (33000000, 22000000, 1355339, 2844232))
    OR (company_name = '주식회사 오유인터내셔널' AND deposit_amount = 8134786)
    OR (company_name = '주식회사 이안에프엔씨' AND deposit_amount IN (0, 28614885))
    OR (company_name = '주식회사 이엘와이컴퍼니' AND deposit_amount = 2852300)
    OR (company_name = '주식회사 지구인컴퍼니' AND deposit_amount = 4400000)
    OR (company_name = '주식회사 채화' AND deposit_amount = 38500000)
    OR (company_name = '주식회사 페이지 (PAGE INC.)' AND deposit_amount = 15047430)
    OR (company_name = '주식회사 플레인하우스' AND deposit_amount = 3185177)
    OR (company_name = '한국인삼공사' AND deposit_amount IN (385000000, 165000000, 539000000))
  );

