/** Fila de tarjetas KPI (como "Product Statistic"). `tone` pinta el borde: verde ok / amarillo aviso. */
export interface Stat { label: string; value: number; tone: 'ok' | 'warn' | 'neutral' }
export const StatsRow = ({ stats }: { stats: Stat[] }) => (
  <div className="stats">{stats.map((s) => (
    <div key={s.label} className={`stat ${s.tone}`}><span>{s.label}</span><b>{s.value}</b></div>))}
  </div>
)
