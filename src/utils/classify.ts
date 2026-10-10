import type { PartSummary } from '../types'

/**
 * ÚNICA regla que separa "normal" de "defectuoso". Se basa en part_condition (API_README §8.2):
 * solo `new` y `functional` están disponibles; el resto (defective, under_repair, scrapped) es de reparación.
 * Si mañana cambia la regla, se cambia AQUÍ y las dos tablas se actualizan solas.
 */
export const isDefective = (p: PartSummary): boolean =>
  p.condition_code === 'defective' || p.condition_code === 'under_repair' || p.condition_code === 'scrapped'
