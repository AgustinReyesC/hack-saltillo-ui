import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

/** Menú lateral COLAPSABLE con navegación por rutas. Sin estado propio: recibe `collapsed` y avisa con onToggle. */
interface Props { logoSrc: string; collapsed: boolean; onToggle: () => void; top: ReactNode; badges?: Record<string, number> }
const NAV = [
  { to: '/', icon: '📊', label: 'Dashboard', end: true }, { to: '/piso', icon: '📱', label: 'Piso' },
  { to: '/ordenes', icon: '🛠️', label: 'Órdenes' }, { to: '/resolucion', icon: '🧾', label: 'Resolución' },
]
export function Sidebar({ logoSrc, collapsed, onToggle, top, badges = {} }: Props) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="side-top">
        <button className="burger" onClick={onToggle} aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'} aria-expanded={!collapsed}>☰</button>
        {!collapsed && <img src={logoSrc} alt="Roceel" className="logo" />}
        {top}
      </div>
      <nav>{NAV.map((n) => (
        // NavLink = <a> que no recarga la página y sabe si su ruta está activa (isActive)
        <NavLink key={n.to} to={n.to} end={n.end} title={collapsed ? n.label : ''} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`}>
          <span>{n.icon}</span>{!collapsed && <span>{n.label}</span>}
          {!!badges[n.to] && <b className="nbadge">{badges[n.to]}</b>}
        </NavLink>))}
      </nav>
    </aside>
  )
}
