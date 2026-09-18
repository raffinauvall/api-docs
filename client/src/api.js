const BASE = ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(new Error(data.error || (res.status === 401 ? 'Belum login' : 'Terjadi kesalahan')), {
      status: res.status,
      data
    })
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}
