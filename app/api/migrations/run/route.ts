import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Supabase PostgreSQL 연결 설정
// 환경 변수에서 연결 문자열 또는 개별 정보 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseConnectionString = process.env.SUPABASE_DB_CONNECTION_STRING;

if (!supabaseUrl) {
  throw new Error('Missing Supabase environment variables');
}

// 연결 풀 생성 함수
function createPool() {
  // 연결 문자열이 있으면 사용 (권장)
  if (supabaseConnectionString) {
    return new Pool({
      connectionString: supabaseConnectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  // 개별 정보로 연결
  if (!supabaseDbPassword) {
    throw new Error('SUPABASE_DB_PASSWORD 또는 SUPABASE_DB_CONNECTION_STRING 환경 변수가 필요합니다.');
  }

  // Supabase URL에서 프로젝트 참조 추출
  // 예: https://xxxxx.supabase.co -> xxxxx
  try {
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    // hostname에서 프로젝트 참조 추출 (예: wmamkvzvqntrcrvsurto.supabase.co -> wmamkvzvqntrcrvsurto)
    const projectRef = hostname.split('.')[0];
    
    if (!projectRef || projectRef.length < 3) {
      throw new Error(`Supabase URL에서 프로젝트 참조를 추출할 수 없습니다: ${supabaseUrl}`);
    }

    // Supabase 데이터베이스 호스트는 보통 db.{project-ref}.supabase.co 형식
    // 하지만 일부는 다른 형식일 수 있으므로 연결 문자열 사용을 권장
    const dbHost = `db.${projectRef}.supabase.co`;

    return new Pool({
      host: dbHost,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: supabaseDbPassword,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    throw new Error(`Supabase URL 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}. 연결 문자열(SUPABASE_DB_CONNECTION_STRING) 사용을 권장합니다.`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { migrationFile } = body;

    if (!migrationFile) {
      return NextResponse.json(
        { success: false, error: '마이그레이션 파일명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 마이그레이션 파일 경로
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    // 파일 존재 확인
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { success: false, error: `마이그레이션 파일을 찾을 수 없습니다: ${migrationFile}` },
        { status: 404 }
      );
    }

    // SQL 파일 읽기
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // SQL 실행
    const pool = createPool();
    const client = await pool.connect();
    try {
      await client.query(sql);
      return NextResponse.json({
        success: true,
        message: `마이그레이션 ${migrationFile}이(가) 성공적으로 실행되었습니다.`,
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('마이그레이션 실행 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

