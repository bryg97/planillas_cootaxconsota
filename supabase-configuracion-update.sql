-- Agregar columnas faltantes a la tabla configuracion
ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS canal_telegram TEXT,
ADD COLUMN IF NOT EXISTS bot_telegram TEXT;

-- Agregar columna descripcion a la tabla modulos
ALTER TABLE modulos
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Insertar datos iniciales si no existen
INSERT INTO configuracion (valor_planilla_defecto, canal_telegram, bot_telegram)
SELECT 0, '', ''
WHERE NOT EXISTS (SELECT 1 FROM configuracion);
