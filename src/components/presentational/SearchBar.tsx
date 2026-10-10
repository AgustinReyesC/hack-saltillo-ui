import { Search } from 'lucide-react'
/** Input "controlado": su valor lo manda el padre (value) y avisa cada tecla (onChange). */
interface Props { value: string; onChange: (v: string) => void; placeholder?: string }

export const SearchBar = ({ value, onChange, placeholder = 'Buscar…' }: Props) => (
  <div className="search-box">
    <Search size={16} aria-hidden="true" />
    <input className="search" type="search" value={value} placeholder={placeholder}
           onChange={(e) => onChange(e.target.value)} />
  </div>
)
