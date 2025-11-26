# 🏪 Ópticas Kairoz - Sistema de Gestión Integral (Con Punto de Venta Proximo a Implementar)

Sistema completo de gestión para ópticas desarrollado con React y Supabase. Permite administrar inventario, clientes, ventas, métricas avanzadas y generar reportes detallados del negocio.

## ✨ Características Principales

### 👥 **Gestión de Clientes**
- 📋 Registro completo con información personal y clínica
- 🔍 Sistema de búsqueda y filtros avanzados
- 📅 Gestión de citas y citas
- 👁️ Historial de graduaciones detallado
- 📊 Estadísticas por cliente
- 💰 Gestión de adeudos y pagos

### 📦 **Control de Inventario**
- 🏷️ Gestión completa de productos (armazones)
- 🏢 Administración de marcas y sub-marcas
- 📊 Control de stock en tiempo real
- 🚨 Alertas de productos sin stock
- 🔄 Acciones masivas para gestión eficiente
- 📈 Reportes de inventario y valorización

### 🧾 **Sistema de Ventas**
- 💳 Generación de notas de venta completas
- 👥 Ventas individuales y compartidas entre vendedores
- 📋 Seguimiento de estado (completada/pendiente)
- 🏢 Gestión de empresas cliente
- 💰 Control de abonos y pagos parciales
- 📊 Análisis de rendimiento por vendedor

### 📊 **Dashboard y Métricas Avanzadas**
- 📈 **Dashboard Principal**: Vista general del negocio
- 🎯 **Metas Mensuales**: Seguimiento de objetivos con calendario visual
- 🏆 **Rankings**: Top productos, marcas, empresas y vendedores
- 📊 **Gráficas Interactivas**: Estado del inventario, tendencias de ventas
- 👥 **Rendimiento de Vendedores**: Análisis detallado con ventas individuales/compartidas
- 📅 **Filtros de Fecha**: Análisis por períodos específicos
- 🏢 **Análisis por Empresa**: Clientes corporativos y sus compras

### 🏢 **Gestión Empresarial**
- 🏢 Administración de empresas cliente
- 👥 Gestión de clientes por empresa
- 📊 Reportes de compras empresariales
- 💼 Seguimiento de relaciones comerciales

### 🔐 **Autenticación y Seguridad**
- 🔑 Sistema de login seguro con Supabase Auth
- 👤 Gestión de usuarios y roles
- 🛡️ Políticas de seguridad (RLS) configuradas
- 🔒 Protección de datos sensibles

### 📱 **Diseño Responsivo**
- 💻 Optimizado para desktop y tablet
- 📱 Interfaz móvil completamente funcional
- 🎨 Diseño moderno y intuitivo
- ⚡ Navegación fluida entre secciones

## 🚀 Tecnologías Utilizadas

### **Frontend**
- **React 18** - Framework principal
- **Vite** - Herramienta de construcción
- **Tailwind CSS** - Framework de estilos
- **React Router** - Navegación
- **React Hook Form** - Manejo de formularios
- **React Query** - Gestión de estado del servidor

### **UI/UX**
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconografía
- **Framer Motion** - Animaciones
- **React Hot Toast** - Notificaciones
- **React Select** - Selectores avanzados

### **Gráficas y Visualización**
- **Chart.js** - Gráficas interactivas
- **React Chart.js 2** - Integración con React
- **Recharts** - Gráficas adicionales
- **D3** - Visualizaciones avanzadas

### **Backend y Base de Datos**
- **Supabase** - Backend como servicio
- **PostgreSQL** - Base de datos
- **Supabase Auth** - Autenticación
- **Real-time** - Actualizaciones en tiempo real

### **Deployment y Monitoreo**
- **Vercel** - Hosting y deployment
- **Vercel Analytics** - Análisis de uso
- **Vercel Speed Insights** - Métricas de rendimiento

## 📋 Requisitos Previos

- **Node.js** 18 o superior
- **npm** o **yarn**
- **Cuenta de Supabase** activa
- **Git** para control de versiones

## ⚙️ Instalación y Configuración

### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/sistemascarpe-ui/kairozcrud
cd kairozcrud
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_ADMIN_DELETE_PIN=1234
```

### 4. **Configurar Base de Datos**

Ejecutar el script SQL `bd.sql` en tu proyecto de Supabase para crear:
- Tablas principales y de relación
- Políticas de seguridad (RLS)
- Funciones y triggers necesarios
- Datos iniciales

### 5. **Iniciar el Servidor de Desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run serve` - Sirve la build de producción localmente

## 🛠️ Optimización de Requests y Conteos

- Se eliminaron peticiones `HEAD` en consultas de conteo (`ventas`, `campana_miembros`) para evitar `net::ERR_ABORTED` por cancelaciones en el navegador.
- Ahora los conteos usan `GET` con `select('id' | 'usuario_id', { count: 'exact' })` y `limit(1)` para minimizar payload sin afectar funcionalidad.
- Beneficios:
  - Menos ruido de errores en consola del navegador.
  - Menor probabilidad de abortos en navegación/cambios rápidos de estado.
  - Mismo comportamiento de conteo y paginación en UI.

