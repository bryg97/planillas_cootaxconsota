-- Script para agregar valores configurables a la calculadora
-- Ejecutar en SQL Editor de Supabase

-- Agregar columnas para valores de la calculadora
ALTER TABLE configuracion 
ADD COLUMN IF NOT EXISTS valor_hora_calculadora DECIMAL(10,2) DEFAULT 30000,
ADD COLUMN IF NOT EXISTS valor_minuto_calculadora DECIMAL(10,2) DEFAULT 500;

-- Establecer valores por defecto si no existen
UPDATE configuracion 
SET valor_hora_calculadora = 30000,
    valor_minuto_calculadora = 500
WHERE id = 1 AND (valor_hora_calculadora IS NULL OR valor_minuto_calculadora IS NULL);

-- Verificar cambios
SELECT * FROM configuracion WHERE id = 1;
