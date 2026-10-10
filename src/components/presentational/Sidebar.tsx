import { ClipboardList, LayoutDashboard, Link2, Menu, ScanLine, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

/** Menú lateral COLAPSABLE con navegación por rutas. Sin estado propio: recibe `collapsed` y avisa con onToggle. */
interface Props { logoSrc: string; collapsed: boolean; onToggle: () => void; top: ReactNode; badges?: Record<string, number> }
const NAV: { to: string; icon: LucideIcon; label: string; end?: boolean }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true }, { to: '/piso', icon: ScanLine, label: 'Piso' },
  { to: '/ordenes', icon: ClipboardList, label: 'Órdenes' }, { to: '/resolucion', icon: Link2, label: 'Resolución' },
]
export function Sidebar({ logoSrc, collapsed, onToggle, top, badges = {} }: Props) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="side-top">
        <button className="burger" onClick={onToggle} aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'} aria-expanded={!collapsed}><Menu size={18} aria-hidden="true" /></button>
        {!collapsed && <img src={logoSrc} alt="Roceel" className="logo" />}
        {top}
      </div>
      <nav>{NAV.map((n) => (
        // NavLink = <a> que no recarga la página y sabe si su ruta está activa (isActive)
        <NavLink key={n.to} to={n.to} end={n.end} title={collapsed ? n.label : ''} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`}>
          <n.icon size={18} aria-hidden="true" />{!collapsed && <span>{n.label}</span>}
          {!!badges[n.to] && <b className="nbadge">{badges[n.to]}</b>}
        </NavLink>))}
      </nav>
    </aside>
  )
}
