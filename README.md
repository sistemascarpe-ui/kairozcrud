# 🏪 Ópticas Kairoz - Sistema de Gestión

Sistema integral de gestión para ópticas desarrollado con React y Supabase. Permite administrar inventario, clientes, ventas y generar métricas de negocio.

## ✨ Características

- 👥 **Gestión de Clientes**: Registro completo con información clínica y prescripciones
- 📦 **Control de Inventario**: Administración de productos, stock y proveedores
- 🧾 **Sistema de Ventas**: Generación de notas de venta y seguimiento
- 📊 **Dashboard y Métricas**: Análisis de ventas, inventario y clientes
- 🔐 **Autenticación Segura**: Sistema de login con roles de usuario
- 📱 **Diseño Responsivo**: Optimizado para desktop y móvil

## 🚀 Tecnologías

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Chart.js, React Chart.js 2
- **Deployment**: Vercel

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- Cuenta de Supabase

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd Kairoz_Rocket
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Configurar base de datos**
   
   Ejecutar el script SQL `Nuevabd.sql` en tu proyecto de Supabase para crear las tablas necesarias.

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm start
   ```

## 🏗️ Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run serve` - Sirve la build de producción localmente

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── contexts/           # Context providers (Auth, etc.)
├── pages/              # Páginas principales
│   ├── customer-management/
│   ├── inventory-management/
│   ├── sales-management/
│   ├── metrics-management/
│   └── login/
├── services/           # Servicios de API
├── styles/             # Estilos globales
└── utils/              # Utilidades
```

## 🔧 Configuración de Supabase

### Tablas Principales:
- `usuarios` - Información de empleados
- `clientes` - Datos de clientes y prescripciones
- `armazones` - Inventario de productos
- `ventas` - Registro de transacciones
- `marcas`, `grupos`, `descripciones` - Catálogos

### Políticas de Seguridad (RLS):
El proyecto incluye políticas de Row Level Security configuradas para proteger los datos según el usuario autenticado.

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio**
   - Importar proyecto desde GitHub en Vercel
   
2. **Configurar variables de entorno**
   - Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   
3. **Deploy automático**
   - Cada push a main despliega automáticamente

### Build Manual

```bash
npm run build
```

Los archivos se generan en la carpeta `build/` listos para servir.

## 👥 Uso del Sistema

### Roles de Usuario:
- **Administrador**: Acceso completo a todas las funciones
- **Vendedor**: Gestión de clientes y ventas
- **Empleado**: Consulta de información

### Flujo de Trabajo:
1. **Login** con credenciales de Supabase
2. **Dashboard** - Vista general del negocio
3. **Gestión de Inventario** - Agregar/editar productos
4. **Gestión de Clientes** - Registro y prescripciones
5. **Ventas** - Crear notas de venta
6. **Métricas** - Análisis y reportes

## 🔒 Seguridad

- Autenticación mediante Supabase Auth
- Variables de entorno para credenciales
- Headers de seguridad configurados
- Validación de datos en frontend y backend

## 🐛 Solución de Problemas

### Errores Comunes:

**Error de conexión a Supabase:**
- Verificar variables de entorno
- Confirmar URL y keys de Supabase

**Problemas de build:**
- Limpiar cache: `rm -rf node_modules package-lock.json && npm install`
- Verificar versión de Node.js

## 📄 Licencia

Este proyecto es privado y está destinado exclusivamente para Ópticas Kairoz.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para Ópticas Kairoz**