import type { ReactNode } from 'react'
/** Tarjeta con título y contador. tone="warn" pinta borde amarillo (faltantes/avisos). */
interface Props { title: string; count?: number; tone?: 'ok' | 'warn'; children: ReactNode }
export const Section = ({ title, count, tone, children }: Props) => (
  <section className={`panel ${tone ? `tone-${tone}` : ''}`}>
    <header className="panel-head"><h2>{title}</h2>{count !== undefined && <i>{count}</i>}</header>{children}
  </section>
)
