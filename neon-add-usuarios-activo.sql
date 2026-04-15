-- Agrega soporte de inhabilitacion logica para usuarios sin romper FKs historicas
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

UPDATE usuarios
SET activo = true
WHERE activo IS NULL;

ALTER TABLE usuarios
  ALTER COLUMN activo SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
