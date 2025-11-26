# 🗄️ Esquema de Base de Datos

Referencia de las tablas y relaciones del sistema.

## Tablas Principales

### `usuarios`
Personal del sistema (vendedores, empleados).
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `nombre` | text | |
| `apellido` | text | |

### `clientes`
Cartera de clientes.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `nombre` | text | |
| `telefono` | text | |
| `correo` | text | |
| `empresa_id` | uuid | FK -> `empresas` |

### `ventas`
Cabecera de las notas de venta.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `folio` | varchar | Único, generado auto (ej. V-0001) |
| `estado` | varchar | 'pendiente', 'pagado', 'cancelada' |
| `total` | numeric | |
| `monto_iva` | numeric | |
| `requiere_factura` | boolean | |
| `creado_por_id` | uuid | FK -> `usuarios` |

### `venta_productos`
Detalle de productos por venta.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `venta_id` | uuid | FK -> `ventas` |
| `tipo_producto` | text | 'armazon', 'mica' |
| `armazon_id` | uuid | FK -> `armazones` (si aplica) |
| `descripcion_mica` | text | Detalle si es mica |
| `cantidad` | int | |
| `precio_unitario` | numeric | |
| `subtotal` | numeric | |

### `armazones`
Inventario de productos.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `sku` | text | Código único |
| `stock` | int | Cantidad disponible |
| `precio` | numeric | Precio de venta |
| `marca_id` | uuid | FK -> `marcas` |
| `grupo_id` | uuid | FK -> `grupos` |
| `sub_marca_id` | uuid | FK -> `sub_marcas` |

---

## Tablas de Catálogos

*   **`marcas`**: Catálogo de marcas.
*   **`sub_marcas`**: Catálogo de sub-marcas.
*   **`grupos`**: Categorías de productos.
*   **`descripciones`**: Variantes o descripciones adicionales.
*   **`empresas`**: Empresas clientes (para convenios).

---

## Tablas de Operación

*   **`abonos`**: Pagos parciales asociados a una venta (`venta_id`).
*   **`historial_graduaciones`**: Exámenes de la vista asociados a un cliente (`cliente_id`).
*   **`campanas`**: Eventos de venta externos.
*   **`campana_miembros`**: Usuarios asignados a una campaña.
*   **`campana_productos`**: Inventario movido a una campaña.

---

## Tablas de Relación (Many-to-Many)

*   **`venta_vendedores`**: Relaciona una venta con uno o más vendedores (`venta_id`, `vendedor_id`).
*   **`venta_clientes`**: Relaciona una venta con un cliente (`venta_id`, `cliente_id`).

---

## Notas Adicionales
*   Todas las tablas tienen campos de auditoría estándar (`created_at`, `updated_at`) aunque no se listen exhaustivamente aquí.
*   Las claves primarias (`PK`) son generalmente `uuid` generados automáticamente (`gen_random_uuid()`).
