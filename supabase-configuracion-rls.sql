-- Deshabilitar RLS temporalmente para la tabla configuracion
-- O crear políticas que permitan al service_role acceder

-- Opción 1: Deshabilitar RLS (más simple para tabla de configuración única)
ALTER TABLE configuracion DISABLE ROW LEVEL SECURITY;

-- Opción 2: Si prefieres mantener RLS, crear políticas
-- ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow service_role full access to configuracion"
-- ON configuracion
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);
