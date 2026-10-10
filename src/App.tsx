import { EventsProvider } from './context/EventsContext'
import { SidebarContainer } from './components/containers/SidebarContainer'
import { InventoryContainer } from './components/containers/InventoryContainer'
import { ChatContainer } from './components/containers/ChatContainer'

/** Solo layout: sidebar colapsable + contenido + chat flotante. */
export default function App() {
  return (
    <EventsProvider>
      <div className="shell">
        <SidebarContainer />
        <main className="content"><InventoryContainer /></main>
      </div>
      <ChatContainer />
    </EventsProvider>
  )
}
