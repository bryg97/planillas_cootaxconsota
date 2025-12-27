-- Agregar rol tesorera si no existe (actualizar constraint)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('administrador', 'supervisor', 'operador', 'tesorera'));

-- Agregar campos necesarios a planillas
ALTER TABLE planillas
ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20) DEFAULT 'credito' CHECK (tipo_pago IN ('contado', 'credito')),
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recaudada', 'liquidada', 'pagada')),
ADD COLUMN IF NOT EXISTS operador VARCHAR(100);

-- Crear tabla de recaudos y pagos
CREATE TABLE IF NOT EXISTS recaudos (
  id BIGSERIAL PRIMARY KEY,
  planilla_id BIGINT REFERENCES planillas(id) ON DELETE CASCADE,
  vehiculo_id BIGINT REFERENCES vehiculos(id) ON DELETE SET NULL,
  monto NUMERIC NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('recaudo_operador', 'pago_tesorera', 'liquidacion')),
  recaudado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de liquidaciones
CREATE TABLE IF NOT EXISTS liquidaciones_detalle (
  id BIGSERIAL PRIMARY KEY,
  liquidacion_id BIGINT REFERENCES liquidaciones(id) ON DELETE CASCADE,
  planilla_id BIGINT REFERENCES planillas(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liquidacion_id, planilla_id)
);

-- Deshabilitar RLS para nuevas tablas (o crear políticas según necesidad)
ALTER TABLE recaudos DISABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones_detalle DISABLE ROW LEVEL SECURITY;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_recaudos_planilla ON recaudos(planilla_id);
CREATE INDEX IF NOT EXISTS idx_recaudos_vehiculo ON recaudos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_detalle_liquidacion ON liquidaciones_detalle(liquidacion_id);
CREATE INDEX IF NOT EXISTS idx_planillas_estado ON planillas(estado);
CREATE INDEX IF NOT EXISTS idx_planillas_tipo_pago ON planillas(tipo_pago);
