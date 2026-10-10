# Documentación completa — Almacén inteligente para taller

> Documento consolidado que reúne **todo** el contenido del kit de arranque:
> el documento técnico del reto (PDF), el `README.md` raíz, el contrato, las pruebas de
> contrato y el dataset. No se omite información.

## Índice

1. [Contexto y objetivo (documento técnico)](#1-contexto-y-objetivo)
2. [Arquitectura y transporte](#2-arquitectura-y-transporte)
3. [Datos de entrada (documento técnico)](#3-datos-de-entrada)
4. [Qué deben construir](#4-qué-deben-construir)
5. [Lo que debe salir](#5-lo-que-debe-salir)
6. [Procedimiento](#6-procedimiento)
7. [Evaluación](#7-evaluación)
8. [Kit de arranque (README raíz)](#8-kit-de-arranque-readme-raíz)
9. [Contrato (contract/README.md)](#9-contrato-contractreadmemd)
10. [Pruebas de contrato (contract-tests/README.md)](#10-pruebas-de-contrato-contract-testsreadmemd)
11. [Dataset (data/README.md)](#11-dataset-datareadmemd)
12. [Resultados de las pruebas locales](#12-resultados-de-las-pruebas-locales)

---

# Reto Hackathon — Almacén inteligente para taller

*Oct 6, 2026 · @Fernando Vazquez*

## 1. Contexto y objetivo

Construyan el servicio de inventario de un taller de reparación de equipo industrial
(husillos, motores eléctricos). Debe enterarse de lo que pasa en el taller por eventos y
responder con existencias, reservas y faltantes en tiempo real.

Hoy el taller ya registra cada equipo que entra (una orden de trabajo), lo inspecciona y
genera una lista de partes: cuáles están bien, cuáles están dañadas y cuáles faltan, y si hay
que comprarlas o repararlas. Compras recibe material. Pero nadie sabe qué hay en el
almacén, así que cada pieza se busca a mano y se pide tarde.

El servicio que construyan debe cerrar este ciclo:

1. Una inspección aprobada pide piezas para una orden de trabajo.
2. Si hay existencia, se reserva para esa orden.
3. Si no alcanza, se registra un faltante y se sugiere una compra.
4. Cuando llega la compra, entra al almacén y se surten las reservas pendientes.
5. El técnico retira la pieza contra su orden y el stock baja.

No tienen que construir el sistema del taller: ese ya existe y les manda los eventos.
Ustedes construyen el inventario que los consume.

## 2. Arquitectura y transporte

El taller publica eventos en un broker Kafka y su servicio los consume. Ustedes no leen la
base de datos del taller ni llaman a su API: todo lo que necesitan llega por los tópicos.

Garantías de entrega, tal como funcionará con el sistema real:

- **Al menos una vez.** Un evento puede llegar repetido; deduplicar por `event_id` es
  responsabilidad suya.
- **Orden por llave.** Dentro de un tópico, los eventos con la misma `key` llegan en orden.
  Entre tópicos distintos no hay orden garantizado.
- **Retención completa.** Los tópicos guardan todo el historial, así que pueden releer
  desde el inicio para reconstruir su estado.
- **Errores.** Un evento que no puedan procesar después de reintentar va a un tópico
  `inventory.dlq` propio, sin detener el consumo.

## 3. Datos de entrada

Todos los eventos llegan en JSON con el mismo sobre; lo que cambia es `data`. Las fechas van
en ISO 8601 UTC, los IDs son enteros y los importes son decimales en texto.

**arquitectura · 4 tópicos de entrada, 3 salidas**

```json
{
  "event_id": "0b9f3c1e-7a42-4c1d-9e0a-5d2f8b61c7aa",
  "event_type": "inspection.approved",
  "event_version": 1,
  "occurred_at": "2026-10-06T16:42:11Z",
  "source": "shop-floor",
  "key": "R061026012",
  "data": { }
}
```

`event_id` es único y sirve para deduplicar. `key` es la llave de partición: el código de la
orden de trabajo, o el ID con el prefijo de su entidad en los eventos de catálogo (`part:305`,
`location:14`, `model:4`).

### Catálogo de eventos

| Evento | Tópico | Cuándo llega | Campos de `data` |
|---|---|---|---|
| `part.upserted` | `shop.catalog` | Alta o edición de una pieza; todas al arrancar | `part_id`, `sku` (puede ser null), `name`, `family`, `group`, `subgroup`, `unit {id, name}` (null), `image_url` (null), `active` |
| `location.upserted` | `shop.catalog` | Alta o edición de una ubicación | `location_id`, `code` (código de barras, ej. `U-014`), `name`, `is_workbench`, `active` |
| `bom.upserted` | `shop.catalog` | Cambio en la lista de partes de un modelo | `model_id`, `model_name`, `brand`, `lines[]`: `bom_line_id`, `part_id` (null), `name`, `group_name` (null), `unit` (null), `qty_per_unit` (null), `sort_order` |
| `work_order.opened` | `shop.work_orders` | Entra un equipo al taller | `work_order_id`, `code`, `model_id`, `department`, `received_at` |
| `work_order.stage_changed` | `shop.work_orders` | Avanza o retrocede de etapa | `work_order_id`, `from_stage`, `to_stage` |
| `work_order.deleted` | `shop.work_orders` | Se da de baja un registro erróneo | `work_order_id`, `code` |
| `inspection.submitted` | `shop.inspections` | El técnico termina su inspección | `inspection_id`, `work_order_id`, `kind` (`quick`/`full`), `items[]` |
| `inspection.approved` | `shop.inspections` | El supervisor la aprueba (este dispara las reservas) | igual que `submitted` + `approved_by`, `approved_at` |
| `inspection.rejected` | `shop.inspections` | El supervisor la devuelve | `inspection_id`, `work_order_id`, `reason` |
| `inspection.discarded` | `shop.inspections` | Se cancela sin aprobar | `inspection_id`, `work_order_id` |
| `inspection.voided` | `shop.inspections` | Se anula una inspección que ya estaba aprobada (la orden regresa de etapa) | `inspection_id`, `work_order_id`, `reason` |
| `purchase.item_received` | `shop.purchasing` | Compras recibe una línea de una requisición | `purchase_request_id`, `request_number`, `line_id`, `part_number` (texto libre), `description`, `quantity`, `unit_price`, `currency`, `purpose` (`restock`/`customer_order`), `received_at`, `work_order_code` (null) |

Cada elemento de `items[]` trae `inspection_item_id`, `bom_line_id`, `part_id` (null), `name`,
`group_name` (null), `condition` (`ok`/`damaged`/`missing`), `action` (`buy`/`repair`/null),
`quantity` (null) y `note` (null). Los valores de `department` son `spindles`, `motors`,
`electronics` y `torque_center`. Las etapas, en orden, son: `awaiting_quick_inspection`,
`quick_inspection`, `awaiting_full_inspection`, `full_inspection`, `cleaning`, `assembly`,
`run_in`, `final_assembly` y `final_release`.

### Ejemplos

```json
{ "event_type": "inspection.approved", "key": "R061026012", "data": {
  "inspection_id": 418, "work_order_id": 1203, "kind": "quick",
  "approved_by": 12, "approved_at": "2026-10-06T16:42:11Z",
  "items": [
    { "inspection_item_id": 9001, "bom_line_id": 77, "part_id": 305, "name": "RODAMIENTO DELANTERO", "group_name": null,
      "condition": "damaged", "action": "buy", "quantity": 2, "note": "pista con picaduras" },
    { "inspection_item_id": 9002, "bom_line_id": 81, "part_id": null, "name": "KIT DE ORINGS", "group_name": null,
      "condition": "missing", "action": "buy", "quantity": 13, "note": null },
    { "inspection_item_id": 9003, "bom_line_id": 85, "part_id": 412, "name": "FLECHA", "group_name": null,
      "condition": "ok", "action": null, "quantity": null, "note": null }
  ] } }
```

```json
{ "event_type": "purchase.item_received", "key": "PR-2044", "data": {
  "purchase_request_id": 88, "request_number": "2044", "line_id": 540,
  "part_number": "7014 CTA/P4", "description": "Rodamiento de contacto angular",
  "quantity": 4, "unit_price": "1850.00", "currency": "MXN", "purpose": "restock",
  "received_at": "2026-10-08T15:10:00Z", "work_order_code": "R061026012" } }
```

### Lo que deben saber de los datos

Así llegan los datos reales; no hay una versión "limpia".

- **Pieza sin identificar.** Una línea puede venir con `part_id: null` (solo nombre libre). No
  se puede reservar automáticamente: repórtenla como faltante sin identificar.
- **Compras sin ID de pieza.** `purchase.item_received` trae un `part_number` en texto, no un
  `part_id`. Tienen que relacionarlo con el `sku` del catálogo (puede variar en espacios o
  mayúsculas) y mandar a revisión manual lo que no coincida.
- **Kits.** Las líneas de un modelo con el mismo `group_name` forman un kit; si `group_name`
  es null, el kit lo forman las líneas con el mismo `name`. Decidan si se inventaría el kit,
  sus componentes o ambos.
- **Rechazos.** Después de un `inspection.rejected` llega una inspección nueva (otro
  `inspection_id`) sobre la misma orden, normalmente con las mismas piezas. Solo una
  aprobación genera reservas.
- **Varias inspecciones por orden.** Una orden puede tener varias aprobadas (una rápida y
  luego varias completas). No dupliquen reservas por la misma pieza y la misma orden.
- **Duplicados y desorden.** Un evento puede llegar dos veces, y entre tópicos distintos no
  hay orden garantizado (una inspección puede llegar antes que el `part.upserted` de su
  pieza).
- **Inspecciones anuladas.** Una inspección ya aprobada puede anularse después con
  `inspection.voided` (la orden regresó de etapa). Sus reservas activas se liberan y sus
  faltantes abiertos se cierran.
- **Cantidad sin capturar.** Una línea con `action = buy` puede traer `quantity: null`. Usen
  el `qty_per_unit` de su línea en la lista de partes (`bom_line_id`); si también es null,
  repórtenla como faltante con `missing_quantity: null`.
- **Inspecciones completas sin piezas.** Una inspección `full` puede llegar con `items: []`.
  Se procesa igual (aprobación, rechazo, anulación), solo que no genera reservas.
- **Compras para un cliente.** Una recepción con `purpose = customer_order` es material
  comprado para revender a un cliente: no entra como existencia del taller ni surte faltantes.
  Solo `restock` entra al almacén.

## 4. Qué deben construir

Un servicio que consuma los eventos, guarde el inventario como un libro mayor de movimientos
y exponga existencias, reservas y faltantes. El stock nunca se edita directo: siempre se
calcula como la suma de los movimientos.

### Modelo mínimo

| Concepto | Qué representa |
|---|---|
| **Movimiento** | Entrada, salida, transferencia o ajuste de una pieza en una ubicación. Es inmutable: un error se corrige con otro movimiento |
| **Saldo** | Por pieza y ubicación: `on_hand`, `reserved` y `available = on_hand - reserved`. Es una proyección de los movimientos |
| **Reserva** | Cantidad apartada de una pieza para una orden de trabajo, con estado `active`, `fulfilled` o `cancelled` |
| **Faltante** | Lo que una orden necesita y no hay, o una pieza sin identificar |
| **Política** | Mínimo, máximo, cantidad de reorden y tiempo de entrega por pieza |

### Flujos

1. **Recepción.** Con `purchase.item_received` y `purpose = restock`, relacionen el
   `part_number` con el catálogo y registren una entrada en una ubicación de recepción. Si
   trae `work_order_code`, surtan primero el faltante de esa orden. Las de `purpose =
   customer_order` no entran al inventario.
2. **Reserva automática.** Con `inspection.approved`, por cada línea con `action = buy`
   reserven lo disponible. Lo que no alcance se vuelve faltante.
3. **Sugerencia de compra.** Agrupen los faltantes y las piezas bajo mínimo en una sugerencia
   de reabasto por pieza, con la cantidad y las órdenes que la piden.
4. **Salida contra orden.** El técnico escanea la ubicación y la pieza y retira contra un
   código de orden. La reserva pasa a `fulfilled`.
5. **Transferencia.** Mover piezas entre ubicaciones escaneando origen y destino.
6. **Conteo cíclico.** Contar una ubicación, comparar contra el sistema y registrar un ajuste
   con motivo obligatorio.
7. **Liberación.** Si una orden se da de baja (`work_order.deleted`) o una inspección aprobada
   se anula (`inspection.voided`), liberen las reservas activas que generó y cierren sus
   faltantes abiertos.

### Reglas obligatorias

- **Idempotencia.** Procesar dos veces el mismo `event_id` no cambia nada. Lo vamos a probar
  reenviando eventos.
- **Sin stock negativo.** Una salida o reserva nunca deja `available` por debajo de cero,
  salvo un ajuste autorizado.
- **Concurrencia.** Dos aprobaciones simultáneas no pueden reservar la misma última pieza.
- **Tolerancia al desorden.** Si llega una inspección que referencia una pieza que aún no
  conocen, no se pierde: se reintenta o se encola.
- **Reconstruible.** Borrando la base y releyendo los tópicos desde el inicio, deben llegar al
  mismo saldo.
- **Piezas del cliente fuera del inventario.** Una línea con `action = repair` es una pieza
  del propio equipo del cliente que se va a reparar: no es stock del taller, no se reserva y
  no entra como existencia.

## 5. Lo que debe salir

Se necesitan tres salidas: eventos de inventario en un tópico propio, una API HTTP y pantallas
para almacén y piso. Los eventos y la API se evalúan con pruebas automáticas, así que respeten
nombres y formas.

### Eventos de salida (tópico `inventory.events`)

Usan el mismo sobre de la sección 3, con `source: "inventory"`.

| Evento | Cuándo | Campos de `data` |
|---|---|---|
| `stock.received` | Entra material por compra | `part_id`, `location_id`, `quantity`, `unit_cost`, `currency`, `purchase_line_id` |
| `stock.unmatched_receipt` | Una recepción no coincide con el catálogo | `purchase_line_id`, `part_number`, `description`, `quantity` |
| `stock.reserved` | Se aparta stock para una orden | `reservation_id`, `work_order_id`, `part_id`, `quantity`, `inspection_item_id` |
| `stock.shortage_detected` | Una orden pide más de lo disponible | `work_order_id`, `part_id` (null), `name`, `missing_quantity`, `inspection_item_id` |
| `stock.shortage_resolved` | Llega material y cubre el faltante | `work_order_id`, `part_id`, `quantity` |
| `stock.issued` | Se retira pieza contra una orden | `work_order_id`, `part_id`, `location_id`, `quantity`, `issued_by` |
| `stock.transferred` | Movimiento entre ubicaciones | `part_id`, `from_location_id`, `to_location_id`, `quantity` |
| `stock.adjusted` | Ajuste por conteo | `part_id`, `location_id`, `delta`, `reason` |
| `stock.reorder_suggested` | Una pieza baja del mínimo o acumula faltantes | `part_id`, `suggested_quantity`, `work_order_ids[]` |

Ejemplo:

```json
{ "event_type": "stock.shortage_detected", "source": "inventory", "key": "R061026012", "data": {
  "work_order_id": 1203, "part_id": 305, "name": "RODAMIENTO DELANTERO",
  "missing_quantity": 1, "inspection_item_id": 9001 } }
```

### API mínima

| Método y ruta | Responde |
|---|---|
| `GET /parts/{part_id}/availability` | Saldo por ubicación: `on_hand`, `reserved`, `available` |
| `GET /parts/{part_id}/ledger` | Kardex: movimientos con saldo corrido, del más reciente al más antiguo |
| `GET /work-orders/{code}/materials` | Por línea de inspección: reservado, entregado y faltante |
| `GET /shortages` | Faltantes abiertos, filtrables por orden o pieza |
| `GET /reorder-suggestions` | Sugerencias de compra vigentes |
| `GET /unmatched-receipts` y `POST /unmatched-receipts/{id}/resolve` | Recepciones por relacionar a mano con una pieza |
| `POST /issues`, `POST /transfers`, `POST /counts` | Salida, transferencia y conteo cíclico |

### Pantallas

- **Almacén.** Existencias por pieza y ubicación, faltantes abiertos y sugerencias de compra.
- **Orden de trabajo.** Busca por código y muestra qué piezas tiene reservadas, entregadas y
  pendientes.
- **Piso (móvil).** Escanear ubicación y pieza para retirar, transferir o contar. Debe
  funcionar con la cámara de un celular.
- **Kardex de una pieza.**

## 6. Procedimiento

Cada equipo recibe un kit de arranque que levanta el broker y el simulador del taller con un
solo comando. Lenguaje, base de datos y framework de pantallas son libres.

### Kit de arranque

- **Contrato (`contract/`).** Un JSON Schema por evento, la API en OpenAPI y las reglas
  exactas que revisan las pruebas (incluida la ubicación de recepción `U-100`). Si algo de
  este documento no coincide con el contrato, gana el contrato.
- **`docker-compose.yml`** con Redpanda (compatible con la API de Kafka) y Redpanda Console
  para ver los tópicos.
- **Simulador del taller.** Publica primero la carga inicial del catálogo y después reproduce
  seis semanas de operación, armadas sobre el catálogo y los diagnósticos reales del taller, a
  velocidad acelerada, con duplicados y desorden incluidos.
- **`events.jsonl`.** Los mismos eventos en un archivo, por si un equipo quiere desarrollar
  sin broker al principio.
- **Pruebas de contrato.** Un script que publica escenarios conocidos y revisa sus eventos de
  salida y su API. Pueden correrlo cuantas veces quieran.
- **Etiquetas impresas** de ubicaciones y piezas para la demo con escaneo real.

### Pasos

1. Levanten el kit y confirmen que ven llegar los eventos en la consola.
2. Consuman el catálogo y construyan el libro mayor con recepciones y salidas.
3. Agreguen reservas y faltantes a partir de inspecciones aprobadas.
4. Corran las pruebas de contrato y corrijan hasta que pasen.
5. Construyan las pantallas y prueben el flujo de piso con un celular.
6. Preparen la demo.

### Entregables

- **Repositorio** con código y un `README` que lo levante con un comando sobre el kit.
- **Un documento de decisiones**, de máximo una página, que responda: cómo relacionan compras
  con el catálogo, cómo manejan kits, cómo evitan reservas dobles y cómo garantizan
  idempotencia.
- **Demo en vivo de 5 minutos.** El jurado aprueba una inspección en el simulador; ustedes
  muestran la reserva, el faltante, la llegada de la compra y la salida escaneada.

### Reglas

- No se modifica el simulador ni el formato de los eventos de entrada.
- Los eventos y rutas de la sección 5 respetan exactamente sus nombres y campos. Pueden
  agregar más, pero no cambiar esos.

## 7. Evaluación

Se califica sobre 100 puntos. Correctitud e integración se miden con las pruebas de contrato;
lo demás lo evalúa el jurado en la demo.

### Niveles

- **Base.** Libro mayor, recepción, salida con escaneo, kardex y saldos por ubicación.
- **Intermedio.** Reservas y faltantes automáticos, mínimos y máximos, conteo cíclico,
  recepciones sin relacionar.
- **Avanzado (extras).** Pronóstico de demanda por modelo a partir de las listas de partes y
  las inspecciones históricas, valuación del inventario a costo promedio, tablero de rotación
  (piezas críticas y piezas sin movimiento), observabilidad del consumidor (lag y errores).

### Criterios

| Criterio | Puntos | Cómo se mide |
|---|---|---|
| Correctitud del libro mayor | 25 | Pruebas de contrato: saldos, idempotencia, sin negativos, reconstrucción desde cero |
| Integración con el taller | 25 | Reservas y faltantes correctos desde inspecciones, recepciones relacionadas, órdenes dadas de baja liberadas |
| Experiencia en piso | 20 | Escaneo con celular, pocos pasos para retirar o contar, claridad de la vista por orden |
| Decisiones justificadas | 15 | Documento de decisiones: kits, relación con compras, concurrencia |
| Extras | 15 | Ver niveles |

---

# 8. Kit de arranque (README raíz)

**Kit de arranque: almacén inteligente para taller**

Todo lo que necesitan para construir el servicio de inventario del reto.

```bash
docker compose up -d
```

Con eso levantan:

| Qué | Dónde |
|---|---|
| Broker Redpanda (API de Kafka) | `localhost:19092` desde su máquina · `redpanda:9092` desde un contenedor |
| Redpanda Console, para ver los tópicos | http://localhost:8080 |
| Simulador del taller | http://localhost:8090 |

El simulador crea los tópicos y reproduce seis semanas de operación del taller, una hora
simulada por segundo (unos 17 minutos). Para otro ritmo usen `SPEED=0 docker compose up -d`
(sin pausas) o `SPEED=600`. Para empezar de cero, `RESET=1` borra y recrea los tópicos.

## Qué hay

| Carpeta | Qué es |
|---|---|
| `contract/` | El contrato: JSON Schema de cada evento, la API en OpenAPI y las reglas que revisan las pruebas. **Empiecen aquí.** |
| `data/events.jsonl` | Las mismas seis semanas en un archivo, para desarrollar sin broker |
| `simulator/` | El simulador y su panel |
| `contract-tests/` | Las pruebas de contrato (50 de los 100 puntos) |
| `labels/etiquetas-demo.pdf` | Etiquetas Code 128 de la demo (estándar en `contract/README.md` §5) |
| `tools/validate_events.py` | Valida cualquier archivo de eventos contra el contrato, incluidos los suyos |

## El panel del simulador

En http://localhost:8090 el jurado (y ustedes, para probar) pueden:

1. Recibir un equipo: abre una orden de trabajo de cualquiera de los 5 modelos.
2. Capturar su inspección pieza por pieza y aprobarla, rechazarla, descartarla o anularla.
3. Cambiar la etapa de la orden o darla de baja.
4. Registrar la llegada de una compra, con o sin código de orden.

Es el flujo de la demo final: el jurado aprueba una inspección aquí y ustedes muestran la
reserva, el faltante, la llegada de la compra y la salida escaneada.

## Pruebas de contrato

```bash
docker compose run --rm contract-tests --api http://host.docker.internal:8000
```

Detalle en [`contract-tests/README.md`](contract-tests/README.md).

---

# 9. Contrato (`contract/README.md`)

Este folder es la referencia exacta de lo que entra y sale de su servicio. Las pruebas de
contrato se escriben contra esto. Si algo aquí contradice al documento del reto, gana esto.

| Archivo | Qué es |
|---|---|
| `schemas/input/*.schema.json` | Un JSON Schema por evento que publica el taller |
| `schemas/output/*.schema.json` | Un JSON Schema por evento que publica su servicio |
| `schemas/common.schema.json` | Tipos compartidos (IDs, fechas, importes, etapas) |
| `schemas/index.json` | Evento → tópico → schema |
| `openapi.yaml` | La API HTTP mínima |

Para revisar un archivo de eventos contra el contrato (sus salidas incluidas):

```bash
uv run --with jsonschema tools/validate_events.py data/events.jsonl
```

## 1. Sobre

Todos los eventos, de entrada y de salida, usan el mismo sobre:

```json
{
  "event_id": "0b9f3c1e-7a42-4c1d-9e0a-5d2f8b61c7aa",
  "event_type": "inspection.approved",
  "event_version": 1,
  "occurred_at": "2026-10-06T16:42:11Z",
  "source": "shop-floor",
  "key": "R061026012",
  "data": { }
}
```

- `event_id`: UUID, único por evento. Sirve para deduplicar.
- `occurred_at`: cuándo pasó en el taller, ISO 8601 UTC. **No** es el orden de llegada.
- `source`: `shop-floor` en las entradas, `inventory` en las salidas.
- IDs enteros; importes como texto decimal (`"1850.00"`); cantidades enteras en la unidad de
  la pieza.
- En la entrada, todos los campos de `data` vienen siempre (los opcionales llegan como `null`)
  y no llegan campos extra. En la salida pueden agregar campos; los pedidos son obligatorios.

## 2. Tópicos y llaves

| Tópico | Eventos | `key` |
|---|---|---|
| `shop.catalog` | `part.upserted`, `location.upserted`, `bom.upserted` | `part:305`, `location:14`, `model:4` |
| `shop.work_orders` | `work_order.opened`, `.stage_changed`, `.deleted` | código de la orden (`R061026012`) |
| `shop.inspections` | `inspection.submitted`, `.approved`, `.rejected`, `.discarded`, `.voided` | código de la orden |
| `shop.purchasing` | `purchase.item_received` | `PR-` + `request_number` (`PR-2044`) |
| `inventory.events` (salida) | los 9 `stock.*` | código de la orden en los que tienen `work_order_id`; `part:<id>` en `received`, `transferred`, `adjusted`, `reorder_suggested`; `purchase_line:<id>` en `unmatched_receipt` |
| `inventory.dlq` (salida) | el evento original que no pudieron procesar | la misma del original |

Garantías de entrega:

- **Al menos una vez.** El mismo `event_id` puede llegar dos o más veces.
- **Orden por llave dentro de un tópico.** Los eventos de una misma orden en `shop.inspections`
  llegan en el orden en que pasaron. Entre tópicos distintos no hay orden: una inspección puede
  llegar antes que el `work_order.opened` de su orden o que el `part.upserted` de su pieza.
- **Retención completa.** Releer desde el inicio debe dejar el mismo saldo.

## 3. Reglas de negocio que revisan las pruebas

### Necesidad de una orden

1. Solo `inspection.approved` crea necesidad. `submitted`, `rejected` y `discarded` no mueven
   inventario.
2. La necesidad vive por **(orden, `bom_line_id`)**. Cada renglón aprobado con `action = buy`
   fija la necesidad de su línea. Si una aprobación posterior de la misma orden vuelve a traer
   esa línea, **reemplaza** la cantidad, no la suma: si sube, reservan la diferencia; si baja,
   liberan el excedente.
3. Una línea que una aprobación posterior no menciona conserva su necesidad. Por eso una
   inspección `full` con `items: []` no cambia nada.
4. `action = repair` y `condition = ok` no generan necesidad: es pieza del cliente.
5. `quantity: null` con `action = buy`: usen el `qty_per_unit` de esa línea en la lista de
   partes vigente del modelo. Si también es null, es faltante con `missing_quantity: null` y
   no se reserva nada.
6. `part_id: null`: faltante sin identificar (`stock.shortage_detected` con `part_id: null`),
   nunca reserva.

### Reserva y faltante

7. Al crear o subir una necesidad reservan `min(disponible, necesidad)` y lo que no alcance
   es faltante. Cada reserva emite `stock.reserved`; cada faltante, `stock.shortage_detected`.
8. `available = on_hand - reserved` nunca baja de cero, ni con aprobaciones simultáneas.

### Recepciones

9. `purpose = customer_order`: es material para revender a un cliente. No entra al
   inventario, no surte faltantes y no emite nada.
10. `purpose = restock`: relacionen `part_number` con el `sku` del catálogo. Como mínimo,
    ignorando mayúsculas y espacios al inicio y al final. Si no coincide con ninguna pieza, o
    coincide con más de una, emiten `stock.unmatched_receipt` y queda para revisión manual
    (`POST /unmatched-receipts/{id}/resolve`). Reglas de relación más listas son bienvenidas:
    explíquenlas en su documento de decisiones.
11. La entrada se registra en la ubicación de recepción **`U-100` (`location_id` 100)** y
    emite `stock.received`.
12. Con la entrada surten faltantes de esa pieza: primero los de la orden en
    `work_order_code` (si viene y la orden sigue viva) y después los demás, del más antiguo al
    más nuevo. Cada uno emite `stock.reserved` + `stock.shortage_resolved`.

### Cancelaciones

13. `inspection.voided`: liberan las reservas activas y cierran los faltantes de las líneas
    cuya necesidad vigente venía de esa inspección.
14. `work_order.deleted`: liberan todas las reservas activas de la orden y cierran sus
    faltantes. Si después llega una compra con ese `work_order_code`, entra como existencia
    general.
15. Liberar una reserva no emite un evento propio en esta versión; se refleja en la API.

### Salida, transferencia y conteo

16. `POST /issues` baja el saldo de la ubicación y consume primero la reserva de esa orden
    para esa pieza; cuando se entrega toda, la reserva pasa a `fulfilled`. Si no alcanza el
    saldo de la ubicación, responde 409 y no mueve nada.
17. `POST /counts` registra un ajuste por cada diferencia, con motivo obligatorio (422 sin
    motivo). Es la única forma de dejar `available` negativo.

### Sugerencias de compra

18. Una pieza con faltantes abiertos (o bajo su mínimo, si configuran políticas) tiene una
    sugerencia vigente con `suggested_quantity` ≥ la suma de lo que falta y las órdenes que lo
    piden en `work_order_ids`. Emiten `stock.reorder_suggested` cuando la sugerencia nace o
    cambia.

### Idempotencia, desorden y errores

19. Procesar dos veces el mismo `event_id` no cambia nada ni emite salidas nuevas.
20. Un evento que referencia algo que aún no conocen (pieza, orden, línea de la lista de
    partes) no se descarta: se reintenta o se encola hasta que llegue lo que falta.
21. Lo que no puedan procesar después de reintentar va a `inventory.dlq`, sin detener el
    consumo.
22. Al arrancar, y siempre que reconstruyan desde cero, consuman `shop.catalog` hasta el
    final **antes** de procesar los demás tópicos. Si no, al releer, las compras llegan antes
    que sus piezas y todas se van a revisión manual. Una compra que no coincide con el
    catálogo ya cargado sí va a revisión manual (regla 10).

### Reconstrucción

23. Borrando su base y releyendo los tópicos desde el inicio deben llegar a la misma
    existencia (`on_hand`) por pieza y ubicación. El jurado lo revisa con
    `run_tests.py snapshot` / `compare` sobre las piezas del dataset, antes de la demo. Las
    reservas no se comparan: dependen de cómo se intercalen los tópicos al releer.

## 4. Lo que el catálogo trae de verdad

- Piezas con `sku: null` (claves pendientes) y piezas distintas con el **mismo** `sku`.
- Familia `SERVICIO`: servicios (cromado, rectificado) que también aparecen en listas de
  partes con `action = buy`. Decidan si se inventarían.
- Kits: líneas con el mismo `group_name` (o el mismo `name` si `group_name` es null).
- Ubicaciones: mesas de trabajo (`is_workbench: true`), racks de equipo, recepción `U-100` y
  estantes de refacciones `U-101`…`U-112`.

## 5. Etiquetas (escaneo en piso)

Todas las etiquetas son **Code 128**, el mismo formato que ya usa el taller:

| Etiqueta | Contenido del código |
|---|---|
| Ubicación | su `code`, ej. `U-101` |
| Pieza con `sku` | el `sku` tal cual, ej. `7014 CTA/P4` |
| Pieza sin `sku` | `P-` + `part_id`, ej. `P-24` |

Los `sku` reales traen espacios, puntos, comas y diagonales: su lector debe aceptarlos sin
alterarlos. Un mismo `sku` puede ser de dos piezas: si pasa, pidan elegir cuál.

`labels/etiquetas-demo.pdf` trae las etiquetas de la demo final: recepción `U-100`, los
estantes `U-101`…`U-112` y las piezas de los modelos GROB MSP-04 y DOOSAN DNM400 (hoja carta,
Avery 5162). Para desarrollar, pueden escanearlas desde la pantalla con el celular.

---

# 10. Pruebas de contrato (`contract-tests/README.md`)

**Pruebas de contrato**

Publican escenarios conocidos en los tópicos del taller y revisan los eventos que su servicio
publica en `inventory.events` y las respuestas de su API. Valen 50 de los 100 puntos: 25 por
el libro mayor y 25 por la integración con el taller.

Cada corrida usa IDs, SKUs y códigos de orden propios. Pueden correrlas cuantas veces quieran,
con o sin el dataset cargado, sin reiniciar nada.

## Correrlas

Con el kit arriba (`docker compose up -d`) y su servicio escuchando en el puerto 8000:

```bash
docker compose run --rm contract-tests --api http://host.docker.internal:8000
```

O sin Docker (Python 3.12; `confluent-kafka` aún no tiene versión para 3.14):

```bash
uv run --python 3.12 --with confluent-kafka==2.6.1 --with jsonschema \
  contract-tests/run_tests.py --api http://localhost:8000
```

Opciones:

| Opción | Para qué |
|---|---|
| `--only reserva_faltante_compra_y_salida,concurrencia` | Correr solo algunos escenarios |
| `--timeout 20` | Segundos máximos de espera por cada resultado |
| `--settle 3` | Segundos de espera para confirmar que algo **no** pasó |

Mientras corren, conecten un solo servicio de inventario al broker: las pruebas leen todo lo
que llega a `inventory.events`.

## Qué revisan

| Libro mayor (25) | Integración con el taller (25) |
|---|---|
| `recepcion_basica` | `reserva_faltante_compra_y_salida` |
| `idempotencia` | `lineas_que_no_reservan` |
| `salida_sin_negativos` | `compra_para_cliente` |
| `transferencia_y_conteo` | `recepcion_sin_relacionar` |
| `kardex` | `necesidad_se_reemplaza` |
| | `rechazo_y_anulacion` |
| | `baja_de_orden` |
| | `desorden` |
| | `concurrencia` |

Cada escenario explica en su docstring qué revisa. Además, todo evento de salida debe cumplir
su JSON Schema y traer la `key` que pide el contrato. Si no, aparece al final del reporte.

## Reconstrucción (la corre el jurado)

```bash
docker compose run --rm -v "$PWD:/out" contract-tests snapshot --out /out/saldo.json --api http://host.docker.internal:8000
# el equipo borra su base y vuelve a consumir los tópicos desde el inicio
docker compose run --rm -v "$PWD:/out" contract-tests compare  --out /out/saldo.json --api http://host.docker.internal:8000
```

`compare` espera a que su servicio termine de releer (hasta `--rebuild-timeout`, 300 s) y
compara la existencia por pieza y ubicación de las piezas del dataset.

---

# 11. Dataset (`data/README.md`)

**Dataset: `events.jsonl`**

Seis semanas de operación de un taller de reparación de husillos (3 ago – 14 sep 2026), en el
orden en que se las entregaría el broker. Es lo mismo que reproduce el simulador; sirve para
desarrollar sin broker.

## Formato

Una línea por entrega:

```json
{"topic": "shop.inspections", "replay_at": "2026-08-05T19:02:11Z", "event": { ...sobre del evento... }}
```

- `topic`: el tópico donde llegaría.
- `replay_at`: cuándo lo entrega el simulador. Solo sirve para reproducir el ritmo; su
  servicio no debe depender de él.
- `event`: el evento tal cual, con el sobre del contrato (`contract/README.md`).

El archivo ya viene con duplicados y desorden: consumirlo de arriba abajo equivale a consumir
los tópicos.

## Qué trae

| | |
|---|---|
| Entregas | 1,742 (65 son reentregas de un `event_id` ya enviado) |
| Piezas | 255 al arrancar + 1 nueva a media operación |
| Ubicaciones | 67 (54 del taller + recepción `U-100` + 12 estantes de refacciones) |
| Modelos con lista de partes | 5 (de 4 a 64 líneas cada uno) |
| Órdenes de trabajo | 36 |
| Inspecciones aprobadas | 88 (rápidas y completas) |
| Líneas de compra recibidas | 854, de ellas 18 para clientes (`customer_order`) |

El catálogo de piezas, ubicaciones y listas de partes viene de un taller real, igual que la
proporción de piezas bien, dañadas y faltantes. Las órdenes, inspecciones, compras y precios
son sintéticos.

## Lo que van a encontrar

Todo esto está a propósito, porque así llegan los datos reales:

- Inspecciones rechazadas, descartadas y anuladas antes o después de aprobarse; órdenes dadas
  de baja con reservas vivas.
- Inspecciones completas sin piezas (`items: []`) y otras que vuelven a pedir una línea que ya
  pidió la rápida, con otra cantidad.
- Renglones a comprar sin cantidad y renglones sin pieza identificada.
- Kits por `group_name` y por `name`, y un grupo que se renombra a media operación.
- Compras con el número de parte escrito de varias formas, con números de proveedor que no
  existen en el catálogo, y piezas que comparten el mismo `sku`.
- Una pieza que recibe su `sku` semanas después de haberse comprado, y otra que se da de baja.
- Una pieza nueva cuyas inspecciones llegan **antes** que su `part.upserted`, y órdenes cuyas
  inspecciones llegan antes que su `work_order.opened`.
- El inventario inicial entra como una compra de arranque (sin orden) dos días antes de la
  primera orden.

---

# 12. Resultados de las pruebas locales

*10 oct 2026 · API `hack-saltillo-api@ffc566d`. Detalle, logs y pasos para reproducir:
[`hackathon-inventario-kit/pruebas-locales/RESULTADOS-PRUEBAS.md`](hackathon-inventario-kit/pruebas-locales/RESULTADOS-PRUEBAS.md).*

Corrimos, sin modificar código, todas las pruebas del kit contra la API levantada en local:
Redpanda del kit, ElasticMQ como SQS, Postgres con una base aparte (`inventario_pruebas`) y un
puente Kafka ↔ SQS de prueba. No se usó ningún recurso de AWS.

| Prueba | Resultado |
|---|---|
| Pruebas de contrato, 4 corridas (2 con el comando oficial en Docker) | **50.0 / 50** en todas: libro mayor 25/25, integración 25/25 |
| Reconstrucción del jurado (`snapshot` / `compare`) | ✔ mismo saldo en 256 piezas |
| `tools/validate_events.py`: dataset y 2,270 salidas de la API | 0 errores |
| `inventory.dlq` | Vacía |
| Reenvío completo del dataset (1,742 eventos repetidos) | Sin movimientos ni salidas nuevas |
| Pruebas unitarias de la API | 43 / 43 |

Pendientes que importan para la evaluación:

- **Kafka ↔ SQS.** Las pruebas del jurado hablan Kafka y la API solo SQS. Sin el puente
  (`pruebas-locales/kafka_sqs_bridge.py` o algo equivalente) la API no recibe nada y las pruebas dan
  0 de 50. La relectura para la reconstrucción también tiene que salir de Kafka.
- **`.env.local`** no arranca tal cual: apunta a certificados en `certs/` que no existen, y las
  variables SQS están vacías. Los valores locales están en el informe (§6). No se modificó.
- **Relación de compras.** Hoy aplica la regla mínima: 541 compras relacionadas y 298 a revisión.
  104 de esas 298 coincidirían ignorando espacios internos y puntuación.
