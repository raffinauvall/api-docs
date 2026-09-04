import { query } from '../db.js'

export async function findUserByNik(nik) {
  return (
    await query(
      'SELECT id, email, name, avatar, nik, role, bu, created_at FROM users WHERE nik = $1',
      [nik]
    )
  ).rows[0]
}

export async function upsertUser({ email, name, avatar, nik, role, bu }) {
  const res = await query(
    `INSERT INTO users (email, name, avatar, nik, role, bu)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (nik) DO UPDATE
       SET email = COALESCE(EXCLUDED.email, users.email),
           name = COALESCE(EXCLUDED.name, users.name),
           avatar = COALESCE(EXCLUDED.avatar, users.avatar),
           role = COALESCE(EXCLUDED.role, users.role),
           bu = COALESCE(EXCLUDED.bu, users.bu),
           updated_at = now()
     RETURNING id, email, name, avatar, nik, role, bu, created_at`,
    [email || null, name || null, avatar || null, nik, role || 'user', bu || null]
  )
  return res.rows[0]
}
