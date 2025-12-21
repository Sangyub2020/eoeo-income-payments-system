const fetch = require('node-fetch');

async function runMigration() {
  try {
    const response = await fetch('http://localhost:3002/api/migrations/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        migrationFile: '007_create_global_marketing_team_table.sql',
      }),
    });

    const data = await response.json();
    console.log('결과:', data);
  } catch (error) {
    console.error('오류:', error);
  }
}

runMigration();


