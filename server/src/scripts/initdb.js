import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

// Inisialisasi + start cluster PostgreSQL lokal di PGDATA (tanpa Docker).
// Dipanggil manual: `npm run db:init`.
const pgdata = path.resolve(config.db.connectionString ? process.env.PGDATA || path.join(process.cwd(), '..', 'pgdata') : 'pgdata')

if (process.getuid && process.getuid() === 0) {
  console.error('Jangan jalankan initdb sebagai root. Gunakan user non-root.')
  process.exit(1)
}

if (!fs.existsSync(path.join(pgdata, 'PG_VERSION'))) {
  console.log(`initdb di ${pgdata} ...`)
  execFileSync('initdb', ['-D', pgdata, '--encoding=UTF8', '--auth=trust'], {
    stdio: 'inherit'
  })
} else {
  console.log(`Cluster sudah ada di ${pgdata}`)
}
