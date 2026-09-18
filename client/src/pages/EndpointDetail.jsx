import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { authHeaders, readRuntimeConfig, saveRuntimeConfig } from '../apiRuntimeConfig'

const METHOD_COLORS = {
  GET: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  DELETE: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  HEAD: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  OPTIONS: 'bg-slate-500/10 text-slate-400 ring-slate-500/20'
}

const BODY_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

function schemaExample(schema) {
  if (!schema || typeof schema !== 'object') return null
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]
  if (schema.type === 'array') return [schemaExample(schema.items)]
  if (schema.type === 'object' || schema.properties) {
    return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [key, schemaExample(value)]))
  }
  if (schema.format === 'email') return 'user@example.com'
  if (schema.format === 'date-time') return new Date(0).toISOString()
  if (schema.type === 'integer' || schema.type === 'number') return 0
  if (schema.type === 'boolean') return false
  return 'string'
}

function requestBodySchema(requestBody) {
  return requestBody?.content?.['application/json']?.schema
}

function requestBodyExample(requestBody) {
  const json = requestBody?.content?.['application/json']
  const example = json?.example || Object.values(json?.examples || {})[0]?.value
  const generated = example || schemaExample(json?.schema)
  return generated ? JSON.stringify(generated, null, 2) : ''
}

function copyText(value) {
  navigator.clipboard?.writeText(value)
}

