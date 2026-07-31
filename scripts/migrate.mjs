// Applique un fichier SQL de migration sur la base (DATABASE_URL).
// Usage : node scripts/migrate.mjs src/lib/migrations/001_add_en_columns.sql
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/migrate.mjs <fichier.sql>");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = readFileSync(file, "utf8");

try {
  await pool.query(sql);
  console.log(`✓ Migration appliquée : ${file}`);
} catch (err) {
  console.error("✗ Échec de la migration :", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
