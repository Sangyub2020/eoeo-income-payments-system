// 마이그레이션 실행 스크립트
// 사용법: node scripts/run-migration.mjs [migration-file-name]

const migrationFile = process.argv[2] || '007_create_global_marketing_team_table.sql';

async function runMigration() {
  try {
    console.log(`마이그레이션 실행 중: ${migrationFile}...`);
    
    const response = await fetch('http://localhost:3002/api/migrations/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        migrationFile: migrationFile,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 성공:', data.message);
    } else {
      console.error('❌ 실패:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error('개발 서버가 실행 중인지 확인하세요 (npm run dev)');
    process.exit(1);
  }
}

runMigration();









