-- Agregar columnas faltantes a la tabla configuracion
ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS valor_planilla_defecto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS canal_telegram TEXT,
ADD COLUMN IF NOT EXISTS bot_telegram TEXT;

-- Agregar columna descripcion a la tabla modulos
ALTER TABLE modulos
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Insertar datos iniciales si no existen
INSERT INTO configuracion (id, valor_planilla_defecto, canal_telegram, bot_telegram, created_at)
SELECT 1, 0, '', '', NOW()
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE id = 1);
