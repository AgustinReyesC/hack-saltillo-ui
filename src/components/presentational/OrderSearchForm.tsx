import type { FormEvent } from 'react'
/** Buscador por código de orden (ej. R061026012). Input controlado: el padre guarda el texto. */
interface Props { value: string; onChange: (v: string) => void; onSearch: () => void }
export function OrderSearchForm({ value, onChange, onSearch }: Props) {
  const submit = (e: FormEvent) => { e.preventDefault(); onSearch() }
  return (
    <form className="order-search" onSubmit={submit}>
      <input className="search" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="Código de orden, ej. R061026012" autoCapitalize="characters" />
      <button disabled={!value.trim()}>Buscar</button>
    </form>
  )
}
