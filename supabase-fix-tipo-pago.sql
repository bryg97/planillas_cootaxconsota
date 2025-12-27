-- Script para limpiar columna tipo antigua y asegurarse de que tipo_pago funcione correctamente

-- 1. Eliminar columna tipo si existe (puede estar causando conflictos)
ALTER TABLE planillas DROP COLUMN IF EXISTS tipo;

-- 2. Verificar que tipo_pago existe y tiene los valores correctos
-- Si no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planillas' AND column_name = 'tipo_pago'
    ) THEN
        ALTER TABLE planillas ADD COLUMN tipo_pago VARCHAR(20) DEFAULT 'contado';
    END IF;
END $$;

-- 3. Agregar constraint para tipo_pago si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'planillas_tipo_pago_check'
    ) THEN
        ALTER TABLE planillas 
        ADD CONSTRAINT planillas_tipo_pago_check 
        CHECK (tipo_pago IN ('contado', 'credito'));
    END IF;
END $$;

-- 4. Actualizar registros NULL o vacíos a 'contado'
UPDATE planillas 
SET tipo_pago = 'contado' 
WHERE tipo_pago IS NULL OR tipo_pago = '';

-- 5. Hacer tipo_pago NOT NULL
ALTER TABLE planillas ALTER COLUMN tipo_pago SET NOT NULL;

-- Verificación final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'planillas' 
AND column_name IN ('tipo', 'tipo_pago')
ORDER BY column_name;
