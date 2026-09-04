import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

function JsonBlock({ title, data }) {
  return (
    <div className="json-block">
      <h3>{title}</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default function EndpointDetail() {
  const { endpointId } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['endpoint', endpointId],
    queryFn: () => api.get(`/api/endpoints/${endpointId}`)
  })

  if (isLoading) return <div className="container">Memuat...</div>

  const ep = data?.endpoint
  if (!ep) return <div className="container">Endpoint tidak ditemukan.</div>

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <Link to="/" className="back">← Dashboard</Link>
          <h1>
            <span className="method inline">{ep.method}</span> {ep.path}
          </h1>
          {ep.summary && <p className="muted">{ep.summary}</p>}
        </div>
      </div>

      {ep.description && (
        <section className="card section">
          <h3>Description</h3>
          <p>{ep.description}</p>
        </section>
      )}

      {ep.parameters?.length > 0 && (
        <section className="card section">
          <h3>Parameters</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>In</th>
                <th>Required</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {ep.parameters.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.in}</td>
                  <td>{p.required ? 'Ya' : 'Tidak'}</td>
                  <td>{p.schema?.type || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {ep.request_body && <JsonBlock title="Request Body" data={ep.request_body} />}

      {ep.responses && Object.keys(ep.responses).length > 0 && (
        <JsonBlock title="Responses" data={ep.responses} />
      )}

      {ep.security && <JsonBlock title="Security" data={ep.security} />}
    </main>
  )
}