## 📁 Estructura del Proyecto

```
src/
├── components/              # Componentes reutilizables
│   ├── ui/                 # Componentes de interfaz base
│   ├── AppIcon.jsx         # Sistema de iconos
│   ├── ErrorBoundary.jsx   # Manejo de errores
│   └── ...
├── contexts/               # Context providers
│   ├── AuthContext.jsx     # Contexto de autenticación
│   ├── MetricsContext.jsx  # Contexto de métricas
│   └── QueryProvider.jsx   # Provider de React Query
├── pages/                  # Páginas principales
│   ├── Dashboard.jsx       # Dashboard principal
│   ├── customer-management/ # Gestión de clientes
│   ├── inventory-management/ # Gestión de inventario
│   ├── sales-management/   # Gestión de ventas
│   ├── metrics-management/ # Dashboard de métricas
│   ├── brand-management/   # Gestión de marcas
│   ├── empresa-management/ # Gestión de empresas
│   ├── adeudos-management/ # Gestión de adeudos
│   └── login/              # Sistema de login
├── services/               # Servicios de API
│   ├── salesService.js     # Servicio de ventas
│   ├── customerService.js  # Servicio de clientes
│   ├── inventoryService.js # Servicio de inventario
│   ├── brandService.js     # Servicio de marcas
│   ├── empresaService.js   # Servicio de empresas
│   ├── userService.js      # Servicio de usuarios
│   └── abonosService.js    # Servicio de abonos
├── hooks/                  # Custom hooks
├── lib/                    # Configuraciones
│   └── supabase.js         # Cliente de Supabase
├── styles/                 # Estilos globales
└── utils/                  # Utilidades
```

## 🔧 Configuración de Supabase

### **Tablas Principales:**
- `usuarios` - Información de empleados y vendedores
- `clientes` - Datos de clientes y prescripciones
- `empresas` - Información de empresas cliente
- `armazones` - Inventario de productos
- `marcas` - Catálogo de marcas
- `sub_marcas` - Sub-marcas y proveedores
- `grupos` - Categorías de productos
- `descripciones` - Descripciones de productos
- `ventas` - Registro de transacciones (Tienda)
- `ventas_campana` - Registro de transacciones (Campaña)
- `venta_vendedores` - Relación vendedores-ventas
- `abonos` - Registro de pagos parciales
- `caja_sesiones` - Control de apertura y cierre de caja
- `caja_movimientos` - Registro de ingresos y egresos
- `historial_graduaciones` - Historial clínico

### **Políticas de Seguridad (RLS):**
- Acceso basado en roles de usuario
- Protección de datos sensibles
- Validación de permisos por módulo
- Auditoría de cambios

## 🚀 Deployment

### **Vercel (Recomendado)**

1. **Conectar Repositorio**
   - Importar proyecto desde GitHub en Vercel
   - Configurar dominio personalizado (opcional)

