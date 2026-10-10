import type { ReactNode } from 'react'

/**
 * Sidebar COLAPSABLE. No guarda estado: recibe `collapsed` y avisa con `onToggle`.
 * `top` = hueco para la campana, que se queda visible aunque el menú esté colapsado.
 */
interface Props { logoSrc: string; collapsed: boolean; onToggle: () => void; top: ReactNode }
const NAV = [
  { icon: '📦', label: 'Inventario', active: true },
  { icon: '⚠️', label: 'Faltantes' }, { icon: '🛒', label: 'Reabasto' },
  { icon: '🧾', label: 'Sin relacionar' }, { icon: '🛠️', label: 'Órdenes' },
]
export function Sidebar({ logoSrc, collapsed, onToggle, top }: Props) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="side-top">
        <button className="burger" onClick={onToggle} aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'} aria-expanded={!collapsed}>☰</button>
        {!collapsed && <img src={logoSrc} alt="Roceel" className="logo" />} {/* colapsado: se quita el logo */}
        {top}
      </div>
      <nav>{NAV.map((n) => (
        <button key={n.label} className={`nav ${n.active ? 'active' : ''}`} disabled={!n.active}
                title={collapsed ? n.label : n.active ? '' : 'Próximamente'}>
          <span>{n.icon}</span>{!collapsed && <span>{n.label}</span>} {/* colapsado: solo el ícono */}
        </button>))}
      </nav>
    </aside>
  )
}
