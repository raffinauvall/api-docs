import SwaggerParser from '@apidevtools/swagger-parser'
import YAML from 'yaml'
import crypto from 'node:crypto'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export function parseOpenApiText(text) {
  if (Buffer.byteLength(text, 'utf8') > MAX_SIZE) {
    const e = new Error('OpenAPI document melebihi batas ukuran (5 MB)')
    e.status = 400
    throw e
  }

  const trimmed = text.trimStart()
  let format
  let doc

  if (trimmed.startsWith('{')) {
    format = 'json'
    try {
      doc = JSON.parse(text)
    } catch (err) {
      const e = new Error(`Invalid JSON: ${err.message}`)
      e.status = 400
      throw e
    }
  } else {
    format = 'yaml'
    try {
      doc = YAML.parse(text)
    } catch (err) {
      const e = new Error(`Invalid YAML: ${err.message}`)
      e.status = 400
      throw e
    }
  }

  if (!doc || typeof doc !== 'object') {
    const e = new Error('OpenAPI document kosong atau bukan object')
    e.status = 400
    throw e
  }

  return { doc, format }
}

export async function validateOpenApi(doc) {
  try {
    await SwaggerParser.validate(doc)
  } catch (err) {
    const e = new Error(`Invalid OpenAPI document: ${err.message}`)
    e.status = 400
    throw e
  }
}

export function checksum(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

// Ekstrak metadata API dari info + servers.
export function extractApiMeta(doc) {
  const info = doc?.info || {}
  const servers = doc?.servers || []
  return {
    name: info.title || 'Untitled API',
    description: info.description || '',
    version: info.version || '1.0.0',
    baseUrl: servers[0]?.url || ''
  }
}

// Ekstrak seluruh endpoint (path + method) menjadi baris untuk tabel `endpoints`.
export function extractEndpoints(doc) {
  const paths = doc?.paths || {}
  const endpoints = []

  for (const [path, pathItem] of Object.entries(paths)) {
    const pathParams = pathItem?.parameters || []
    for (const method of HTTP_METHODS) {
      const op = pathItem?.[method]
      if (!op || typeof op !== 'object') continue

      // Gabung path-level + operation-level parameters (operation menang jika nama+in sama)
      const opParams = op.parameters || []
      const merged = [...pathParams]
      for (const p of opParams) {
        const idx = merged.findIndex((x) => x?.name === p?.name && x?.in === p?.in)
        if (idx >= 0) merged[idx] = p
        else merged.push(p)
      }

      endpoints.push({
        path,
        method: method.toUpperCase(),
        operation_id: op.operationId || null,
        summary: op.summary || null,
        description: op.description || null,
        deprecated: !!op.deprecated,
        tags: op.tags || [],
        parameters: merged,
        request_body: op.requestBody || null,
        responses: op.responses || {},
        security: op.security || null
      })
    }
  }

  return endpoints
}
