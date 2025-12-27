-- Limpiar todos los registros de configuración
DELETE FROM configuracion;

-- Crear el registro único con id=1
-- IMPORTANTE: Reemplaza los valores con tus datos reales de Telegram
INSERT INTO configuracion (id, valor_planilla_defecto, canal_telegram, bot_telegram, created_at)
VALUES (1, 20000, 'TU_CANAL_ID', 'TU_BOT_TOKEN', NOW());

-- Verificar el resultado
SELECT * FROM configuracion;
