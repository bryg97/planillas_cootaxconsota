-- Agregar soporte de credito sin limite por vehiculo
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS credito_sin_limite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS autorizado_por_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS autorizado_por_identificacion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS autorizado_desde DATE,
  ADD COLUMN IF NOT EXISTS autorizado_hasta DATE;

-- Limpiar datos de autorizacion para vehiculos que no tienen credito sin limite
UPDATE vehiculos
SET
  autorizado_por_nombre = NULL,
  autorizado_por_identificacion = NULL,
  autorizado_desde = NULL,
  autorizado_hasta = NULL
WHERE credito_sin_limite IS DISTINCT FROM true;
