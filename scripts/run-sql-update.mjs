// SQL 직접 실행 스크립트
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일에서 환경 변수 로드
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSQL() {
  try {
    const sql = `
      UPDATE income_records
      SET advance_balance = '일시불'
      WHERE advance_balance = '분할X';
    `;

    console.log('SQL 실행 중...');
    console.log(sql);

    // Supabase RPC를 통해 SQL 실행
    // Supabase는 직접 SQL 실행을 지원하지 않으므로, 
    // Supabase Admin API의 REST 엔드포인트를 사용하거나
    // 또는 pg 라이브러리를 사용해야 합니다.
    
    // 대신 Supabase의 REST API를 사용하여 직접 업데이트
    // 먼저 '분할X' 값을 가진 레코드들을 찾아서 업데이트
    const { data: records, error: fetchError } = await supabase
      .from('income_records')
      .select('id')
      .eq('advance_balance', '분할X');

    if (fetchError) {
      throw fetchError;
    }

    if (!records || records.length === 0) {
      console.log('✅ 업데이트할 레코드가 없습니다.');
      return;
    }

    console.log(`📊 ${records.length}개의 레코드를 찾았습니다.`);

    // 배치로 업데이트
    const { error: updateError } = await supabase
      .from('income_records')
      .update({ advance_balance: '일시불' })
      .eq('advance_balance', '분할X');

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ 성공적으로 ${records.length}개의 레코드를 업데이트했습니다.`);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

runSQL();

