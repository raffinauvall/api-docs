const units = [
  { name: 'PT-A', teams: ['Platform', 'Backend'] },
  { name: 'PT-B', teams: ['Finance', 'DMS'] },
  { name: 'PT-C', teams: [] }
]

export default function Organization() {
  return <main className="hub-page"><header className="hub-page-header"><div><p className="hub-kicker">Organization</p><h1 className="hub-title">Business Units & Teams</h1><p className="hub-subtitle">Struktur ownership yang membantu orang menemukan pemilik service dan API.</p></div></header><div className="hub-grid hub-grid-3">{units.map((unit) => <section key={unit.name} className="hub-panel"><div className="hub-panel-header"><div><p className="hub-panel-label">Business unit</p><h2 className="hub-panel-title" style={{ marginTop: 6 }}>{unit.name}</h2></div><span className="hub-badge hub-badge-muted">{unit.teams.length} teams</span></div><div style={{ display: 'grid', gap: 8, padding: 16 }}>{unit.teams.length ? unit.teams.map((team) => <div key={team} style={{ background: 'var(--input)', border: '1px solid var(--line-soft)', borderRadius: 8, color: 'var(--text-2)', padding: '12px 13px' }}>{team}</div>) : <div className="hub-empty" style={{ border: '1px dashed var(--line)', borderRadius: 8, padding: 28 }}><p>Belum ada team</p></div>}</div></section>)}</div></main>
}
