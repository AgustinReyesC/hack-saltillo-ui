import { Search } from 'lucide-react'
import type { FormEvent } from 'react'
/** Buscador por código de orden (ej. R061026012). Input controlado: el padre guarda el texto. */
interface Props { value: string; onChange: (v: string) => void; onSearch: () => void }
export function OrderSearchForm({ value, onChange, onSearch }: Props) {
  const submit = (e: FormEvent) => { e.preventDefault(); onSearch() }
  return (
    <form className="order-search" onSubmit={submit}>
      <div className="search-box">
        <Search size={16} aria-hidden="true" />
        <input className="search" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="Código de orden, ej. R061026012" autoCapitalize="characters" />
      </div>
      <button disabled={!value.trim()}>Buscar</button>
    </form>
  )
}
