-- Agregar columnas Origen y Destino a la tabla planillas

ALTER TABLE planillas 
ADD COLUMN IF NOT EXISTS origen VARCHAR(200),
ADD COLUMN IF NOT EXISTS destino VARCHAR(200);

-- Verificar las nuevas columnas
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'planillas' 
AND column_name IN ('origen', 'destino')
ORDER BY column_name;
