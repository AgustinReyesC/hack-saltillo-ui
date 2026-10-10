import { USE_MOCKS } from '../config'
import { httpInventoryService } from './httpService'
import { mockInventoryService } from './mockService'

/** ÚNICO punto de intercambio. El resto de la app importa `inventoryService` y nada más. */
export const inventoryService = USE_MOCKS ? mockInventoryService : httpInventoryService
