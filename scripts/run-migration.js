const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseConnectionString = process.env.SUPABASE_DB_CONNECTION_STRING;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

function createPool() {
  if (supabaseConnectionString) {
    return new Pool({
      connectionString: supabaseConnectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  if (!supabaseDbPassword) {
    console.error('Missing SUPABASE_DB_PASSWORD or SUPABASE_DB_CONNECTION_STRING');
    process.exit(1);
  }

  const url = new URL(supabaseUrl);
  const hostname = url.hostname;
  const projectRef = hostname.split('.')[0];
  
  if (!projectRef || projectRef.length < 3) {
    console.error(`Cannot extract project ref from Supabase URL: ${supabaseUrl}`);
    process.exit(1);
  }

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
}

async function runMigration() {
  const migrationFile = '031_add_brand_names_to_income_records.sql';
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  console.log(`Running migration: ${migrationFile}`);

  const pool = createPool();
  const client = await pool.connect();
  
  try {
    await client.query(sql);
    console.log(`✅ Migration ${migrationFile} executed successfully!`);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
