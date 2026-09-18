const units = [
  { name: 'PT-A', teams: ['Platform', 'Backend'] },
  { name: 'PT-B', teams: ['Finance', 'DMS'] },
  { name: 'PT-C', teams: [] }
]

export default function Organization() {
  return (
    <main className="w-full p-5 pb-20 sm:p-6 lg:p-8">
      <div className="mb-8 border-b border-white/5 pb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Organization</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">Business Units & Teams</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Struktur ownership untuk developer portal.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {units.map((unit) => (
            <section key={unit.name} className="rounded-xl border border-white/10 bg-[#101219] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{unit.name}</h2>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">{unit.teams.length} teams</span>
            </div>
            <div className="mt-5 space-y-2">
              {unit.teams.length ? unit.teams.map((team) => (
                <div key={team} className="rounded-lg border border-white/10 bg-[#05070a] px-3 py-2 text-sm text-slate-300">{team}</div>
              )) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-[#05070a] px-3 py-6 text-center text-sm text-slate-500">Belum ada team</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
