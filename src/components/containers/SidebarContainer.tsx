import { useState } from 'react'
import { Sidebar } from '../presentational/Sidebar'
import { NotificationsContainer } from './NotificationsContainer'

/** Dueño del estado "¿colapsado?". El layout se ajusta solo porque .content usa flex:1. */
export function SidebarContainer() {
  const [collapsed, setCollapsed] = useState(false) // false = menú visible
  return <Sidebar logoSrc="/assets/logo.png" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} top={<NotificationsContainer />} />
}
