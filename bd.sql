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
CREATE TABLE public.abonos_campana (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  venta_id bigint NOT NULL,
  monto numeric NOT NULL,
  forma_pago text,
  fecha_abono timestamp with time zone DEFAULT now(),
  observaciones text,
  creado_por_id uuid,
  CONSTRAINT abonos_campana_pkey PRIMARY KEY (id),
  CONSTRAINT abonos_campana_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas_campana(id),
  CONSTRAINT abonos_campana_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
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
  ubicacion text NOT NULL DEFAULT 'optica'::text CHECK (ubicacion = ANY (ARRAY['optica'::text, 'campana'::text])),
  CONSTRAINT armazones_pkey PRIMARY KEY (id),
  CONSTRAINT armazones_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id),
  CONSTRAINT armazones_descripcion_id_fkey FOREIGN KEY (descripcion_id) REFERENCES public.descripciones(id),
  CONSTRAINT armazones_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id),
  CONSTRAINT armazones_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT armazones_sub_marca_id_fkey FOREIGN KEY (sub_marca_id) REFERENCES public.sub_marcas(id)
);
CREATE TABLE public.caja_movimientos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['ingreso'::text, 'egreso'::text])),
  monto numeric NOT NULL,
  categoria text,
  concepto text,
  metodo_pago text,
  referencia text,
  venta_id uuid,
  usuario_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT caja_movimientos_pkey PRIMARY KEY (id),
  CONSTRAINT caja_movimientos_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES public.caja_sesiones(id),
  CONSTRAINT caja_movimientos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT caja_movimientos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.caja_sesiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_apertura timestamp with time zone NOT NULL DEFAULT now(),
  usuario_apertura_id uuid,
  saldo_inicial numeric NOT NULL DEFAULT 0,
  estado text NOT NULL CHECK (estado = ANY (ARRAY['abierta'::text, 'cerrada'::text])),
  fecha_cierre timestamp with time zone,
  usuario_cierre_id uuid,
  saldo_cierre numeric,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT caja_sesiones_pkey PRIMARY KEY (id),
  CONSTRAINT caja_sesiones_usuario_apertura_id_fkey FOREIGN KEY (usuario_apertura_id) REFERENCES public.usuarios(id),
  CONSTRAINT caja_sesiones_usuario_cierre_id_fkey FOREIGN KEY (usuario_cierre_id) REFERENCES public.usuarios(id)
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
  creado_por_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  identificador text,
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
CREATE TABLE public.configuracion_folios_campana (
  id integer NOT NULL,
  prefijo text DEFAULT 'CAM'::text,
  numero_inicio integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_folios_campana_pkey PRIMARY KEY (id)
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
CREATE TABLE public.venta_campana_clientes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  venta_id bigint NOT NULL,
  cliente_id uuid NOT NULL,
  CONSTRAINT venta_campana_clientes_pkey PRIMARY KEY (id),
  CONSTRAINT venta_campana_clientes_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas_campana(id),
  CONSTRAINT venta_campana_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.venta_campana_productos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  venta_id bigint NOT NULL,
  tipo_producto text NOT NULL CHECK (tipo_producto = ANY (ARRAY['armazon'::text, 'mica'::text])),
  armazon_id uuid,
  descripcion_mica text,
  cantidad numeric DEFAULT 1,
  precio_unitario numeric DEFAULT 0,
  descuento_monto numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  CONSTRAINT venta_campana_productos_pkey PRIMARY KEY (id),
  CONSTRAINT venta_campana_productos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas_campana(id),
  CONSTRAINT venta_campana_productos_armazon_id_fkey FOREIGN KEY (armazon_id) REFERENCES public.armazones(id)
);
CREATE TABLE public.venta_campana_vendedores (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  venta_id bigint NOT NULL,
  vendedor_id uuid NOT NULL,
  CONSTRAINT venta_campana_vendedores_pkey PRIMARY KEY (id),
  CONSTRAINT venta_campana_vendedores_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas_campana(id),
  CONSTRAINT venta_campana_vendedores_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.venta_clientes (
  venta_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venta_clientes_pkey PRIMARY KEY (venta_id, cliente_id),
  CONSTRAINT venta_clientes_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT venta_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.venta_productos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  tipo_producto text NOT NULL CHECK (tipo_producto = ANY (ARRAY['armazon'::text, 'mica'::text])),
  armazon_id uuid,
  descripcion_mica text,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0::numeric),
  descuento_monto numeric DEFAULT 0 CHECK (descuento_monto >= 0::numeric),
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venta_productos_pkey PRIMARY KEY (id),
  CONSTRAINT venta_productos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT venta_productos_armazon_id_fkey FOREIGN KEY (armazon_id) REFERENCES public.armazones(id)
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
  fecha_venta timestamp with time zone,
  subtotal numeric,
  descuento_monto numeric DEFAULT 0,
  estado character varying DEFAULT 'pendiente'::character varying,
  observaciones text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  requiere_factura boolean NOT NULL DEFAULT false,
  monto_iva numeric NOT NULL DEFAULT 0,
  rfc text,
  razon_social text,
  total numeric,
  creado_por_id uuid,
  CONSTRAINT ventas_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_creado_por_id_fkey FOREIGN KEY (creado_por_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.ventas_campana (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  folio text UNIQUE,
  subtotal numeric,
  total numeric,
  descuento_monto numeric DEFAULT 0,
  requiere_factura boolean DEFAULT false,
  monto_iva numeric DEFAULT 0,
  rfc text,
  razon_social text,
  estado text DEFAULT 'pendiente'::text,
  observaciones text,
  fecha_venta timestamp with time zone DEFAULT now(),
  campana_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ventas_campana_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_campana_campana_id_fkey FOREIGN KEY (campana_id) REFERENCES public.campanas(id)
);