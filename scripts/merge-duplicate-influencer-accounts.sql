-- 중복된 인플루언서 계좌 합치기 스크립트
-- Account Holder 이름, Account Number, ACH routing number가 같은 행들을 하나로 합침

DO $$
DECLARE
  duplicate_record RECORD;
  merged_id UUID;
  merged_email TEXT;
  merged_swift_code TEXT;
  merged_tiktok_handles JSONB;
  merged_instagram_handles JSONB;
  account_record RECORD;
  temp_tiktok_handles TEXT[] := ARRAY[]::TEXT[];
  temp_instagram_handles TEXT[] := ARRAY[]::TEXT[];
  temp_emails TEXT[] := ARRAY[]::TEXT[];
  temp_swift_codes TEXT[] := ARRAY[]::TEXT[];
  unique_emails TEXT[];
  unique_swift_codes TEXT[];
  unique_tiktok_handles TEXT[];
  unique_instagram_handles TEXT[];
  handle_text TEXT;
BEGIN
  -- 중복된 그룹 찾기
  FOR duplicate_record IN
    SELECT 
      full_name,
      account_number,
      ach_routing_number,
      array_agg(id ORDER BY created_at) as ids
    FROM influencer_accounts
    WHERE full_name IS NOT NULL 
      AND account_number IS NOT NULL 
      AND ach_routing_number IS NOT NULL
    GROUP BY full_name, account_number, ach_routing_number
    HAVING COUNT(*) > 1
  LOOP
    -- 첫 번째 ID를 유지할 ID로 선택
    merged_id := duplicate_record.ids[1];
    
    -- 모든 중복 행의 데이터 수집
    temp_emails := ARRAY[]::TEXT[];
    temp_swift_codes := ARRAY[]::TEXT[];
    temp_tiktok_handles := ARRAY[]::TEXT[];
    temp_instagram_handles := ARRAY[]::TEXT[];
    
    -- 각 중복 행의 데이터 수집
    FOR account_record IN
      SELECT 
        id,
        email,
        swift_code,
        tiktok_handle,
        tiktok_handles,
        instagram_handles,
        recipient_type
      FROM influencer_accounts
      WHERE id = ANY(duplicate_record.ids)
      ORDER BY created_at
    LOOP
      -- Email 수집
      IF account_record.email IS NOT NULL AND account_record.email != '' THEN
        temp_emails := array_append(temp_emails, account_record.email);
      END IF;
      
      -- SWIFT Code 수집
      IF account_record.swift_code IS NOT NULL AND account_record.swift_code != '' THEN
        temp_swift_codes := array_append(temp_swift_codes, account_record.swift_code);
      END IF;
      
      -- Tiktok Account 수집
      IF account_record.recipient_type = 'Business' AND account_record.tiktok_handles IS NOT NULL THEN
        -- Business 타입: tiktok_handles 배열에서 추출
        FOR handle_text IN SELECT value::text FROM jsonb_array_elements_text(account_record.tiktok_handles)
        LOOP
          IF handle_text IS NOT NULL AND handle_text != '' THEN
            temp_tiktok_handles := array_append(temp_tiktok_handles, handle_text);
          END IF;
        END LOOP;
      ELSIF account_record.tiktok_handle IS NOT NULL AND account_record.tiktok_handle != '' THEN
        -- Personal 타입: tiktok_handle 사용
        temp_tiktok_handles := array_append(temp_tiktok_handles, account_record.tiktok_handle);
      END IF;
      
      -- Instagram handles 수집
      IF account_record.instagram_handles IS NOT NULL THEN
        FOR handle_text IN SELECT value::text FROM jsonb_array_elements_text(account_record.instagram_handles)
        LOOP
          IF handle_text IS NOT NULL AND handle_text != '' THEN
            temp_instagram_handles := array_append(temp_instagram_handles, handle_text);
          END IF;
        END LOOP;
      END IF;
    END LOOP;
    
    -- 중복 제거 및 정렬
    SELECT array_agg(DISTINCT email ORDER BY email) INTO unique_emails
    FROM unnest(temp_emails) AS email
    WHERE email IS NOT NULL AND email != '';
    
    SELECT array_agg(DISTINCT swift_code ORDER BY swift_code) INTO unique_swift_codes
    FROM unnest(temp_swift_codes) AS swift_code
    WHERE swift_code IS NOT NULL AND swift_code != '';
    
    SELECT array_agg(DISTINCT handle ORDER BY handle) INTO unique_tiktok_handles
    FROM unnest(temp_tiktok_handles) AS handle
    WHERE handle IS NOT NULL AND handle != '';
    
    SELECT array_agg(DISTINCT handle ORDER BY handle) INTO unique_instagram_handles
    FROM unnest(temp_instagram_handles) AS handle
    WHERE handle IS NOT NULL AND handle != '';
    
    -- Email과 SWIFT Code를 상하 병기로 합치기 (줄바꿈으로 구분)
    IF array_length(unique_emails, 1) > 1 THEN
      merged_email := array_to_string(unique_emails, E'\n');
    ELSIF array_length(unique_emails, 1) = 1 THEN
      merged_email := unique_emails[1];
    ELSE
      merged_email := NULL;
    END IF;
    
    IF array_length(unique_swift_codes, 1) > 1 THEN
      merged_swift_code := array_to_string(unique_swift_codes, E'\n');
    ELSIF array_length(unique_swift_codes, 1) = 1 THEN
      merged_swift_code := unique_swift_codes[1];
    ELSE
      merged_swift_code := NULL;
    END IF;
    
    -- Tiktok handles를 JSONB 배열로 변환
    IF array_length(unique_tiktok_handles, 1) > 0 THEN
      merged_tiktok_handles := to_jsonb(unique_tiktok_handles);
    ELSE
      merged_tiktok_handles := NULL;
    END IF;
    
    -- Instagram handles를 JSONB 배열로 변환
    IF array_length(unique_instagram_handles, 1) > 0 THEN
      merged_instagram_handles := to_jsonb(unique_instagram_handles);
    ELSE
      merged_instagram_handles := NULL;
    END IF;
    
    -- 첫 번째 행 업데이트 (합친 데이터로)
    UPDATE influencer_accounts
    SET 
      email = COALESCE(merged_email, email),
      swift_code = COALESCE(merged_swift_code, swift_code),
      tiktok_handles = COALESCE(merged_tiktok_handles, tiktok_handles),
      instagram_handles = COALESCE(merged_instagram_handles, instagram_handles),
      recipient_type = CASE 
        WHEN merged_tiktok_handles IS NOT NULL THEN 'Business'
        ELSE recipient_type
      END,
      tiktok_handle = CASE 
        WHEN merged_tiktok_handles IS NOT NULL THEN NULL
        ELSE tiktok_handle
      END
    WHERE id = merged_id;
    
    -- 나머지 중복 행 삭제
    DELETE FROM influencer_accounts
    WHERE id = ANY(duplicate_record.ids[2:array_length(duplicate_record.ids, 1)]);
    
    RAISE NOTICE 'Merged % rows for % (Account: %, ACH: %)', 
      array_length(duplicate_record.ids, 1),
      duplicate_record.full_name,
      duplicate_record.account_number,
      duplicate_record.ach_routing_number;
  END LOOP;
END $$;

