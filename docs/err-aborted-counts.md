# Reducción de `net::ERR_ABORTED` en consultas de conteo

Este documento registra las correcciones aplicadas para eliminar errores `net::ERR_ABORTED` provocados por peticiones `HEAD` en conteos de tablas, y define el patrón recomendado para futuras implementaciones.

## Síntomas
- Errores visibles en consola del navegador:
  - `.../rest/v1/ventas?select=id` → `net::ERR_ABORTED`
  - `.../rest/v1/campana_miembros?select=usuario_id&campana_id=eq.<id>` → `net::ERR_ABORTED`

## Causa raíz
- Uso de `head: true` en `select(..., { count: 'exact', head: true })` con Supabase provoca peticiones `HEAD`.
- Las peticiones `HEAD` son propensas a abortarse cuando:
  - Cambia el foco de la vista y React Query invalida/reintenta.
  - El usuario navega rápidamente entre pantallas.
  - Se producen re-renderizados y cancelaciones de fetch.

## Solución aplicada
Sustituir `HEAD` por `GET` con conteo y limitar el payload al mínimo:

```js
// Patrón recomendado
const { count, error } = await supabase
  .from('<tabla>')
  .select('<columna_id>', { count: 'exact' })
  .limit(1); // Mantiene payload mínimo y evita HEAD
```

### Cambios específicos
- `src/services/salesService.js` (función `getSalesCount`):
  - Antes: `.select('id', { count: 'exact', head: true })`
  - Ahora: `.select('id', { count: 'exact' }).limit(1)`

- `src/services/campaignService.js` (función `getCampaignMembersCount`):
  - Antes: `.select('usuario_id', { count: 'exact', head: true }).eq('campana_id', campaignId)`
  - Ahora: `.select('usuario_id', { count: 'exact' }).eq('campana_id', campaignId).limit(1)`

## Verificación
- Pruebas unitarias: `src/services/__tests__/counts.test.js`
  - Aseguran que no se usa `head:true` y que el servicio devuelve conteo correcto.
  - Ejecutar con: `npm run test`

## Impacto y beneficios
- Menos errores visibles de red en consola (`net::ERR_ABORTED`).
- Menor payload por petición de conteo.
- Comportamiento idéntico en UI (paginación y conteos) sin cambios en contratos.

## Consideraciones futuras
- Aplicar el mismo patrón en otros conteos (`inventario`, etc.) para homogenizar el comportamiento.
- Evitar `select('*')` en endpoints críticos; preferir selects explícitos para reducir abortos por URLs muy largas y mejorar rendimiento.