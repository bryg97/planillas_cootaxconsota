-- Fix rapido para error:
-- null value in column "autorizador_id" of relation "viajes_autorizadores_validacion" violates not-null constraint

-- 1) Si existe la columna legacy autorizador_id, quitar NOT NULL
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

-- 2) Garantizar columnas nuevas del esquema por operador
ALTER TABLE viajes_autorizadores_validacion
  ADD COLUMN IF NOT EXISTS operador_id INTEGER,
  ADD COLUMN IF NOT EXISTS operador_nombre VARCHAR(255);

-- 3) Migrar datos legacy -> nuevo esquema
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
