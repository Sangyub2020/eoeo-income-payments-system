// 직접 마이그레이션 실행 스크립트
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 직접 읽기
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseConnectionString = process.env.SUPABASE_DB_CONNECTION_STRING;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 환경 변수가 없습니다.');
  process.exit(1);
}

function createPool() {
  if (supabaseConnectionString) {
    return new Pool({
      connectionString: supabaseConnectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!supabaseDbPassword) {
    console.error('❌ SUPABASE_DB_PASSWORD 또는 SUPABASE_DB_CONNECTION_STRING 환경 변수가 필요합니다.');
    process.exit(1);
  }

  const url = new URL(supabaseUrl);
  const hostname = url.hostname;
  const projectRef = hostname.split('.')[0];
  
  if (!projectRef || projectRef.length < 3) {
    console.error(`❌ Supabase URL에서 프로젝트 참조를 추출할 수 없습니다: ${supabaseUrl}`);
    process.exit(1);
  }

  const dbHost = `db.${projectRef}.supabase.co`;

  return new Pool({
    host: dbHost,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: supabaseDbPassword,
    ssl: { rejectUnauthorized: false },
  });
}

async function runMigration() {
  const migrationFile = '031_add_brand_names_to_income_records.sql';
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ 마이그레이션 파일을 찾을 수 없습니다: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  console.log(`\n🔄 마이그레이션 실행 중: ${migrationFile}\n`);

  const pool = createPool();
  const client = await pool.connect();
  
  try {
    await client.query(sql);
    console.log(`✅ 마이그레이션 ${migrationFile}이(가) 성공적으로 실행되었습니다!\n`);
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error.message);
    if (error.detail) {
      console.error('상세:', error.detail);
    }
    if (error.hint) {
      console.error('힌트:', error.hint);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

