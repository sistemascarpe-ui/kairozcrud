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
  rol text DEFAULT 'miembro'::text,
  asignado_por_id uuid,
  fecha_asignacion timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campana_miembros_pkey PRIMARY KEY (campana_id, usuario_id),
  CONSTRAINT campana_miembros_campana_id_fkey FOREIGN KEY (campana_id) REFERENCES public.campanas(id),
  CONSTRAINT campana_miembros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT campana_miembros_asignado_por_id_fkey FOREIGN KEY (asignado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT campana_miembros_rol_check CHECK (rol = ANY (ARRAY['miembro'::text, 'coordinador'::text]))
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

-- Funciones RPC para gestión de campañas

-- Función para agregar miembro a campaña
CREATE OR REPLACE FUNCTION public.agregar_miembro_a_campana(
  p_campana_id uuid,
  p_usuario_id uuid,
  p_rol text DEFAULT 'miembro',
  p_asignado_por_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar que la campaña existe
  IF NOT EXISTS (SELECT 1 FROM public.campanas WHERE id = p_campana_id) THEN
    RETURN json_build_object('error', 'La campaña no existe');
  END IF;
  
  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = p_usuario_id) THEN
    RETURN json_build_object('error', 'El usuario no existe');
  END IF;
  
  -- Verificar que no es miembro ya
  IF EXISTS (SELECT 1 FROM public.campana_miembros WHERE campana_id = p_campana_id AND usuario_id = p_usuario_id) THEN
    RETURN json_build_object('error', 'El usuario ya es miembro de esta campaña');
  END IF;
  
  -- Insertar miembro
  INSERT INTO public.campana_miembros (campana_id, usuario_id, rol, asignado_por_id)
  VALUES (p_campana_id, p_usuario_id, p_rol, p_asignado_por_id);
  
  RETURN json_build_object('success', true, 'message', 'Miembro agregado exitosamente');
END;
$$;

-- Función para remover miembro de campaña
CREATE OR REPLACE FUNCTION public.remover_miembro_de_campana(
  p_campana_id uuid,
  p_usuario_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar que el miembro existe
  IF NOT EXISTS (SELECT 1 FROM public.campana_miembros WHERE campana_id = p_campana_id AND usuario_id = p_usuario_id) THEN
    RETURN json_build_object('error', 'El usuario no es miembro de esta campaña');
  END IF;
  
  -- Remover miembro
  DELETE FROM public.campana_miembros 
  WHERE campana_id = p_campana_id AND usuario_id = p_usuario_id;
  
  RETURN json_build_object('success', true, 'message', 'Miembro removido exitosamente');
END;
$$;

-- Función para enviar producto a campaña
CREATE OR REPLACE FUNCTION public.enviar_producto_a_campana(
  p_campana_id uuid,
  p_armazon_id uuid,
  p_cantidad integer,
  p_enviado_por_id uuid,
  p_observaciones text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stock_actual integer;
  resultado json;
BEGIN
  -- Verificar que la campaña existe
  IF NOT EXISTS (SELECT 1 FROM public.campanas WHERE id = p_campana_id) THEN
    RETURN json_build_object('error', 'La campaña no existe');
  END IF;
  
  -- Verificar que el armazón existe
  IF NOT EXISTS (SELECT 1 FROM public.armazones WHERE id = p_armazon_id) THEN
    RETURN json_build_object('error', 'El armazón no existe');
  END IF;
  
  -- Obtener stock actual
  SELECT stock INTO stock_actual FROM public.armazones WHERE id = p_armazon_id;
  
  -- Verificar stock suficiente
  IF stock_actual < p_cantidad THEN
    RETURN json_build_object('error', 'Stock insuficiente. Stock actual: ' || stock_actual || ', solicitado: ' || p_cantidad);
  END IF;
  
  -- Reducir stock PRIMERO (NO marcar como editado manualmente - es automático)
  UPDATE public.armazones 
  SET stock = stock - p_cantidad,
      updated_at = now()
  WHERE id = p_armazon_id;
  
  -- Verificar que el stock se actualizó correctamente
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Error al actualizar el stock');
  END IF;
  
  -- Insertar producto en campaña
  INSERT INTO public.campana_productos (campana_id, armazon_id, cantidad_enviada, enviado_por_id, observaciones)
  VALUES (p_campana_id, p_armazon_id, p_cantidad, p_enviado_por_id, p_observaciones);
  
  -- Verificar que se insertó correctamente
  IF NOT FOUND THEN
    -- Si falló la inserción, revertir el stock
    UPDATE public.armazones 
    SET stock = stock + p_cantidad 
    WHERE id = p_armazon_id;
    RETURN json_build_object('error', 'Error al registrar el producto en la campaña');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Producto enviado exitosamente');
END;
$$;

-- Función para devolver producto de campaña
CREATE OR REPLACE FUNCTION public.devolver_producto_de_campana(
  p_campana_producto_id uuid,
  p_cantidad_devolver integer,
  p_observaciones text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  producto_record record;
  cantidad_actual integer;
BEGIN
  -- Obtener información del producto
  SELECT * INTO producto_record 
  FROM public.campana_productos 
  WHERE id = p_campana_producto_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'El producto no existe en la campaña');
  END IF;
  
  -- Calcular cantidad actual (enviada - devuelta)
  cantidad_actual := producto_record.cantidad_enviada - COALESCE(producto_record.cantidad_devuelta, 0);
  
  -- Verificar cantidad a devolver
  IF p_cantidad_devolver > cantidad_actual THEN
    RETURN json_build_object('error', 'No se puede devolver más cantidad de la disponible. Disponible: ' || cantidad_actual || ', solicitado: ' || p_cantidad_devolver);
  END IF;
  
  -- Restaurar stock PRIMERO (NO marcar como editado manualmente - es automático)
  UPDATE public.armazones 
  SET stock = stock + p_cantidad_devolver,
      updated_at = now()
  WHERE id = producto_record.armazon_id;
  
  -- Verificar que el stock se actualizó correctamente
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Error al restaurar el stock');
  END IF;
  
  -- Actualizar cantidad devuelta
  UPDATE public.campana_productos 
  SET 
    cantidad_devuelta = COALESCE(cantidad_devuelta, 0) + p_cantidad_devolver,
    fecha_devolucion = CASE 
      WHEN (COALESCE(cantidad_devuelta, 0) + p_cantidad_devolver) >= cantidad_enviada THEN now()
      ELSE fecha_devolucion
    END,
    estado = CASE 
      WHEN (COALESCE(cantidad_devuelta, 0) + p_cantidad_devolver) >= cantidad_enviada THEN 'devuelto'
      ELSE estado
    END,
    observaciones = COALESCE(observaciones || ' | ', '') || COALESCE(p_observaciones, ''),
    updated_at = now()
  WHERE id = p_campana_producto_id;
  
  -- Verificar que se actualizó correctamente
  IF NOT FOUND THEN
    -- Si falló la actualización, revertir el stock
    UPDATE public.armazones 
    SET stock = stock - p_cantidad_devolver 
    WHERE id = producto_record.armazon_id;
    RETURN json_build_object('error', 'Error al actualizar el registro de la campaña');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Producto devuelto exitosamente');
END;
$$;

-- Agregar campo para rastrear ediciones manuales
ALTER TABLE public.armazones 
ADD COLUMN IF NOT EXISTS editado_manualmente timestamp with time zone;

-- Función para marcar producto como editado manualmente
CREATE OR REPLACE FUNCTION public.marcar_producto_editado(
  p_armazon_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el armazón existe
  IF NOT EXISTS (SELECT 1 FROM public.armazones WHERE id = p_armazon_id) THEN
    RETURN json_build_object('error', 'El armazón no existe');
  END IF;
  
  -- Marcar como editado manualmente
  UPDATE public.armazones 
  SET editado_manualmente = now(),
      updated_at = now()
  WHERE id = p_armazon_id;
  
  RETURN json_build_object('success', true, 'message', 'Producto marcado como editado');
END;
$$;

-- Función para limpiar marcas de editado después de 24 horas
CREATE OR REPLACE FUNCTION public.limpiar_marcas_editado()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpiar marcas de editado que tengan más de 24 horas
  UPDATE public.armazones 
  SET editado_manualmente = NULL 
  WHERE editado_manualmente < now() - interval '24 hours';
END;
$$;

-- Eliminar la vista existente y crear una nueva con el campo editado_manualmente
DROP VIEW IF EXISTS public.stock_armazones;

-- Vista para stock de armazones con información de campañas
CREATE VIEW public.stock_armazones AS
SELECT 
  a.id,
  a.sku,
  a.color,
  a.stock,
  a.precio,
  a.created_at,
  a.updated_at,
  a.marca_id,
  a.grupo_id,
  a.sub_marca_id,
  a.descripcion_id,
  a.creado_por_id,
  a.editado_manualmente,
  COALESCE(m.nombre, 'Sin marca') as marca,
  COALESCE(g.nombre, 'Sin grupo') as grupo,
  COALESCE(sm.nombre, 'Sin sub marca') as sub_marca,
  COALESCE(d.nombre, 'Sin descripción') as descripcion,
  COALESCE(cp.cantidad_en_campanas, 0) as cantidad_en_campanas,
  (a.stock - COALESCE(cp.cantidad_en_campanas, 0)) as stock_disponible
FROM public.armazones a
LEFT JOIN public.marcas m ON a.marca_id = m.id
LEFT JOIN public.grupos g ON a.grupo_id = g.id
LEFT JOIN public.sub_marcas sm ON a.sub_marca_id = sm.id
LEFT JOIN public.descripciones d ON a.descripcion_id = d.id
LEFT JOIN (
  SELECT 
    armazon_id,
    SUM(cantidad_enviada - COALESCE(cantidad_devuelta, 0)) as cantidad_en_campanas
  FROM public.campana_productos
  WHERE estado IN ('enviado', 'vendido')
  GROUP BY armazon_id
) cp ON a.id = cp.armazon_id;