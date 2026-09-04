import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations')

export async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT now()
  )`)

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const applied = (await pool.query('SELECT name FROM _migrations')).rows.map(
    (r) => r.name
  )

  for (const file of files) {
    if (applied.includes(file)) continue
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`✓ migrated: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}
