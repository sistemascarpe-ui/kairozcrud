# 📖 Manual de Usuario - Ópticas Kairoz

Este documento describe el funcionamiento del sistema para los usuarios finales.

## 👥 Roles de Usuario

El sistema cuenta con diferentes niveles de acceso:

*   **Administrador**: Acceso total. Puede gestionar usuarios, ver métricas financieras completas, eliminar registros (con PIN) y configurar el sistema.
*   **Vendedor**: Enfoque en la operación diaria. Puede registrar clientes, realizar ventas, consultar inventario y ver sus propias métricas.
*   **Empleado**: Acceso básico para consulta de información y reportes operativos.

---

## 🔄 Flujos de Trabajo Principales

### 1. Gestión de Clientes
*   **Registro**: Ingrese datos personales, teléfono y correo.
*   **Historial**: Consulte graduaciones anteriores y compras previas.
*   **Búsqueda**: Utilice la barra de búsqueda para encontrar clientes por nombre o teléfono.

### 2. Control de Inventario
El módulo de inventario permite gestionar los armazones y productos.
*   **Filtros**: Puede filtrar por Marca, Grupo, Descripción, Sub-marca, Estado (En stock/Agotado) y Ubicación (Óptica/Campaña).
*   **Reportes**:
    *   **Reporte General**: Muestra todo el inventario sin filtrar por marca específica.
    *   **Reporte por Marca**: Genera un PDF específico para una marca seleccionada.
*   **Productos Agotados**: Se listan por SKU.

### 3. Sistema de Ventas
*   **Crear Venta**: Seleccione un cliente y agregue productos (armazones, micas).
*   **Folio**: El sistema genera un folio automático (ej. `V-0001`) consecutivo.
*   **Pagos**: Registre abonos o pagos completos.
*   **Facturación**: Marque si la venta requiere factura e ingrese los datos fiscales.
*   **Cancelación**: Puede cancelar una nota. Esto repondrá el stock automáticamente (si está configurado).
*   **Eliminación**: **(Solo Admin)** Requiere un PIN de seguridad. **Nota:** Eliminar una nota NO modifica el inventario, solo borra el registro de la venta.

### 4. Gestión de Adeudos
*   Monitoree las cuentas por cobrar.
*   Registre abonos parciales a notas pendientes.

---

## 💡 Guía Operativa y Tips

### Inventario
*   **Ubicación**: Los productos pueden estar en "Óptica" (tienda principal) o "Campaña" (ventas externas). Los conteos de inventario respetan esta ubicación.
*   **Reportes PDF**: Asegúrese de que el logo (`/logo.png`) esté cargado correctamente para que aparezca en los encabezados.

### Ventas
*   **Menú de Acciones**: En la tabla de ventas, el menú "..." permite ver detalles, abonar o cancelar. Se cierra automáticamente al hacer clic fuera o presionar `Escape`.
*   **Folios**: Si necesita reiniciar o ajustar los folios, esto debe solicitarse al administrador del sistema (requiere ajuste en base de datos).

### Solución de Problemas Comunes
*   **No puedo crear una nota**: Verifique que todos los campos obligatorios del cliente estén llenos. Si el error persiste, recargue la página.
*   **Error de conexión**: Si ve mensajes de error de red, verifique su conexión a internet. El sistema requiere conexión constante para guardar datos en la nube.
