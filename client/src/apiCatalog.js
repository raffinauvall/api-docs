export function groupApis(apis) {
  return Object.values((apis || []).reduce((acc, item) => {
    const key = `${item.repository || item.id}:${item.file_path || item.slug || item.name}`
    const current = acc[key] || { ...item, branches: [] }
    current.branches.push(item)
    current.last_synced_at = [current.last_synced_at, item.last_synced_at].filter(Boolean).sort().at(-1)
    current.last_sync_status = current.branches.some((branch) => branch.last_sync_status === 'FAILED') ? 'FAILED' : item.last_sync_status
    const preferred = current.branches.find((branch) => branch.branch === item.branch) || item
    current.endpoint_count = Number(preferred.endpoint_count || 0)
    acc[key] = current
    return acc
  }, {}))
}
