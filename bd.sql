-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.abonos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  monto numeric NOT NULL CHECK (monto > 0::numeric),
  fecha_abono timestamp with time zone NOT NULL DEFAULT now(),
  observaciones text,
  creado_por_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  forma_pago text NOT NULL DEFAULT 'efectivo'::text CHECK (forma_pago = ANY (ARRAY['efectivo'::text, 'tarjeta_debito'::text, 'tarjeta_credito'::text, 'transferencia'::text])),
  CONSTRAINT abonos_pkey PRIMARY KEY (id),
  CONSTRAINT abonos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT abonos_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.armazones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  color text,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  marca_id uuid,
  descripcion_id uuid,
  grupo_id uuid,
  creado_por_id uuid,
  sub_marca_id uuid,
  precio numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  editado_manualmente timestamp with time zone,
  CONSTRAINT armazones_pkey PRIMARY KEY (id),
  CONSTRAINT armazones_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id),
  CONSTRAINT armazones_descripcion_id_fkey FOREIGN KEY (descripcion_id) REFERENCES public.descripciones(id),
  CONSTRAINT armazones_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id),
  CONSTRAINT armazones_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT armazones_sub_marca_id_fkey FOREIGN KEY (sub_marca_id) REFERENCES public.sub_marcas(id)
);
CREATE TABLE public.campana_miembros (
  campana_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  rol text DEFAULT 'miembro'::text CHECK (rol = ANY (ARRAY['miembro'::text, 'coordinador'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  asignado_por_id uuid,
  fecha_asignacion timestamp with time zone DEFAULT now(),
  CONSTRAINT campana_miembros_pkey PRIMARY KEY (campana_id, usuario_id),
  CONSTRAINT campana_miembros_campana_id_fkey FOREIGN KEY (campana_id) REFERENCES public.campanas(id),
  CONSTRAINT campana_miembros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT campana_miembros_asignado_por_id_fkey FOREIGN KEY (asignado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.campana_productos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campana_id uuid NOT NULL,
  armazon_id uuid NOT NULL,
  cantidad_enviada integer NOT NULL DEFAULT 1 CHECK (cantidad_enviada > 0),
  cantidad_devuelta integer NOT NULL DEFAULT 0 CHECK (cantidad_devuelta >= 0),
  fecha_envio timestamp with time zone NOT NULL DEFAULT now(),
  fecha_devolucion timestamp with time zone,
  estado text NOT NULL DEFAULT 'enviado'::text CHECK (estado = ANY (ARRAY['enviado'::text, 'devuelto'::text, 'vendido'::text])),
  observaciones text,
  enviado_por_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campana_productos_pkey PRIMARY KEY (id),
  CONSTRAINT campana_productos_campana_id_fkey FOREIGN KEY (campana_id) REFERENCES public.campanas(id),
  CONSTRAINT campana_productos_armazon_id_fkey FOREIGN KEY (armazon_id) REFERENCES public.armazones(id),
  CONSTRAINT campana_productos_enviado_por_id_fkey FOREIGN KEY (enviado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.campanas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  empresa text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  ubicacion text,
  observaciones text,
  estado text NOT NULL DEFAULT 'activa'::text CHECK (estado = ANY (ARRAY['activa'::text, 'finalizada'::text, 'cancelada'::text])),
  creado_por_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campanas_pkey PRIMARY KEY (id),
  CONSTRAINT campanas_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  correo text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  creado_por_id uuid,
  empresa_id uuid,
  CONSTRAINT clientes_pkey PRIMARY KEY (id),
  CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT clientes_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.configuracion_folios (
  id integer NOT NULL DEFAULT nextval('configuracion_folios_id_seq'::regclass),
  prefijo character varying DEFAULT 'V'::character varying,
  numero_inicio integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_folios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.descripciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  CONSTRAINT descripciones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.empresas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empresas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.grupos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  CONSTRAINT grupos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.historial_graduaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  fecha_consulta timestamp with time zone NOT NULL DEFAULT now(),
  graduacion_od text,
  graduacion_oi text,
  graduacion_add text,
  dip text,
  observaciones text,
  creado_por_id uuid,
  CONSTRAINT historial_graduaciones_pkey PRIMARY KEY (id),
  CONSTRAINT historial_graduaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT historial_graduaciones_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.marcas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  CONSTRAINT marcas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sub_marcas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  CONSTRAINT sub_marcas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.venta_vendedores (
  venta_id uuid NOT NULL,
  vendedor_id uuid NOT NULL,
  CONSTRAINT venta_vendedores_pkey PRIMARY KEY (venta_id, vendedor_id),
  CONSTRAINT venta_vendedores_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT venta_vendedores_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folio character varying NOT NULL DEFAULT ('V-'::text || lpad((nextval('ventas_folio_seq'::regclass))::text, 4, '0'::text)) UNIQUE,
  armazon_id uuid,
  precio_armazon numeric NOT NULL DEFAULT 0,
  descripcion_micas text,
  precio_micas numeric NOT NULL DEFAULT 0,
  cliente_id uuid,
  fecha_venta timestamp with time zone,
  subtotal numeric,
  descuento_monto numeric DEFAULT 0,
  estado character varying DEFAULT 'pendiente'::character varying,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  descuento_armazon_monto numeric DEFAULT 0,
  descuento_micas_monto numeric DEFAULT 0,
  requiere_factura boolean NOT NULL DEFAULT false,
  monto_iva numeric NOT NULL DEFAULT 0,
  rfc text,
  razon_social text,
  total numeric,
  creado_por_id uuid,
  CONSTRAINT ventas_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_armazon_id_fkey FOREIGN KEY (armazon_id) REFERENCES public.armazones(id),
  CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ventas_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);