-- Ajustes adicionales para modulo Viajes ya creado previamente

ALTER TABLE viajes
  ADD COLUMN IF NOT EXISTS autorizador_operador_id INTEGER,
  ADD COLUMN IF NOT EXISTS autorizador_operador_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cedula_autorizador VARCHAR(50),
  ADD COLUMN IF NOT EXISTS respuesta_autorizacion VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_viajes_autorizador_operador ON viajes(autorizador_operador_id);

CREATE TABLE IF NOT EXISTS viajes_autorizadores_validacion (
  id SERIAL PRIMARY KEY,
  operador_id INTEGER UNIQUE NOT NULL,
  operador_nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  actualizado_por_id INTEGER REFERENCES usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE viajes_autorizadores_validacion
  ADD COLUMN IF NOT EXISTS operador_id INTEGER,
  ADD COLUMN IF NOT EXISTS operador_nombre VARCHAR(255);

-- Compatibilidad: si existe esquema antiguo con autorizador_id NOT NULL,
-- dejarlo opcional para permitir inserciones con el nuevo modelo por operador.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'viajes_autorizadores_validacion'
      AND column_name = 'autorizador_id'
  ) THEN
    EXECUTE 'ALTER TABLE viajes_autorizadores_validacion ALTER COLUMN autorizador_id DROP NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'viajes_autorizadores_validacion'
      AND column_name = 'autorizador_id'
  ) THEN
    UPDATE viajes_autorizadores_validacion
    SET operador_id = autorizador_id
    WHERE operador_id IS NULL;
  END IF;
END $$;

UPDATE viajes_autorizadores_validacion
SET operador_nombre = COALESCE(operador_nombre, 'Operador sin nombre')
WHERE operador_nombre IS NULL;

ALTER TABLE viajes_autorizadores_validacion
  ALTER COLUMN operador_id SET NOT NULL;

ALTER TABLE viajes_autorizadores_validacion
  ALTER COLUMN operador_nombre SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_viajes_autorizadores_validacion_operador_id
ON viajes_autorizadores_validacion(operador_id);
