-- Ver planillas actuales y su tipo de pago
SELECT id, numero_planilla, conductor, valor, tipo_pago, estado, fecha
FROM planillas
ORDER BY fecha DESC
LIMIT 20;

-- Si quieres marcar todas las planillas antiguas como 'contado' (ajusta según tu caso)
-- Opción 1: Marcar TODAS las planillas existentes como contado
UPDATE planillas
SET tipo_pago = 'contado'
WHERE created_at < '2025-12-27 18:00:00'; -- Ajusta la fecha según cuándo agregaste el campo

-- Opción 2: Marcar como contado solo las que están en estado 'pendiente'
-- UPDATE planillas
-- SET tipo_pago = 'contado', estado = 'pagada'
-- WHERE estado = 'pendiente' AND created_at < '2025-12-27 18:00:00';

-- Opción 3: Marcar planilla específica por su ID o número
-- UPDATE planillas
-- SET tipo_pago = 'contado'
-- WHERE numero_planilla = 'PL-XXXXXXXX';

-- Verificar resultado
SELECT 
  tipo_pago,
  estado,
  COUNT(*) as cantidad,
  SUM(valor) as total
FROM planillas
GROUP BY tipo_pago, estado;