function JsonBlock({ title, data }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)

  async function copy() {
    await copyText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-[#101219]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#171923] px-5 py-3">
        <h3 className="text-sm font-bold text-slate-300">{title}</h3>
        <button onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white" title="Copy to clipboard">
          {copied ? 'Copied' : 'Copy'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <div className="overflow-x-auto bg-[#0C0E14] p-5">
        <pre className="text-sm font-mono text-sky-200/80 leading-relaxed">{text}</pre>
      </div>
    </div>
  )
}

function TryIt({ endpoint }) {
  const apiId = endpoint.api_id || endpoint.id
  const saved = readRuntimeConfig(apiId, endpoint.api_base_url)
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl || endpoint.api_base_url || '')
  const [values, setValues] = useState({})
  const [body, setBody] = useState(requestBodyExample(endpoint.request_body))
  const [headers, setHeaders] = useState(saved.headers || '{}')
  const [authType, setAuthType] = useState(saved.authType || 'none')
  const [bearerToken, setBearerToken] = useState(saved.bearerToken || '')
  const [basicUser, setBasicUser] = useState(saved.basicUser || '')
  const [basicPass, setBasicPass] = useState(saved.basicPass || '')
  const [apiKeyName, setApiKeyName] = useState(saved.apiKeyName || 'X-API-Key')
  const [apiKeyValue, setApiKeyValue] = useState(saved.apiKeyValue || '')
  const [apiKeyIn, setApiKeyIn] = useState(saved.apiKeyIn || 'header')
  const [activeTab, setActiveTab] = useState(endpoint.request_body ? 'body' : 'params')
  const [savedAt, setSavedAt] = useState(null)
  const [result, setResult] = useState(null)
  const [sending, setSending] = useState(false)
  const parameters = endpoint.parameters || []
  const hasBody = BODY_METHODS.includes(endpoint.method)
  const baseOptions = [endpoint.api_base_url].filter(Boolean)

  function buildUrl(includeAuthQuery = true) {
    let path = endpoint.path
    for (const parameter of parameters.filter((item) => item.in === 'path')) {
      if (values[parameter.name]) path = path.replace(`{${parameter.name}}`, encodeURIComponent(values[parameter.name]))
    }
    const queryParts = parameters
      .filter((item) => item.in === 'query' && values[item.name])
      .map((item) => `${encodeURIComponent(item.name)}=${encodeURIComponent(values[item.name])}`)
    if (includeAuthQuery && authType === 'apiKey' && apiKeyIn === 'query' && apiKeyName && apiKeyValue) {
      queryParts.push(`${encodeURIComponent(apiKeyName)}=${encodeURIComponent(apiKeyValue)}`)
    }
    const query = queryParts.join('&')
    return `${baseUrl.replace(/\/$/, '')}${path}${query ? `?${query}` : ''}`
  }

  function requestHeaders() {
    const requestHeaders = { ...JSON.parse(headers || '{}') }
    parameters
      .filter((item) => item.in === 'header' && values[item.name])
      .forEach((item) => { requestHeaders[item.name] = values[item.name] })
    Object.assign(requestHeaders, authHeaders({ authType, bearerToken, basicUser, basicPass, apiKeyName, apiKeyValue, apiKeyIn }))
    if (hasBody && body.trim() && !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type')) {
      requestHeaders['Content-Type'] = 'application/json'
    }
    return requestHeaders
  }

  function saveConfig() {
    saveRuntimeConfig(apiId, {
      baseUrl,
      headers,
      authType,
      bearerToken,
      basicUser,
      basicPass,
      apiKeyName,
      apiKeyValue,
      apiKeyIn
    })
    setSavedAt(new Date())
  }

  function curlCommand() {
    const headerFlags = Object.entries(requestHeaders()).map(([key, value]) => `-H '${key}: ${value}'`).join(' ')
    const bodyFlag = hasBody && body.trim() ? ` --data '${body.replaceAll("'", "'\\''")}'` : ''
    return `curl -X ${endpoint.method} '${buildUrl()}' ${headerFlags}${bodyFlag}`.trim()
  }

  async function send() {
    setSending(true)
    const started = performance.now()
    try {
      const proxyResult = await api.post('/api/proxy', {
        url: buildUrl(),
        method: endpoint.method,
        headers: requestHeaders(),
        body: hasBody && body.trim() ? body : undefined
      })
      setResult(proxyResult)
    } catch (error) {
      setResult({ status: 'ERR', ok: false, duration: Math.round(performance.now() - started), data: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mb-10 overflow-hidden rounded-xl border border-white/10 bg-[#101219]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#171923] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Try it</p>
          <h2 className="mt-1 text-lg font-bold text-white">{endpoint.api_name || 'API'} request</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedAt && <span className="text-xs font-semibold text-emerald-400">Saved {savedAt.toLocaleTimeString()}</span>}
          <button onClick={() => copyText(curlCommand())} className="min-h-11 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10">Copy cURL</button>
          <button onClick={saveConfig} className="min-h-11 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-bold text-sky-300 transition hover:bg-sky-500/20">Save config</button>
          <button onClick={send} disabled={sending || !baseUrl} className="min-h-11 rounded-lg bg-sky-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-11 w-20 items-center justify-center rounded-lg border border-white/10 bg-[#05070a] px-3 text-xs font-bold text-emerald-400">{endpoint.method}</div>
          <input list={`base-url-${endpoint.id}`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={endpoint.api_base_url || 'https://api.example.com'} className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />
          <datalist id={`base-url-${endpoint.id}`}>
            {baseOptions.map((url) => <option key={url} value={url}>OpenAPI</option>)}
          </datalist>
          <div className="flex h-11 min-w-0 items-center overflow-x-auto rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-slate-300 sm:w-1/3">{buildUrl(false).replace(baseUrl, '') || endpoint.path}</div>
        </div>

        <div className="flex gap-2 border-b border-white/10">
          {['params', 'auth', 'headers', ...(hasBody ? ['body'] : [])].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${activeTab === tab ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'params' && (
          parameters.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {parameters.map((parameter) => (
                <label key={`${parameter.in}-${parameter.name}`} className="space-y-1.5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    {parameter.name}<span className="text-slate-600">({parameter.in})</span>{parameter.required && <span className="text-rose-400">*</span>}
                  </span>
                  <input value={values[parameter.name] || ''} onChange={(e) => setValues({ ...values, [parameter.name]: e.target.value })} placeholder={parameter.schema?.type || 'value'} className="h-10 w-full rounded-lg border border-white/10 bg-[#080b12] px-3 text-sm text-white outline-none focus:border-sky-500" />
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-[#05070a] p-4 text-sm text-slate-500">No parameters.</p>
          )
        )}

        {activeTab === 'auth' && (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Type</span>
              <select value={authType} onChange={(e) => setAuthType(e.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500">
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apiKey">API Key</option>
              </select>
            </label>
            {authType === 'bearer' && <input value={bearerToken} onChange={(e) => setBearerToken(e.target.value)} placeholder="token" className="mt-6 h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />}
            {authType === 'basic' && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <input value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="username" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
                <input value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="password" type="password" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
              </div>
            )}
            {authType === 'apiKey' && (
              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
                <input value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} placeholder="Header/query name" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
                <input value={apiKeyValue} onChange={(e) => setApiKeyValue(e.target.value)} placeholder="value" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />
                <select value={apiKeyIn} onChange={(e) => setApiKeyIn(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500">
                  <option value="header">Header</option>
                  <option value="query">Query</option>
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Headers JSON</span>
            <textarea value={headers} onChange={(e) => setHeaders(e.target.value)} className="min-h-36 w-full resize-y rounded-lg border border-white/10 bg-[#05070a] p-3 font-mono text-xs text-sky-200 outline-none focus:border-sky-500" spellCheck="false" />
          </label>
        )}

        {activeTab === 'body' && hasBody && (
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Request body</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={'{\n  "key": "value"\n}'} className="min-h-44 w-full resize-y rounded-lg border border-white/10 bg-[#05070a] p-3 font-mono text-xs text-sky-200 outline-none focus:border-sky-500" spellCheck="false" />
          </label>
        )}

        {result && (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080b12]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-bold">
              <span className={result.ok ? 'text-emerald-400' : 'text-rose-400'}>{result.status}</span>
              <span className="text-slate-500">{result.duration} ms</span>
            </div>
            <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed text-sky-100">{typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}</pre>
          </div>
        )}
      </div>
    </section>
  )
}

export default function EndpointDetail() {
  const { endpointId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['endpoint', endpointId],
    queryFn: () => api.get(`/api/endpoints/${endpointId}`)
  })

  if (isLoading) return <div className="mx-auto max-w-4xl px-6 py-12 text-center text-slate-500">Loading endpoint...</div>

  const ep = data?.endpoint
  if (!ep) return <div className="mx-auto max-w-4xl px-6 py-12 text-center text-slate-500">Endpoint not found.</div>

  const methodColor = METHOD_COLORS[ep.method] || METHOD_COLORS.GET
  const hasMainContent = Boolean(ep.description || ep.parameters?.length)

  return (
    <main className="mx-auto w-full px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-10 pb-6 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-sky-400 mb-6 transition-colors">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className={`inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-extrabold tracking-widest ring-1 ring-inset ${methodColor}`}>
            {ep.method}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight break-all">
            {ep.path}
          </h1>
        </div>
        {ep.summary && <p className="mt-4 text-slate-400 text-lg leading-relaxed">{ep.summary}</p>}
      </div>

      <TryIt endpoint={ep} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="space-y-8">
          {ep.description && (
            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Description</h3>
              <div className="rounded-xl border border-white/10 bg-[#101219] p-6">
                <p className="text-slate-300 leading-relaxed">{ep.description}</p>
              </div>
            </section>
          )}

          {ep.parameters?.length > 0 && (
            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Parameters</h3>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101219]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#0B0F19]/80 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold border-b border-white/5">Name</th>
                        <th className="px-6 py-4 font-semibold border-b border-white/5">In</th>
                        <th className="px-6 py-4 font-semibold border-b border-white/5">Required</th>
                        <th className="px-6 py-4 font-semibold border-b border-white/5">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ep.parameters.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-sky-400">{p.name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-inset ring-white/10">
                              {p.in}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.required ? (
                              <span className="inline-flex items-center text-xs font-bold text-rose-400">Required</span>
                            ) : (
                              <span className="text-slate-500 text-xs">Optional</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-300">{p.schema?.type || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {!hasMainContent && <p className="rounded-lg border border-white/10 bg-slate-900/30 p-5 text-sm text-slate-500">No extra endpoint docs. Use the request builder above, then inspect the response schema on the right.</p>}
        </div>

        <div className="space-y-8">
          {ep.request_body && <JsonBlock title="Request Schema" data={requestBodySchema(ep.request_body) || ep.request_body} />}

          {ep.responses && Object.keys(ep.responses).length > 0 && (
            <JsonBlock title="Responses" data={ep.responses} />
          )}

          {ep.security && <JsonBlock title="Security" data={ep.security} />}
        </div>
      </div>
    </main>
  )
}
