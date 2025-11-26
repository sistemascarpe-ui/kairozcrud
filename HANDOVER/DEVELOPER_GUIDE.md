# 🛠️ Guía de Desarrollo - Ópticas Kairoz

Información técnica para desarrolladores y mantenimiento del sistema.

## 🚀 Stack Tecnológico

### Frontend
*   **Framework**: React 18
*   **Build Tool**: Vite
*   **Estilos**: Tailwind CSS, Radix UI (Componentes), Lucide React (Iconos)
*   **Estado**: React Query (TanStack Query), Context API
*   **Routing**: React Router
*   **Formularios**: React Hook Form

### Backend & Datos
*   **Plataforma**: Supabase (BaaS)
*   **Base de Datos**: PostgreSQL
*   **Autenticación**: Supabase Auth
*   **Almacenamiento**: Supabase Storage (si aplica)

### Infraestructura
*   **Hosting**: Vercel (Recomendado)

---

## ⚙️ Instalación y Configuración Local

1.  **Requisitos**:
    *   Node.js 18+
    *   npm o yarn
    *   Git

2.  **Clonar Repositorio**:
    ```bash
    git clone <url-del-repo>
    cd kairozcrud
    ```

3.  **Instalar Dependencias**:
    ```bash
    npm install
    ```

4.  **Variables de Entorno**:
    Crea un archivo `.env` en la raíz (ver `ENV_TEMPLATE.md` o `.env.example`).
    ```env
    VITE_SUPABASE_URL=tu_url
    VITE_SUPABASE_ANON_KEY=tu_key
    VITE_ADMIN_DELETE_PIN=1234
    ```

5.  **Base de Datos**:
    *   Si es una instalación nueva, ejecuta el script `bd.sql` en el SQL Editor de Supabase para crear la estructura.

6.  **Ejecutar**:
    ```bash
    npm start
    # o
    npm run dev
    ```

---

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes UI reutilizables
├── contexts/         # Estados globales (Auth, Metrics)
├── hooks/            # Custom hooks
├── lib/              # Configuración de clientes (supabase.js)
├── pages/            # Vistas por módulo (Dashboard, Ventas, etc.)
├── services/         # Lógica de negocio y llamadas a API
├── styles/           # CSS global
└── utils/            # Funciones auxiliares
```

---

## 🐛 Solución de Problemas y Notas Técnicas

### Optimización de Consultas (ERR_ABORTED)
Se ha implementado una optimización para evitar errores `net::ERR_ABORTED` en consultas de conteo (especialmente en Ventas y Miembros de Campaña).
*   **Problema**: Supabase usaba `HEAD` requests para `count`, que eran cancelados por el navegador al navegar rápido.
*   **Solución**: Se reemplazó por `GET` con `limit(1)`.
*   **Patrón a seguir**:
    ```javascript
    const { count } = await supabase
      .from('tabla')
      .select('id', { count: 'exact' })
      .limit(1);
    ```

### Folios de Venta
El folio se genera automáticamente en base de datos (`ventas_folio_seq`). Si se requiere reiniciar, se debe alterar la secuencia en PostgreSQL:
```sql
ALTER SEQUENCE ventas_folio_seq RESTART WITH 1001;
```

### Eliminación de Registros
La eliminación de ventas está protegida por PIN (`VITE_ADMIN_DELETE_PIN`).
*   **Importante**: La función de eliminar venta (`deleteSale`) **NO** revierte el inventario. Si se desea devolver los productos al stock, se debe "Cancelar" la venta primero, o hacerlo manualmente.

---

## 🚀 Despliegue (Vercel)

1.  Conectar el repositorio a Vercel.
2.  Configurar las variables de entorno en el panel de Vercel.
3.  El `build command` es `npm run build`.
4.  El `output directory` es `dist`.