2. **Configurar Variables de Entorno**
   ```
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

3. **Deploy Automático**
   - Cada push a `main` despliega automáticamente
   - Builds optimizados para producción
   - CDN global para máximo rendimiento

### **Build Manual**
```bash
npm run build
```
Los archivos se generan en la carpeta `dist/` listos para servir.

## 👥 Uso del Sistema

### **Roles de Usuario:**
- **Administrador**: Acceso completo a todas las funciones
- **Vendedor**: Gestión de clientes, ventas y consulta de inventario
- **Empleado**: Consulta de información y reportes básicos

### **Flujo de Trabajo Principal:**

1. **🔐 Login** - Autenticación segura
2. **📊 Dashboard** - Vista general del negocio
3. **👥 Gestión de Clientes** - Registro y seguimiento
4. **📦 Control de Inventario** - Administración de productos
5. **🧾 Sistema de Ventas** - Creación de notas de venta
6. **📈 Métricas y Reportes** - Análisis de rendimiento
7. **💰 Gestión de Adeudos** - Seguimiento de pagos

### **Guía Operativa (Resumida):**

- **Inventario**
  - Filtros por marca, grupo, descripción, sub marca, estado de stock y `ubicación` (`optica`/`campaña`).
  - Reporte PDF con selector: `General` o `Por marca`. El general ignora marca; el de marca filtra todas las secciones y muestra la marca en el encabezado.
  - Lista de “Agotados” usa SKU como nombre y respeta filtros, incluyendo marca y ubicación.
- **Ventas**
  - Folio automático basado en los últimos 4 dígitos existentes, incrementando ascendentemente. Implementación: `src/services/salesService.js:1263`.
  - Cancelar nota marca `estado='cancelada'` y repone stock de armazones vendidos (configurable).
  - Eliminar nota requiere PIN de administración y no modifica inventario. Implementación: `src/services/salesService.js:1184` y uso en `src/pages/sales-management/index.jsx:661`.
  - Menú de acciones (“…”) se cierra al hacer clic fuera o con `Escape`. Implementación: `src/pages/sales-management/components/SalesTable.jsx:33`.

### **Funcionalidades Avanzadas:**

- **📅 Calendario de Ventas**: Vista mensual con métricas diarias
- **🎯 Metas Mensuales**: Seguimiento de objetivos con indicadores visuales
- **🏆 Rankings Dinámicos**: Top productos, marcas y vendedores
- **📊 Gráficas Interactivas**: Análisis visual de tendencias
- **🔍 Filtros Avanzados**: Búsqueda por múltiples criterios
- **📱 Diseño Responsivo**: Optimizado para todos los dispositivos

## 🔒 Seguridad

- **Autenticación**: Supabase Auth con tokens JWT
- **Autorización**: Políticas RLS en base de datos
- **Variables de Entorno**: Credenciales protegidas
- **Validación**: Datos validados en frontend y backend
- **Auditoría**: Logs de cambios y accesos

## 📊 Métricas y Reportes

### **Dashboard Principal:**
- Resumen de ventas del día/mes
- Estado del inventario
- Clientes activos
- Productos más vendidos

### **Métricas Avanzadas:**
- Análisis de rendimiento por vendedor
- Ventas individuales vs compartidas
- Tendencias mensuales
- Estado del inventario en tiempo real
- Ranking de empresas cliente

### **Reportes Disponibles:**
- Ventas por período
- Inventario y stock
- Rendimiento de vendedores
- Clientes y empresas
- Productos más vendidos

### **Detalles del Reporte de Inventario (PDF):**
- Encabezado con logo (`/logo.png`), fecha y hora.
- Resumen ejecutivo: tipos, total de armazones, valor total, porcentajes de stock y agotados.
- Productos agotados: tabla por SKU, color y marca.
- Conteos por marca, grupo, descripción y sub marca.
- Modo “Por marca”: muestra la marca seleccionada; modo “General”: no aplica filtro de marca.

## 🐛 Solución de Problemas

### **Errores Comunes:**

**Error de conexión a Supabase:**
```bash
# Verificar variables de entorno
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Problemas de build:**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Problemas de dependencias:**
```
# Verificar versión de Node.js
node --version  # Debe ser 18+
npm --version
```

**No se puede crear nota de venta: error `es_campana` no existe**
- Causa: intento de insertar columna inexistente en `ventas`.
- Estado: corregido. Ver `src/services/salesService.js:401–416` (se eliminó `es_campana`). Si persiste, limpia caché del navegador.

**Menú de acciones (“…”) no se cierra**
- Estado: corregido con cierre por clic fuera y tecla `Escape`. Ver `src/pages/sales-management/components/SalesTable.jsx:33–47`.

**Reporte general muestra datos filtrados por marca**
- Estado: corregido. El general fuerza `selectedBrand=undefined` y `scope='general'`. Ver `src/pages/inventory-management/index.jsx:524–531` y `src/hooks/useImprovedPDFReport.js:112–115`.

**Conteos incorrectos por ubicación (optica/campaña)**
- Estado: corregido. Todos los agregados aplican `ubicacion`. Ver funciones en `src/services/inventoryService.js:118–137, 165–183, 217–235, 272–289, 326–343, 380–397, 436–453`.

**Eliminar nota suma/resta inventario**
- Estado: corregido. La eliminación ya no modifica stock; sólo borra la nota y relaciones. Ver `src/services/salesService.js:1184–1225` y mensaje en `src/pages/sales-management/index.jsx:667`.

**Logo no aparece en PDF**
- Asegura que el archivo `public/logo.png` esté accesible en ruta `/logo.png`.

### **Configuraciones y Mantenimiento:**
- **PIN de administración**: define `VITE_ADMIN_DELETE_PIN` en `.env` para eliminar armazones y notas.
- **Folio automático (últimos 4 dígitos solicitados)**: función `generateUniqueFolio()` en `src/services/salesService.js:1263–1304`. Para reiniciar el contador, crea una venta con los 4 dígitos deseados o ajusta directamente en BD.
- **RLS/Permisos**: valida políticas en Supabase si ves errores de acceso.

### **Logs y Debugging:**
- Console logs disponibles en desarrollo
- React Query DevTools para debugging
- Supabase dashboard para monitoreo de base de datos

## 📄 Licencia

Este proyecto es privado y está destinado exclusivamente para **Ópticas Kairoz**.

## 👤 Autor

- GitHub: [@ismaiars](https://github.com/ismaiars)
- Email: iarsfate@gmail.com

<a href="https://github.com/ismaiars" target="_blank">
  <img src="https://github.com/ismaiars.png?size=160" alt="Avatar de ismaiars" width="120" height="120" style="border-radius: 50%;" />
</a>

## 📞 Soporte

Para soporte técnico, consultas sobre el sistema o reportar bugs:
- Contactar al equipo de desarrollo
- Revisar la documentación de Supabase
- Consultar logs en el dashboard de Vercel

---

**Desarrollado con ❤️ para Ópticas Kairoz**

*Sistema de gestión integral optimizado para el sector óptico*

