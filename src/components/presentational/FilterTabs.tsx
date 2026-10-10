/** Pestañas de filtro con contador (como "All / Active / Drafts"). Solo diseño. */
export interface Tab { id: string; label: string; count: number }
interface Props { tabs: Tab[]; active: string; onChange: (id: string) => void }
export const FilterTabs = ({ tabs, active, onChange }: Props) => (
  <div className="tabs">{tabs.map((t) => (
    <button key={t.id} className={t.id === active ? 'on' : ''} onClick={() => onChange(t.id)}>{t.label} <i>{t.count}</i></button>))}
  </div>
)
