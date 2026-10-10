import { EventsProvider } from './context/EventsContext'
import { Header } from './components/presentational/Header'
import { NotificationsContainer } from './components/containers/NotificationsContainer'
import { InventoryContainer } from './components/containers/InventoryContainer'
import { ChatContainer } from './components/containers/ChatContainer'

/** App ya no guarda estado: solo arma el layout. Cada contenedor maneja lo suyo. */
export default function App() {
  return (
    <EventsProvider>
      <Header logoSrc="/assets/logo.png" left={<NotificationsContainer />} />
      <main className="main"><InventoryContainer /></main>
      <ChatContainer />
    </EventsProvider>
  )
}
