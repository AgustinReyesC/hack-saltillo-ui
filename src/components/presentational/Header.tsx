import type { ReactNode } from 'react'

/** `left` es un "hueco": quien use Header decide qué poner a la izquierda (aquí, la campana). */
interface Props { logoSrc: string; left: ReactNode }

export function Header({ logoSrc, left }: Props) {
  return (
    <header className="header">
      <div className="header-left">{left}</div>
      <img src={logoSrc} alt="Roceel" className="logo" />
      <span className="tagline">Servicios especializados · Inventario</span>
    </header>
  )
}
