import { Outlet } from 'react-router-dom'
import { SidebarContainer } from '../components/containers/SidebarContainer'
import { ChatContainer } from '../components/containers/ChatContainer'

/** Marco común a TODAS las rutas: sidebar (con campana) + <Outlet/> (aquí se pinta la vista activa) + chat flotante. */
export function AppLayout() {
  return (
    <>
      <div className="shell">
        <SidebarContainer />
        <main className="content"><Outlet /></main>
      </div>
      <ChatContainer />
    </>
  )
}
