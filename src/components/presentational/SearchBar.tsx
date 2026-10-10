/** Input "controlado": su valor lo manda el padre (value) y avisa cada tecla (onChange). */
interface Props { value: string; onChange: (v: string) => void; placeholder?: string }

export const SearchBar = ({ value, onChange, placeholder = 'Buscar…' }: Props) => (
  <input className="search" type="search" value={value} placeholder={placeholder}
         onChange={(e) => onChange(e.target.value)} />
)
