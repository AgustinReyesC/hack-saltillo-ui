import { useState } from 'react'
import { Sidebar } from '../presentational/Sidebar'
import { NotificationsContainer } from './NotificationsContainer'
import { useWarehouse } from '../../context/WarehouseContext'

export function SidebarContainer() {
  const { unmatched } = useWarehouse()
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 800) // en celular arranca colapsado
  return <Sidebar logoSrc="/assets/logo.png" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}
    top={<NotificationsContainer />} badges={{ '/resolucion': unmatched.length }} />
}
