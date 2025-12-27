-- Cambiar el DEFAULT de tipo_pago de 'credito' a 'contado'

ALTER TABLE planillas ALTER COLUMN tipo_pago SET DEFAULT 'contado';

-- Actualizar las planillas existentes que están incorrectamente marcadas como crédito
-- Solo las que fueron creadas recientemente y deberían ser contado
-- (puedes ajustar esta query según tus necesidades)

-- Ver planillas que necesitan corrección
SELECT 
    id, 
    numero_planilla, 
    fecha, 
    tipo_pago, 
    estado,
    conductor
FROM planillas
WHERE tipo_pago = 'credito'
ORDER BY fecha DESC
LIMIT 20;

-- Si necesitas cambiar alguna planilla específica a contado, usa:
-- UPDATE planillas SET tipo_pago = 'contado' WHERE id = [ID_PLANILLA];

-- Verificar el cambio
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'planillas' 
AND column_name = 'tipo_pago';
