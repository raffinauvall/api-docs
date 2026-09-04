import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.db.connectionString,
  max: 10
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client', err)
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
