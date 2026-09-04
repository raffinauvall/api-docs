import { query } from '../db.js'

export async function getSourceById(id) {
  return (await query('SELECT * FROM api_sources WHERE id = $1', [id])).rows[0]
}

export async function getSourceByApi(apiId) {
  return (await query('SELECT * FROM api_sources WHERE api_id = $1 LIMIT 1', [apiId])).rows[0]
}

export async function findSourceByRepo({ provider, repository, branch, filePath }) {
  return (
    await query(
      `SELECT * FROM api_sources
       WHERE provider = $1 AND repository = $2 AND branch = $3 AND file_path = $4`,
      [provider, repository, branch, filePath]
    )
  ).rows[0]
}

export async function createSource(client, { apiId, provider, repository, branch, filePath }) {
  const res = await client.query(
    `INSERT INTO api_sources (api_id, provider, repository, branch, file_path)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [apiId, provider, repository, branch, filePath]
  )
  return res.rows[0]
}

export async function listSourcesByRepository(repository, branch) {
  const params = [repository]
  let sql = 'SELECT * FROM api_sources WHERE repository = $1'
  if (branch) {
    sql += ' AND branch = $2'
    params.push(branch)
  }
  return (await query(sql, params)).rows
}

export async function updateSource(id, fields) {
  const keys = []
  const values = []
  let i = 1
  for (const [k, v] of Object.entries(fields)) {
    keys.push(`${k} = $${i++}`)
    values.push(v)
  }
  values.push(id)
  const res = await query(
    `UPDATE api_sources SET ${keys.join(', ')}, updated_at = now()
     WHERE id = $${i} RETURNING *`,
    values
  )
  return res.rows[0]
}

export async function updateSourceForClient(client, id, fields) {
  const keys = []
  const values = []
  let i = 1
  for (const [k, v] of Object.entries(fields)) {
    keys.push(`${k} = $${i++}`)
    values.push(v)
  }
  values.push(id)
  const res = await client.query(
    `UPDATE api_sources SET ${keys.join(', ')}, updated_at = now()
     WHERE id = $${i} RETURNING *`,
    values
  )
  return res.rows[0]
}
