import { config } from '../config.js'

// Abstraction Git provider (provider-agnostic).
// Kontrak minimal: getFile(), getLatestCommit().
// Tidak boleh ada business logic parsing di sini.

class GitHubProvider {
  constructor() {
    this.token = config.github.token
  }

  _headers() {
    const h = { Accept: 'application/vnd.github.v3+json' }
    if (this.token) h.Authorization = `Bearer ${this.token}`
    return h
  }

  // repository: "owner/repo", filePath: "docs/openapi.yml", ref: "main"
  async getFile(repository, filePath, ref) {
    const url = `https://api.github.com/repos/${repository}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(ref)}`
    const r = await fetch(url, { headers: this._headers() })
    if (r.status === 404) {
      const e = new Error(`File tidak ditemukan: ${filePath}`)
      e.status = 404
      throw e
    }
    if (!r.ok) {
      const e = new Error(`Gagal fetch file dari GitHub (${r.status})`)
      e.status = r.status
      throw e
    }
    const data = await r.json()
    if (data.type !== 'file' || !data.content) {
      const e = new Error(`Path bukan file: ${filePath}`)
      e.status = 400
      throw e
    }
    // decode base64
    const content = Buffer.from(data.content, 'base64').toString('utf8')
    return { content, sha: data.sha, path: data.path }
  }

  // Ambil SHA commit terbaru di branch.
  async getLatestCommit(repository, ref) {
    const url = `https://api.github.com/repos/${repository}/commits?sha=${encodeURIComponent(ref)}&per_page=1`
    const r = await fetch(url, { headers: this._headers() })
    if (!r.ok) {
      const e = new Error(`Gagal ambil commit dari GitHub (${r.status})`)
      e.status = r.status
      throw e
    }
    const data = await r.json()
    return data[0]?.sha || null
  }
}

const providers = {
  github: () => new GitHubProvider()
}

export function getProvider(name = 'github') {
  const factory = providers[name]
  if (!factory) throw new Error(`Git provider tidak didukung: ${name}`)
  return factory()
}
