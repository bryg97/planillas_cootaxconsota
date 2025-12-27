-- Limpiar todos los registros de configuración
DELETE FROM configuracion;

-- Crear el registro único con id=1
INSERT INTO configuracion (id, valor_planilla_defecto, canal_telegram, bot_telegram, created_at)
VALUES (1, 20000, '-1003266271071', '8127994041:AAGdiNEzZI8aL3ZQ8s_AH5OPTGZbp7-DR80', NOW());

-- Verificar el resultado
SELECT * FROM configuracion;
