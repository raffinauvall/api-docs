import { query } from '../db.js'

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function toSlug(s) {
  return slugify(s)
}

export async function listGroups() {
  return (
    await query(
      `SELECT g.id, g.name, g.slug, g.description, g.created_by,
              g.created_at, g.updated_at,
              u.name AS creator_name,
              (SELECT count(*) FROM apis a WHERE a.group_id = g.id) AS api_count
       FROM api_groups g
       LEFT JOIN users u ON u.id = g.created_by
       ORDER BY g.name`
    )
  ).rows
}

export async function getGroupById(id) {
  return (await query('SELECT * FROM api_groups WHERE id = $1', [id])).rows[0]
}

export async function createGroupForClient(client, { name, slug }) {
  return (
    await client.query(
      `INSERT INTO api_groups (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
       RETURNING *`,
      [name, slug]
    )
  ).rows[0]
}

export async function createGroup({ name, slug, description, createdBy }) {
  return (
    await query(
      `INSERT INTO api_groups (name, slug, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, description || null, createdBy]
    )
  ).rows[0]
}

export async function updateGroup(id, fields) {
  const keys = []
  const values = []
  let i = 1
  for (const [k, v] of Object.entries(fields)) {
    keys.push(`${k} = $${i++}`)
    values.push(v)
  }
  values.push(id)
  const res = await query(
    `UPDATE api_groups SET ${keys.join(', ')}, updated_at = now()
     WHERE id = $${i} RETURNING *`,
    values
  )
  return res.rows[0]
}

export async function deleteGroup(id) {
  await query('DELETE FROM api_groups WHERE id = $1', [id])
}
